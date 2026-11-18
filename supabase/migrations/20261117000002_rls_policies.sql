-- ============================================================================
-- TYCOONVALE SUPABASE MIGRATION 02: ROW LEVEL SECURITY (RLS) POLICIES
-- Version: 20261117000002
-- Description: Authorization rules ensuring zero unauthorized mutations.
-- ============================================================================

-- Enable RLS on all game tables
ALTER TABLE public.player_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auctions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_history ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- Security Helper Functions (SECURITY DEFINER to avoid recursive RLS checks)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_member_of_room(p_room_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.room_members
        WHERE room_id = p_room_id AND user_id = auth.uid()
    );
$$;

CREATE OR REPLACE FUNCTION public.is_host_of_room(p_room_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.rooms
        WHERE id = p_room_id AND host_id = auth.uid()
    );
$$;

-- ----------------------------------------------------------------------------
-- 1. Player Profiles Policies
-- ----------------------------------------------------------------------------
CREATE POLICY "Profiles are viewable by any authenticated user"
    ON public.player_profiles FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can insert their own profile"
    ON public.player_profiles FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON public.player_profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- ----------------------------------------------------------------------------
-- 2. Rooms Policies
-- ----------------------------------------------------------------------------
CREATE POLICY "Rooms viewable by room code lookup or membership"
    ON public.rooms FOR SELECT
    TO authenticated
    USING (true); -- Public room discovery by code

CREATE POLICY "Hosts can update room settings during LOBBY"
    ON public.rooms FOR UPDATE
    TO authenticated
    USING (auth.uid() = host_id AND phase = 'LOBBY')
    WITH CHECK (auth.uid() = host_id);

-- Direct client INSERT or DELETE on rooms is disabled; created via RPC

-- ----------------------------------------------------------------------------
-- 3. Room Members Policies
-- ----------------------------------------------------------------------------
CREATE POLICY "Members can view other members in the same room"
    ON public.room_members FOR SELECT
    TO authenticated
    USING (public.is_member_of_room(room_id));

CREATE POLICY "Users can update their own readiness and team in LOBBY"
    ON public.room_members FOR UPDATE
    TO authenticated
    USING (
        auth.uid() = user_id AND 
        EXISTS (SELECT 1 FROM public.rooms r WHERE r.id = room_id AND r.phase = 'LOBBY')
    )
    WITH CHECK (
        auth.uid() = user_id
    );

-- Balances, positions, in_jail, properties can NEVER be directly modified by clients

-- ----------------------------------------------------------------------------
-- 4. Game States Policies
-- ----------------------------------------------------------------------------
CREATE POLICY "Room members can view game state"
    ON public.game_states FOR SELECT
    TO authenticated
    USING (public.is_member_of_room(room_id));

-- NO DIRECT INSERT/UPDATE/DELETE POLICIES FOR CLIENTS ON game_states!
-- All game state transitions occur via SECURITY DEFINER transactional RPC functions.

-- ----------------------------------------------------------------------------
-- 5. Properties Policies
-- ----------------------------------------------------------------------------
CREATE POLICY "Room members can view properties"
    ON public.properties FOR SELECT
    TO authenticated
    USING (public.is_member_of_room(room_id));

-- NO DIRECT UPDATE POLICY FOR CLIENTS ON properties!
-- Property purchases, mortgages, houses occur via SECURITY DEFINER transactional RPCs.

-- ----------------------------------------------------------------------------
-- 6. Chat Messages Policies
-- ----------------------------------------------------------------------------
CREATE POLICY "Room members can read chat messages"
    ON public.chat_messages FOR SELECT
    TO authenticated
    USING (public.is_member_of_room(room_id));

CREATE POLICY "Room members can insert their own chat messages"
    ON public.chat_messages FOR INSERT
    TO authenticated
    WITH CHECK (
        public.is_member_of_room(room_id) AND 
        (sender_id = auth.uid() OR is_system = true) AND
        length(text) <= 280
    );

-- ----------------------------------------------------------------------------
-- 7. Trades Policies
-- ----------------------------------------------------------------------------
CREATE POLICY "Room members can view active trades"
    ON public.trades FOR SELECT
    TO authenticated
    USING (public.is_member_of_room(room_id));

-- Direct modifications are restricted; handled via atomic trade RPCs

-- ----------------------------------------------------------------------------
-- 8. Auctions Policies
-- ----------------------------------------------------------------------------
CREATE POLICY "Room members can view auctions"
    ON public.auctions FOR SELECT
    TO authenticated
    USING (public.is_member_of_room(room_id));

-- ----------------------------------------------------------------------------
-- 9. Career Match History Policies
-- ----------------------------------------------------------------------------
CREATE POLICY "Users can view their own match history"
    ON public.match_history FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);
