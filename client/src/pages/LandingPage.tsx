import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext.js';
import { AVATAR_DEFINITIONS, getAvatarById } from '../components/Artwork/AvatarIcons.js';
import { TOKEN_DEFINITIONS, getTokenById } from '../components/Artwork/TokenIcons.js';
import { PLAYER_COLORS } from '@tycoonvale/shared';
import { 
  Building2, 
  Crown, 
  ArrowRight, 
  Gavel, 
  Coins, 
  ShieldCheck, 
  Users, 
  Dices,
  Sparkles,
  BookOpen
} from 'lucide-react';

interface LandingPageProps {
  onOpenRules: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenRules }) => {
  const { session, updateSession, createRoom, joinRoom, error, clearError } = useGame();
  const [joinCode, setJoinCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionTab, setActionTab] = useState<'create' | 'join'>('create');

  // Detect URL parameter ?room=XYZ
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      setJoinCode(roomParam.toUpperCase());
      setActionTab('join');
    }
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session.nickname.trim()) return;
    setIsSubmitting(true);
    await createRoom();
    setIsSubmitting(false);
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim() || !session.nickname.trim()) return;
    setIsSubmitting(true);
    await joinRoom(joinCode.trim().toUpperCase());
    setIsSubmitting(false);
  };

  const currentAvatar = getAvatarById(session.avatar);
  const currentToken = getTokenById(session.token);

  return (
    <div className="min-h-screen bg-tabletop-wood text-[#EDE6D6] flex flex-col justify-between selection:bg-[#B58A30] selection:text-white">
      {/* Top Ambient Tabletop Banner */}
      <div className="w-full bg-[#102217] border-b border-[#3A281A] px-4 py-2 text-center text-xs font-serif text-[#D4AF37] tracking-widest uppercase flex items-center justify-center space-x-2">
        <span>❖</span>
        <span>A Digital Tabletop Board Game of High Finance & Strategic Monopoly</span>
        <span>❖</span>
      </div>

      {/* Main Hero Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10 lg:py-16 flex-1 w-full">
        {/* Error Alert */}
        {error && (
          <div className="max-w-xl mx-auto mb-8 p-4 bg-[#3B0E14] border-2 border-[#8B1A24] rounded-xl text-red-200 text-sm flex items-center justify-between shadow-xl">
            <span className="font-sans font-medium">{error}</span>
            <button onClick={clearError} className="text-red-300 hover:text-white font-bold text-lg ml-3">✕</button>
          </div>
        )}

        {/* Asymmetrical 2-Column Hero Composition */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          
          {/* Left Column: Brand, Storytelling & Match Action (7 cols) */}
          <div className="lg:col-span-7 space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#183626] border border-[#B58A30]/40 text-[#FCE794] text-xs font-serif uppercase tracking-widest">
                <Crown className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>4 to 6 Human Players • Zero Registration Required</span>
              </div>

              <h1 className="text-4xl sm:text-6xl font-display font-black tracking-wide text-[#F9F5EC] leading-[1.1]">
                THE METROPOLIS <br />
                <span className="text-gold-foil">AWAITS YOUR BID.</span>
              </h1>

              <p className="text-[#C8BCAB] font-serif text-base sm:text-lg leading-relaxed max-w-xl">
                Roll the dice, stake your claim on 40 prime city spaces, spark hostile property auctions, 
                and construct towering Luxury Hotels to drive your rivals into bankruptcy.
              </p>
            </div>

            {/* Embossed Match Admission Card */}
            <div className="bg-[#12261B] border-2 border-[#B58A30] rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
              <div className="flex border-b border-[#3B281A] pb-4 mb-6">
                <button
                  type="button"
                  onClick={() => setActionTab('create')}
                  className={`flex-1 py-2 text-center font-display font-bold text-sm tracking-wider uppercase transition ${
                    actionTab === 'create'
                      ? 'text-[#FCE794] border-b-2 border-[#D4AF37] -mb-[18px]'
                      : 'text-[#8C7A65] hover:text-[#DCD0BE]'
                  }`}
                >
                  Host Private Table
                </button>
                <button
                  type="button"
                  onClick={() => setActionTab('join')}
                  className={`flex-1 py-2 text-center font-display font-bold text-sm tracking-wider uppercase transition ${
                    actionTab === 'join'
                      ? 'text-[#FCE794] border-b-2 border-[#D4AF37] -mb-[18px]'
                      : 'text-[#8C7A65] hover:text-[#DCD0BE]'
                  }`}
                >
                  Enter Room Code
                </button>
              </div>

              {actionTab === 'create' ? (
                <form onSubmit={handleCreate} className="space-y-5">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <label className="block text-xs font-serif uppercase tracking-wider text-[#D4AF37] mb-1.5">
                        Your Tycoon Handle
                      </label>
                      <input
                        type="text"
                        value={session.nickname}
                        onChange={(e) => updateSession({ nickname: e.target.value })}
                        maxLength={18}
                        placeholder="Enter your moniker..."
                        className="w-full bg-[#0A160F] border border-[#4A3828] rounded-xl px-4 py-3 text-white font-sans text-sm focus:outline-none focus:border-[#D4AF37] transition"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 py-3 px-4 bg-[#0A160F] rounded-xl border border-[#3A291A] text-center text-xs font-serif text-[#C8BCAB]">
                    <div>
                      <span className="text-[#8C7A65] block text-[10px] uppercase">Table Size</span>
                      <strong className="text-white">4–6 Seats</strong>
                    </div>
                    <div>
                      <span className="text-[#8C7A65] block text-[10px] uppercase">Starting Fund</span>
                      <strong className="text-[#FCE794]">$1,500</strong>
                    </div>
                    <div>
                      <span className="text-[#8C7A65] block text-[10px] uppercase">Pass GO</span>
                      <strong className="text-emerald-400">+$200</strong>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || !session.nickname.trim()}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-[#D4AF37] via-[#E2B755] to-[#B8860B] text-[#12241A] font-display font-black text-base uppercase tracking-widest shadow-gold-seal hover:brightness-110 active:scale-[0.99] transition disabled:opacity-50 flex items-center justify-center space-x-2"
                  >
                    <span>{isSubmitting ? 'Summoning Table...' : 'Open New Table'}</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </form>
              ) : (
                <form onSubmit={handleJoin} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-serif uppercase tracking-wider text-[#D4AF37] mb-1.5">
                        Your Moniker
                      </label>
                      <input
                        type="text"
                        value={session.nickname}
                        onChange={(e) => updateSession({ nickname: e.target.value })}
                        maxLength={18}
                        placeholder="Enter nickname..."
                        className="w-full bg-[#0A160F] border border-[#4A3828] rounded-xl px-4 py-3 text-white font-sans text-sm focus:outline-none focus:border-[#D4AF37] transition"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-serif uppercase tracking-wider text-[#D4AF37] mb-1.5">
                        6-Digit Room Code
                      </label>
                      <input
                        type="text"
                        value={joinCode}
                        onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                        maxLength={6}
                        placeholder="TYCOON"
                        className="w-full bg-[#0A160F] border border-[#4A3828] rounded-xl px-4 py-3 text-center text-amber-300 font-mono font-bold tracking-widest text-lg uppercase focus:outline-none focus:border-[#D4AF37] transition"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || !joinCode.trim() || !session.nickname.trim()}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-[#1E5C38] via-[#2A754B] to-[#1E5C38] text-white border border-[#4ADE80]/40 font-display font-black text-base uppercase tracking-widest shadow-lg hover:brightness-110 active:scale-[0.99] transition disabled:opacity-50 flex items-center justify-center space-x-2"
                  >
                    <span>{isSubmitting ? 'Taking Seat...' : 'Take Your Seat'}</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Right Column: The Tycoon's Atelier (Customization Showcase) (5 cols) */}
          <div className="lg:col-span-5 bg-[#0F2218] border-2 border-[#4A3525] rounded-3xl p-6 sm:p-8 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-[#3B281A] pb-3 mb-6">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                <h2 className="font-display font-bold text-sm tracking-wider uppercase text-[#F9F5EC]">
                  The Tycoon's Atelier
                </h2>
              </div>
              <span className="text-[10px] font-mono text-[#D4AF37]">Guest Identity</span>
            </div>

            {/* Live Character & Token Preview Stand */}
            <div className="bg-[#0A160F] border border-[#3B281A] rounded-2xl p-5 mb-6 flex items-center space-x-5 shadow-inner">
              <div className="w-20 h-20 rounded-2xl bg-[#142B1F] border-2 border-[#D4AF37] p-1 flex items-center justify-center shadow-md">
                <currentAvatar.Component className="w-full h-full" />
              </div>

              <div className="flex-1 space-y-1">
                <span className="text-[10px] font-serif uppercase tracking-widest text-[#B58A30]">
                  {currentAvatar.title}
                </span>
                <h3 className="font-display font-extrabold text-lg text-white">
                  {session.nickname || currentAvatar.name}
                </h3>
                <div className="flex items-center space-x-3 pt-1">
                  <div className="flex items-center space-x-1.5 text-xs text-[#C8BCAB]">
                    <div className="w-5 h-5">
                      <currentToken.Component color={session.color} />
                    </div>
                    <span>{currentToken.name}</span>
                  </div>
                  <div 
                    className="w-3.5 h-3.5 rounded-full border border-white"
                    style={{ backgroundColor: session.color }}
                  />
                </div>
              </div>
            </div>

            {/* 20 Illustrated Avatars Palette */}
            <div className="space-y-2 mb-6">
              <label className="block text-xs font-serif uppercase tracking-wider text-[#D4AF37]">
                Select Character Persona ({AVATAR_DEFINITIONS.length} Options)
              </label>
              <div className="grid grid-cols-5 gap-2 max-h-48 overflow-y-auto pr-1">
                {AVATAR_DEFINITIONS.map((av) => (
                  <button
                    key={av.id}
                    type="button"
                    onClick={() => updateSession({ avatar: av.id })}
                    title={`${av.name} — ${av.title}`}
                    className={`aspect-square p-1.5 rounded-xl border transition ${
                      session.avatar === av.id
                        ? 'border-[#D4AF37] bg-[#1E3B2B] shadow-brass-glow scale-105'
                        : 'border-[#2D3E32] bg-[#0A160F] hover:border-[#8C7A65]'
                    }`}
                  >
                    <av.Component className="w-full h-full" />
                  </button>
                ))}
              </div>
            </div>

            {/* 12 Sculpted Game Tokens Palette */}
            <div className="space-y-2 mb-6">
              <label className="block text-xs font-serif uppercase tracking-wider text-[#D4AF37]">
                Select Tabletop Figurine ({TOKEN_DEFINITIONS.length} Options)
              </label>
              <div className="grid grid-cols-6 gap-2">
                {TOKEN_DEFINITIONS.map((tok) => (
                  <button
                    key={tok.id}
                    type="button"
                    onClick={() => updateSession({ token: tok.id })}
                    title={tok.name}
                    className={`aspect-square p-1.5 rounded-xl border flex items-center justify-center transition ${
                      session.token === tok.id
                        ? 'border-[#D4AF37] bg-[#1E3B2B] shadow-brass-glow scale-105'
                        : 'border-[#2D3E32] bg-[#0A160F] hover:border-[#8C7A65]'
                    }`}
                  >
                    <tok.Component color={session.color} className="w-full h-full" />
                  </button>
                ))}
              </div>
            </div>

            {/* Accessible Player Colors Palette */}
            <div>
              <label className="block text-xs font-serif uppercase tracking-wider text-[#D4AF37] mb-2">
                Seal Color
              </label>
              <div className="flex items-center justify-between">
                {PLAYER_COLORS.map((col) => (
                  <button
                    key={col}
                    type="button"
                    onClick={() => updateSession({ color: col })}
                    style={{ backgroundColor: col }}
                    className={`w-7 h-7 rounded-full border-2 transition transform ${
                      session.color === col
                        ? 'border-white scale-125 shadow-lg'
                        : 'border-transparent hover:scale-110 opacity-80'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Tabletop Philosophy & Gameplay Showcase (Open, flowing layout) */}
        <div className="mt-24 pt-16 border-t border-[#3B281A] space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-serif uppercase tracking-widest text-[#D4AF37]">Tactile Strategic Depth</span>
            <h2 className="text-3xl sm:text-4xl font-display font-black text-white">
              An Authentic Tabletop Experience
            </h2>
            <p className="text-[#C8BCAB] font-serif text-sm">
              Engineered with physical game mechanics, server-authoritative certainty, and opulent aesthetics.
            </p>
          </div>

          {/* 4 Feature Columns with Serif Headings */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-[#142B1F] border border-[#B58A30] flex items-center justify-center text-[#D4AF37]">
                <Building2 className="w-6 h-6" />
              </div>
              <h3 className="font-display font-bold text-lg text-white">Square 40-Tile Board</h3>
              <p className="text-sm font-serif text-[#A99D8D] leading-relaxed">
                4 corners, 8 property districts, 4 transit links and 2 utilities laid out on an authentic 11x11 square grid.
              </p>
            </div>

            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-[#142B1F] border border-[#B58A30] flex items-center justify-center text-[#D4AF37]">
                <Gavel className="w-6 h-6" />
              </div>
              <h3 className="font-display font-bold text-lg text-white">Live Timed Auctions</h3>
              <p className="text-sm font-serif text-[#A99D8D] leading-relaxed">
                Decline a property to spark a bidding war. Anti-snipe time extensions ensure fair, intense showdowns.
              </p>
            </div>

            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-[#142B1F] border border-[#B58A30] flex items-center justify-center text-[#D4AF37]">
                <Coins className="w-6 h-6" />
              </div>
              <h3 className="font-display font-bold text-lg text-white">Bilateral Trading</h3>
              <p className="text-sm font-serif text-[#A99D8D] leading-relaxed">
                Propose complex trades swapping titles, cash and concessions with atomic server verification.
              </p>
            </div>

            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-[#142B1F] border border-[#B58A30] flex items-center justify-center text-[#D4AF37]">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-display font-bold text-lg text-white">Team Mode (2v2 / 3v3)</h3>
              <p className="text-sm font-serif text-[#A99D8D] leading-relaxed">
                Form financial cartels with Team Gold and Team Silver, pool equity, and dominate the municipal ledger.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabletop Footer */}
      <footer className="border-t border-[#3B281A] bg-[#0A160F] py-8 text-center text-xs text-[#8C7A65]">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="font-display font-bold text-[#F5EEDB]">TycoonVale</span>
            <span>— Premium Multiplayer Tabletop Experience</span>
          </div>
          <div className="flex items-center space-x-6">
            <button onClick={onOpenRules} className="hover:text-[#D4AF37] font-serif transition">
              Read Official Rulebook
            </button>
            <span>•</span>
            <span>React + Vite + Socket.IO + Web Audio</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
