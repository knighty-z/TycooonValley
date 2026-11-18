import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useGame } from '../../context/GameContext.js';
import { getTileById } from '@tycoonvale/shared';
import { getAvatarById } from '../Artwork/AvatarIcons.js';
import { X, ArrowLeftRight, Check, XCircle } from 'lucide-react';

export const TradeModal: React.FC = () => {
  const {
    gameState,
    player,
    isTradeModalOpen,
    setIsTradeModalOpen,
    proposeTrade,
    acceptTrade,
    rejectTrade
  } = useGame();

  const [targetId, setTargetId] = useState<string>('');
  const [offerCash, setOfferCash] = useState<number>(0);
  const [requestCash, setRequestCash] = useState<number>(0);
  const [offerProps, setOfferProps] = useState<number[]>([]);
  const [requestProps, setRequestProps] = useState<number[]>([]);

  const isVisible = Boolean(isTradeModalOpen && gameState && player);
  const otherPlayers = gameState && player
    ? gameState.players.filter(p => p.id !== player.id && !p.isBankrupt)
    : [];
  const activeTrade = gameState?.activeTrade;

  // Selected trade partner
  const currentTargetId = targetId || (otherPlayers[0]?.id ?? '');
  const targetPlayer = gameState?.players.find(p => p.id === currentTargetId);

  // Incoming trade to current player
  const isIncomingTrade = Boolean(activeTrade && player && activeTrade.targetId === player.id && activeTrade.status === 'pending');
  const initiatorPlayer = activeTrade && gameState ? gameState.players.find(p => p.id === activeTrade.initiatorId) : null;

  const handleToggleOfferProp = (id: number) => {
    setOfferProps(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleToggleRequestProp = (id: number) => {
    setRequestProps(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleSendProposal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTargetId) return;

    proposeTrade({
      targetId: currentTargetId,
      offerCash: Number(offerCash) || 0,
      requestCash: Number(requestCash) || 0,
      offerPropertyIds: offerProps,
      requestPropertyIds: requestProps
    });
    setIsTradeModalOpen(false);
  };

  return (
    <AnimatePresence>
      {isVisible && gameState && player && (
        <motion.div
          key="trade-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <motion.div
            key="trade-dialog"
            initial={{ opacity: 0, scale: 0.93, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', stiffness: 360, damping: 26 }}
            className="bg-[#122419] border-4 border-[#B58A30] rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl relative select-none text-[#EDE6D6]"
          >
        {/* Header */}
        <div className="bg-[#0A160F] p-5 border-b-2 border-[#3B281A] flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <ArrowLeftRight className="w-5 h-5 text-[#D4AF37]" />
            <h2 className="text-xl font-display font-black tracking-wide text-white">
              Bilateral Treaty Negotiations
            </h2>
          </div>
          <button
            onClick={() => setIsTradeModalOpen(false)}
            className="w-8 h-8 rounded-full bg-[#183626] hover:bg-[#254C37] text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* INCOMING TRADE VIEW */}
        {isIncomingTrade && activeTrade && initiatorPlayer ? (
          <div className="p-6 space-y-6">
            <div className="bg-[#183626]/80 border border-[#B58A30] p-4 rounded-2xl text-center">
              <span className="text-[#FCE794] font-display font-bold text-sm block">
                Trade Proposal from {initiatorPlayer.nickname}
              </span>
              <span className="text-[#C8BCAB] text-xs font-serif">Carefully review the terms below:</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* You Receive */}
              <div className="bg-[#0A160F] p-4 rounded-2xl border border-[#3B281A]">
                <span className="text-xs font-serif font-bold text-emerald-400 uppercase tracking-wider block mb-2">
                  You Receive
                </span>
                <div className="text-sm font-mono font-bold text-white mb-2">
                  Cash: ${activeTrade.offerCash}
                </div>
                <div className="space-y-1">
                  {activeTrade.offerPropertyIds.map(id => {
                    const t = getTileById(id);
                    return (
                      <div key={id} className="text-xs bg-[#122419] p-2 rounded-lg text-slate-200 border border-[#2D3E32]">
                        {t.name}
                      </div>
                    );
                  })}
                  {activeTrade.offerPropertyIds.length === 0 && (
                    <span className="text-xs text-[#655745] italic font-serif">No properties offered</span>
                  )}
                </div>
              </div>

              {/* You Give */}
              <div className="bg-[#0A160F] p-4 rounded-2xl border border-[#3B281A]">
                <span className="text-xs font-serif font-bold text-amber-400 uppercase tracking-wider block mb-2">
                  You Give
                </span>
                <div className="text-sm font-mono font-bold text-white mb-2">
                  Cash: ${activeTrade.requestCash}
                </div>
                <div className="space-y-1">
                  {activeTrade.requestPropertyIds.map(id => {
                    const t = getTileById(id);
                    return (
                      <div key={id} className="text-xs bg-[#122419] p-2 rounded-lg text-slate-200 border border-[#2D3E32]">
                        {t.name}
                      </div>
                    );
                  })}
                  {activeTrade.requestPropertyIds.length === 0 && (
                    <span className="text-xs text-[#655745] italic font-serif">No properties requested</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => { acceptTrade(); setIsTradeModalOpen(false); }}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-display font-black text-sm uppercase tracking-wider shadow-lg transition flex items-center justify-center space-x-2"
              >
                <Check className="w-4 h-4" />
                <span>Ratify Treaty</span>
              </button>
              <button
                type="button"
                onClick={() => { rejectTrade(); setIsTradeModalOpen(false); }}
                className="flex-1 py-3 rounded-xl bg-[#2E1810] hover:bg-[#3D2015] text-[#D4AF37] border border-[#B58A30] font-display font-bold text-sm uppercase tracking-wider transition flex items-center justify-center space-x-2"
              >
                <XCircle className="w-4 h-4" />
                <span>Decline Treaty</span>
              </button>
            </div>
          </div>
        ) : (
          /* PROPOSE NEW TRADE VIEW */
          <form onSubmit={handleSendProposal} className="p-6 space-y-6">
            {/* Select Partner */}
            <div>
              <label className="block text-xs font-serif uppercase tracking-wider text-[#D4AF37] mb-2">
                Select Negotiating Partner
              </label>
              <div className="flex flex-wrap gap-2">
                {otherPlayers.map(p => {
                  const av = getAvatarById(p.avatar);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => { setTargetId(p.id); setRequestProps([]); }}
                      style={{ borderColor: p.color }}
                      className={`py-1.5 px-3 rounded-xl border text-xs font-serif font-bold transition flex items-center space-x-2 ${
                        currentTargetId === p.id
                          ? 'bg-[#183626] text-[#FCE794] shadow-brass-glow scale-105'
                          : 'bg-[#0A160F] text-[#8C7A65] hover:text-white'
                      }`}
                    >
                      <div className="w-4 h-4 rounded-full overflow-hidden">
                        <av.Component className="w-full h-full" />
                      </div>
                      <span>{p.nickname} (${p.balance})</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dual Column: Offer vs Request */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* You Offer */}
              <div className="bg-[#0A160F] p-4 rounded-2xl border border-[#3B281A] space-y-3">
                <span className="text-xs font-serif font-bold text-emerald-400 uppercase tracking-wider block">
                  You Offer
                </span>

                <div>
                  <label className="block text-[10px] font-mono text-[#8C7A65] mb-1">Cash Consideration ($)</label>
                  <input
                    type="number"
                    min={0}
                    max={player.balance}
                    value={offerCash}
                    onChange={(e) => setOfferCash(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="w-full bg-[#122419] border border-[#3B281A] rounded-xl px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-[#8C7A65] mb-1">Properties (Click to Toggle)</label>
                  <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                    {player.properties.map(id => {
                      const t = getTileById(id);
                      const isChecked = offerProps.includes(id);
                      return (
                        <div
                          key={id}
                          onClick={() => handleToggleOfferProp(id)}
                          className={`p-2 rounded-lg text-xs cursor-pointer border flex items-center justify-between transition font-serif ${
                            isChecked
                              ? 'bg-[#183626] border-[#D4AF37] text-[#FCE794]'
                              : 'bg-[#122419] border-[#2D3E32] text-[#8C7A65] hover:border-[#655745]'
                          }`}
                        >
                          <span>{t.name}</span>
                          {isChecked && <Check className="w-3.5 h-3.5 text-[#D4AF37]" />}
                        </div>
                      );
                    })}
                    {player.properties.length === 0 && (
                      <span className="text-xs text-[#655745] italic font-serif">You hold no title deeds yet.</span>
                    )}
                  </div>
                </div>
              </div>

              {/* You Request */}
              <div className="bg-[#0A160F] p-4 rounded-2xl border border-[#3B281A] space-y-3">
                <span className="text-xs font-serif font-bold text-amber-400 uppercase tracking-wider block">
                  You Request
                </span>

                <div>
                  <label className="block text-[10px] font-mono text-[#8C7A65] mb-1">Cash Requested ($)</label>
                  <input
                    type="number"
                    min={0}
                    max={targetPlayer?.balance || 0}
                    value={requestCash}
                    onChange={(e) => setRequestCash(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="w-full bg-[#122419] border border-[#3B281A] rounded-xl px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-[#8C7A65] mb-1">Properties (Click to Toggle)</label>
                  <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                    {targetPlayer?.properties.map(id => {
                      const t = getTileById(id);
                      const isChecked = requestProps.includes(id);
                      return (
                        <div
                          key={id}
                          onClick={() => handleToggleRequestProp(id)}
                          className={`p-2 rounded-lg text-xs cursor-pointer border flex items-center justify-between transition font-serif ${
                            isChecked
                              ? 'bg-[#183626] border-[#D4AF37] text-[#FCE794]'
                              : 'bg-[#122419] border-[#2D3E32] text-[#8C7A65] hover:border-[#655745]'
                          }`}
                        >
                          <span>{t.name}</span>
                          {isChecked && <Check className="w-3.5 h-3.5 text-[#D4AF37]" />}
                        </div>
                      );
                    })}
                    {(!targetPlayer?.properties || targetPlayer.properties.length === 0) && (
                      <span className="text-xs text-[#655745] italic font-serif">Partner holds no deeds.</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={!targetPlayer || (offerCash === 0 && requestCash === 0 && offerProps.length === 0 && requestProps.length === 0)}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#D4AF37] via-[#E2B755] to-[#B8860B] text-[#12241A] font-display font-black text-sm uppercase tracking-widest shadow-gold-seal hover:brightness-110 transition disabled:opacity-40"
            >
              Dispatch Proposal
            </button>
          </form>
        )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
