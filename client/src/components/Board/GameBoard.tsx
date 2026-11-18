import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../../context/GameContext.js';
import { BOARD_TILES } from '@tycoonvale/shared';
import { BoardTileComponent } from './BoardTile.js';
import { CenterArea } from './CenterArea.js';
import { THEME_CONFIGS } from '../../styles/themes.js';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { soundEngine } from '../../services/audio.js';

export function computeCircularTilePath(fromPosition: number, toPosition: number): number[] {
  if (fromPosition === toPosition) return [];
  const path: number[] = [];
  let curr = fromPosition;
  while (curr !== toPosition) {
    curr = (curr + 1) % 40;
    path.push(curr);
    if (path.length >= 40) break;
  }
  return path;
}

// Exact 11x11 Grid coordinates for all 40 tiles
const TILE_GRID_POSITIONS: Record<number, { row: number; col: number; edge: 'bottom' | 'left' | 'top' | 'right' | 'corner' }> = {
  // Corner 0: Bottom Right
  0: { row: 11, col: 11, edge: 'corner' },
  // Bottom Edge (1 to 9, right to left)
  1: { row: 11, col: 10, edge: 'bottom' },
  2: { row: 11, col: 9, edge: 'bottom' },
  3: { row: 11, col: 8, edge: 'bottom' },
  4: { row: 11, col: 7, edge: 'bottom' },
  5: { row: 11, col: 6, edge: 'bottom' },
  6: { row: 11, col: 5, edge: 'bottom' },
  7: { row: 11, col: 4, edge: 'bottom' },
  8: { row: 11, col: 3, edge: 'bottom' },
  9: { row: 11, col: 2, edge: 'bottom' },
  // Corner 10: Bottom Left
  10: { row: 11, col: 1, edge: 'corner' },
  // Left Edge (11 to 19, bottom to top)
  11: { row: 10, col: 1, edge: 'left' },
  12: { row: 9, col: 1, edge: 'left' },
  13: { row: 8, col: 1, edge: 'left' },
  14: { row: 7, col: 1, edge: 'left' },
  15: { row: 6, col: 1, edge: 'left' },
  16: { row: 5, col: 1, edge: 'left' },
  17: { row: 4, col: 1, edge: 'left' },
  18: { row: 3, col: 1, edge: 'left' },
  19: { row: 2, col: 1, edge: 'left' },
  // Corner 20: Top Left
  20: { row: 1, col: 1, edge: 'corner' },
  // Top Edge (21 to 29, left to right)
  21: { row: 1, col: 2, edge: 'top' },
  22: { row: 1, col: 3, edge: 'top' },
  23: { row: 1, col: 4, edge: 'top' },
  24: { row: 1, col: 5, edge: 'top' },
  25: { row: 1, col: 6, edge: 'top' },
  26: { row: 1, col: 7, edge: 'top' },
  27: { row: 1, col: 8, edge: 'top' },
  28: { row: 1, col: 9, edge: 'top' },
  29: { row: 1, col: 10, edge: 'top' },
  // Corner 30: Top Right
  30: { row: 1, col: 11, edge: 'corner' },
  // Right Edge (31 to 39, top to bottom)
  31: { row: 2, col: 11, edge: 'right' },
  32: { row: 3, col: 11, edge: 'right' },
  33: { row: 4, col: 11, edge: 'right' },
  34: { row: 5, col: 11, edge: 'right' },
  35: { row: 6, col: 11, edge: 'right' },
  36: { row: 7, col: 11, edge: 'right' },
  37: { row: 8, col: 11, edge: 'right' },
  38: { row: 9, col: 11, edge: 'right' },
  39: { row: 10, col: 11, edge: 'right' }
};

export const GameBoard: React.FC = () => {
  const { gameState, setSelectedTile, activeMoveEvent, activeTileEffect } = useGame();
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [animatedPositions, setAnimatedPositions] = useState<Record<string, number>>({});
  const [walkingPlayerId, setWalkingPlayerId] = useState<string | null>(null);
  const activeTimersRef = useRef<number[]>([]);

  // Drive smooth step-by-step tile traversal from unified GameContext move events
  // (works identically across Supabase Realtime Broadcast and legacy Socket.IO)
  useEffect(() => {
    if (!activeMoveEvent) return;

    const { playerId, fromPosition, toPosition } = activeMoveEvent;
    const path = computeCircularTilePath(fromPosition, toPosition);
    if (path.length === 0) return;

    activeTimersRef.current.forEach(id => window.clearTimeout(id));
    activeTimersRef.current = [];

    // Anchor token at start tile briefly before stepping smoothly forward
    setWalkingPlayerId(playerId);
    setAnimatedPositions(prev => ({ ...prev, [playerId]: fromPosition }));

    // Crisp 125ms step per tile — fluid yet snappy so gameplay never stalls
    const stepDelayMs = path.length > 10 ? 95 : 125;

    path.forEach((stepPos, index) => {
      const timerId = window.setTimeout(() => {
        setAnimatedPositions(prev => ({
          ...prev,
          [playerId]: stepPos
        }));
        soundEngine.playTokenStep();

        if (stepPos === 0) {
          soundEngine.playCoin();
        }

        if (index === path.length - 1) {
          const clearTimer = window.setTimeout(() => {
            setAnimatedPositions(prev => {
              const next = { ...prev };
              delete next[playerId];
              return next;
            });
            setWalkingPlayerId(prev => (prev === playerId ? null : prev));
          }, 220);
          activeTimersRef.current.push(clearTimer);
        }
      }, (index + 1) * stepDelayMs);

      activeTimersRef.current.push(timerId);
    });

    return () => {
      activeTimersRef.current.forEach(id => window.clearTimeout(id));
      activeTimersRef.current = [];
    };
  }, [activeMoveEvent?.timestamp]);

  if (!gameState) return null;

  const activeTheme = gameState.settings.theme || 'classic';
  const themeConfig = THEME_CONFIGS[activeTheme];
  const activePlayer = gameState.players.find(p => p.id === gameState.turn.activePlayerId);

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.15, 1.45));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.15, 0.85));
  const handleResetZoom = () => setZoomLevel(1);

  return (
    <div className="w-full flex flex-col items-center select-none relative">
      {/* Zoom / Viewport Controls Toolbar */}
      <div className="flex items-center space-x-2 mb-2 bg-[#0E1E16]/80 border border-[#B58A30]/30 px-3 py-1 rounded-full text-xs font-serif text-[#C8BCAB]">
        <span className="text-[10px] uppercase font-bold text-[#D4AF37] hidden sm:inline">Table View</span>
        <button 
          onClick={handleZoomOut} 
          title="Zoom Out" 
          className="p-1 hover:text-white transition"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <span className="font-mono text-[10px] w-8 text-center">{Math.round(zoomLevel * 100)}%</span>
        <button 
          onClick={handleZoomIn} 
          title="Zoom In" 
          className="p-1 hover:text-white transition"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button 
          onClick={handleResetZoom} 
          title="Reset Scale" 
          className="p-1 hover:text-white transition ml-1"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Board Scaling Outer Frame */}
      <div 
        className="w-full max-w-[850px] transition-transform duration-200 origin-center"
        style={{ transform: `scale(${zoomLevel})` }}
      >
        <div className={`board-grid-11 rounded-3xl border-4 ${themeConfig.boardBorder} ${themeConfig.boardBg} shadow-wood-frame p-1 sm:p-2 relative overflow-hidden`}>
          {/* Render all 40 Board Tiles */}
          {BOARD_TILES.map((tile) => {
            const pos = TILE_GRID_POSITIONS[tile.id];
            const propertyState = gameState.properties[tile.id];
            const owner = propertyState?.ownerId
              ? gameState.players.find(p => p.id === propertyState.ownerId)
              : undefined;
            const playersOnTile = gameState.players.filter(p => {
              if (p.isBankrupt) return false;
              const currentPos = animatedPositions[p.id] !== undefined ? animatedPositions[p.id] : p.position;
              return currentPos === tile.id;
            });
            const activePlayerPos = activePlayer
              ? (animatedPositions[activePlayer.id] !== undefined ? animatedPositions[activePlayer.id] : activePlayer.position)
              : -1;
            const isCurrentTurnTile = activePlayerPos === tile.id;

            return (
              <div
                key={tile.id}
                style={{
                  gridRow: pos.row,
                  gridColumn: pos.col
                }}
                className="w-full h-full"
              >
                <BoardTileComponent
                  tile={tile}
                  propertyState={propertyState}
                  playersOnTile={playersOnTile}
                  owner={owner}
                  isCurrentTurnTile={isCurrentTurnTile}
                  walkingPlayerId={walkingPlayerId}
                  tileEffect={activeTileEffect?.tileId === tile.id ? activeTileEffect : null}
                  edge={pos.edge}
                  theme={activeTheme}
                  onClick={() => setSelectedTile(tile)}
                />
              </div>
            );
          })}

          {/* Center 9x9 Area */}
          <div
            style={{
              gridRow: '2 / 11',
              gridColumn: '2 / 11'
            }}
            className="w-full h-full p-1 sm:p-3"
          >
            <CenterArea />
          </div>
        </div>
      </div>
    </div>
  );
};
