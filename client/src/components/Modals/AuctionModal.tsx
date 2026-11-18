import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useGame } from '../../context/GameContext.js';
import { getTileById, COLOR_GROUP_CONFIG } from '@tycoonvale/shared';
import { Gavel, Timer, XCircle } from 'lucide-react';
import { AnimatedCurrency } from '../HUD/AnimatedCurrency.js';

export const AuctionModal: React.FC = () => {
  const { gameState, player, bidAuction, passAuction } = useGame();
  const [customBid, setCustomBid] = useState<string>('');

  const isVisible = Boolean(gameState && gameState.auction && player);
  const auction = gameState?.auction;
  const tile = auction ? getTileById(auction.tileId) : null;
  const groupConfig = tile?.group ? COLOR_GROUP_CONFIG[tile.group] : null;

  const highestBidder = auction?.highestBidderId && gameState
    ? gameState.players.find(p => p.id === auction.highestBidderId)
    : null;
  const isHighestBidder = Boolean(auction && player && auction.highestBidderId === player.id);
  const isActiveBidder = Boolean(auction && player && auction.activePlayerIds.includes(player.id));

  const handleCustomBid = (e: React.FormEvent) => {
    e.preventDefault();
    if (!auction || !player) return;
    const amount = parseInt(customBid, 10);
    if (!isNaN(amount) && amount >= auction.minNextBid && amount <= player.balance) {
      bidAuction(amount);
      setCustomBid('');
    }
  };

  return (
    <AnimatePresence>
      {isVisible && auction && tile && player && (
        <motion.div
          key="auction-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
        >
          <motion.div
            key="auction-dialog"
            initial={{ opacity: 0, scale: 0.92, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 12 }}
            transition={{ type: 'spring', stiffness: 360, damping: 26 }}
            className="bg-[#122419] border-4 border-[#B58A30] rounded-3xl max-w-md w-full overflow-hidden shadow-2xl relative select-none text-[#EDE6D6]"
          >
            {/* Header */}
            <div
              style={{ backgroundColor: groupConfig?.colorHex || '#1e293b' }}
              className="p-5 text-center text-white relative shadow-md border-b-2 border-black/20"
            >
              <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-black/50 text-[#FCE794] text-xs font-serif font-bold mb-1">
                <Gavel className="w-3.5 h-3.5" />
                <span>PUBLIC PROPERTY AUCTION</span>
              </div>
              <h2 className="text-2xl font-display font-black tracking-wide">{tile.name}</h2>
              <span className="text-xs font-serif text-white/80">
                Catalog Value: ${tile.price}
              </span>
            </div>

            {/* Content */}
            <div className="p-6 space-y-5">
              {/* Bid & Timer Metric Box */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#0A160F] p-4 rounded-2xl border border-[#3B281A] text-center shadow-inner">
                  <span className="text-[#8C7A65] text-xs font-serif block mb-1">High Bidder</span>
                  <motion.div
                    key={auction.currentBid}
                    initial={{ scale: 1.18, color: '#FEF08A' }}
                    animate={{ scale: 1, color: '#FCE794' }}
                    transition={{ type: 'spring', stiffness: 420, damping: 20 }}
                    className="font-mono text-2xl font-black text-[#FCE794]"
                  >
                    {auction.currentBid > 0 ? (
                      <AnimatedCurrency value={auction.currentBid} showDelta={false} durationMs={260} />
                    ) : (
                      '$0'
                    )}
                  </motion.div>
                  <span className="text-[10px] font-serif text-[#C8BCAB] block mt-0.5 truncate">
                    {highestBidder ? `Held by ${highestBidder.nickname}` : 'Open for first bid'}
                  </span>
                </div>

            <div className="bg-[#0A160F] p-4 rounded-2xl border border-[#3B281A] text-center shadow-inner">
              <span className="text-[#8C7A65] text-xs font-serif block mb-1 flex items-center justify-center space-x-1">
                <Timer className="w-3.5 h-3.5 text-red-400" />
                <span>Hammer Falling</span>
              </span>
              <span className={`font-mono text-2xl font-black ${auction.timerSeconds <= 5 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                {auction.timerSeconds}s
              </span>
              <span className="text-[10px] font-mono text-[#8C7A65] block mt-0.5">
                {auction.activePlayerIds.length} Bidders in Ring
              </span>
            </div>
          </div>

          {/* Highest Bidder Notice */}
          {isHighestBidder && (
            <div className="bg-emerald-950/60 border border-emerald-500/60 text-emerald-300 text-xs font-serif font-bold p-3 rounded-xl text-center">
              🌟 You hold the winning offer! Awaiting other bids...
            </div>
          )}

          {!isActiveBidder && (
            <div className="bg-[#3B0E14]/60 border border-red-800 text-red-300 text-xs font-serif p-3 rounded-xl text-center">
              You stepped down from bidding for this title deed.
            </div>
          )}

          {/* Bidding Controls if active */}
          {isActiveBidder && (
            <div className="space-y-3">
              <div className="text-xs font-serif text-[#C8BCAB] flex items-center justify-between font-mono">
                <span>Available Cash: ${player.balance}</span>
                <span>Minimum Next: ${auction.minNextBid}</span>
              </div>

              {/* Increments */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => bidAuction(auction.minNextBid)}
                  disabled={player.balance < auction.minNextBid || isHighestBidder}
                  className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-[#12241A] font-display font-bold text-xs shadow-md transition disabled:opacity-40"
                >
                  + Min (${auction.minNextBid})
                </button>
                <button
                  type="button"
                  onClick={() => bidAuction(auction.minNextBid + 50)}
                  disabled={player.balance < (auction.minNextBid + 50) || isHighestBidder}
                  className="py-2.5 px-3 rounded-xl bg-[#1E3B2B] hover:bg-[#2A523C] text-emerald-200 font-display font-bold text-xs border border-[#4ADE80]/30 transition disabled:opacity-40"
                >
                  +$50
                </button>
                <button
                  type="button"
                  onClick={() => bidAuction(auction.minNextBid + 100)}
                  disabled={player.balance < (auction.minNextBid + 100) || isHighestBidder}
                  className="py-2.5 px-3 rounded-xl bg-[#1E3B2B] hover:bg-[#2A523C] text-emerald-200 font-display font-bold text-xs border border-[#4ADE80]/30 transition disabled:opacity-40"
                >
                  +$100
                </button>
              </div>

              {/* Custom Bid */}
              <form onSubmit={handleCustomBid} className="flex items-center space-x-2">
                <input
                  type="number"
                  value={customBid}
                  onChange={(e) => setCustomBid(e.target.value)}
                  placeholder={`Custom bid (min $${auction.minNextBid})`}
                  className="flex-1 bg-[#0A160F] border border-[#3B281A] rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-[#D4AF37]"
                />
                <button
                  type="submit"
                  disabled={!customBid || parseInt(customBid, 10) < auction.minNextBid || parseInt(customBid, 10) > player.balance || isHighestBidder}
                  className="py-2 px-4 rounded-xl bg-[#B8860B] hover:brightness-110 text-[#12241A] font-display font-bold text-xs disabled:opacity-40 transition"
                >
                  Bid
                </button>
              </form>

              {/* Pass / Withdraw */}
              <button
                type="button"
                onClick={passAuction}
                className="w-full py-2.5 rounded-xl bg-[#0A160F] hover:bg-[#1A1814] text-[#8C7A65] hover:text-red-300 border border-[#3B281A] text-xs font-serif transition flex items-center justify-center space-x-1.5"
              >
                <XCircle className="w-3.5 h-3.5 text-red-400" />
                <span>Pass & Step Down</span>
              </button>
            </div>
          )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
