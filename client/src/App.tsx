import React, { useState } from 'react';
import { GameProvider, useGame } from './context/GameContext.js';
import { Navbar } from './components/Navbar.js';
import { LandingPage } from './pages/LandingPage.js';
import { LobbyPage } from './pages/LobbyPage.js';
import { GamePage } from './pages/GamePage.js';
import { HowToPlayModal } from './components/Modals/HowToPlayModal.js';

const MainContent: React.FC = () => {
  const { gameState } = useGame();
  const [isRulesOpen, setIsRulesOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#080C14] text-slate-100 flex flex-col">
      <Navbar onOpenRules={() => setIsRulesOpen(true)} />

      <main className="flex-1 flex flex-col">
        {!gameState ? (
          <LandingPage onOpenRules={() => setIsRulesOpen(true)} />
        ) : gameState.phase === 'LOBBY' ? (
          <LobbyPage />
        ) : (
          <GamePage />
        )}
      </main>

      <HowToPlayModal isOpen={isRulesOpen} onClose={() => setIsRulesOpen(false)} />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <GameProvider>
      <MainContent />
    </GameProvider>
  );
};
