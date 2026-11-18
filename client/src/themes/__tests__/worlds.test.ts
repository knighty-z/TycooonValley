import { describe, it, expect } from 'vitest';
import { BOARD_TILES } from '@tycoonvale/shared';
import { WORLD_THEMES, WORLD_THEME_LIST, INDIA_OPTIONAL_CITIES } from '../index.js';

const EXPECTED_GROUP_SIZES = [2, 3, 3, 3, 3, 3, 3, 2];
const CORNER_INDICES = [0, 10, 20, 30];
const TRANSPORT_INDICES = [5, 15, 25, 35];
const UTILITY_INDICES = [12, 28];
const TAX_INDICES = [4, 38];
const CHANCE_INDICES = [7, 22, 36];
const CHEST_INDICES = [2, 17, 33];

// Regex matching common emoji ranges to enforce strict "no emojis" rule
const EMOJI_REGEX = /\p{Extended_Pictographic}/u;

describe('Phase C & World 5 — Five Worlds Theme Configs Structural Integrity', () => {
  it('registers all five worlds: india, valorant, original, cyberpunk, wompwomp', () => {
    expect(WORLD_THEME_LIST).toHaveLength(5);
    expect(Object.keys(WORLD_THEMES).sort()).toEqual([
      'cyberpunk',
      'india',
      'original',
      'valorant',
      'wompwomp'
    ]);
    expect(INDIA_OPTIONAL_CITIES).toEqual(['Ahmedabad', 'Surat', 'Srinagar', 'Guwahati', 'Jaipur']);
  });

  for (const world of WORLD_THEME_LIST) {
    describe(`World: ${world.name} (${world.id})`, () => {
      it('has exactly 40 tiles indexed 0..39 with corners at 0, 10, 20, 30', () => {
        expect(world.tiles).toHaveLength(40);
        world.tiles.forEach((tile, idx) => {
          expect(tile.index).toBe(idx);
        });

        expect(world.tiles[0].kind).toBe('go');
        expect(world.tiles[10].kind).toBe('jail');
        expect(world.tiles[20].kind).toBe('free_parking');
        expect(world.tiles[30].kind).toBe('go_to_jail');

        for (const cIdx of CORNER_INDICES) {
          expect(['go', 'jail', 'free_parking', 'go_to_jail']).toContain(world.tiles[cIdx].kind);
        }
      });

      it('has exactly 22 properties across 8 color groups sized 2/3/3/3/3/3/3/2', () => {
        const props = world.tiles.filter(t => t.kind === 'property');
        expect(props).toHaveLength(22);
        expect(world.groupColors).toHaveLength(8);

        const groupCounts = new Array<number>(8).fill(0);
        for (const prop of props) {
          expect(prop.groupIndex).toBeDefined();
          groupCounts[prop.groupIndex!] += 1;
        }
        expect(groupCounts).toEqual(EXPECTED_GROUP_SIZES);
      });

      it('places transports, utilities, taxes, chance and chest at exact canonical positions', () => {
        expect(world.tiles.filter(t => t.kind === 'transport').map(t => t.index)).toEqual(TRANSPORT_INDICES);
        expect(world.tiles.filter(t => t.kind === 'utility').map(t => t.index)).toEqual(UTILITY_INDICES);
        expect(world.tiles.filter(t => t.kind === 'tax').map(t => t.index)).toEqual(TAX_INDICES);
        expect(world.tiles.filter(t => t.kind === 'chance').map(t => t.index)).toEqual(CHANCE_INDICES);
        expect(world.tiles.filter(t => t.kind === 'chest').map(t => t.index)).toEqual(CHEST_INDICES);
      });

      it('preserves authoritative engine prices and tax amounts 1-to-1', () => {
        for (let i = 0; i < 40; i++) {
          const engineTile = BOARD_TILES[i];
          const worldTile = world.tiles[i];
          if (engineTile.price !== undefined) {
            expect(worldTile.price).toBe(engineTile.price);
          }
          if (engineTile.taxAmount !== undefined) {
            expect(worldTile.taxAmount).toBe(engineTile.taxAmount);
          }
        }
      });

      it('has no duplicate tile names (outside repeated Chance/Chest deck spaces) and zero emojis', () => {
        const uniqueSpaces = world.tiles.filter(t => t.kind !== 'chance' && t.kind !== 'chest');
        const normalizedNames = uniqueSpaces.map(t => t.name.trim().toLowerCase());
        expect(new Set(normalizedNames).size).toBe(uniqueSpaces.length);

        // Chance and Chest tile names must not collide with any property/corner/special tile
        const chanceName = world.tiles[7].name.trim().toLowerCase();
        const chestName = world.tiles[2].name.trim().toLowerCase();
        expect(chanceName).not.toBe(chestName);
        expect(normalizedNames).not.toContain(chanceName);
        expect(normalizedNames).not.toContain(chestName);

        // Enforce strict zero-emoji rule
        for (const tile of world.tiles) {
          expect(EMOJI_REGEX.test(tile.name)).toBe(false);
          if (tile.subtitle) expect(EMOJI_REGEX.test(tile.subtitle)).toBe(false);
        }
        for (const token of world.tokens) {
          expect(EMOJI_REGEX.test(token.name)).toBe(false);
        }
      });

      it('defines 6 unique tokens and complete theme palette', () => {
        expect(world.tokens).toHaveLength(6);
        const tokenIds = new Set(world.tokens.map(t => t.id));
        expect(tokenIds.size).toBe(6);
        expect(world.currencySymbol.length).toBeGreaterThan(0);
        expect(world.palette.boardInk).toBeTruthy();
      });
    });
  }
});
