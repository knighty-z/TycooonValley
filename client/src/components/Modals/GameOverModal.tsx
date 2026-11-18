import React, { useEffect, useMemo } from 'react';
import type { GameState } from '@tycoonvale/shared';
import { useGame } from '../../context/GameContext.js';
import {
  getThemeConfig,
  resolveUniquePlayerColors,
  resolveWorldTokensForPlayers,
  type ThemeConfig
} from '../../themes/index.js';
import { WorldTokenIcon } from '../Icons/WorldTokens.js';
import confetti from 'canvas-confetti';
import { Trophy, RotateCcw, ArrowLeft, Skull, Crown } from 'lucide-react';

export interface GameOverModalProps {
  gameState?: GameState | null;
  themeConfig?: ThemeConfig;
  onPlayAgain?: () => void;
  onBackToLobby?: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  gameState: propGameState,
  themeConfig: propThemeConfig,
  onPlayAgain,
  onBackToLobby
}) => {
  let ctx: ReturnType<typeof useGame> | null = null;
  try {
    ctx = useGame();
  } catch {
    ctx = null;
  }

  const gameState = propGameState !== undefined ? propGameState : ctx?.gameState ?? null;
  const leaveRoom = ctx?.leaveRoom;

  useEffect(() => {
    if (gameState?.phase !== 'ENDED') return;
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    try {
      const testCanvas = document.createElement('canvas');
      if (!testCanvas.getContext || !testCanvas.getContext('2d')) return;
      confetti({
        particleCount: 100,
        spread: 75,
        origin: { y: 0.58 }
      });
    } catch {
      // Silent fallback when canvas-confetti is unavailable
    }
  }, [gameState?.phase]);

  const theme = useMemo(
    () => propThemeConfig ?? (gameState ? getThemeConfig(gameState.settings.theme) : getThemeConfig('original')),
    [propThemeConfig, gameState]
  );

  const colorMap = useMemo(
    () => (gameState ? resolveUniquePlayerColors(gameState.players) : {}),
    [gameState]
  );

  const tokenMap = useMemo(
    () => (gameState ? resolveWorldTokensForPlayers(gameState.players, theme.tokens) : {}),
    [gameState, theme.tokens]
  );

  if (!gameState || gameState.phase !== 'ENDED') return null;

  const currency = theme.currencySymbol;
  const winningTeam = gameState.winningTeam;
  const isTeamWin = Boolean(gameState.settings.teamMode && winningTeam);
  const sortedPlayers = [...gameState.players].sort((a, b) => {
    if (a.isBankrupt !== b.isBankrupt) return Number(a.isBankrupt) - Number(b.isBankrupt);
    return (b.netWorth || b.balance) - (a.netWorth || a.balance);
  });

  const winner = gameState.winner ?? sortedPlayers[0] ?? null;
  const winnerColor = winner ? colorMap[winner.id]?.hex ?? winner.color : 'var(--accent)';
  const winnerToken = winner ? tokenMap[winner.id] : undefined;
  const chamferedAttr = theme.chamfered ? 'true' : 'false';

  const handleBackToLobby = () => {
    if (onBackToLobby) onBackToLobby();
    else leaveRoom?.();
  };

  const handlePlayAgain = () => {
    if (onPlayAgain) onPlayAgain();
    else leaveRoom?.();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Match Complete"
      data-testid="game-over-modal"
      className="fixed inset-0 z-50 bg-black/82 backdrop-blur-md flex items-center justify-center p-4"
    >
      <div
        data-chamfered={chamferedAttr}
        className="tv-hud-panel max-w-lg w-full overflow-hidden shadow-2xl select-none"
      >
        <div style={{ backgroundColor: 'var(--accent)' }} className="h-1.5 w-full" />

        <div className="p-6 space-y-5 text-center">
          {/* Winner Spotlight */}
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-3">
              <div
                className="w-12 h-12 flex items-center justify-center"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--accent) 18%, var(--bg))',
                  border: '1.5px solid var(--accent)',
                  borderRadius: theme.chamfered ? '2px' : '9999px',
                  color: 'var(--accent)'
                }}
              >
                <Trophy className="w-6 h-6" />
              </div>

              {winner && !isTeamWin && (
                <div
                  className="w-12 h-12 flex items-center justify-center overflow-hidden"
                  style={{
                    backgroundColor: 'color-mix(in srgb, var(--bg) 88%, var(--board))',
                    border: `2px solid ${winnerColor}`,
                    borderRadius: theme.chamfered ? '2px' : '9999px'
                  }}
                >
                  <WorldTokenIcon
                    tokenId={winnerToken?.id ?? winner.token}
                    tokenDef={winnerToken}
                    worldId={theme.id}
                    color={winnerColor}
                    size={winnerToken?.imageSrc ? 42 : 30}
                  />
                </div>
              )}
            </div>

            <span
              style={{ color: 'var(--accent)' }}
              className="text-[10px] uppercase font-extrabold tracking-[0.22em] block"
            >
              {theme.name} &middot; Match Complete
            </span>

            <h2
              style={{
                fontFamily: 'var(--font-heading)',
                textTransform: theme.fonts.headingUppercase ? 'uppercase' : 'none'
              }}
              className="text-2xl sm:text-3xl font-extrabold tracking-wide"
            >
              {isTeamWin
                ? `Team ${winningTeam?.toUpperCase()} Wins`
                : `${winner?.nickname ?? 'Champion'} Wins`}
            </h2>

            <p className="text-xs opacity-75 max-w-md mx-auto">
              {isTeamWin
                ? 'The winning alliance outlasted every rival syndicate across the board.'
                : 'Final assets tallied across cash reserves, deeds, and improvements.'}
            </p>
          </div>

          {/* Ranked Final Standings */}
          <div className="tv-hud-subcard p-3.5 text-left space-y-2">
            <div className="flex items-center justify-between text-[10px] uppercase tracking-widest opacity-70 font-bold pb-1.5 border-b border-white/10">
              <span>Final Standings</span>
              <span>Deeds &middot; Net Worth</span>
            </div>

            <div className="space-y-1.5 max-h-56 overflow-y-auto tv-hud-scroll pr-0.5">
              {sortedPlayers.map((p, idx) => {
                const pColor = colorMap[p.id]?.hex ?? p.color;
                const pToken = tokenMap[p.id];
                const isWinnerRow = isTeamWin ? p.team === winningTeam : p.id === winner?.id;

                return (
                  <div
                    key={p.id}
                    style={{
                      backgroundColor: isWinnerRow
                        ? `color-mix(in srgb, ${pColor} 16%, var(--bg))`
                        : 'color-mix(in srgb, var(--bg) 70%, var(--board))',
                      borderColor: isWinnerRow
                        ? pColor
                        : 'color-mix(in srgb, var(--tile-border) 35%, transparent)',
                      borderLeftColor: pColor,
                      borderRadius: 'var(--radius-tile)'
                    }}
                    className={`px-2.5 py-2 border border-l-4 flex items-center justify-between text-xs ${
                      p.isBankrupt ? 'opacity-55' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono text-[11px] opacity-65 w-5 shrink-0">#{idx + 1}</span>
                      <div
                        className="w-7 h-7 shrink-0 flex items-center justify-center overflow-hidden"
                        style={{
                          backgroundColor: 'var(--bg)',
                          border: `1.5px solid ${pColor}`,
                          borderRadius: theme.chamfered ? '2px' : '9999px'
                        }}
                      >
                        <WorldTokenIcon
                          tokenId={pToken?.id ?? p.token}
                          tokenDef={pToken}
                          worldId={theme.id}
                          color={pColor}
                          size={pToken?.imageSrc ? 24 : 18}
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold truncate">{p.nickname}</span>
                          {isWinnerRow && (
                            <Crown className="w-3 h-3 shrink-0" style={{ color: 'var(--accent)' }} />
                          )}
                          {p.isBankrupt && (
                            <span className="inline-flex items-center gap-0.5 text-[9px] px-1 py-0.2 rounded bg-rose-500/20 text-rose-300 uppercase font-bold">
                              <Skull className="w-2.5 h-2.5" /> Bankrupt
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] opacity-65 block">
                          {pToken?.name ?? p.token}
                          {gameState.settings.teamMode && p.team ? ` · Team ${p.team}` : ''}
                        </span>
                      </div>
                    </div>

                    <div className="text-right tabular-nums shrink-0 ml-2">
                      <span className="text-[10px] opacity-65 mr-2">{p.properties.length} deeds</span>
                      <span className="font-extrabold">
                        {currency}
                        {(p.netWorth || p.balance).toLocaleString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Actions: Play Again & Back to Lobby */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <button
              type="button"
              onClick={handleBackToLobby}
              data-testid="gameover-lobby-btn"
              data-chamfered={chamferedAttr}
              className="tv-hud-btn tv-hud-btn-secondary py-2.5 px-3 text-xs uppercase tracking-wider"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Lobby</span>
            </button>
            <button
              type="button"
              onClick={handlePlayAgain}
              data-testid="gameover-playagain-btn"
              data-chamfered={chamferedAttr}
              className="tv-hud-btn tv-hud-btn-primary py-2.5 px-3 text-xs uppercase tracking-wider"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Play Again</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
