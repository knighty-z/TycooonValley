import React, { useState, useEffect, useMemo } from 'react';
import type { Card, GameState, Player } from '@tycoonvale/shared';
import { useGame } from '../../context/GameContext.js';
import {
  getThemeConfig,
  resolveUniquePlayerColors,
  resolveWorldTokensForPlayers,
  type ThemeConfig
} from '../../themes/index.js';
import { TileIcon } from '../Icons/TileIcons.js';
import { WorldTokenIcon } from '../Icons/WorldTokens.js';
import { X } from 'lucide-react';

export interface CardModalProps {
  card?: Card | null;
  drawerPlayer?: Player | null;
  gameState?: GameState | null;
  themeConfig?: ThemeConfig;
  onClose?: () => void;
}

export const CardModal: React.FC<CardModalProps> = ({
  card: propCard,
  drawerPlayer: propDrawer,
  gameState: propGameState,
  themeConfig: propThemeConfig,
  onClose: propOnClose
}) => {
  let ctx: ReturnType<typeof useGame> | null = null;
  try {
    ctx = useGame();
  } catch {
    ctx = null;
  }

  const gameState = propGameState !== undefined ? propGameState : ctx?.gameState ?? null;
  const isControlled = propCard !== undefined;

  const [isOpen, setIsOpen] = useState(false);
  const [lastSeenId, setLastSeenId] = useState<string | null>(null);

  useEffect(() => {
    if (isControlled) return;
    if (gameState?.lastCardDrawn && gameState.lastCardDrawn.id !== lastSeenId) {
      setLastSeenId(gameState.lastCardDrawn.id);
      setIsOpen(true);
    }
  }, [gameState?.lastCardDrawn, lastSeenId, isControlled]);

  const activeCard = isControlled ? propCard : isOpen ? gameState?.lastCardDrawn ?? null : null;

  const handleClose = () => {
    if (propOnClose) propOnClose();
    else setIsOpen(false);
  };

  useEffect(() => {
    if (!activeCard) return undefined;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter') {
        e.preventDefault();
        handleClose();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [activeCard]);

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

  if (!activeCard) return null;

  const drawer =
    propDrawer !== undefined
      ? propDrawer
      : gameState?.players.find(p => p.id === gameState.cardDrawPlayerId) ?? null;

  const isChest = activeCard.deck === 'fortune';
  const deckTitle = isChest ? theme.eventDeckNames.chest : theme.eventDeckNames.chance;
  const accentColor = isChest ? 'var(--accent-2)' : 'var(--accent)';
  const drawerColor = drawer ? colorMap[drawer.id]?.hex ?? drawer.color : 'var(--accent)';
  const drawerToken = drawer ? tokenMap[drawer.id] : undefined;
  const chamferedAttr = theme.chamfered ? 'true' : 'false';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${deckTitle} Card`}
      data-testid="card-event-modal"
      onClick={handleClose}
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div
        onClick={e => e.stopPropagation()}
        data-chamfered={chamferedAttr}
        className="tv-hud-panel max-w-sm w-full overflow-hidden shadow-2xl relative select-none"
      >
        {/* Top Accent Strip */}
        <div style={{ backgroundColor: accentColor }} className="h-1.5 w-full" />

        <button
          type="button"
          onClick={handleClose}
          aria-label="Close card modal"
          className="tv-hud-focus absolute top-3.5 right-3 w-7 h-7 rounded bg-black/30 hover:bg-black/55 flex items-center justify-center transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Deck Header */}
        <div className="px-6 pt-5 pb-4 text-center space-y-2.5 border-b border-white/10">
          <div className="flex justify-center">
            <TileIcon
              id={isChest ? 'chest_vault' : 'chance_card'}
              worldId={theme.id}
              kind={isChest ? 'chest' : 'chance'}
              size={22}
              chamfered={theme.chamfered}
            />
          </div>

          <span
            style={{ color: accentColor }}
            className="text-[10px] uppercase font-extrabold tracking-[0.2em] block"
          >
            {deckTitle}
          </span>

          <h2
            style={{
              fontFamily: 'var(--font-heading)',
              textTransform: theme.fonts.headingUppercase ? 'uppercase' : 'none'
            }}
            className="text-xl font-extrabold tracking-wide leading-tight"
          >
            {activeCard.title}
          </h2>

          {drawer && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 tv-hud-subcard text-xs">
              <div
                className="w-5 h-5 flex items-center justify-center overflow-hidden"
                style={{
                  border: `1.5px solid ${drawerColor}`,
                  borderRadius: theme.chamfered ? '2px' : '9999px'
                }}
              >
                <WorldTokenIcon
                  tokenId={drawerToken?.id ?? drawer.token}
                  tokenDef={drawerToken}
                  worldId={theme.id}
                  color={drawerColor}
                  size={drawerToken?.imageSrc ? 18 : 14}
                />
              </div>
              <span className="opacity-75">Drawn by</span>
              <strong style={{ color: drawerColor }}>{drawer.nickname}</strong>
            </div>
          )}
        </div>

        {/* Description & OK Button */}
        <div className="px-6 py-5 text-center space-y-5">
          <p className="text-sm leading-relaxed opacity-90">{activeCard.description}</p>

          <button
            type="button"
            onClick={handleClose}
            data-testid="card-modal-ok-btn"
            data-chamfered={chamferedAttr}
            className="tv-hud-btn tv-hud-btn-primary w-full py-2.5 text-xs tracking-widest uppercase"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};
