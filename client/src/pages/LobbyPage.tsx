import React, { useState } from 'react';
import { useGame } from '../context/GameContext.js';
import { getAvatarById } from '../components/Artwork/AvatarIcons.js';
import { getTokenById } from '../components/Artwork/TokenIcons.js';
import { THEME_CONFIGS } from '../styles/themes.js';
import { BoardTheme } from '@tycoonvale/shared';
import { 
  Crown, 
  CheckCircle2, 
  Clock, 
  Copy, 
  Check, 
  Play, 
  Sliders, 
  Sparkles,
  Users,
  Shield,
  Coins,
  Timer,
  Gavel,
  ArrowLeftRight
} from 'lucide-react';

export const LobbyPage: React.FC = () => {
  const { 
    gameState, 
    player, 
    toggleReady, 
    setTeam, 
    updateSettings, 
    startGame, 
    error, 
    clearError 
  } = useGame();
  
  const [copied, setCopied] = useState(false);

  if (!gameState || !player) return null;

  const isHost = player.isHost;
  const isReady = player.isReady;
  const readyCount = gameState.players.filter(p => p.isReady).length;
  const canStart = isHost && gameState.players.length >= 2 && readyCount === gameState.players.length;

  const handleCopyLink = () => {
    const url = `${window.location.origin}?room=${gameState.roomCode}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentTheme = THEME_CONFIGS[gameState.settings.theme || 'classic'];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8 selection:bg-[#B58A30] selection:text-white">
      {/* Top Banner: Invitation & Atmosphere */}
      <div className="bg-[#122419] border-2 border-[#B58A30] rounded-3xl p-6 sm:p-8 mb-8 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center space-x-2 text-xs font-serif uppercase tracking-widest px-3 py-1 rounded-full bg-[#183626] border border-[#B58A30]/50 text-[#FCE794] mb-2">
              <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Multiplayer Gathering Table</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-display font-black text-[#F9F5EC]">
              The High Council Room
            </h1>
            <p className="text-sm font-serif text-[#C8BCAB] mt-1">
              Assemble 4 to 6 tycoons. Select your theme and rules, ready up, and inaugurate the match.
            </p>
          </div>

          {/* Table Seal & Room Code */}
          <div className="bg-[#0A160F] p-4 rounded-2xl border border-[#4A3828] flex items-center space-x-5 shadow-inner">
            <div>
              <span className="text-[10px] font-serif uppercase tracking-widest text-[#8C7A65] block">Table Access Code</span>
              <span className="font-mono text-3xl font-black text-[#FCE794] tracking-widest block">
                {gameState.roomCode}
              </span>
            </div>
            <button
              onClick={handleCopyLink}
              className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B8860B] hover:brightness-110 text-[#12241A] font-display font-black text-xs uppercase tracking-wider transition flex items-center space-x-1.5 shadow-md"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-950" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Share Table</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="mb-6 p-4 bg-[#3B0E14] border-2 border-[#8B1A24] rounded-2xl text-red-200 text-sm flex items-center justify-between">
          <span className="font-sans font-medium">{error}</span>
          <button onClick={clearError} className="font-bold text-red-300 hover:text-white">✕</button>
        </div>
      )}

      {/* Main Gathering Table Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left: Table Seats (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between border-b border-[#3B281A] pb-2">
            <h2 className="text-xs font-serif uppercase tracking-widest text-[#D4AF37] flex items-center space-x-2">
              <Users className="w-4 h-4 text-[#D4AF37]" />
              <span>Table Seats ({gameState.players.length} / {gameState.settings.maxPlayers})</span>
            </h2>
            <span className="text-xs font-mono text-[#FCE794]">
              {readyCount} of {gameState.players.length} Ready
            </span>
          </div>

          {/* Seat Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {gameState.players.map((p) => {
              const isMe = p.id === player.id;
              const avatar = getAvatarById(p.avatar);
              const token = getTokenById(p.token);

              return (
                <div
                  key={p.id}
                  style={{ borderLeftColor: p.color }}
                  className={`p-4 rounded-2xl bg-[#0F2218] border-y border-r border-l-4 border-[#2D3E32] relative overflow-hidden transition ${
                    isMe ? 'ring-2 ring-[#D4AF37]' : ''
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-14 h-14 rounded-2xl bg-[#142B1F] border-2 p-1 relative flex items-center justify-center shadow"
                      style={{ borderColor: p.color }}
                    >
                      <avatar.Component className="w-full h-full" />
                      {p.isHost && (
                        <div className="absolute -top-1.5 -right-1.5 bg-[#D4AF37] rounded-full p-1 shadow">
                          <Crown className="w-3 h-3 text-[#12241A]" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-display font-bold text-white text-sm truncate">
                          {p.nickname}
                        </span>
                        {isMe && (
                          <span className="text-[9px] bg-[#1E3B2B] text-[#D4AF37] px-1.5 py-0.2 rounded border border-[#B58A30]/40 font-mono">
                            You
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] font-serif text-[#C8BCAB] flex items-center space-x-2 mt-0.5">
                        <div className="w-4 h-4">
                          <token.Component color={p.color} />
                        </div>
                        <span className="truncate">{token.name}</span>
                      </div>

                      {/* Team Tag if team mode is enabled */}
                      {gameState.settings.teamMode && (
                        <div className="mt-1">
                          <span className={`text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-full ${
                            p.team === 'silver' ? 'bg-slate-700 text-slate-200' : 'bg-amber-700/80 text-amber-200'
                          }`}>
                            Team {p.team === 'silver' ? 'Silver' : 'Gold'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Ready Stamp */}
                    <div>
                      {p.isReady ? (
                        <span className="inline-flex items-center space-x-1 text-xs font-serif font-bold px-2.5 py-1 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-500/40 shadow-sm">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Ready</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 text-xs font-serif px-2.5 py-1 rounded-full bg-[#18181B] text-[#8C7A65] border border-[#3A291A]">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Waiting</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Team Switcher for local player */}
                  {gameState.settings.teamMode && isMe && (
                    <div className="mt-3 pt-2 border-t border-[#2D3E32] flex items-center justify-between text-xs font-serif">
                      <span className="text-[#8C7A65]">Switch Cartel:</span>
                      <div className="flex space-x-2">
                        <button
                          type="button"
                          onClick={() => setTeam('gold')}
                          className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            p.team !== 'silver' ? 'bg-[#D4AF37] text-black font-black' : 'bg-[#183626] text-[#FCE794]'
                          }`}
                        >
                          Team Gold
                        </button>
                        <button
                          type="button"
                          onClick={() => setTeam('silver')}
                          className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            p.team === 'silver' ? 'bg-slate-300 text-black font-black' : 'bg-[#183626] text-slate-300'
                          }`}
                        >
                          Team Silver
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Empty Table Seats */}
            {Array.from({ length: Math.max(0, gameState.settings.maxPlayers - gameState.players.length) }).map((_, idx) => (
              <div
                key={`empty-${idx}`}
                className="p-4 rounded-2xl bg-[#0A160F]/60 border-2 border-dashed border-[#2D3E32] flex items-center justify-center space-x-2 text-[#655745] text-xs font-serif"
              >
                <span>Seat {gameState.players.length + idx + 1} Open for Challenger</span>
              </div>
            ))}
          </div>

          {/* Ready & Start Action Controls */}
          <div className="bg-[#122419] border-2 border-[#4A3828] rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
            <div>
              {!isHost && (
                <button
                  type="button"
                  onClick={() => toggleReady(!isReady)}
                  className={`w-full sm:w-auto py-3.5 px-8 rounded-xl font-display font-black text-sm uppercase tracking-wider transition flex items-center justify-center space-x-2 shadow-lg ${
                    isReady
                      ? 'bg-[#2E1810] text-[#D4AF37] border border-[#B58A30]'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/50'
                  }`}
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span>{isReady ? 'Standing By (Click to Cancel)' : 'Declare Ready!'}</span>
                </button>
              )}

              {isHost && (
                <div className="text-xs font-serif text-[#C8BCAB]">
                  {gameState.players.length < 2
                    ? 'Waiting for at least 1 more challenger to take a seat...'
                    : !canStart
                    ? 'Waiting for all seated tycoons to declare Ready...'
                    : 'All tycoons ready! Launch the game board.'}
                </div>
              )}
            </div>

            {isHost && (
              <button
                type="button"
                onClick={startGame}
                disabled={!canStart}
                className="w-full sm:w-auto py-4 px-10 rounded-xl font-display font-black text-sm uppercase tracking-widest bg-gradient-to-r from-[#D4AF37] via-[#E2B755] to-[#B8860B] text-[#12241A] shadow-gold-seal hover:brightness-110 active:scale-[0.99] transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>Begin Match</span>
              </button>
            )}
          </div>
        </div>

        {/* Right: Board Themes & Host Rules Panel (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* 4 Board Themes Showcase */}
          <div className="bg-[#0F2218] border-2 border-[#4A3828] rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#2D3E32] pb-2">
              <span className="text-xs font-serif uppercase tracking-widest text-[#D4AF37] flex items-center space-x-1.5">
                <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                <span>Board Theme Aesthetics</span>
              </span>
              <span className="text-[10px] font-mono text-[#C8BCAB]">
                {isHost ? 'Host Controls' : 'Host Selected'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {(Object.keys(THEME_CONFIGS) as BoardTheme[]).map((themeKey) => {
                const conf = THEME_CONFIGS[themeKey];
                const isSelected = (gameState.settings.theme || 'classic') === themeKey;

                return (
                  <button
                    key={themeKey}
                    type="button"
                    disabled={!isHost}
                    onClick={() => updateSettings({ theme: themeKey })}
                    className={`p-3 rounded-xl border text-left transition relative ${
                      isSelected
                        ? 'border-[#D4AF37] bg-[#1E3B2B] shadow-brass-glow'
                        : 'border-[#2D3E32] bg-[#0A160F] hover:border-[#655745]'
                    } ${!isHost ? 'cursor-default' : ''}`}
                  >
                    <div 
                      className="w-full h-8 rounded-lg mb-2 border border-white/20 flex items-center justify-center text-xs font-bold text-white shadow-inner"
                      style={{ backgroundColor: conf.previewColor }}
                    >
                      {conf.name}
                    </div>
                    <span className="text-[11px] font-display font-bold text-white block">
                      {conf.name}
                    </span>
                    <span className="text-[9px] font-serif text-[#8C7A65] block line-clamp-1">
                      {conf.tagline}
                    </span>
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#D4AF37]" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Host Custom Match Configuration */}
          <div className="bg-[#0F2218] border-2 border-[#4A3828] rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center space-x-2 border-b border-[#2D3E32] pb-2">
              <Sliders className="w-4 h-4 text-[#D4AF37]" />
              <span className="text-xs font-serif uppercase tracking-widest text-[#D4AF37]">
                Custom Table Rules
              </span>
            </div>

            <div className="space-y-3 text-xs font-serif">
              {/* Starting Cash */}
              <div className="flex items-center justify-between">
                <span className="text-[#C8BCAB]">Starting Capital:</span>
                {isHost ? (
                  <select
                    value={gameState.settings.startingBalance}
                    onChange={(e) => updateSettings({ startingBalance: Number(e.target.value) })}
                    className="bg-[#0A160F] border border-[#4A3828] rounded-lg px-2.5 py-1 text-white font-mono"
                  >
                    <option value={1000}>$1,000</option>
                    <option value={1500}>$1,500 (Standard)</option>
                    <option value={2000}>$2,000</option>
                    <option value={2500}>$2,500</option>
                  </select>
                ) : (
                  <span className="font-mono font-bold text-[#FCE794]">${gameState.settings.startingBalance}</span>
                )}
              </div>

              {/* Turn Duration */}
              <div className="flex items-center justify-between">
                <span className="text-[#C8BCAB]">Turn Duration:</span>
                {isHost ? (
                  <select
                    value={gameState.settings.turnTimeoutSeconds}
                    onChange={(e) => updateSettings({ turnTimeoutSeconds: Number(e.target.value) })}
                    className="bg-[#0A160F] border border-[#4A3828] rounded-lg px-2.5 py-1 text-white font-mono"
                  >
                    <option value={30}>30 Seconds (Fast)</option>
                    <option value={45}>45 Seconds (Standard)</option>
                    <option value={60}>60 Seconds</option>
                    <option value={90}>90 Seconds (Casual)</option>
                  </select>
                ) : (
                  <span className="font-mono font-bold text-white">{gameState.settings.turnTimeoutSeconds}s</span>
                )}
              </div>

              {/* Free Parking Jackpot */}
              <div className="flex items-center justify-between">
                <span className="text-[#C8BCAB]">Free Parking Jackpot:</span>
                {isHost ? (
                  <button
                    type="button"
                    onClick={() => updateSettings({ freeParkingJackpot: !gameState.settings.freeParkingJackpot })}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                      gameState.settings.freeParkingJackpot ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {gameState.settings.freeParkingJackpot ? 'Enabled' : 'Disabled'}
                  </button>
                ) : (
                  <span className="font-bold text-emerald-400">
                    {gameState.settings.freeParkingJackpot ? 'Enabled' : 'Disabled'}
                  </span>
                )}
              </div>

              {/* Team Mode */}
              <div className="flex items-center justify-between">
                <span className="text-[#C8BCAB]">Cartel Team Mode:</span>
                {isHost ? (
                  <button
                    type="button"
                    onClick={() => updateSettings({ teamMode: !gameState.settings.teamMode })}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                      gameState.settings.teamMode ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {gameState.settings.teamMode ? 'Active (2v2/3v3)' : 'Free-for-All'}
                  </button>
                ) : (
                  <span className="font-bold text-[#FCE794]">
                    {gameState.settings.teamMode ? 'Active (Teams)' : 'Free-for-All'}
                  </span>
                )}
              </div>

              {/* Auctions & Trading toggles */}
              <div className="flex items-center justify-between">
                <span className="text-[#C8BCAB]">Auctions:</span>
                <span className="text-white font-mono">{gameState.settings.auctionEnabled ? 'Enabled' : 'Disabled'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
