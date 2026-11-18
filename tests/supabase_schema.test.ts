import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Supabase Database Foundation & SQL Migrations', () => {
  const migrationsDir = path.resolve(__dirname, '../supabase/migrations');

  it('contains the version-controlled migration files', () => {
    expect(fs.existsSync(migrationsDir)).toBe(true);
    const files = fs.readdirSync(migrationsDir);
    expect(files).toContain('20261117000001_initial_schema.sql');
    expect(files).toContain('20261117000002_rls_policies.sql');
    expect(files).toContain('20261117000003_transactional_gameplay_functions.sql');
    expect(files).toContain('20261117000004_realtime_setup.sql');
  });

  it('defines all required core relational tables in initial schema', () => {
    const schemaSql = fs.readFileSync(path.join(migrationsDir, '20261117000001_initial_schema.sql'), 'utf-8');
    const requiredTables = [
      'public.player_profiles',
      'public.rooms',
      'public.room_members',
      'public.game_states',
      'public.properties',
      'public.chat_messages',
      'public.trades',
      'public.auctions',
      'public.match_history'
    ];

    for (const table of requiredTables) {
      expect(schemaSql).toContain(`CREATE TABLE IF NOT EXISTS ${table}`);
    }
  });

  it('enforces strict Row Level Security on all exposed tables', () => {
    const rlsSql = fs.readFileSync(path.join(migrationsDir, '20261117000002_rls_policies.sql'), 'utf-8');
    const rlsTables = [
      'player_profiles',
      'rooms',
      'room_members',
      'game_states',
      'properties',
      'chat_messages',
      'trades',
      'auctions',
      'match_history'
    ];

    for (const table of rlsTables) {
      expect(rlsSql).toContain(`ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY;`);
    }

    // Security check: game_states and properties must NOT have direct public UPDATE policies
    expect(rlsSql).not.toContain('CREATE POLICY "Allow public update on game_states"');
    expect(rlsSql).not.toContain('CREATE POLICY "Allow public update on properties"');
  });

  it('defines all required atomic transactional gameplay stored procedures', () => {
    const fnSql = fs.readFileSync(path.join(migrationsDir, '20261117000003_transactional_gameplay_functions.sql'), 'utf-8');
    const requiredFunctions = [
      'create_room',
      'join_room',
      'start_game',
      'roll_dice_turn',
      'buy_property',
      'decline_property',
      'end_turn'
    ];

    for (const fn of requiredFunctions) {
      expect(fnSql).toContain(`CREATE OR REPLACE FUNCTION public.${fn}`);
    }
  });

  it('configures Supabase Realtime CDC publication and full replica identity', () => {
    const realtimeSql = fs.readFileSync(path.join(migrationsDir, '20261117000004_realtime_setup.sql'), 'utf-8');
    expect(realtimeSql).toContain('ALTER PUBLICATION supabase_realtime ADD TABLE public.game_states');
    expect(realtimeSql).toContain('ALTER PUBLICATION supabase_realtime ADD TABLE public.room_members');
    expect(realtimeSql).toContain('ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages');
    expect(realtimeSql).toContain('ALTER TABLE public.game_states REPLICA IDENTITY FULL;');
  });

  it('defines complete gameplay RPCs, 40-tile reference table, and activity_logs in migration 05', () => {
    const m5Path = path.join(migrationsDir, '20261118000005_complete_gameplay_rpcs.sql');
    expect(fs.existsSync(m5Path)).toBe(true);
    const sql = fs.readFileSync(m5Path, 'utf-8');

    expect(sql).toContain('CREATE TABLE IF NOT EXISTS public.board_tile_definitions');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS public.activity_logs');
    expect(sql).toContain("'Diamond Pinnacle'");
    expect(sql).toContain("'Harbor Alley'");

    const fullRpcs = [
      'recalculate_member_net_worth',
      'check_bankruptcy_and_victory',
      'roll_dice_turn',
      'buy_property',
      'build_house',
      'sell_house',
      'mortgage_property',
      'unmortgage_property',
      'pay_jail_fine',
      'use_jail_card',
      'bid_auction',
      'pass_auction',
      'propose_trade',
      'accept_trade',
      'reject_trade',
      'get_full_room_state'
    ];
    for (const fn of fullRpcs) {
      expect(sql).toContain(`CREATE OR REPLACE FUNCTION public.${fn}`);
    }
  });
});
