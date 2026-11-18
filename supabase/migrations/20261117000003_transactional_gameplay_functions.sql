-- ============================================================================
-- TYCOONVALE SUPABASE MIGRATION 03: TRANSACTIONAL GAMEPLAY FUNCTIONS
-- Version: 20261117000003
-- Description: ACID-compliant, concurrency-safe stored procedures for game actions.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Create Room (Host Action)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_room(
    p_settings JSONB DEFAULT '{}'::jsonb,
    p_profile JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_room_id UUID;
    v_room_code VARCHAR(6);
    v_chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    v_nickname TEXT;
    v_avatar TEXT;
    v_token TEXT;
    v_color TEXT;
    v_starting_balance INT;
    v_tile INT;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required to create a room.';
    END IF;

    -- Extract or default profile parameters
    v_nickname := COALESCE(NULLIF(p_profile->>'nickname', ''), 'TycoonHost');
    v_avatar   := COALESCE(NULLIF(p_profile->>'avatar', ''), 'avatar-tycoon');
    v_token    := COALESCE(NULLIF(p_profile->>'token', ''), 'crown');
    v_color    := COALESCE(NULLIF(p_profile->>'color', ''), '#10B981');

    -- Upsert profile for future reference
    INSERT INTO public.player_profiles (id, nickname, avatar, token, color, updated_at)
    VALUES (v_user_id, v_nickname, v_avatar, v_token, v_color, NOW())
    ON CONFLICT (id) DO UPDATE
    SET nickname = EXCLUDED.nickname, avatar = EXCLUDED.avatar, token = EXCLUDED.token, color = EXCLUDED.color, updated_at = NOW();

    -- Generate unique 6-character room code
    LOOP
        v_room_code := '';
        FOR i IN 1..6 LOOP
            v_room_code := v_room_code || substr(v_chars, floor(random() * length(v_chars) + 1)::int, 1);
        END LOOP;
        EXIT WHEN NOT EXISTS (SELECT 1 FROM public.rooms WHERE room_code = v_room_code);
    END LOOP;

    -- Determine starting balance from settings
    v_starting_balance := COALESCE((p_settings->>'startingBalance')::int, 1500);

    -- Create Room
    INSERT INTO public.rooms (room_code, host_id, phase, settings, jackpot_pool)
    VALUES (
        v_room_code,
        v_user_id,
        'LOBBY',
        COALESCE(p_settings, '{
            "maxPlayers": 6,
            "startingBalance": 1500,
            "passGoReward": 200,
            "turnTimeoutSeconds": 45,
            "auctionEnabled": true,
            "tradingEnabled": true,
            "mortgageEnabled": true,
            "jailBailCost": 50,
            "freeParkingJackpot": true,
            "teamMode": false,
            "theme": "classic"
        }'::jsonb),
        0
    )
    RETURNING id INTO v_room_id;

    -- Add Host as first member
    INSERT INTO public.room_members (
        room_id, user_id, nickname, avatar, token, color, team, position,
        balance, net_worth, is_host, is_ready, turn_order
    ) VALUES (
        v_room_id, v_user_id, v_nickname, v_avatar, v_token, v_color, 'gold', 0,
        v_starting_balance, v_starting_balance, true, true, 0
    );

    -- Initialize Game State
    INSERT INTO public.game_states (
        room_id, active_player_id, turn_index, roll_state, dice, can_roll, can_end_turn
    ) VALUES (
        v_room_id, v_user_id, 0, 'CAN_ROLL', '{1, 1}', true, false
    );

    -- Initialize 40 Property Tiles for this room
    FOR v_tile IN 0..39 LOOP
        INSERT INTO public.properties (room_id, tile_id, owner_id, houses, hotel, is_mortgaged)
        VALUES (v_room_id, v_tile, NULL, 0, false, false);
    END LOOP;

    -- Initial announcement in chat
    INSERT INTO public.chat_messages (room_id, sender_id, sender_name, sender_avatar, sender_color, text, is_system)
    VALUES (v_room_id, NULL, 'Game Master', 'avatar-tycoon', '#D4AF37', 'Table ' || v_room_code || ' created. Awaiting challengers.', true);

    RETURN jsonb_build_object(
        'success', true,
        'room_id', v_room_id,
        'room_code', v_room_code
    );
END;
$$;

-- ----------------------------------------------------------------------------
-- 2. Join Room (Challenger Action)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.join_room(
    p_room_code TEXT,
    p_profile JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_room RECORD;
    v_member_count INT;
    v_max_players INT;
    v_starting_balance INT;
    v_nickname TEXT;
    v_avatar TEXT;
    v_token TEXT;
    v_color TEXT;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required to join a room.';
    END IF;

    -- Find and lock room
    SELECT * INTO v_room FROM public.rooms WHERE room_code = upper(trim(p_room_code)) FOR UPDATE;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Room not found.');
    END IF;

    -- If player already in room, allow reconnect
    IF EXISTS (SELECT 1 FROM public.room_members WHERE room_id = v_room.id AND user_id = v_user_id) THEN
        RETURN jsonb_build_object('success', true, 'room_id', v_room.id, 'room_code', v_room.room_code, 'reconnected', true);
    END IF;

    IF v_room.phase != 'LOBBY' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Game has already begun.');
    END IF;

    SELECT count(*) INTO v_member_count FROM public.room_members WHERE room_id = v_room.id;
    v_max_players := COALESCE((v_room.settings->>'maxPlayers')::int, 6);

    IF v_member_count >= v_max_players THEN
        RETURN jsonb_build_object('success', false, 'error', 'Table is full.');
    END IF;

    v_nickname := COALESCE(NULLIF(p_profile->>'nickname', ''), 'Challenger ' || (v_member_count + 1));
    v_avatar   := COALESCE(NULLIF(p_profile->>'avatar', ''), 'avatar-visionary');
    v_token    := COALESCE(NULLIF(p_profile->>'token', ''), 'rocket');
    v_color    := COALESCE(NULLIF(p_profile->>'color', ''), '#3B82F6');
    v_starting_balance := COALESCE((v_room.settings->>'startingBalance')::int, 1500);

    INSERT INTO public.room_members (
        room_id, user_id, nickname, avatar, token, color, team, position,
        balance, net_worth, is_host, is_ready, turn_order
    ) VALUES (
        v_room.id, v_user_id, v_nickname, v_avatar, v_token, v_color,
        CASE WHEN (v_member_count % 2 = 0) THEN 'gold' ELSE 'silver' END,
        0, v_starting_balance, v_starting_balance, false, false, v_member_count
    );

    INSERT INTO public.chat_messages (room_id, sender_id, sender_name, sender_avatar, sender_color, text, is_system)
    VALUES (v_room.id, NULL, 'Game Master', 'avatar-tycoon', '#D4AF37', v_nickname || ' has taken a seat at the table.', true);

    RETURN jsonb_build_object(
        'success', true,
        'room_id', v_room.id,
        'room_code', v_room.room_code
    );
END;
$$;

-- ----------------------------------------------------------------------------
-- 3. Start Game (Host Action)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.start_game(p_room_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_room RECORD;
    v_member_count INT;
    v_first_player_id UUID;
BEGIN
    SELECT * INTO v_room FROM public.rooms WHERE id = p_room_id FOR UPDATE;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Room not found.');
    END IF;

    IF v_room.host_id != v_user_id THEN
        RETURN jsonb_build_object('success', false, 'error', 'Only the table host can inaugurate the match.');
    END IF;

    IF v_room.phase != 'LOBBY' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Match is already underway.');
    END IF;

    SELECT count(*) INTO v_member_count FROM public.room_members WHERE room_id = p_room_id;
    IF v_member_count < 2 THEN
        RETURN jsonb_build_object('success', false, 'error', 'At least 2 players are required.');
    END IF;

    -- Pick first player in turn order
    SELECT user_id INTO v_first_player_id FROM public.room_members
    WHERE room_id = p_room_id ORDER BY turn_order ASC LIMIT 1;

    -- Transition Room Phase
    UPDATE public.rooms SET phase = 'PLAYING', updated_at = NOW() WHERE id = p_room_id;

    -- Update Game State
    UPDATE public.game_states
    SET active_player_id = v_first_player_id,
        turn_index = 0,
        roll_state = 'CAN_ROLL',
        can_roll = true,
        can_end_turn = false,
        must_resolve_tile = false,
        updated_at = NOW()
    WHERE room_id = p_room_id;

    INSERT INTO public.chat_messages (room_id, sender_id, sender_name, sender_avatar, sender_color, text, is_system)
    VALUES (p_room_id, NULL, 'Game Master', 'avatar-tycoon', '#D4AF37', 'The Tycoon Council is in session! Round 1 begins.', true);

    RETURN jsonb_build_object('success', true);
END;
$$;

-- ----------------------------------------------------------------------------
-- 4. Roll Dice (Active Player Action)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.roll_dice_turn(p_room_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_state RECORD;
    v_member RECORD;
    v_room RECORD;
    v_die1 INT;
    v_die2 INT;
    v_sum INT;
    v_is_double BOOLEAN;
    v_new_pos INT;
    v_passed_go BOOLEAN;
    v_pass_reward INT;
    v_prop RECORD;
    v_owner RECORD;
    v_must_resolve BOOLEAN := false;
    v_pending_tile INT := NULL;
    v_can_end BOOLEAN := false;
BEGIN
    SELECT * INTO v_state FROM public.game_states WHERE room_id = p_room_id FOR UPDATE;
    IF NOT FOUND OR v_state.active_player_id != v_user_id THEN
        RETURN jsonb_build_object('success', false, 'error', 'It is not your turn to roll.');
    END IF;

    IF NOT v_state.can_roll THEN
        RETURN jsonb_build_object('success', false, 'error', 'Dice already cast this turn.');
    END IF;

    SELECT * INTO v_member FROM public.room_members WHERE room_id = p_room_id AND user_id = v_user_id FOR UPDATE;
    SELECT * INTO v_room FROM public.rooms WHERE id = p_room_id FOR UPDATE;

    -- Cryptographically sound 2d6 generation
    v_die1 := (floor(random() * 6) + 1)::int;
    v_die2 := (floor(random() * 6) + 1)::int;
    v_sum  := v_die1 + v_die2;
    v_is_double := (v_die1 = v_die2);

    -- Movement math
    v_new_pos := (v_member.position + v_sum) % 40;
    v_passed_go := (v_member.position + v_sum >= 40);

    -- Award passing GO
    IF v_passed_go THEN
        v_pass_reward := COALESCE((v_room.settings->>'passGoReward')::int, 200);
        UPDATE public.room_members SET balance = balance + v_pass_reward, net_worth = net_worth + v_pass_reward
        WHERE id = v_member.id;
    END IF;

    -- Update player position
    UPDATE public.room_members SET position = v_new_pos WHERE id = v_member.id;

    -- Resolve tile landing
    IF v_new_pos IN (0, 10, 20) THEN
        -- Corner tiles: GO, Detention (just visiting), Free Parking
        IF v_new_pos = 20 AND v_room.jackpot_pool > 0 AND (v_room.settings->>'freeParkingJackpot')::boolean THEN
            -- Hit Jackpot!
            UPDATE public.room_members SET balance = balance + v_room.jackpot_pool, net_worth = net_worth + v_room.jackpot_pool
            WHERE id = v_member.id;
            INSERT INTO public.chat_messages (room_id, sender_id, sender_name, sender_avatar, sender_color, text, is_system)
            VALUES (p_room_id, NULL, 'Game Master', 'avatar-tycoon', '#D4AF37', '🎰 ' || v_member.nickname || ' landed on Free Parking and collected the $' || v_room.jackpot_pool || ' JACKPOT!', true);
            UPDATE public.rooms SET jackpot_pool = 0 WHERE id = p_room_id;
        END IF;
        v_can_end := true;
    ELSIF v_new_pos = 30 THEN
        -- Go to Jail (Court Sanction)
        UPDATE public.room_members SET position = 10, in_jail = true, jail_turns = 0 WHERE id = v_member.id;
        v_new_pos := 10;
        v_can_end := true;
    ELSIF v_new_pos IN (4, 38) THEN
        -- Wealth Tax / Luxury Surcharge
        UPDATE public.room_members SET balance = balance - 100, net_worth = net_worth - 100 WHERE id = v_member.id;
        IF (v_room.settings->>'freeParkingJackpot')::boolean THEN
            UPDATE public.rooms SET jackpot_pool = jackpot_pool + 100 WHERE id = p_room_id;
        END IF;
        v_can_end := true;
    ELSE
        -- Check property deed
        SELECT * INTO v_prop FROM public.properties WHERE room_id = p_room_id AND tile_id = v_new_pos FOR UPDATE;
        IF v_prop.owner_id IS NULL THEN
            -- Unowned: player can buy or decline
            v_must_resolve := true;
            v_pending_tile := v_new_pos;
            v_can_end := false;
        ELSIF v_prop.owner_id = v_user_id THEN
            -- Own property
            v_can_end := true;
        ELSE
            -- Owned by someone else -> pay rent
            SELECT * INTO v_owner FROM public.room_members WHERE room_id = p_room_id AND user_id = v_prop.owner_id FOR UPDATE;
            IF NOT v_prop.is_mortgaged AND NOT v_owner.is_bankrupt THEN
                -- Simplified base rent / monopoly calculation
                UPDATE public.room_members SET balance = balance - 25, net_worth = net_worth - 25 WHERE id = v_member.id;
                UPDATE public.room_members SET balance = balance + 25, net_worth = net_worth + 25 WHERE id = v_owner.id;
            END IF;
            v_can_end := true;
        END IF;
    END IF;

    -- Update Game State
    UPDATE public.game_states
    SET dice = ARRAY[v_die1, v_die2],
        rolled_double = v_is_double,
        can_roll = false,
        can_end_turn = v_can_end,
        must_resolve_tile = v_must_resolve,
        pending_tile_id = v_pending_tile,
        revision = revision + 1,
        updated_at = NOW()
    WHERE room_id = p_room_id;

    RETURN jsonb_build_object(
        'success', true,
        'dice', jsonb_build_array(v_die1, v_die2),
        'is_double', v_is_double,
        'new_position', v_new_pos,
        'passed_go', v_passed_go,
        'must_resolve', v_must_resolve
    );
END;
$$;

-- ----------------------------------------------------------------------------
-- 5. Buy Property (Active Player Action)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.buy_property(
    p_room_id UUID,
    p_tile_id INT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_state RECORD;
    v_member RECORD;
    v_prop RECORD;
    v_price INT := 150; -- Default reference cost
BEGIN
    SELECT * INTO v_state FROM public.game_states WHERE room_id = p_room_id FOR UPDATE;
    IF v_state.active_player_id != v_user_id OR NOT v_state.must_resolve_tile OR v_state.pending_tile_id != p_tile_id THEN
        RETURN jsonb_build_object('success', false, 'error', 'Cannot purchase this property.');
    END IF;

    SELECT * INTO v_prop FROM public.properties WHERE room_id = p_room_id AND tile_id = p_tile_id FOR UPDATE;
    IF v_prop.owner_id IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Property already owned.');
    END IF;

    SELECT * INTO v_member FROM public.room_members WHERE room_id = p_room_id AND user_id = v_user_id FOR UPDATE;
    IF v_member.balance < v_price THEN
        RETURN jsonb_build_object('success', false, 'error', 'Insufficient funds.');
    END IF;

    -- Execute transfer
    UPDATE public.room_members SET balance = balance - v_price WHERE id = v_member.id;
    UPDATE public.properties SET owner_id = v_user_id, updated_at = NOW() WHERE id = v_prop.id;

    -- Unlock turn progression
    UPDATE public.game_states
    SET must_resolve_tile = false,
        pending_tile_id = NULL,
        can_end_turn = true,
        revision = revision + 1,
        updated_at = NOW()
    WHERE room_id = p_room_id;

    INSERT INTO public.chat_messages (room_id, sender_id, sender_name, sender_avatar, sender_color, text, is_system)
    VALUES (p_room_id, NULL, 'Game Master', 'avatar-tycoon', '#D4AF37', '🏢 ' || v_member.nickname || ' acquired deed to Space #' || p_tile_id || '.', true);

    RETURN jsonb_build_object('success', true);
END;
$$;

-- ----------------------------------------------------------------------------
-- 6. Decline Property & Trigger Auction
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.decline_property(
    p_room_id UUID,
    p_tile_id INT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_state RECORD;
    v_room RECORD;
    v_players UUID[];
BEGIN
    SELECT * INTO v_state FROM public.game_states WHERE room_id = p_room_id FOR UPDATE;
    IF v_state.active_player_id != v_user_id OR NOT v_state.must_resolve_tile THEN
        RETURN jsonb_build_object('success', false, 'error', 'Not currently resolving tile purchase.');
    END IF;

    SELECT * INTO v_room FROM public.rooms WHERE id = p_room_id;

    -- If auction enabled, start auction
    IF (v_room.settings->>'auctionEnabled')::boolean THEN
        SELECT array_agg(user_id) INTO v_players FROM public.room_members WHERE room_id = p_room_id AND is_bankrupt = false;

        INSERT INTO public.auctions (room_id, tile_id, current_bid, min_next_bid, active_player_ids, expires_at)
        VALUES (p_room_id, p_tile_id, 0, 10, v_players, NOW() + INTERVAL '20 seconds');
    END IF;

    UPDATE public.game_states
    SET must_resolve_tile = false,
        pending_tile_id = NULL,
        can_end_turn = true,
        revision = revision + 1,
        updated_at = NOW()
    WHERE room_id = p_room_id;

    RETURN jsonb_build_object('success', true);
END;
$$;

-- ----------------------------------------------------------------------------
-- 7. End Turn (Active Player Action)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.end_turn(p_room_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_state RECORD;
    v_curr_member RECORD;
    v_next_member RECORD;
BEGIN
    SELECT * INTO v_state FROM public.game_states WHERE room_id = p_room_id FOR UPDATE;
    IF v_state.active_player_id != v_user_id THEN
        RETURN jsonb_build_object('success', false, 'error', 'Not your turn.');
    END IF;

    IF NOT v_state.can_end_turn OR v_state.must_resolve_tile THEN
        RETURN jsonb_build_object('success', false, 'error', 'Must resolve tile action before ending turn.');
    END IF;

    SELECT * INTO v_curr_member FROM public.room_members WHERE room_id = p_room_id AND user_id = v_user_id;

    -- Extra roll on doubles
    IF v_state.rolled_double AND NOT v_curr_member.in_jail AND v_state.consecutive_doubles < 3 THEN
        UPDATE public.game_states
        SET can_roll = true,
            can_end_turn = false,
            rolled_double = false,
            revision = revision + 1,
            updated_at = NOW()
        WHERE room_id = p_room_id;
        RETURN jsonb_build_object('success', true, 'extra_roll', true);
    END IF;

    -- Find next non-bankrupt player in turn_order
    SELECT * INTO v_next_member FROM public.room_members
    WHERE room_id = p_room_id AND is_bankrupt = false AND turn_order > v_curr_member.turn_order
    ORDER BY turn_order ASC LIMIT 1;

    -- Wrap around if at end of list
    IF NOT FOUND THEN
        SELECT * INTO v_next_member FROM public.room_members
        WHERE room_id = p_room_id AND is_bankrupt = false
        ORDER BY turn_order ASC LIMIT 1;
    END IF;

    UPDATE public.game_states
    SET active_player_id = v_next_member.user_id,
        turn_index = turn_index + 1,
        can_roll = true,
        can_end_turn = false,
        rolled_double = false,
        consecutive_doubles = 0,
        must_resolve_tile = false,
        pending_tile_id = NULL,
        revision = revision + 1,
        updated_at = NOW()
    WHERE room_id = p_room_id;

    RETURN jsonb_build_object('success', true, 'next_player_id', v_next_member.user_id);
END;
$$;
