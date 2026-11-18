import React from 'react';
import { X, BookOpen, Building, Gavel, ArrowLeftRight, Lock, Trophy, Sparkles, Users } from 'lucide-react';

interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#122419] border-4 border-[#B58A30] rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl relative select-none text-[#EDE6D6]">
        {/* Header */}
        <div className="bg-[#0A160F] p-5 border-b-2 border-[#3B281A] flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <BookOpen className="w-5 h-5 text-[#D4AF37]" />
            <h2 className="text-xl font-display font-black tracking-wide text-white">
              TycoonVale Official Rulebook
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#183626] hover:bg-[#254C37] text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-[#C8BCAB] font-serif leading-relaxed">
          <section className="space-y-1.5">
            <h3 className="font-display font-bold text-white flex items-center space-x-2 text-base">
              <Trophy className="w-4 h-4 text-[#D4AF37]" />
              <span>1. The Grand Objective</span>
            </h3>
            <p className="text-xs sm:text-sm">
              TycoonVale is an economic board game for 4–6 tycoons. Your goal is to secure color monopolies, 
              construct townhouses and luxury hotels, extract crippling rent tariffs, and bankrupt your rivals. 
              In <strong>Team Mode</strong>, cartels pool equity to eliminate the rival syndicate.
            </p>
          </section>

          <section className="space-y-1.5">
            <h3 className="font-display font-bold text-white flex items-center space-x-2 text-base">
              <Building className="w-4 h-4 text-emerald-400" />
              <span>2. The 40-Tile Board & Movement</span>
            </h3>
            <p className="text-xs sm:text-sm">
              Players roll two six-sided dice. Rolling doubles grants an immediate extra roll; rolling three 
              consecutive doubles results in instant detention. Passing or landing on the <strong>GO</strong> corner awards $200.
            </p>
          </section>

          <section className="space-y-1.5">
            <h3 className="font-display font-bold text-white flex items-center space-x-2 text-base">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>3. Monopolies & Developments</span>
            </h3>
            <p className="text-xs sm:text-sm">
              When a tycoon acquires all title deeds within a color district, unimproved base rent is doubled. 
              You may then construct up to 4 townhouses before erecting a crowning <strong>Luxury Hotel</strong>. 
              Houses must be developed evenly across the set.
            </p>
          </section>

          <section className="space-y-1.5">
            <h3 className="font-display font-bold text-white flex items-center space-x-2 text-base">
              <Gavel className="w-4 h-4 text-[#D4AF37]" />
              <span>4. Public Auctions</span>
            </h3>
            <p className="text-xs sm:text-sm">
              Whenever a tycoon lands on an unowned title deed and declines to purchase it from the municipal bank, 
              the space immediately enters a timed public auction. Any active player may bid; bids placed in the 
              final seconds automatically trigger an anti-sniping time extension.
            </p>
          </section>

          <section className="space-y-1.5">
            <h3 className="font-display font-bold text-white flex items-center space-x-2 text-base">
              <ArrowLeftRight className="w-4 h-4 text-cyan-400" />
              <span>5. Bilateral Trading Treaties</span>
            </h3>
            <p className="text-xs sm:text-sm">
              Negotiate directly with rivals. Offer unmortgaged properties and treasury funds in exchange for 
              the exact pieces you need to finish your monopoly sets.
            </p>
          </section>

          <section className="space-y-1.5">
            <h3 className="font-display font-bold text-white flex items-center space-x-2 text-base">
              <Lock className="w-4 h-4 text-orange-400" />
              <span>6. Detention Center & Free Parking Jackpot</span>
            </h3>
            <p className="text-xs sm:text-sm">
              Detention is served upon landing on Tile 30, drawing a sanction card, or rolling 3 doubles. 
              To exit, roll doubles, pay $50 bail, or use an Executive Pardon Pass. 
              When the <strong>Free Parking Jackpot</strong> rule is active, all paid taxes and fines accumulate 
              in the central pot and are awarded to the first tycoon to rest on Grand Plaza Park!
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="bg-[#0A160F] p-4 border-t-2 border-[#3B281A] text-center">
          <button
            onClick={onClose}
            className="py-2.5 px-8 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-[#12241A] font-display font-black text-xs uppercase tracking-widest shadow-md hover:brightness-110 transition"
          >
            I Understand the Rules
          </button>
        </div>
      </div>
    </div>
  );
};
