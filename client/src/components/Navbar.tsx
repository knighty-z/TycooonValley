import React, { useState } from 'react';
import { useGame } from '../context/GameContext.js';
import { soundEngine } from '../services/audio.js';
import { 
  Volume2, 
  VolumeX, 
  Copy, 
  Check, 
  BookOpen, 
  LogOut, 
  MessageSquare,
  Sparkles
} from 'lucide-react';

interface NavbarProps {
  onOpenRules: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenRules }) => {
  const { 
    gameState, 
    isConnected, 
    leaveRoom, 
    unreadChatCount, 
    isChatDrawerOpen, 
    setIsChatDrawerOpen,
    resetUnreadChatCount 
  } = useGame();
  
  const [copied, setCopied] = useState(false);
  const [isMuted, setIsMuted] = useState(soundEngine.getMuted());

  const handleCopyCode = () => {
    if (!gameState?.roomCode) return;
    soundEngine.playClick();
    const url = `${window.location.origin}?room=${gameState.roomCode}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleMute = () => {
    const next = soundEngine.toggleMute();
    setIsMuted(next);
  };

  const handleToggleChat = () => {
    soundEngine.playClick();
    setIsChatDrawerOpen(!isChatDrawerOpen);
    if (!isChatDrawerOpen) {
      resetUnreadChatCount();
    }
  };

  return (
    <header className="h-16 border-b border-[#3A2616] bg-[#0A1610]/95 backdrop-blur-md px-4 sm:px-8 flex items-center justify-between z-30 sticky top-0 shadow-lg">
      {/* Brand & Crest */}
      <div 
        className="flex items-center space-x-3 cursor-pointer select-none" 
        onClick={() => !gameState && window.location.reload()}
      >
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#E2B755] via-[#B8860B] to-[#734A12] p-0.5 shadow-md flex items-center justify-center">
          <div className="w-full h-full bg-[#12241A] rounded-[6px] flex items-center justify-center">
            <span className="font-display text-lg text-[#E2B755]">T</span>
          </div>
        </div>
        <div>
          <span className="font-display font-black text-lg sm:text-xl tracking-widest text-[#F5EEDB]">
            TYCOON<span className="text-[#D4AF37]">VALE</span>
          </span>
          <span className="hidden sm:inline-block ml-2 text-[9px] uppercase font-mono tracking-widest text-[#B58A30] border-l border-[#B58A30]/30 pl-2">
            Tabletop Edition
          </span>
        </div>
      </div>

      {/* Center: Tabletop Wax-Seal Room Badge if in room */}
      {gameState && (
        <div className="flex items-center space-x-2 bg-[#12241A] border border-[#B58A30]/50 px-3.5 py-1.5 rounded-full shadow-inner">
          <span className="text-xs text-[#C8B89E] font-serif uppercase tracking-wider">Room:</span>
          <span className="font-mono font-black text-[#FCE794] tracking-widest text-sm">
            {gameState.roomCode}
          </span>
          <button
            onClick={handleCopyCode}
            title="Copy invitation link"
            className="p-1 rounded hover:bg-[#1E3A2A] text-[#C8B89E] hover:text-[#FFF] transition flex items-center"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      )}

      {/* Right Controls */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Connection status indicator */}
        <div className="flex items-center space-x-1.5 text-xs px-2.5 py-1 rounded-full bg-[#102016] border border-[#2D3E32]">
          <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
          <span className="text-[#A3B899] text-[11px] hidden md:inline">
            {isConnected ? 'Table Ready' : 'Connecting...'}
          </span>
        </div>

        {/* Chat Drawer Toggle (with unread badge) */}
        {gameState && (
          <button
            onClick={handleToggleChat}
            title="Multiplayer Chat & Ledger"
            className="relative p-2 rounded-lg bg-[#14261C] border border-[#3A4E3F] text-[#DED7C8] hover:text-white hover:border-[#B58A30] transition"
          >
            <MessageSquare className="w-4 h-4 text-[#D4AF37]" />
            {unreadChatCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full animate-bounce">
                {unreadChatCount}
              </span>
            )}
          </button>
        )}

        {/* Audio Toggle */}
        <button
          onClick={handleToggleMute}
          title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          className="p-2 rounded-lg bg-[#14261C] border border-[#3A4E3F] text-[#DED7C8] hover:text-white hover:border-[#B58A30] transition"
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-[#E2B755]" />}
        </button>

        {/* Rules button */}
        <button
          onClick={onOpenRules}
          title="Rulebook"
          className="p-2 rounded-lg bg-[#14261C] border border-[#3A4E3F] text-[#DED7C8] hover:text-white hover:border-[#B58A30] transition flex items-center space-x-1.5"
        >
          <BookOpen className="w-4 h-4 text-[#D4AF37]" />
          <span className="text-xs font-serif font-bold tracking-wider hidden lg:inline">Rulebook</span>
        </button>

        {/* Leave Match */}
        {gameState && (
          <button
            onClick={leaveRoom}
            title="Leave table"
            className="p-2 rounded-lg bg-[#3B0E14] border border-[#6B1D27] text-red-300 hover:bg-[#52141C] transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </header>
  );
};
