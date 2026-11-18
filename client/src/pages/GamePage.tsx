import React, { useState } from 'react';
import { useGame } from '../context/GameContext.js';
import { GameBoard } from '../components/Board/GameBoard.js';
import { PlayerRoster } from '../components/HUD/PlayerRoster.js';
import { ActivityLogFeed } from '../components/HUD/ActivityLogFeed.js';
import { ChatBox } from '../components/HUD/ChatBox.js';
import { PropertyDetailModal } from '../components/Modals/PropertyDetailModal.js';
import { AuctionModal } from '../components/Modals/AuctionModal.js';
import { TradeModal } from '../components/Modals/TradeModal.js';
import { CardModal } from '../components/Modals/CardModal.js';
import { GameOverModal } from '../components/Modals/GameOverModal.js';
import { THEME_CONFIGS } from '../styles/themes.js';
import { Users, ScrollText, MessageSquare, LayoutGrid } from 'lucide-react';

export const GamePage: React.FC = () => {
  const { 
    gameState, 
    unreadChatCount, 
    setIsChatDrawerOpen, 
    resetUnreadChatCount 
  } = useGame();
  
  const [mobileTab, setMobileTab] = useState<'board' | 'players' | 'ledger'>('board');

  if (!gameState) return null;

  const activeTheme = gameState.settings.theme || 'classic';
  const themeConfig = THEME_CONFIGS[activeTheme];

  const handleOpenMobileChat = () => {
    setIsChatDrawerOpen(true);
    resetUnreadChatCount();
  };

  return (
    <div className={`min-h-[calc(100vh-4rem)] p-2 sm:p-4 max-w-[1750px] mx-auto flex flex-col justify-between ${themeConfig.canvasBg} text-[#EDE6D6]`}>
      {/* Mobile Screen Switcher Bar */}
      <div className="flex lg:hidden bg-[#0A160F] border border-[#3A281A] rounded-xl p-1 mb-2">
        <button
          onClick={() => setMobileTab('board')}
          className={`flex-1 py-1.5 text-xs font-serif font-bold rounded-lg flex items-center justify-center space-x-1 transition ${
            mobileTab === 'board' ? 'bg-[#D4AF37] text-black shadow' : 'text-[#8C7A65]'
          }`}
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          <span>The Board</span>
        </button>
        <button
          onClick={() => setMobileTab('players')}
          className={`flex-1 py-1.5 text-xs font-serif font-bold rounded-lg flex items-center justify-center space-x-1 transition ${
            mobileTab === 'players' ? 'bg-[#D4AF37] text-black shadow' : 'text-[#8C7A65]'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Council</span>
        </button>
        <button
          onClick={() => setMobileTab('ledger')}
          className={`flex-1 py-1.5 text-xs font-serif font-bold rounded-lg flex items-center justify-center space-x-1 transition ${
            mobileTab === 'ledger' ? 'bg-[#D4AF37] text-black shadow' : 'text-[#8C7A65]'
          }`}
        >
          <ScrollText className="w-3.5 h-3.5" />
          <span>Ledger</span>
        </button>
      </div>

      {/* Main Multi-Column Tabletop Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-6 items-start flex-1">
        {/* Left Column: Player Council (3 cols on desktop) */}
        <div className={`lg:col-span-3 ${mobileTab === 'players' ? 'block' : 'hidden lg:block'}`}>
          <PlayerRoster />
        </div>

        {/* Center Column: Square Board (6 cols on desktop) */}
        <div className={`lg:col-span-6 flex justify-center items-center ${mobileTab === 'board' ? 'block' : 'hidden lg:block'}`}>
          <GameBoard />
        </div>

        {/* Right Column: Ledger Feed & Chat (3 cols on desktop) */}
        <div className={`lg:col-span-3 space-y-4 ${
          mobileTab === 'ledger' ? 'block' : 'hidden lg:block'
        }`}>
          <div>
            <ActivityLogFeed />
          </div>
          <div>
            <ChatBox />
          </div>
        </div>
      </div>

      {/* Floating Mobile Chat Trigger Button */}
      <div className="fixed bottom-4 right-4 z-40 lg:hidden">
        <button
          onClick={handleOpenMobileChat}
          className="relative p-3.5 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-[#12241A] shadow-gold-seal flex items-center justify-center"
        >
          <MessageSquare className="w-5 h-5 fill-current" />
          {unreadChatCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full animate-bounce">
              {unreadChatCount}
            </span>
          )}
        </button>
      </div>

      {/* Interactive Modals */}
      <PropertyDetailModal />
      <AuctionModal />
      <TradeModal />
      <CardModal />
      <GameOverModal />
    </div>
  );
};
