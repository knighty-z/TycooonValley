import React from 'react';
import { useGame } from '../../context/GameContext.js';
import { COLOR_GROUP_CONFIG } from '@tycoonvale/shared';
import { canBuildHouse, canSellHouse, canMortgage, canUnmortgage } from '@tycoonvale/shared';
import { X, Building, Home, Shield, RotateCcw, FileText } from 'lucide-react';

export const PropertyDetailModal: React.FC = () => {
  const { 
    selectedTile, 
    setSelectedTile, 
    gameState, 
    player,
    buildHouse,
    sellHouse,
    mortgageProperty,
    unmortgageProperty
  } = useGame();

  if (!selectedTile || !gameState || !player) return null;

  const prop = gameState.properties[selectedTile.id];
  const owner = prop?.ownerId ? gameState.players.find(p => p.id === prop.ownerId) : null;
  const isOwner = prop?.ownerId === player.id;
  const groupConfig = selectedTile.group ? COLOR_GROUP_CONFIG[selectedTile.group] : null;

  // Validation checks
  const buildCheck = isOwner ? canBuildHouse(selectedTile.id, player.id, gameState.properties, player.balance) : { canBuild: false };
  const sellCheck = isOwner ? canSellHouse(selectedTile.id, player.id, gameState.properties) : { canSell: false };
  const mortgageCheck = isOwner ? canMortgage(selectedTile.id, player.id, gameState.properties) : { canMortgage: false };
  const unmortgageCheck = isOwner ? canUnmortgage(selectedTile.id, player.id, gameState.properties, player.balance) : { canUnmortgage: false, cost: 0 };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#FAF6ED] border-4 border-[#B58A30] rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl relative select-none text-[#1A140E]">
        {/* Certificate Header Banner */}
        <div
          style={{ backgroundColor: groupConfig?.colorHex || '#1e293b' }}
          className="p-4 text-center text-white relative shadow-md border-b-2 border-black/20"
        >
          <button
            onClick={() => setSelectedTile(null)}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/30 hover:bg-black/60 text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
          <span className="text-[9px] uppercase font-serif tracking-widest opacity-90 block">
            {groupConfig?.name || selectedTile.type} • Title Deed
          </span>
          <h2 className="text-xl font-display font-black tracking-wide">{selectedTile.name}</h2>
          {selectedTile.price && (
            <span className="text-xs font-mono font-bold text-amber-200">
              Assessed Value: ${selectedTile.price}
            </span>
          )}
        </div>

        {/* Parchment Body */}
        <div className="p-5 space-y-4">
          {/* Ownership Status */}
          <div className="bg-white/80 p-2.5 rounded-xl border border-[#D9D0BE] flex items-center justify-between text-xs font-serif">
            <span className="text-[#655745]">Title Holder:</span>
            {owner ? (
              <span className="font-bold flex items-center space-x-1" style={{ color: owner.color }}>
                <span>{owner.nickname}</span>
                {isOwner && <span className="text-[10px] text-slate-500">(You)</span>}
              </span>
            ) : selectedTile.price ? (
              <span className="text-emerald-700 font-bold">Unclaimed (Bank Treasury)</span>
            ) : (
              <span className="text-slate-500 italic">Special Municipal Space</span>
            )}
          </div>

          {/* Rent Schedule for standard properties */}
          {selectedTile.type === 'property' && selectedTile.rent && (
            <div className="bg-white/80 rounded-xl p-3 border border-[#D9D0BE] text-xs space-y-1.5 font-mono">
              <div className="flex justify-between text-[#1A140E]">
                <span>Base Rent:</span>
                <span className="font-bold">${selectedTile.rent[0]}</span>
              </div>
              <div className="flex justify-between text-[#655745]">
                <span>With 1 Townhouse:</span>
                <span>${selectedTile.rent[1]}</span>
              </div>
              <div className="flex justify-between text-[#655745]">
                <span>With 2 Townhouses:</span>
                <span>${selectedTile.rent[2]}</span>
              </div>
              <div className="flex justify-between text-[#655745]">
                <span>With 3 Townhouses:</span>
                <span>${selectedTile.rent[3]}</span>
              </div>
              <div className="flex justify-between text-[#655745]">
                <span>With 4 Townhouses:</span>
                <span>${selectedTile.rent[4]}</span>
              </div>
              <div className="flex justify-between text-red-700 font-bold pt-1 border-t border-[#D9D0BE]">
                <span>With LUXURY CHATEAU HOTEL:</span>
                <span>${selectedTile.rent[5]}</span>
              </div>
            </div>
          )}

          {/* Station Rents */}
          {selectedTile.type === 'station' && (
            <div className="bg-white/80 rounded-xl p-3 border border-[#D9D0BE] text-xs space-y-1 font-mono">
              <div className="text-[11px] text-[#655745] mb-1 font-serif">Transit Link tariffs scale:</div>
              <div className="flex justify-between"><span>1 Station:</span><span>$25</span></div>
              <div className="flex justify-between"><span>2 Stations:</span><span>$50</span></div>
              <div className="flex justify-between"><span>3 Stations:</span><span>$100</span></div>
              <div className="flex justify-between text-amber-800 font-bold"><span>4 Stations:</span><span>$200</span></div>
            </div>
          )}

          {/* Utility Multipliers */}
          {selectedTile.type === 'utility' && (
            <div className="bg-white/80 rounded-xl p-3 border border-[#D9D0BE] text-xs space-y-1 font-serif text-[#1A140E]">
              <div>• 1 Utility owned: <strong>4×</strong> Dice Roll Sum</div>
              <div>• Both Utilities owned: <strong>10×</strong> Dice Roll Sum</div>
            </div>
          )}

          {/* House Cost & Mortgage Values */}
          {selectedTile.price && (
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="bg-white/80 p-2 rounded-xl border border-[#D9D0BE] text-center">
                <span className="text-[#655745] block text-[9px] uppercase font-serif">Development Cost</span>
                <span className="font-bold text-[#1A140E]">${selectedTile.houseCost ?? 50} / unit</span>
              </div>
              <div className="bg-white/80 p-2 rounded-xl border border-[#D9D0BE] text-center">
                <span className="text-[#655745] block text-[9px] uppercase font-serif">Mortgage Value</span>
                <span className="font-bold text-amber-700">${selectedTile.mortgageValue ?? Math.floor(selectedTile.price / 2)}</span>
              </div>
            </div>
          )}

          {/* Owner Development Controls */}
          {isOwner && (
            <div className="pt-2 border-t border-[#D9D0BE] space-y-2">
              <span className="text-[10px] font-serif uppercase tracking-widest text-[#B58A30] font-bold block">
                Deed Management Actions
              </span>

              {selectedTile.type === 'property' && (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => buildHouse(selectedTile.id)}
                    disabled={!buildCheck.canBuild}
                    title={buildCheck.reason}
                    className="py-2.5 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-serif font-bold text-xs disabled:opacity-40 transition flex items-center justify-center space-x-1 shadow"
                  >
                    <Home className="w-3.5 h-3.5" />
                    <span>Build (${selectedTile.houseCost})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => sellHouse(selectedTile.id)}
                    disabled={!sellCheck.canSell}
                    title={sellCheck.reason}
                    className="py-2.5 px-3 rounded-xl bg-[#2E1810] hover:bg-[#3D2015] text-[#D4AF37] font-serif font-bold text-xs disabled:opacity-40 transition flex items-center justify-center space-x-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Sell Unit</span>
                  </button>
                </div>
              )}

              {/* Mortgage / Unmortgage */}
              {!prop?.isMortgaged ? (
                <button
                  type="button"
                  onClick={() => mortgageProperty(selectedTile.id)}
                  disabled={!mortgageCheck.canMortgage}
                  title={mortgageCheck.reason}
                  className="w-full py-2.5 px-3 rounded-xl bg-[#4A151C] hover:bg-[#5E1B24] text-red-200 font-serif font-bold text-xs disabled:opacity-40 transition flex items-center justify-center space-x-1.5"
                >
                  <Shield className="w-3.5 h-3.5 text-red-300" />
                  <span>Mortgage (+${selectedTile.mortgageValue ?? Math.floor((selectedTile.price ?? 100) / 2)})</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => unmortgageProperty(selectedTile.id)}
                  disabled={!unmortgageCheck.canUnmortgage}
                  title={unmortgageCheck.reason}
                  className="w-full py-2.5 px-3 rounded-xl bg-blue-700 hover:bg-blue-600 text-white font-serif font-bold text-xs disabled:opacity-40 transition flex items-center justify-center space-x-1.5"
                >
                  <span>Lift Mortgage (-${unmortgageCheck.cost})</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
