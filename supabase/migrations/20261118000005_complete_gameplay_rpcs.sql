-- ============================================================================
-- TYCOONVALE SUPABASE MIGRATION 05: COMPLETE ATOMIC GAMEPLAY RPCs & ACTIVITY LOGS
-- Version: 20261118000005
-- Description: Exact 40-tile definitions matching @tycoonvale/shared, activity_logs,
--              full atomic gameplay RPCs (houses, mortgages, jail, auctions, trades,
--              monopoly/station/utility rent, bankruptcy, team victory, snapshot fetch).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Reference Table: Exact 40 Board Tile Definitions (matches shared/boardData.ts)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.board_tile_definitions (
    tile_id INT PRIMARY KEY CHECK (tile_id >= 0 AND tile_id <= 39),
    name TEXT NOT NULL,
    tile_type VARCHAR(16) NOT NULL,
    color_group VARCHAR(16),
    price INT DEFAULT 0,
    rent INT[] DEFAULT '{}',
    house_cost INT DEFAULT 0,
    mortgage_value INT DEFAULT 0,
    tax_amount INT DEFAULT 0
);

ALTER TABLE public.board_tile_definitions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'board_tile_definitions' AND policyname = 'Board definitions readable by all authenticated users'
    ) THEN
        CREATE POLICY "Board definitions readable by all authenticated users"
            ON public.board_tile_definitions FOR SELECT TO authenticated USING (true);
    END IF;
END $$;

INSERT INTO public.board_tile_definitions (tile_id, name, tile_type, color_group, price, rent, house_cost, mortgage_value, tax_amount)
VALUES
    (0,  'GO: STARTING POINT',     'corner',   NULL,        0,   '{}',                              0,   0,   0),
    (1,  'Harbor Alley',           'property', 'brown',     60,  '{2,10,30,90,160,250}',            50,  30,  0),
    (2,  'Opportunity Vault',      'card',     NULL,        0,   '{}',                              0,   0,   0),
    (3,  'Beacon Wharf',           'property', 'brown',     60,  '{4,20,60,180,320,450}',           50,  30,  0),
    (4,  'Municipal Wealth Tax',   'tax',      NULL,        0,   '{}',                              0,   0,   200),
    (5,  'Metro Central Station',  'station',  'station',   200, '{25,50,100,200}',                 0,   100, 0),
    (6,  'Cobalt Terrace',         'property', 'lightblue', 100, '{6,30,90,270,400,550}',           50,  50,  0),
    (7,  'Fortune Chest',          'card',     NULL,        0,   '{}',                              0,   0,   0),
    (8,  'Azure Avenue',           'property', 'lightblue', 100, '{6,30,90,270,400,550}',           50,  50,  0),
    (9,  'Skyline Way',            'property', 'lightblue', 120, '{8,40,100,300,450,600}',          50,  60,  0),
    (10, 'Detention Center',       'corner',   NULL,        0,   '{}',                              0,   0,   0),
    (11, 'Orchid Boulevard',       'property', 'pink',      140, '{10,50,150,450,625,750}',         100, 70,  0),
    (12, 'Volt Energy Grid',       'utility',  'utility',   150, '{4,10}',                          0,   75,  0),
    (13, 'Lotus Promenade',        'property', 'pink',      140, '{10,50,150,450,625,750}',         100, 70,  0),
    (14, 'Magnolia Plaza',         'property', 'pink',      160, '{12,60,180,500,700,900}',         100, 80,  0),
    (15, 'Aero Skyport Express',   'station',  'station',   200, '{25,50,100,200}',                 0,   100, 0),
    (16, 'Amber Ridge',            'property', 'orange',    180, '{14,70,200,550,750,950}',         100, 90,  0),
    (17, 'Opportunity Vault',      'card',     NULL,        0,   '{}',                              0,   0,   0),
    (18, 'Copper Square',          'property', 'orange',    180, '{14,70,200,550,750,950}',         100, 90,  0),
    (19, 'Sienna Heights',         'property', 'orange',    200, '{16,80,220,600,800,1000}',        100, 100, 0),
    (20, 'Grand Plaza Park',       'corner',   NULL,        0,   '{}',                              0,   0,   0),
    (21, 'Ruby Boulevard',         'property', 'red',       220, '{18,90,250,700,875,1050}',        150, 110, 0),
    (22, 'Fortune Chest',          'card',     NULL,        0,   '{}',                              0,   0,   0),
    (23, 'Scarlet Row',            'property', 'red',       220, '{18,90,250,700,875,1050}',        150, 110, 0),
    (24, 'Crimson Court',          'property', 'red',       240, '{20,100,300,750,925,1100}',       150, 120, 0),
    (25, 'High-Speed Rail Link',   'station',  'station',   200, '{25,50,100,200}',                 0,   100, 0),
    (26, 'Solaris Promenade',      'property', 'yellow',    260, '{22,110,330,800,975,1150}',       150, 130, 0),
    (27, 'Aureolin Way',           'property', 'yellow',    260, '{22,110,330,800,975,1150}',       150, 130, 0),
    (28, 'Aqua Reservoir Works',   'utility',  'utility',   150, '{4,10}',                          0,   75,  0),
    (29, 'Gilded Parkway',         'property', 'yellow',    280, '{24,120,360,850,1025,1200}',      150, 140, 0),
    (30, 'Court Sanction',         'corner',   NULL,        0,   '{}',                              0,   0,   0),
    (31, 'Emerald Crest',          'property', 'green',     300, '{26,130,390,900,1100,1275}',      200, 150, 0),
    (32, 'Jade Parkway',           'property', 'green',     300, '{26,130,390,900,1100,1275}',      200, 150, 0),
    (33, 'Opportunity Vault',      'card',     NULL,        0,   '{}',                              0,   0,   0),
    (34, 'Verdant Summit',         'property', 'green',     320, '{28,150,450,1000,1200,1400}',     200, 160, 0),
    (35, 'Interstellar Hyperloop', 'station',  'station',   200, '{25,50,100,200}',                 0,   100, 0),
    (36, 'Fortune Chest',          'card',     NULL,        0,   '{}',                              0,   0,   0),
    (37, 'Obsidian Heights',       'property', 'darkblue',  350, '{35,175,500,1100,1300,1500}',     200, 175, 0),
    (38, 'Billionaire Luxury Duty','tax',      NULL,        0,   '{}',                              0,   0,   100),
    (39, 'Diamond Pinnacle',       'property', 'darkblue',  400, '{50,200,600,1400,1700,2000}',     200, 200, 0)
ON CONFLICT (tile_id) DO UPDATE SET
    name = EXCLUDED.name,
    tile_type = EXCLUDED.tile_type,
    color_group = EXCLUDED.color_group,
    price = EXCLUDED.price,
    rent = EXCLUDED.rent,
    house_cost = EXCLUDED.house_cost,
    mortgage_value = EXCLUDED.mortgage_value,
    tax_amount = EXCLUDED.tax_amount;

-- ----------------------------------------------------------------------------
-- 2. Activity Logs Table (Persisted Event Feed synced via Realtime)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
    player_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    text VARCHAR(320) NOT NULL,
    log_type VARCHAR(20) NOT NULL DEFAULT 'system',
    amount INT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_room_time ON public.activity_logs(room_id, created_at DESC);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'activity_logs' AND policyname = 'Room members can read activity logs'
    ) THEN
        CREATE POLICY "Room members can read activity logs"
            ON public.activity_logs FOR SELECT TO authenticated
            USING (public.is_member_of_room(room_id));
    END IF;
END $$;

ALTER TABLE public.activity_logs REPLICA IDENTITY FULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND tablename = 'activity_logs'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_logs;
    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 3. Internal Helpers: Net Worth & Bankruptcy/Team Victory
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.recalculate_member_net_worth(p_room_id UUID, p_user_id UUID)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_balance INT;
    v_assets INT;
    v_total INT;
BEGIN
    SELECT balance INTO v_balance FROM public.room_members WHERE room_id = p_room_id AND user_id = p_user_id;
    IF NOT FOUND THEN RETURN 0; END IF;

    SELECT COALESCE(SUM(
        CASE WHEN p.is_mortgaged THEN d.mortgage_value ELSE d.price END +
        CASE WHEN p.hotel THEN 5 * d.house_cost ELSE p.houses * d.house_cost END
    ), 0) INTO v_assets
    FROM public.properties p
    JOIN public.board_tile_definitions d ON d.tile_id = p.tile_id
    WHERE p.room_id = p_room_id AND p.owner_id = p_user_id;

    v_total := GREATEST(0, v_balance + v_assets);
    UPDATE public.room_members SET net_worth = v_total, updated_at = NOW()
    WHERE room_id = p_room_id AND user_id = p_user_id;

    RETURN v_total;
END;
$$;

CREATE OR REPLACE FUNCTION public.check_bankruptcy_and_victory(
    p_room_id UUID,
    p_user_id UUID,
    p_creditor_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_member RECORD;
    v_room RECORD;
    v_active_count INT;
    v_teams_count INT;
    v_win_team TEXT;
    v_winner_id UUID;
BEGIN
    SELECT * INTO v_member FROM public.room_members WHERE room_id = p_room_id AND user_id = p_user_id FOR UPDATE;
    IF NOT FOUND OR v_member.balance >= 0 THEN
        RETURN false;
    END IF;

    UPDATE public.room_members SET is_bankrupt = true, updated_at = NOW() WHERE id = v_member.id;

    INSERT INTO public.activity_logs (room_id, player_id, text, log_type)
    VALUES (p_room_id, p_user_id, '💀 ' || v_member.nickname || ' has declared bankruptcy!', 'bankrupt');

    -- Transfer properties to creditor or return to bank
    IF p_creditor_id IS NOT NULL THEN
        UPDATE public.properties SET owner_id = p_creditor_id, updated_at = NOW()
        WHERE room_id = p_room_id AND owner_id = p_user_id;
        PERFORM public.recalculate_member_net_worth(p_room_id, p_creditor_id);
    ELSE
        UPDATE public.properties SET owner_id = NULL, houses = 0, hotel = false, is_mortgaged = false, updated_at = NOW()
        WHERE room_id = p_room_id AND owner_id = p_user_id;
    END IF;

    SELECT * INTO v_room FROM public.rooms WHERE id = p_room_id FOR UPDATE;

    -- Team mode victory check
    IF COALESCE((v_room.settings->>'teamMode')::boolean, false) THEN
        SELECT COUNT(DISTINCT COALESCE(team, 'gold')), MIN(COALESCE(team, 'gold'))
        INTO v_teams_count, v_win_team
        FROM public.room_members WHERE room_id = p_room_id AND is_bankrupt = false;

        IF v_teams_count = 1 THEN
            SELECT user_id INTO v_winner_id FROM public.room_members WHERE room_id = p_room_id AND is_bankrupt = false ORDER BY net_worth DESC LIMIT 1;
            UPDATE public.rooms SET phase = 'ENDED', winning_team = v_win_team, winner_id = v_winner_id, updated_at = NOW() WHERE id = p_room_id;
            INSERT INTO public.activity_logs (room_id, text, log_type)
            VALUES (p_room_id, '🏆 TEAM ' || upper(v_win_team) || ' achieved economic supremacy!', 'system');
            RETURN true;
        END IF;
    END IF;

    -- Standard last-tycoon-standing victory check
    SELECT COUNT(*) INTO v_active_count FROM public.room_members WHERE room_id = p_room_id AND is_bankrupt = false;
    IF v_active_count <= 1 THEN
        SELECT user_id INTO v_winner_id FROM public.room_members WHERE room_id = p_room_id AND is_bankrupt = false LIMIT 1;
        UPDATE public.rooms SET phase = 'ENDED', winner_id = v_winner_id, updated_at = NOW() WHERE id = p_room_id;
        INSERT INTO public.activity_logs (room_id, player_id, text, log_type)
        VALUES (p_room_id, v_winner_id, '🏆 Match concluded! A Tycoon Champion has been crowned!', 'system');
    END IF;

    RETURN true;
END;
$$;

-- ----------------------------------------------------------------------------
-- 4. Upgraded Roll Dice (Exact Monopoly/Station/Utility Rent, Jail, Cards, Jackpot)
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
    v_tile RECORD;
    v_prop RECORD;
    v_owner RECORD;
    v_die1 INT;
    v_die2 INT;
    v_sum INT;
    v_is_double BOOLEAN;
    v_old_pos INT;
    v_new_pos INT;
    v_passed_go BOOLEAN := false;
    v_pass_reward INT;
    v_bail_cost INT;
    v_must_resolve BOOLEAN := false;
    v_pending_tile INT := NULL;
    v_can_end BOOLEAN := false;
    v_rent INT := 0;
    v_group_total INT;
    v_owner_group_count INT;
    v_stations_owned INT;
    v_utils_owned INT;
    v_effect_type TEXT := NULL;
    v_effect_amount INT := 0;
BEGIN
    SELECT * INTO v_state FROM public.game_states WHERE room_id = p_room_id FOR UPDATE;
    IF NOT FOUND OR v_state.active_player_id != v_user_id THEN
        RETURN jsonb_build_object('success', false, 'error', 'It is not your turn to roll.');
    END IF;

    IF NOT v_state.can_roll THEN
        RETURN jsonb_build_object('success', false, 'error', 'Dice already rolled this turn.');
    END IF;

    SELECT * INTO v_member FROM public.room_members WHERE room_id = p_room_id AND user_id = v_user_id FOR UPDATE;
    IF v_member.is_bankrupt THEN
        RETURN jsonb_build_object('success', false, 'error', 'Bankrupt players cannot roll.');
    END IF;

    SELECT * INTO v_room FROM public.rooms WHERE id = p_room_id FOR UPDATE;
    v_old_pos := v_member.position;

    v_die1 := (floor(random() * 6) + 1)::int;
    v_die2 := (floor(random() * 6) + 1)::int;
    v_sum  := v_die1 + v_die2;
    v_is_double := (v_die1 = v_die2);

    INSERT INTO public.activity_logs (room_id, player_id, text, log_type)
    VALUES (p_room_id, v_user_id, '🎲 ' || v_member.nickname || ' rolled [' || v_die1 || '] and [' || v_die2 || '] (Total: ' || v_sum || ')' || CASE WHEN v_is_double THEN ' — Doubles!' ELSE '' END, 'roll');

    -- Handle Detention (Jail) turns
    IF v_member.in_jail THEN
        IF v_is_double THEN
            UPDATE public.room_members SET in_jail = false, jail_turns = 0 WHERE id = v_member.id;
            INSERT INTO public.activity_logs (room_id, player_id, text, log_type)
            VALUES (p_room_id, v_user_id, '🔓 ' || v_member.nickname || ' rolled doubles and escaped Detention!', 'jail');
        ELSE
            IF v_member.jail_turns + 1 >= 3 THEN
                v_bail_cost := COALESCE((v_room.settings->>'jailBailCost')::int, 50);
                UPDATE public.room_members SET balance = balance - v_bail_cost, in_jail = false, jail_turns = 0 WHERE id = v_member.id;
                IF COALESCE((v_room.settings->>'freeParkingJackpot')::boolean, true) THEN
                    UPDATE public.rooms SET jackpot_pool = jackpot_pool + v_bail_cost WHERE id = p_room_id;
                END IF;
                INSERT INTO public.activity_logs (room_id, player_id, text, log_type, amount)
                VALUES (p_room_id, v_user_id, '⚖️ ' || v_member.nickname || ' served 3 turns and paid $' || v_bail_cost || ' bail.', 'jail', -v_bail_cost);
                PERFORM public.check_bankruptcy_and_victory(p_room_id, v_user_id, NULL);
            ELSE
                UPDATE public.room_members SET jail_turns = jail_turns + 1 WHERE id = v_member.id;
                UPDATE public.game_states
                SET dice = ARRAY[v_die1, v_die2], rolled_double = false, can_roll = false, can_end_turn = true, revision = revision + 1, updated_at = NOW()
                WHERE room_id = p_room_id;
                RETURN jsonb_build_object('success', true, 'dice', jsonb_build_array(v_die1, v_die2), 'is_double', false, 'from_position', v_old_pos, 'new_position', v_old_pos, 'passed_go', false, 'must_resolve', false);
            END IF;
        END IF;
    ELSIF v_is_double AND v_state.consecutive_doubles + 1 >= 3 THEN
        -- 3 consecutive doubles -> Detention!
        UPDATE public.room_members SET position = 10, in_jail = true, jail_turns = 0 WHERE id = v_member.id;
        INSERT INTO public.activity_logs (room_id, player_id, text, log_type)
        VALUES (p_room_id, v_user_id, '🚨 ' || v_member.nickname || ' rolled 3 consecutive doubles and was sent to Detention!', 'jail');
        UPDATE public.game_states
        SET dice = ARRAY[v_die1, v_die2], rolled_double = false, consecutive_doubles = 0, can_roll = false, can_end_turn = true, revision = revision + 1, updated_at = NOW()
        WHERE room_id = p_room_id;
        RETURN jsonb_build_object('success', true, 'dice', jsonb_build_array(v_die1, v_die2), 'is_double', true, 'from_position', v_old_pos, 'new_position', 10, 'passed_go', false, 'must_resolve', false);
    END IF;

    -- Advance around 40-tile board
    v_new_pos := (v_old_pos + v_sum) % 40;
    v_passed_go := (v_old_pos + v_sum >= 40);

    IF v_passed_go THEN
        v_pass_reward := COALESCE((v_room.settings->>'passGoReward')::int, 200);
        UPDATE public.room_members SET balance = balance + v_pass_reward WHERE id = v_member.id;
        INSERT INTO public.activity_logs (room_id, player_id, text, log_type, amount)
        VALUES (p_room_id, v_user_id, '💰 ' || v_member.nickname || ' passed GO and collected $' || v_pass_reward || '!', 'system', v_pass_reward);
    END IF;

    UPDATE public.room_members SET position = v_new_pos WHERE id = v_member.id;
    SELECT * INTO v_tile FROM public.board_tile_definitions WHERE tile_id = v_new_pos;

    -- Resolve landing tile
    IF v_tile.tile_type = 'corner' THEN
        IF v_new_pos = 30 THEN
            UPDATE public.room_members SET position = 10, in_jail = true, jail_turns = 0 WHERE id = v_member.id;
            v_new_pos := 10;
            INSERT INTO public.activity_logs (room_id, player_id, text, log_type)
            VALUES (p_room_id, v_user_id, '🚨 ' || v_member.nickname || ' landed on Court Sanction and was sent to Detention!', 'jail');
        ELSIF v_new_pos = 20 AND v_room.jackpot_pool > 0 AND COALESCE((v_room.settings->>'freeParkingJackpot')::boolean, true) THEN
            v_effect_type := 'jackpot';
            v_effect_amount := v_room.jackpot_pool;
            UPDATE public.room_members SET balance = balance + v_room.jackpot_pool WHERE id = v_member.id;
            UPDATE public.rooms SET jackpot_pool = 0 WHERE id = p_room_id;
            INSERT INTO public.activity_logs (room_id, player_id, text, log_type, amount)
            VALUES (p_room_id, v_user_id, '🎰 ' || v_member.nickname || ' claimed the $' || v_effect_amount || ' Free Parking JACKPOT!', 'system', v_effect_amount);
        END IF;
        v_can_end := true;

    ELSIF v_tile.tile_type = 'tax' THEN
        v_effect_type := 'tax';
        v_effect_amount := v_tile.tax_amount;
        UPDATE public.room_members SET balance = balance - v_tile.tax_amount WHERE id = v_member.id;
        IF COALESCE((v_room.settings->>'freeParkingJackpot')::boolean, true) THEN
            UPDATE public.rooms SET jackpot_pool = jackpot_pool + v_tile.tax_amount WHERE id = p_room_id;
        END IF;
        INSERT INTO public.activity_logs (room_id, player_id, text, log_type, amount)
        VALUES (p_room_id, v_user_id, '💸 ' || v_member.nickname || ' paid $' || v_tile.tax_amount || ' at ' || v_tile.name || '.', 'tax', -v_tile.tax_amount);
        PERFORM public.check_bankruptcy_and_victory(p_room_id, v_user_id, NULL);
        v_can_end := true;

    ELSIF v_tile.tile_type = 'card' THEN
        -- Balanced Fortune / Opportunity event
        IF random() < 0.65 THEN
            v_effect_amount := 100;
            UPDATE public.room_members SET balance = balance + 100 WHERE id = v_member.id;
            INSERT INTO public.activity_logs (room_id, player_id, text, log_type, amount)
            VALUES (p_room_id, v_user_id, '🎴 ' || v_member.nickname || ' drew a Dividend Windfall (+$100)!', 'card', 100);
        ELSE
            v_effect_amount := 50;
            UPDATE public.room_members SET balance = balance - 50 WHERE id = v_member.id;
            IF COALESCE((v_room.settings->>'freeParkingJackpot')::boolean, true) THEN
                UPDATE public.rooms SET jackpot_pool = jackpot_pool + 50 WHERE id = p_room_id;
            END IF;
            INSERT INTO public.activity_logs (room_id, player_id, text, log_type, amount)
            VALUES (p_room_id, v_user_id, '🎴 ' || v_member.nickname || ' drew a Municipal Audit Fee (-$50).', 'card', -50);
            PERFORM public.check_bankruptcy_and_victory(p_room_id, v_user_id, NULL);
        END IF;
        v_can_end := true;

    ELSE
        -- Property / Station / Utility
        SELECT * INTO v_prop FROM public.properties WHERE room_id = p_room_id AND tile_id = v_new_pos FOR UPDATE;
        IF v_prop.owner_id IS NULL THEN
            v_must_resolve := true;
            v_pending_tile := v_new_pos;
            v_can_end := false;
            INSERT INTO public.activity_logs (room_id, player_id, text, log_type)
            VALUES (p_room_id, v_user_id, '🏷️ ' || v_member.nickname || ' landed on unowned ' || v_tile.name || ' ($' || v_tile.price || ').', 'system');
        ELSIF v_prop.owner_id = v_user_id THEN
            v_can_end := true;
        ELSE
            SELECT * INTO v_owner FROM public.room_members WHERE room_id = p_room_id AND user_id = v_prop.owner_id FOR UPDATE;
            IF NOT v_prop.is_mortgaged AND NOT v_owner.is_bankrupt THEN
                IF v_tile.tile_type = 'property' THEN
                    IF v_prop.hotel THEN
                        v_rent := v_tile.rent[6];
                    ELSIF v_prop.houses > 0 THEN
                        v_rent := v_tile.rent[v_prop.houses + 1];
                    ELSE
                        SELECT COUNT(*) INTO v_group_total FROM public.board_tile_definitions WHERE color_group = v_tile.color_group;
                        SELECT COUNT(*) INTO v_owner_group_count
                        FROM public.properties p JOIN public.board_tile_definitions d ON d.tile_id = p.tile_id
                        WHERE p.room_id = p_room_id AND d.color_group = v_tile.color_group AND p.owner_id = v_prop.owner_id;
                        v_rent := CASE WHEN v_owner_group_count = v_group_total THEN v_tile.rent[1] * 2 ELSE v_tile.rent[1] END;
                    END IF;
                ELSIF v_tile.tile_type = 'station' THEN
                    SELECT COUNT(*) INTO v_stations_owned
                    FROM public.properties p JOIN public.board_tile_definitions d ON d.tile_id = p.tile_id
                    WHERE p.room_id = p_room_id AND d.tile_type = 'station' AND p.owner_id = v_prop.owner_id AND p.is_mortgaged = false;
                    v_rent := v_tile.rent[GREATEST(1, LEAST(4, v_stations_owned))];
                ELSIF v_tile.tile_type = 'utility' THEN
                    SELECT COUNT(*) INTO v_utils_owned
                    FROM public.properties p JOIN public.board_tile_definitions d ON d.tile_id = p.tile_id
                    WHERE p.room_id = p_room_id AND d.tile_type = 'utility' AND p.owner_id = v_prop.owner_id AND p.is_mortgaged = false;
                    v_rent := v_sum * CASE WHEN v_utils_owned >= 2 THEN 10 ELSE 4 END;
                END IF;

                v_effect_type := 'rent';
                v_effect_amount := v_rent;

                UPDATE public.room_members SET balance = balance - v_rent WHERE id = v_member.id;
                UPDATE public.room_members SET balance = balance + v_rent WHERE id = v_owner.id;

                INSERT INTO public.activity_logs (room_id, player_id, text, log_type, amount)
                VALUES (p_room_id, v_user_id, '💳 ' || v_member.nickname || ' paid $' || v_rent || ' rent to ' || v_owner.nickname || ' for ' || v_tile.name || '.', 'rent', -v_rent);

                PERFORM public.recalculate_member_net_worth(p_room_id, v_owner.user_id);
                PERFORM public.check_bankruptcy_and_victory(p_room_id, v_user_id, v_owner.user_id);
            END IF;
            v_can_end := true;
        END IF;
    END IF;

    PERFORM public.recalculate_member_net_worth(p_room_id, v_user_id);

    UPDATE public.game_states
    SET dice = ARRAY[v_die1, v_die2],
        rolled_double = v_is_double,
        consecutive_doubles = CASE WHEN v_is_double THEN consecutive_doubles + 1 ELSE 0 END,
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
        'from_position', v_old_pos,
        'new_position', v_new_pos,
        'passed_go', v_passed_go,
        'must_resolve', v_must_resolve,
        'effect_type', v_effect_type,
        'effect_amount', v_effect_amount
    );
END;
$$;

-- ----------------------------------------------------------------------------
-- 5. Buy Property (Exact Price from board_tile_definitions)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.buy_property(p_room_id UUID, p_tile_id INT)
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
    v_tile RECORD;
BEGIN
    SELECT * INTO v_state FROM public.game_states WHERE room_id = p_room_id FOR UPDATE;
    IF v_state.active_player_id != v_user_id OR NOT v_state.must_resolve_tile OR v_state.pending_tile_id != p_tile_id THEN
        RETURN jsonb_build_object('success', false, 'error', 'Cannot purchase this property right now.');
    END IF;

    SELECT * INTO v_tile FROM public.board_tile_definitions WHERE tile_id = p_tile_id;
    SELECT * INTO v_prop FROM public.properties WHERE room_id = p_room_id AND tile_id = p_tile_id FOR UPDATE;
    IF v_prop.owner_id IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Property is already owned.');
    END IF;

    SELECT * INTO v_member FROM public.room_members WHERE room_id = p_room_id AND user_id = v_user_id FOR UPDATE;
    IF v_member.balance < v_tile.price THEN
        RETURN jsonb_build_object('success', false, 'error', 'Insufficient funds. Price is $' || v_tile.price || '.');
    END IF;

    UPDATE public.room_members SET balance = balance - v_tile.price WHERE id = v_member.id;
    UPDATE public.properties SET owner_id = v_user_id, updated_at = NOW() WHERE id = v_prop.id;
    PERFORM public.recalculate_member_net_worth(p_room_id, v_user_id);

    UPDATE public.game_states
    SET must_resolve_tile = false, pending_tile_id = NULL, can_end_turn = true, revision = revision + 1, updated_at = NOW()
    WHERE room_id = p_room_id;

    INSERT INTO public.activity_logs (room_id, player_id, text, log_type, amount)
    VALUES (p_room_id, v_user_id, '🏢 ' || v_member.nickname || ' purchased ' || v_tile.name || ' for $' || v_tile.price || '!', 'buy', -v_tile.price);

    RETURN jsonb_build_object('success', true, 'price', v_tile.price, 'tile_name', v_tile.name);
END;
$$;

-- ----------------------------------------------------------------------------
-- 6. Build & Sell Houses (Authentic Monopoly & Even-Building Rules)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.build_house(p_room_id UUID, p_tile_id INT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_tile RECORD;
    v_prop RECORD;
    v_member RECORD;
    v_group_total INT;
    v_owned_count INT;
    v_mortgaged_count INT;
    v_min_level INT;
    v_curr_level INT;
BEGIN
    SELECT * INTO v_tile FROM public.board_tile_definitions WHERE tile_id = p_tile_id;
    IF v_tile.tile_type != 'property' OR v_tile.house_cost <= 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Cannot construct buildings on this tile.');
    END IF;

    SELECT * INTO v_prop FROM public.properties WHERE room_id = p_room_id AND tile_id = p_tile_id FOR UPDATE;
    IF v_prop.owner_id != v_user_id THEN
        RETURN jsonb_build_object('success', false, 'error', 'You do not own this property.');
    END IF;
    IF v_prop.hotel THEN
        RETURN jsonb_build_object('success', false, 'error', 'Maximum development (Luxury Hotel) already built.');
    END IF;

    SELECT COUNT(*) INTO v_group_total FROM public.board_tile_definitions WHERE color_group = v_tile.color_group;
    SELECT COUNT(*), COUNT(*) FILTER (WHERE p.is_mortgaged), MIN(CASE WHEN p.hotel THEN 5 ELSE p.houses END)
    INTO v_owned_count, v_mortgaged_count, v_min_level
    FROM public.properties p JOIN public.board_tile_definitions d ON d.tile_id = p.tile_id
    WHERE p.room_id = p_room_id AND d.color_group = v_tile.color_group AND p.owner_id = v_user_id;

    IF v_owned_count < v_group_total THEN
        RETURN jsonb_build_object('success', false, 'error', 'Must own the full color set before building.');
    END IF;
    IF v_mortgaged_count > 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Cannot build while any property in this color group is mortgaged.');
    END IF;

    v_curr_level := CASE WHEN v_prop.hotel THEN 5 ELSE v_prop.houses END;
    IF v_curr_level > v_min_level THEN
        RETURN jsonb_build_object('success', false, 'error', 'Must develop evenly across all properties in this color group.');
    END IF;

    SELECT * INTO v_member FROM public.room_members WHERE room_id = p_room_id AND user_id = v_user_id FOR UPDATE;
    IF v_member.balance < v_tile.house_cost THEN
        RETURN jsonb_build_object('success', false, 'error', 'Insufficient funds ($' || v_tile.house_cost || ' required).');
    END IF;

    UPDATE public.room_members SET balance = balance - v_tile.house_cost WHERE id = v_member.id;
    IF v_prop.houses < 4 THEN
        UPDATE public.properties SET houses = houses + 1, updated_at = NOW() WHERE id = v_prop.id;
        INSERT INTO public.activity_logs (room_id, player_id, text, log_type, amount)
        VALUES (p_room_id, v_user_id, '🏗️ ' || v_member.nickname || ' built a house on ' || v_tile.name || ' (-$' || v_tile.house_cost || ').', 'house', -v_tile.house_cost);
    ELSE
        UPDATE public.properties SET houses = 0, hotel = true, updated_at = NOW() WHERE id = v_prop.id;
        INSERT INTO public.activity_logs (room_id, player_id, text, log_type, amount)
        VALUES (p_room_id, v_user_id, '🏨 ' || v_member.nickname || ' erected a LUXURY HOTEL on ' || v_tile.name || '!', 'house', -v_tile.house_cost);
    END IF;

    PERFORM public.recalculate_member_net_worth(p_room_id, v_user_id);
    UPDATE public.game_states SET revision = revision + 1, updated_at = NOW() WHERE room_id = p_room_id;

    RETURN jsonb_build_object('success', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.sell_house(p_room_id UUID, p_tile_id INT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_tile RECORD;
    v_prop RECORD;
    v_member RECORD;
    v_max_level INT;
    v_curr_level INT;
    v_refund INT;
BEGIN
    SELECT * INTO v_tile FROM public.board_tile_definitions WHERE tile_id = p_tile_id;
    SELECT * INTO v_prop FROM public.properties WHERE room_id = p_room_id AND tile_id = p_tile_id FOR UPDATE;
    IF v_prop.owner_id != v_user_id OR (v_prop.houses = 0 AND NOT v_prop.hotel) THEN
        RETURN jsonb_build_object('success', false, 'error', 'No buildings to sell on this property.');
    END IF;

    SELECT MAX(CASE WHEN p.hotel THEN 5 ELSE p.houses END) INTO v_max_level
    FROM public.properties p JOIN public.board_tile_definitions d ON d.tile_id = p.tile_id
    WHERE p.room_id = p_room_id AND d.color_group = v_tile.color_group AND p.owner_id = v_user_id;

    v_curr_level := CASE WHEN v_prop.hotel THEN 5 ELSE v_prop.houses END;
    IF v_curr_level < v_max_level THEN
        RETURN jsonb_build_object('success', false, 'error', 'Must sell buildings evenly across the color group.');
    END IF;

    v_refund := v_tile.house_cost / 2;
    SELECT * INTO v_member FROM public.room_members WHERE room_id = p_room_id AND user_id = v_user_id FOR UPDATE;
    UPDATE public.room_members SET balance = balance + v_refund WHERE id = v_member.id;

    IF v_prop.hotel THEN
        UPDATE public.properties SET hotel = false, houses = 4, updated_at = NOW() WHERE id = v_prop.id;
    ELSE
        UPDATE public.properties SET houses = houses - 1, updated_at = NOW() WHERE id = v_prop.id;
    END IF;

    PERFORM public.recalculate_member_net_worth(p_room_id, v_user_id);
    UPDATE public.game_states SET revision = revision + 1, updated_at = NOW() WHERE room_id = p_room_id;

    INSERT INTO public.activity_logs (room_id, player_id, text, log_type, amount)
    VALUES (p_room_id, v_user_id, '🏚️ ' || v_member.nickname || ' liquidated a building on ' || v_tile.name || ' (+$' || v_refund || ').', 'house', v_refund);

    RETURN jsonb_build_object('success', true);
END;
$$;

-- ----------------------------------------------------------------------------
-- 7. Mortgage & Unmortgage Property
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.mortgage_property(p_room_id UUID, p_tile_id INT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_tile RECORD;
    v_prop RECORD;
    v_member RECORD;
    v_group_buildings INT;
BEGIN
    SELECT * INTO v_tile FROM public.board_tile_definitions WHERE tile_id = p_tile_id;
    SELECT * INTO v_prop FROM public.properties WHERE room_id = p_room_id AND tile_id = p_tile_id FOR UPDATE;
    IF v_prop.owner_id != v_user_id OR v_prop.is_mortgaged THEN
        RETURN jsonb_build_object('success', false, 'error', 'Cannot mortgage this property.');
    END IF;

    SELECT COALESCE(SUM(p.houses + CASE WHEN p.hotel THEN 5 ELSE 0 END), 0) INTO v_group_buildings
    FROM public.properties p JOIN public.board_tile_definitions d ON d.tile_id = p.tile_id
    WHERE p.room_id = p_room_id AND d.color_group = v_tile.color_group AND p.owner_id = v_user_id;

    IF v_group_buildings > 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Must sell all houses in this color group before mortgaging.');
    END IF;

    SELECT * INTO v_member FROM public.room_members WHERE room_id = p_room_id AND user_id = v_user_id FOR UPDATE;
    UPDATE public.properties SET is_mortgaged = true, updated_at = NOW() WHERE id = v_prop.id;
    UPDATE public.room_members SET balance = balance + v_tile.mortgage_value WHERE id = v_member.id;
    PERFORM public.recalculate_member_net_worth(p_room_id, v_user_id);
    UPDATE public.game_states SET revision = revision + 1, updated_at = NOW() WHERE room_id = p_room_id;

    INSERT INTO public.activity_logs (room_id, player_id, text, log_type, amount)
    VALUES (p_room_id, v_user_id, '📜 ' || v_member.nickname || ' mortgaged ' || v_tile.name || ' (+$' || v_tile.mortgage_value || ').', 'mortgage', v_tile.mortgage_value);

    RETURN jsonb_build_object('success', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.unmortgage_property(p_room_id UUID, p_tile_id INT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_tile RECORD;
    v_prop RECORD;
    v_member RECORD;
    v_cost INT;
BEGIN
    SELECT * INTO v_tile FROM public.board_tile_definitions WHERE tile_id = p_tile_id;
    SELECT * INTO v_prop FROM public.properties WHERE room_id = p_room_id AND tile_id = p_tile_id FOR UPDATE;
    IF v_prop.owner_id != v_user_id OR NOT v_prop.is_mortgaged THEN
        RETURN jsonb_build_object('success', false, 'error', 'Property is not mortgaged.');
    END IF;

    v_cost := ceil(v_tile.mortgage_value * 1.1)::int;
    SELECT * INTO v_member FROM public.room_members WHERE room_id = p_room_id AND user_id = v_user_id FOR UPDATE;
    IF v_member.balance < v_cost THEN
        RETURN jsonb_build_object('success', false, 'error', 'Insufficient funds ($' || v_cost || ' required).');
    END IF;

    UPDATE public.properties SET is_mortgaged = false, updated_at = NOW() WHERE id = v_prop.id;
    UPDATE public.room_members SET balance = balance - v_cost WHERE id = v_member.id;
    PERFORM public.recalculate_member_net_worth(p_room_id, v_user_id);
    UPDATE public.game_states SET revision = revision + 1, updated_at = NOW() WHERE room_id = p_room_id;

    INSERT INTO public.activity_logs (room_id, player_id, text, log_type, amount)
    VALUES (p_room_id, v_user_id, '🔓 ' || v_member.nickname || ' lifted mortgage on ' || v_tile.name || ' (-$' || v_cost || ').', 'mortgage', -v_cost);

    RETURN jsonb_build_object('success', true);
END;
$$;

-- ----------------------------------------------------------------------------
-- 8. Jail Bail & Pardon Card
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.pay_jail_fine(p_room_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_member RECORD;
    v_room RECORD;
    v_bail INT;
BEGIN
    SELECT * INTO v_member FROM public.room_members WHERE room_id = p_room_id AND user_id = v_user_id FOR UPDATE;
    IF NOT FOUND OR NOT v_member.in_jail THEN
        RETURN jsonb_build_object('success', false, 'error', 'You are not in Detention.');
    END IF;

    SELECT * INTO v_room FROM public.rooms WHERE id = p_room_id FOR UPDATE;
    v_bail := COALESCE((v_room.settings->>'jailBailCost')::int, 50);

    IF v_member.balance < v_bail THEN
        RETURN jsonb_build_object('success', false, 'error', 'Insufficient balance to pay bail.');
    END IF;

    UPDATE public.room_members SET balance = balance - v_bail, in_jail = false, jail_turns = 0 WHERE id = v_member.id;
    IF COALESCE((v_room.settings->>'freeParkingJackpot')::boolean, true) THEN
        UPDATE public.rooms SET jackpot_pool = jackpot_pool + v_bail WHERE id = p_room_id;
    END IF;

    PERFORM public.recalculate_member_net_worth(p_room_id, v_user_id);
    UPDATE public.game_states SET revision = revision + 1, updated_at = NOW() WHERE room_id = p_room_id;

    INSERT INTO public.activity_logs (room_id, player_id, text, log_type, amount)
    VALUES (p_room_id, v_user_id, '⚖️ ' || v_member.nickname || ' paid $' || v_bail || ' bail and exited Detention!', 'jail', -v_bail);

    RETURN jsonb_build_object('success', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.use_jail_card(p_room_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_member RECORD;
BEGIN
    SELECT * INTO v_member FROM public.room_members WHERE room_id = p_room_id AND user_id = v_user_id FOR UPDATE;
    IF NOT FOUND OR NOT v_member.in_jail OR v_member.get_out_of_jail_cards <= 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'No Executive Pardon Pass available.');
    END IF;

    UPDATE public.room_members SET get_out_of_jail_cards = get_out_of_jail_cards - 1, in_jail = false, jail_turns = 0 WHERE id = v_member.id;
    UPDATE public.game_states SET revision = revision + 1, updated_at = NOW() WHERE room_id = p_room_id;

    INSERT INTO public.activity_logs (room_id, player_id, text, log_type)
    VALUES (p_room_id, v_user_id, '🎫 ' || v_member.nickname || ' presented an Executive Pardon Pass!', 'jail');

    RETURN jsonb_build_object('success', true);
END;
$$;

-- ----------------------------------------------------------------------------
-- 9. Auction Bidding (Anti-Sniping +8s) & Passing (Auto-Conclude)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.bid_auction(p_room_id UUID, p_amount INT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_auction RECORD;
    v_member RECORD;
    v_new_expiry TIMESTAMPTZ;
BEGIN
    SELECT * INTO v_auction FROM public.auctions WHERE room_id = p_room_id AND is_finished = false ORDER BY created_at DESC LIMIT 1 FOR UPDATE;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'No active auction.');
    END IF;

    IF NOT (v_user_id = ANY(v_auction.active_player_ids)) THEN
        RETURN jsonb_build_object('success', false, 'error', 'You already stepped down from this auction.');
    END IF;

    IF p_amount < v_auction.min_next_bid THEN
        RETURN jsonb_build_object('success', false, 'error', 'Bid must be at least $' || v_auction.min_next_bid || '.');
    END IF;

    SELECT * INTO v_member FROM public.room_members WHERE room_id = p_room_id AND user_id = v_user_id FOR UPDATE;
    IF v_member.balance < p_amount THEN
        RETURN jsonb_build_object('success', false, 'error', 'Insufficient funds for this bid.');
    END IF;

    -- Anti-sniping: guarantee at least 8s remaining
    v_new_expiry := GREATEST(v_auction.expires_at, NOW() + INTERVAL '8 seconds');

    UPDATE public.auctions
    SET current_bid = p_amount,
        highest_bidder_id = v_user_id,
        min_next_bid = p_amount + 10,
        expires_at = v_new_expiry,
        updated_at = NOW()
    WHERE id = v_auction.id;

    INSERT INTO public.activity_logs (room_id, player_id, text, log_type)
    VALUES (p_room_id, v_user_id, '🔨 ' || v_member.nickname || ' bid $' || p_amount || ' at auction!', 'auction');

    RETURN jsonb_build_object('success', true, 'current_bid', p_amount);
END;
$$;

CREATE OR REPLACE FUNCTION public.pass_auction(p_room_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_auction RECORD;
    v_remaining UUID[];
    v_winner RECORD;
    v_tile RECORD;
BEGIN
    SELECT * INTO v_auction FROM public.auctions WHERE room_id = p_room_id AND is_finished = false ORDER BY created_at DESC LIMIT 1 FOR UPDATE;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'No active auction.');
    END IF;

    v_remaining := array_remove(v_auction.active_player_ids, v_user_id);

    IF (array_length(v_remaining, 1) IS NULL) OR (array_length(v_remaining, 1) <= 1 AND v_auction.highest_bidder_id IS NOT NULL) THEN
        UPDATE public.auctions SET active_player_ids = COALESCE(v_remaining, '{}'), is_finished = true, updated_at = NOW() WHERE id = v_auction.id;

        IF v_auction.highest_bidder_id IS NOT NULL AND v_auction.current_bid > 0 THEN
            SELECT * INTO v_winner FROM public.room_members WHERE room_id = p_room_id AND user_id = v_auction.highest_bidder_id FOR UPDATE;
            SELECT * INTO v_tile FROM public.board_tile_definitions WHERE tile_id = v_auction.tile_id;

            UPDATE public.room_members SET balance = balance - v_auction.current_bid WHERE id = v_winner.id;
            UPDATE public.properties SET owner_id = v_winner.user_id, updated_at = NOW() WHERE room_id = p_room_id AND tile_id = v_auction.tile_id;
            PERFORM public.recalculate_member_net_worth(p_room_id, v_winner.user_id);

            INSERT INTO public.activity_logs (room_id, player_id, text, log_type, amount)
            VALUES (p_room_id, v_winner.user_id, '🏆 ' || v_winner.nickname || ' won ' || v_tile.name || ' at auction for $' || v_auction.current_bid || '!', 'auction', -v_auction.current_bid);
        END IF;
    ELSE
        UPDATE public.auctions SET active_player_ids = v_remaining, updated_at = NOW() WHERE id = v_auction.id;
    END IF;

    UPDATE public.game_states SET revision = revision + 1, updated_at = NOW() WHERE room_id = p_room_id;
    RETURN jsonb_build_object('success', true);
END;
$$;

-- ----------------------------------------------------------------------------
-- 10. Bilateral Trades (Propose, Atomic Accept, Reject)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.propose_trade(
    p_room_id UUID,
    p_target_id UUID,
    p_offer_cash INT,
    p_request_cash INT,
    p_offer_props INT[],
    p_request_props INT[]
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_init RECORD;
    v_target RECORD;
    v_trade_id UUID;
BEGIN
    SELECT * INTO v_init FROM public.room_members WHERE room_id = p_room_id AND user_id = v_user_id;
    SELECT * INTO v_target FROM public.room_members WHERE room_id = p_room_id AND user_id = p_target_id;
    IF NOT FOUND OR v_init.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid trade participants.');
    END IF;

    IF v_init.balance < p_offer_cash OR v_target.balance < p_request_cash THEN
        RETURN jsonb_build_object('success', false, 'error', 'Insufficient cash balance for proposed treaty.');
    END IF;

    -- Cancel any older pending trade in this room
    UPDATE public.trades SET status = 'cancelled', updated_at = NOW() WHERE room_id = p_room_id AND status = 'pending';

    INSERT INTO public.trades (room_id, initiator_id, target_id, offer_cash, request_cash, offer_property_ids, request_property_ids, status)
    VALUES (p_room_id, v_user_id, p_target_id, GREATEST(0, p_offer_cash), GREATEST(0, p_request_cash), COALESCE(p_offer_props, '{}'), COALESCE(p_request_props, '{}'), 'pending')
    RETURNING id INTO v_trade_id;

    INSERT INTO public.activity_logs (room_id, player_id, text, log_type)
    VALUES (p_room_id, v_user_id, '🤝 ' || v_init.nickname || ' proposed a bilateral treaty to ' || v_target.nickname || '.', 'trade');

    RETURN jsonb_build_object('success', true, 'trade_id', v_trade_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.accept_trade(p_room_id UUID, p_trade_id UUID DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_trade RECORD;
    v_init RECORD;
    v_target RECORD;
BEGIN
    SELECT * INTO v_trade FROM public.trades
    WHERE room_id = p_room_id AND status = 'pending' AND (p_trade_id IS NULL OR id = p_trade_id)
    ORDER BY created_at DESC LIMIT 1 FOR UPDATE;

    IF NOT FOUND OR v_trade.target_id != v_user_id THEN
        RETURN jsonb_build_object('success', false, 'error', 'No pending treaty for you to ratify.');
    END IF;

    SELECT * INTO v_init FROM public.room_members WHERE room_id = p_room_id AND user_id = v_trade.initiator_id FOR UPDATE;
    SELECT * INTO v_target FROM public.room_members WHERE room_id = p_room_id AND user_id = v_trade.target_id FOR UPDATE;

    IF v_init.balance < v_trade.offer_cash OR v_target.balance < v_trade.request_cash THEN
        RETURN jsonb_build_object('success', false, 'error', 'One of the parties no longer has sufficient funds.');
    END IF;

    -- Atomic cash transfer
    UPDATE public.room_members SET balance = balance - v_trade.offer_cash + v_trade.request_cash WHERE id = v_init.id;
    UPDATE public.room_members SET balance = balance - v_trade.request_cash + v_trade.offer_cash WHERE id = v_target.id;

    -- Atomic deed transfers
    IF array_length(v_trade.offer_property_ids, 1) > 0 THEN
        UPDATE public.properties SET owner_id = v_target.user_id, updated_at = NOW()
        WHERE room_id = p_room_id AND tile_id = ANY(v_trade.offer_property_ids) AND owner_id = v_init.user_id;
    END IF;

    IF array_length(v_trade.request_property_ids, 1) > 0 THEN
        UPDATE public.properties SET owner_id = v_init.user_id, updated_at = NOW()
        WHERE room_id = p_room_id AND tile_id = ANY(v_trade.request_property_ids) AND owner_id = v_target.user_id;
    END IF;

    UPDATE public.trades SET status = 'accepted', updated_at = NOW() WHERE id = v_trade.id;

    PERFORM public.recalculate_member_net_worth(p_room_id, v_init.user_id);
    PERFORM public.recalculate_member_net_worth(p_room_id, v_target.user_id);
    UPDATE public.game_states SET revision = revision + 1, updated_at = NOW() WHERE room_id = p_room_id;

    INSERT INTO public.activity_logs (room_id, text, log_type)
    VALUES (p_room_id, '🤝 Bilateral treaty ratified between ' || v_init.nickname || ' and ' || v_target.nickname || '!', 'trade');

    RETURN jsonb_build_object('success', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.reject_trade(p_room_id UUID, p_trade_id UUID DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_trade RECORD;
BEGIN
    SELECT * INTO v_trade FROM public.trades
    WHERE room_id = p_room_id AND status = 'pending' AND (p_trade_id IS NULL OR id = p_trade_id)
    ORDER BY created_at DESC LIMIT 1 FOR UPDATE;

    IF NOT FOUND OR (v_trade.target_id != v_user_id AND v_trade.initiator_id != v_user_id) THEN
        RETURN jsonb_build_object('success', false, 'error', 'No active trade to decline.');
    END IF;

    UPDATE public.trades SET status = 'rejected', updated_at = NOW() WHERE id = v_trade.id;
    INSERT INTO public.activity_logs (room_id, player_id, text, log_type)
    VALUES (p_room_id, v_user_id, '🚫 Trade proposal was declined.', 'trade');

    RETURN jsonb_build_object('success', true);
END;
$$;

-- ----------------------------------------------------------------------------
-- 11. Single-Roundtrip Authoritative Room Snapshot Fetch
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_full_room_state(p_room_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_room RECORD;
    v_state RECORD;
    v_members JSONB;
    v_properties JSONB;
    v_auction JSONB;
    v_trade JSONB;
    v_chats JSONB;
    v_logs JSONB;
BEGIN
    IF NOT public.is_member_of_room(p_room_id) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Unauthorized room access.');
    END IF;

    SELECT * INTO v_room FROM public.rooms WHERE id = p_room_id;
    SELECT * INTO v_state FROM public.game_states WHERE room_id = p_room_id;

    SELECT COALESCE(jsonb_agg(to_jsonb(m) ORDER BY m.turn_order ASC), '[]'::jsonb) INTO v_members
    FROM public.room_members m WHERE m.room_id = p_room_id;

    SELECT COALESCE(jsonb_agg(to_jsonb(p) ORDER BY p.tile_id ASC), '[]'::jsonb) INTO v_properties
    FROM public.properties p WHERE p.room_id = p_room_id;

    SELECT to_jsonb(a) INTO v_auction
    FROM public.auctions a WHERE a.room_id = p_room_id AND a.is_finished = false
    ORDER BY a.created_at DESC LIMIT 1;

    SELECT to_jsonb(t) INTO v_trade
    FROM public.trades t WHERE t.room_id = p_room_id AND t.status = 'pending'
    ORDER BY t.created_at DESC LIMIT 1;

    SELECT COALESCE(jsonb_agg(sub ORDER BY sub.created_at ASC), '[]'::jsonb) INTO v_chats
    FROM (
        SELECT * FROM public.chat_messages WHERE room_id = p_room_id ORDER BY created_at DESC LIMIT 100
    ) sub;

    SELECT COALESCE(jsonb_agg(sub ORDER BY sub.created_at DESC), '[]'::jsonb) INTO v_logs
    FROM (
        SELECT * FROM public.activity_logs WHERE room_id = p_room_id ORDER BY created_at DESC LIMIT 80
    ) sub;

    RETURN jsonb_build_object(
        'success', true,
        'room', to_jsonb(v_room),
        'game_state', to_jsonb(v_state),
        'members', v_members,
        'properties', v_properties,
        'auction', v_auction,
        'active_trade', v_trade,
        'chat_messages', v_chats,
        'activity_logs', v_logs
    );
END;
$$;
