export type BoardEdge = 'corner' | 'bottom' | 'left' | 'top' | 'right';

export interface TileGridCell {
  index: number;
  row: number; // 1..11 (CSS Grid 1-indexed)
  col: number; // 1..11 (CSS Grid 1-indexed)
  edge: BoardEdge;
  rotationDeg: 0 | 90 | 180 | 270;
}

export interface TileCenter {
  index: number;
  /** Exact percentage center X on the 13.3-unit board (0..100) */
  xPercent: number;
  /** Exact percentage center Y on the 13.3-unit board (0..100) */
  yPercent: number;
  /** Pixel X when board dimensions are supplied (equals xPercent when omitted) */
  x: number;
  /** Pixel Y when board dimensions are supplied (equals yPercent when omitted) */
  y: number;
  row: number;
  col: number;
  edge: BoardEdge;
  rotationDeg: 0 | 90 | 180 | 270;
}

export interface TokenZonePoint {
  xPercent: number;
  yPercent: number;
  edge: BoardEdge;
}

/**
 * Track sizes in grid units for `1.48fr repeat(9, 1fr) 1.48fr` — balanced, near-square
 * regular property tiles (1 : 1.48 ratio instead of skinny 1 : 2.2 strips) with distinct,
 * proportionate corner tiles.
 * Total span = 1.48 + 9 * 1.0 + 1.48 = 11.96 units.
 */
export const CORNER_TRACK_UNITS = 1.48;
export const TOTAL_TRACK_UNITS = 9 + CORNER_TRACK_UNITS * 2; // 11.96

function getTrackCenterRatio(track1Based: number): number {
  if (track1Based <= 1) {
    return (CORNER_TRACK_UNITS / 2) / TOTAL_TRACK_UNITS;
  }
  if (track1Based >= 11) {
    return (TOTAL_TRACK_UNITS - CORNER_TRACK_UNITS / 2) / TOTAL_TRACK_UNITS;
  }
  const start = CORNER_TRACK_UNITS + (track1Based - 2);
  return (start + 0.5) / TOTAL_TRACK_UNITS;
}

export function getTileGridCell(index: number): TileGridCell {
  const idx = ((Math.floor(index) % 40) + 40) % 40;

  if (idx === 0) return { index: 0, row: 11, col: 11, edge: 'corner', rotationDeg: 0 };
  if (idx >= 1 && idx <= 9) return { index: idx, row: 11, col: 11 - idx, edge: 'bottom', rotationDeg: 0 };
  if (idx === 10) return { index: 10, row: 11, col: 1, edge: 'corner', rotationDeg: 0 };
  if (idx >= 11 && idx <= 19) return { index: idx, row: 21 - idx, col: 1, edge: 'left', rotationDeg: 90 };
  if (idx === 20) return { index: 20, row: 1, col: 1, edge: 'corner', rotationDeg: 0 };
  if (idx >= 21 && idx <= 29) return { index: idx, row: 1, col: idx - 19, edge: 'top', rotationDeg: 180 };
  if (idx === 30) return { index: 30, row: 1, col: 11, edge: 'corner', rotationDeg: 0 };
  return { index: idx, row: idx - 29, col: 11, edge: 'right', rotationDeg: 270 };
}

export function getTileCenter(
  index: number,
  boardSize?: { width: number; height: number }
): TileCenter {
  const cell = getTileGridCell(index);
  const xRatio = getTrackCenterRatio(cell.col);
  const yRatio = getTrackCenterRatio(cell.row);
  const xPercent = xRatio * 100;
  const yPercent = yRatio * 100;

  return {
    index: cell.index,
    xPercent,
    yPercent,
    x: boardSize ? xRatio * boardSize.width : xPercent,
    y: boardSize ? yRatio * boardSize.height : yPercent,
    row: cell.row,
    col: cell.col,
    edge: cell.edge,
    rotationDeg: cell.rotationDeg
  };
}

/**
 * Deliberate, readable multi-token formations inside each tile's standing pad:
 * - 2 tokens: side-by-side stance with subtle depth stagger.
 * - 3 tokens: tactical V-chevron triad (flanks slightly back, center slightly forward)
 *   so all 3 upright figurines stay large, distinct, and cleanly depth-layered.
 * - 4-6 tokens: staggered 2-row squad formation.
 * - Left/Right edges: staggered vertical arc along the outer rim.
 */
export function getStackOffset(
  slotIndex: number,
  totalCount: number,
  edge: BoardEdge
): { dxPercent: number; dyPercent: number } {
  if (totalCount <= 1) {
    return { dxPercent: 0, dyPercent: 0 };
  }

  const count = Math.min(6, Math.max(1, totalCount));
  const clampedSlot = Math.max(0, Math.min(count - 1, slotIndex));

  // Left & Right columns: staggered vertical formation along the outer standing pad
  if (edge === 'left' || edge === 'right') {
    const outDir = edge === 'left' ? -1 : 1;
    if (count === 2) {
      return {
        dxPercent: clampedSlot === 0 ? outDir * 0.35 : -outDir * 0.25,
        dyPercent: (clampedSlot - 0.5) * 2.35
      };
    }
    if (count === 3) {
      const dyTable = [-2.3, 0.15, 2.4];
      const dxTable = [-outDir * 0.2, outDir * 0.65, -outDir * 0.2];
      return {
        dxPercent: dxTable[clampedSlot],
        dyPercent: dyTable[clampedSlot]
      };
    }
    const cols = 2;
    const colIdx = clampedSlot % cols;
    const rowIdx = Math.floor(clampedSlot / cols);
    return {
      dxPercent: (colIdx - 0.5) * 1.65,
      dyPercent: (rowIdx - 1) * 2.1
    };
  }

  // Top, Bottom, and Corners: side-by-side (2) or tactical V-chevron triad (3)
  if (count === 2) {
    const stepX = edge === 'corner' ? 3.1 : 2.15;
    return {
      dxPercent: (clampedSlot - 0.5) * stepX * 2,
      dyPercent: clampedSlot === 0 ? -0.35 : 0.35
    };
  }

  if (count === 3) {
    const spreadX = edge === 'corner' ? 3.35 : 2.45;
    const dxTable = [-spreadX, 0, spreadX];
    const dyTable = edge === 'corner' ? [-0.95, 0.75, -0.95] : [-0.85, 0.55, -0.85];
    return {
      dxPercent: dxTable[clampedSlot],
      dyPercent: dyTable[clampedSlot]
    };
  }

  // 4-6 tokens: staggered 2-row formation
  const cols = 3;
  const colIdx = clampedSlot % cols;
  const rowIdx = Math.floor(clampedSlot / cols);
  const rowItems = rowIdx === 0 ? cols : count - cols;
  const centeredCol = colIdx - (rowItems - 1) / 2;

  const stepX = edge === 'corner' ? 3.1 : 2.25;
  const dy = rowIdx === 0 ? -1.05 : 0.65;

  return {
    dxPercent: centeredCol * stepX,
    dyPercent: dy
  };
}

/**
 * Exact board-percentage foot-anchor inside each tile's dedicated standing pad.
 * Tokens are bottom-anchored (`translate(-50%, -94%)`) so upright collectible figurines
 * rise UPWARD from their feet and NEVER spill downward onto property names or prices.
 */
export function getTokenZonePoint(
  tileIndex: number,
  slotIndex = 0,
  totalCount = 1
): TokenZonePoint {
  const center = getTileCenter(tileIndex);
  const offset = getStackOffset(slotIndex, totalCount, center.edge);
  const cornerSpanPct = (CORNER_TRACK_UNITS / TOTAL_TRACK_UNITS) * 100; // ~12.375%

  let zoneX = center.xPercent;
  let zoneY = center.yPercent;

  if (center.edge === 'bottom') {
    // Bottom tile: band at top (0..11%), feet planted right below band so tall figurine rises into open board margin
    const tileTop = 100 - cornerSpanPct;
    zoneY = tileTop + cornerSpanPct * 0.25;
  } else if (center.edge === 'top') {
    // Top tile: feet planted on top standing pad; upright figurine rises above outer rim, text stays 100% clear
    zoneY = cornerSpanPct * 0.20;
  } else if (center.edge === 'left') {
    // Left tile: feet planted along outer-left rim so large figurine frames the edge without touching tile text
    zoneX = cornerSpanPct * 0.04;
    zoneY = center.yPercent + 2.5;
  } else if (center.edge === 'right') {
    // Right tile: feet planted along outer-right rim so large figurine frames the edge without touching tile text
    zoneX = 100 - cornerSpanPct * 0.04;
    zoneY = center.yPercent + 2.5;
  } else {
    // Corner tiles (0, 10, 20, 30): feet planted along top standing pad so upright figurine leaves subtitle, icon & heading 100% clear
    const tileTop = center.row === 1 ? 0 : 100 - cornerSpanPct;
    zoneY = center.row === 1 ? cornerSpanPct * 0.20 : tileTop + cornerSpanPct * 0.24;
  }

  return {
    xPercent: zoneX + offset.dxPercent,
    yPercent: zoneY + offset.dyPercent,
    edge: center.edge
  };
}
