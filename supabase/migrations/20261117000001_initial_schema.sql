-- ============================================================================
-- TYCOONVALE SUPABASE MIGRATION 01: INITIAL RELATIONAL SCHEMA
-- Version: 20261117000001
-- Description: Core tables, relational constraints, enums, and indexes.
-- ============================================================================

-- Enable pgcrypto for UUID generation if not already active
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. Player Profiles (Persistent Anonymous / Guest User Metadata)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.player_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nickname VARCHAR(32) NOT NULL,
    avatar VARCHAR(64) NOT NULL DEFAULT 'avatar-tycoon',
    token VARCHAR(64) NOT NULL DEFAULT 'crown',
    color VARCHAR(16) NOT NULL DEFAULT '#10B981',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 2. Rooms (Multiplayer High Council Chambers)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_code VARCHAR(6) UNIQUE NOT NULL,
    host_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    phase VARCHAR(12) NOT NULL DEFAULT 'LOBBY' CHECK (phase IN ('LOBBY', 'PLAYING', 'ENDED')),
    settings JSONB NOT NULL DEFAULT '{
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
    }'::jsonb,
    jackpot_pool INT NOT NULL DEFAULT 0 CHECK (jackpot_pool >= 0),
    winner_id UUID REFERENCES auth.users(id),
    winning_team VARCHAR(8) CHECK (winning_team IN ('gold', 'silver')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 3. Room Members (Player Seats and In-Game State per Room)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.room_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nickname VARCHAR(32) NOT NULL,
    avatar VARCHAR(64) NOT NULL DEFAULT 'avatar-tycoon',
    token VARCHAR(64) NOT NULL DEFAULT 'crown',
    color VARCHAR(16) NOT NULL DEFAULT '#10B981',
    team VARCHAR(8) CHECK (team IN ('gold', 'silver')),
    position INT NOT NULL DEFAULT 0 CHECK (position >= 0 AND position <= 39),
    balance INT NOT NULL DEFAULT 1500,
    net_worth INT NOT NULL DEFAULT 1500,
    in_jail BOOLEAN NOT NULL DEFAULT FALSE,
    jail_turns INT NOT NULL DEFAULT 0 CHECK (jail_turns >= 0),
    get_out_of_jail_cards INT NOT NULL DEFAULT 0 CHECK (get_out_of_jail_cards >= 0),
    is_bankrupt BOOLEAN NOT NULL DEFAULT FALSE,
    is_host BOOLEAN NOT NULL DEFAULT FALSE,
    is_ready BOOLEAN NOT NULL DEFAULT FALSE,
    turn_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(room_id, user_id)
);

-- ----------------------------------------------------------------------------
-- 4. Game States (Authoritative Turn State Engine)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.game_states (
    room_id UUID PRIMARY KEY REFERENCES public.rooms(id) ON DELETE CASCADE,
    active_player_id UUID REFERENCES auth.users(id),
    turn_index INT NOT NULL DEFAULT 0 CHECK (turn_index >= 0),
    roll_state VARCHAR(24) NOT NULL DEFAULT 'CAN_ROLL' CHECK (
        roll_state IN ('CAN_ROLL', 'ROLLING', 'MOVING', 'TILE_ACTION', 'TURN_ACTIONS', 'AUCTION', 'TRADE')
    ),
    dice INT[] NOT NULL DEFAULT '{1, 1}',
    consecutive_doubles INT NOT NULL DEFAULT 0 CHECK (consecutive_doubles >= 0),
    rolled_double BOOLEAN NOT NULL DEFAULT FALSE,
    can_roll BOOLEAN NOT NULL DEFAULT TRUE,
    can_end_turn BOOLEAN NOT NULL DEFAULT FALSE,
    must_resolve_tile BOOLEAN NOT NULL DEFAULT FALSE,
    pending_tile_id INT CHECK (pending_tile_id IS NULL OR (pending_tile_id >= 0 AND pending_tile_id <= 39)),
    turn_timer_expires_at TIMESTAMPTZ,
    last_card_drawn JSONB,
    card_draw_player_id UUID REFERENCES auth.users(id),
    revision INT NOT NULL DEFAULT 1,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 5. Properties (Board Deeds and Improvements for 40 Tiles per Room)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
    tile_id INT NOT NULL CHECK (tile_id >= 0 AND tile_id <= 39),
    owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    houses INT NOT NULL DEFAULT 0 CHECK (houses >= 0 AND houses <= 4),
    hotel BOOLEAN NOT NULL DEFAULT FALSE,
    is_mortgaged BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(room_id, tile_id)
);

-- ----------------------------------------------------------------------------
-- 6. Chat Messages & System Announcements
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    sender_name VARCHAR(64) NOT NULL,
    sender_avatar VARCHAR(64) NOT NULL,
    sender_color VARCHAR(16) NOT NULL,
    text VARCHAR(280) NOT NULL,
    is_reaction BOOLEAN NOT NULL DEFAULT FALSE,
    is_system BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 7. Trades (Bilateral Treaties)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.trades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
    initiator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    target_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    offer_cash INT NOT NULL DEFAULT 0 CHECK (offer_cash >= 0),
    request_cash INT NOT NULL DEFAULT 0 CHECK (request_cash >= 0),
    offer_property_ids INT[] NOT NULL DEFAULT '{}',
    request_property_ids INT[] NOT NULL DEFAULT '{}',
    status VARCHAR(16) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 8. Auctions & Bidding
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.auctions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
    tile_id INT NOT NULL CHECK (tile_id >= 0 AND tile_id <= 39),
    current_bid INT NOT NULL DEFAULT 0 CHECK (current_bid >= 0),
    highest_bidder_id UUID REFERENCES auth.users(id),
    active_player_ids UUID[] NOT NULL DEFAULT '{}',
    min_next_bid INT NOT NULL DEFAULT 10 CHECK (min_next_bid > 0),
    expires_at TIMESTAMPTZ NOT NULL,
    is_finished BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 9. Career Match History
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.match_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    room_code VARCHAR(6) NOT NULL,
    is_winner BOOLEAN NOT NULL DEFAULT FALSE,
    final_net_worth INT NOT NULL DEFAULT 0,
    properties_acquired INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- Indexes for Sub-Millisecond Query Performance
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_rooms_room_code ON public.rooms(room_code);
CREATE INDEX IF NOT EXISTS idx_room_members_room ON public.room_members(room_id);
CREATE INDEX IF NOT EXISTS idx_room_members_user ON public.room_members(user_id);
CREATE INDEX IF NOT EXISTS idx_properties_room_tile ON public.properties(room_id, tile_id);
CREATE INDEX IF NOT EXISTS idx_properties_room_owner ON public.properties(room_id, owner_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_time ON public.chat_messages(room_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trades_room_status ON public.trades(room_id, status);
CREATE INDEX IF NOT EXISTS idx_auctions_room_active ON public.auctions(room_id, is_finished);
