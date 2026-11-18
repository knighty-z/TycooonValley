import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useGame } from '../../context/GameContext.js';
import { getTileById } from '@tycoonvale/shared';
import { THEME_CONFIGS } from '../../styles/themes.js';
import { DiceFace } from './DiceFace.js';
import { AnimatedCurrency } from '../HUD/AnimatedCurrency.js';
import { 
  Dices, 
  ShoppingCart, 
  ArrowRight, 
  Lock, 
  Ticket, 
  ArrowLeftRight, 
  Timer, 
  Gavel, 
  Coins,
  Sparkles
} from 'lucide-react';

export const CenterArea: React.FC = () => {
  const {
    gameState,
    player,
    isRolling,
    rollingDiceValues,
    rollDice,
    buyProperty,
    declineProperty,
    endTurn,
    payJailFine,
    useJailCard,
    setIsTradeModalOpen
  } = useGame();

  if (!gameState || !player) return null;

  const themeConfig = THEME_CONFIGS[gameState.settings.theme || 'classic'];
  const activePlayer = gameState.players.find(p => p.id === gameState.turn.activePlayerId);
  const isMyTurn = gameState.turn.activePlayerId === player.id;
  const isPendingPurchase = gameState.turn.mustResolveTile && gameState.turn.pendingTileId !== undefined;
  const pendingTile = isPendingPurchase && gameState.turn.pendingTileId !== undefined
    ? getTileById(gameState.turn.pendingTileId)
    : null;

  const latestLog = gameState.activityLogs[0];

  return (
    <div className={`w-full h-full p-2 sm:p-4 flex flex-col justify-between items-center text-center rounded-2xl border-2 ${themeConfig.centerBg} ${themeConfig.boardBorder} shadow-tabletop-inlay relative overflow-hidden select-none`}>
      {/* Background Watermark Crest */}
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.04] pointer-events-none">
        <span className="font-display font-black text-9xl tracking-widest text-white">TYCOON</span>
      </div>

      {/* Top Bar: Turn Status, Free Parking Jackpot & Timer */}
      <div className="w-full flex items-center justify-between border-b border-[#B58A30]/30 pb-2 z-10">
        <div className="flex items-center space-x-2">
          <div 
            className="w-3.5 h-3.5 rounded-full border border-white/40 animate-pulse shadow"
            style={{ backgroundColor: activePlayer?.color || '#D4AF37' }}
          />
          <span className="text-xs sm:text-sm font-serif font-bold text-[#F9F5EC]">
            {isMyTurn ? "Your Turn, Tycoon!" : `${activePlayer?.nickname}'s Turn`}
          </span>
        </div>

        {/* Free Parking Jackpot Badge if enabled & > 0 */}
        {gameState.settings.freeParkingJackpot && gameState.jackpotPool > 0 && (
          <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-[#D4AF37]/50 text-[#FCE794] text-[11px] font-mono">
            <Coins className="w-3 h-3 text-[#D4AF37]" />
            <span>Pot: </span>
            <AnimatedCurrency value={gameState.jackpotPool} showDelta={false} />
          </div>
        )}

        <div className="flex items-center space-x-1.5 text-xs text-[#C8BCAB] bg-black/40 px-2.5 py-1 rounded-full border border-[#4A3828]">
          <Timer className="w-3.5 h-3.5 text-[#D4AF37]" />
          <span className="font-mono font-bold">{gameState.turn.turnTimerSeconds}s</span>
        </div>
      </div>

      {/* Center Stage: The Tabletop Dice Tray */}
      <div className="flex flex-col items-center my-auto py-2 z-10">
        {/* Felt Dice Tray */}
        <div className="p-3 sm:p-4 rounded-3xl bg-black/30 border border-[#B58A30]/40 flex items-center space-x-4 mb-2 shadow-inner">
          {rollingDiceValues.map((val, idx) => (
            <DiceFace
              key={idx}
              index={idx}
              value={val}
              isRolling={isRolling}
              isDouble={gameState.turn.rolledDouble}
            />
          ))}
        </div>

        {/* Double Roll Indicator */}
        <AnimatePresence>
          {gameState.turn.rolledDouble && !isRolling && (
            <motion.span
              initial={{ opacity: 0, scale: 0.85, y: 4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={{ duration: 0.2 }}
              className="text-[11px] font-serif font-bold text-[#FCE794] bg-[#B58A30]/20 px-3 py-0.5 rounded-full border border-[#D4AF37] mb-1"
            >
              ✨ DOUBLES! ROLL AGAIN
            </motion.span>
          )}
        </AnimatePresence>

        {/* Activity Highlight Ticker */}
        <AnimatePresence mode="wait">
          {latestLog && (
            <motion.div
              key={latestLog.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.18 }}
              className="text-[11px] sm:text-xs text-[#EAE2D4] bg-black/40 px-3 py-1 rounded-xl border border-[#3A281A] max-w-sm truncate mt-1 font-serif"
            >
              {latestLog.text}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Action Controls Section */}
      <div className="w-full flex flex-col space-y-2 z-10 pt-2 border-t border-[#B58A30]/30">
        {/* Pending Property Purchase Decisions */}
        <AnimatePresence>
          {isPendingPurchase && pendingTile && isMyTurn && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 400, damping: 28 }}
              className="bg-[#0A160F]/90 p-2.5 rounded-xl border border-[#D4AF37]/50 space-y-2"
            >
              <div className="text-xs font-serif text-[#C8BCAB]">
                Claim <span className="font-bold text-white">{pendingTile.name}</span> for{' '}
                <span className="font-mono font-bold text-[#FCE794]">${pendingTile.price}</span>
              </div>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => buyProperty(pendingTile.id)}
                  disabled={player.balance < (pendingTile.price ?? 0)}
                  className="flex-1 py-2 px-3 rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-display font-bold text-xs shadow-md transition active:scale-[0.98] disabled:opacity-40 flex items-center justify-center space-x-1.5"
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  <span>Buy Title Deed</span>
                </button>
                <button
                  type="button"
                  onClick={() => declineProperty(pendingTile.id)}
                  className="flex-1 py-2 px-3 rounded-lg bg-[#2E1C12] hover:bg-[#3D2518] text-[#FCE794] font-display font-bold text-xs border border-[#B58A30] transition active:scale-[0.98] flex items-center justify-center space-x-1.5"
                >
                  <Gavel className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>To Auction</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Jail Controls if player is in jail */}
        {player.inJail && isMyTurn && !gameState.turn.canEndTurn && (
          <div className="bg-[#3B0E14]/80 p-2.5 rounded-xl border border-orange-700/60 space-y-2">
            <div className="text-xs font-serif text-orange-200 font-semibold flex items-center justify-center space-x-1">
              <Lock className="w-3.5 h-3.5 text-orange-400" />
              <span>In Detention ({player.jailTurns}/3 turns served)</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={rollDice}
                disabled={!gameState.turn.canRoll || isRolling}
                className="py-1.5 px-2 rounded-lg bg-[#183626] border border-[#4ADE80]/40 text-emerald-200 font-serif font-bold transition disabled:opacity-40"
              >
                Roll for Doubles
              </button>
              <button
                type="button"
                onClick={payJailFine}
                disabled={player.balance < gameState.settings.jailBailCost}
                className="py-1.5 px-2 rounded-lg bg-[#B8860B] hover:brightness-110 text-slate-950 font-serif font-black transition disabled:opacity-40"
              >
                Pay ${gameState.settings.jailBailCost} Bail
              </button>
              {player.getOutOfJailCards > 0 && (
                <button
                  type="button"
                  onClick={useJailCard}
                  className="col-span-2 py-1.5 px-2 rounded-lg bg-purple-700 text-white font-serif font-bold transition flex items-center justify-center space-x-1"
                >
                  <Ticket className="w-3.5 h-3.5" />
                  <span>Use Executive Pardon Pass</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Standard Roll / End Turn Action Buttons */}
        {!isPendingPurchase && (!player.inJail || gameState.turn.canEndTurn) && (
          <div className="flex space-x-2">
            {isMyTurn && gameState.turn.canRoll ? (
              <button
                type="button"
                onClick={rollDice}
                disabled={isRolling}
                className="w-full py-3 rounded-xl font-display font-black text-sm uppercase tracking-wider bg-gradient-to-r from-[#D4AF37] via-[#E2B755] to-[#B8860B] text-[#12241A] shadow-gold-seal hover:brightness-110 active:scale-[0.99] transition flex items-center justify-center space-x-2"
              >
                <Dices className="w-4 h-4" />
                <span>{isRolling ? 'Rolling Dice...' : 'Roll Dice'}</span>
              </button>
            ) : isMyTurn && gameState.turn.canEndTurn ? (
              <button
                type="button"
                onClick={endTurn}
                className="w-full py-3 rounded-xl font-display font-black text-sm uppercase tracking-wider bg-gradient-to-r from-[#183626] to-[#1E4D34] text-[#FCE794] border border-[#B58A30] hover:brightness-110 active:scale-[0.99] transition flex items-center justify-center space-x-2 shadow-lg"
              >
                <span>Pass Dice to Next Tycoon</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <div className="w-full py-2.5 rounded-xl bg-black/40 border border-[#3A281A] text-[#8C7A65] text-xs font-serif flex items-center justify-center space-x-2">
                <span>Awaiting {activePlayer?.nickname}'s move...</span>
              </div>
            )}
          </div>
        )}

        {/* Trade Shortcut */}
        <div className="flex items-center justify-center pt-1">
          <button
            type="button"
            onClick={() => setIsTradeModalOpen(true)}
            className="py-1 px-3 rounded-lg bg-black/40 hover:bg-black/60 text-[#D4AF37] border border-[#B58A30]/40 text-xs font-serif font-bold transition flex items-center space-x-1"
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span>Open Trade Negotiations</span>
          </button>
        </div>
      </div>
    </div>
  );
};
