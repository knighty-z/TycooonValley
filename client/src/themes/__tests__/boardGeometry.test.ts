import { describe, it, expect } from 'vitest';
import {
  getTileGridCell,
  getTileCenter,
  getStackOffset,
  ORIGINAL_THEME,
  getThemeCssVars,
  normalizeWorldTheme
} from '../index.js';

describe('Phase B — Board Geometry & Theme System', () => {
  it('maps all 40 tiles to unique cells around the 11x11 perimeter with exact inward rotations', () => {
    const seen = new Set<string>();

    for (let i = 0; i < 40; i++) {
      const cell = getTileGridCell(i);
      const key = `${cell.row},${cell.col}`;
      expect(seen.has(key)).toBe(false);
      seen.add(key);

      // Must sit strictly on outer perimeter (row 1/11 or col 1/11)
      expect(cell.row === 1 || cell.row === 11 || cell.col === 1 || cell.col === 11).toBe(true);
    }

    expect(seen.size).toBe(40);

    // Verify 4 corners
    expect(getTileGridCell(0)).toMatchObject({ row: 11, col: 11, edge: 'corner' });
    expect(getTileGridCell(10)).toMatchObject({ row: 11, col: 1, edge: 'corner' });
    expect(getTileGridCell(20)).toMatchObject({ row: 1, col: 1, edge: 'corner' });
    expect(getTileGridCell(30)).toMatchObject({ row: 1, col: 11, edge: 'corner' });

    // Verify side rotations face center
    expect(getTileGridCell(5)).toMatchObject({ row: 11, col: 6, edge: 'bottom', rotationDeg: 0 });
    expect(getTileGridCell(15)).toMatchObject({ row: 6, col: 1, edge: 'left', rotationDeg: 90 });
    expect(getTileGridCell(25)).toMatchObject({ row: 1, col: 6, edge: 'top', rotationDeg: 180 });
    expect(getTileGridCell(35)).toMatchObject({ row: 6, col: 11, edge: 'right', rotationDeg: 270 });
  });

  it('computes exact tile centers purely from 1.48fr repeat(9, 1fr) 1.48fr grid math', () => {
    const cornerRatio = (1.48 / 2) / 11.96;
    const cornerPct = cornerRatio * 100;
    const farPct = (1 - cornerRatio) * 100;

    expect(getTileCenter(0).xPercent).toBeCloseTo(farPct, 4);
    expect(getTileCenter(0).yPercent).toBeCloseTo(farPct, 4);
    expect(getTileCenter(10).xPercent).toBeCloseTo(cornerPct, 4);
    expect(getTileCenter(10).yPercent).toBeCloseTo(farPct, 4);
    expect(getTileCenter(20).xPercent).toBeCloseTo(cornerPct, 4);
    expect(getTileCenter(20).yPercent).toBeCloseTo(cornerPct, 4);
    expect(getTileCenter(30).xPercent).toBeCloseTo(farPct, 4);
    expect(getTileCenter(30).yPercent).toBeCloseTo(cornerPct, 4);

    // Pixel coordinates on a 1196x1196 board (1 unit = 100px)
    const c0 = getTileCenter(0, { width: 1196, height: 1196 });
    expect(c0.x).toBeCloseTo(1122, 3);
    expect(c0.y).toBeCloseTo(1122, 3);

    const c1 = getTileCenter(1, { width: 1196, height: 1196 }); // col 10 -> center at 9.98 units = 998px
    expect(c1.x).toBeCloseTo(998, 3);
    expect(c1.y).toBeCloseTo(1122, 3);

    const c9 = getTileCenter(9, { width: 1196, height: 1196 }); // col 2 -> center at 1.98 units = 198px
    expect(c9.x).toBeCloseTo(198, 3);
    expect(c9.y).toBeCloseTo(1122, 3);
  });

  it('produces distinct stacking offsets for up to 6 tokens on one tile', () => {
    const coords = new Set<string>();
    for (let slot = 0; slot < 6; slot++) {
      const { dxPercent, dyPercent } = getStackOffset(slot, 6, 'bottom');
      coords.add(`${dxPercent.toFixed(2)},${dyPercent.toFixed(2)}`);
    }
    expect(coords.size).toBe(6);
  });

  it('exports complete CSS custom properties for ORIGINAL_THEME and normalizes legacy IDs', () => {
    const vars = getThemeCssVars(ORIGINAL_THEME) as Record<string, string>;
    expect(vars['--bg']).toBe('#0B1F19');
    expect(vars['--board']).toBe('#12372C');
    expect(vars['--tile']).toBe('#F4EEDC');
    expect(vars['--tile-border']).toBe('#C9A24B');
    expect(vars['--ink']).toBe('#1B1B1B');
    expect(vars['--accent']).toBe('#C9A24B');
    expect(vars['--accent-2']).toBe('#2F7D4F');
    expect(vars['--group-0']).toBe('#7A4B2E');
    expect(vars['--group-7']).toBe('#23408E');

    expect(normalizeWorldTheme('classic')).toBe('original');
    expect(normalizeWorldTheme('neon')).toBe('cyberpunk');
    expect(normalizeWorldTheme('forest')).toBe('india');
    expect(normalizeWorldTheme('luxury')).toBe('original');
    expect(normalizeWorldTheme('valorant')).toBe('valorant');
    expect(normalizeWorldTheme('original')).toBe('original');
  });
});
