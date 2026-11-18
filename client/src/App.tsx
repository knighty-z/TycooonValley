import React, { useState, useMemo } from 'react';
import type { WorldThemeId } from '@tycoonvale/shared';
import { GameProvider, useGame } from './context/GameContext.js';
import { Navbar } from './components/Navbar.js';
import { LandingPage } from './pages/LandingPage.js';
import { LobbyPage } from './pages/LobbyPage.js';
import { GamePage } from './pages/GamePage.js';
import { PhaseDPreview } from './components/Board/PhaseDPreview.js';
import { PregamePreview } from './components/Pregame/PregamePreview.js';
import { HowToPlayModal } from './components/Modals/HowToPlayModal.js';
import { getThemeConfig, getThemeCssVars, normalizeWorldTheme } from './themes/index.js';
import { getPreferredWorld } from './services/session.js';

const MainContent: React.FC = () => {
  const { gameState } = useGame();
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [landingWorld, setLandingWorld] = useState<WorldThemeId>(getPreferredWorld);

  const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const previewParam = params?.get('previewBoard');
  const previewPregame = params?.get('previewPregame');

  // Interactive tabletop visual preview mode (?previewBoard=original|valorant|india|cyberpunk)
  if (previewParam) {
    return (
      <PhaseDPreview
        initialWorld={normalizeWorldTheme(previewParam)}
        initialGraphics={params?.get('graphics') === 'low' ? 'low' : 'high'}
        hideSwitcher={params?.get('clean') === '1'}
        closeupParam={params?.get('closeup') ?? null}
        initialDiceMidRoll={params?.get('diceRolling') === '1'}
        initialHoverPlayerId={params?.get('hoverPlayer') ?? null}
        emptyBoardOnly={params?.get('empty') === '1'}
        initialModalParam={params?.get('modal') ?? null}
        initialToastParam={params?.get('toast') === '1'}
        initialHudMode={params?.get('hud') !== '0'}
        initialSoundPanel={params?.get('soundPanel') === '1'}
        initialPropManageId={params?.get('propManage') ? Number(params.get('propManage')) : null}
      />
    );
  }

  // Simulated Phase G pregame preview mode (?previewPregame=lobby|landing|invalid-code|connection-lost|rules)
  if (previewPregame) {
    return (
      <PregamePreview
        mode={previewPregame}
        initialWorld={normalizeWorldTheme(params?.get('world') ?? 'valorant')}
        asGuest={params?.get('guest') === '1'}
        disconnected={params?.get('disconnected') === '1'}
        openRules={previewPregame === 'rules' || params?.get('rules') === '1'}
        invalidCode={previewPregame === 'invalid-code' || params?.get('invalidCode') === '1'}
      />
    );
  }

  const activeWorldId = gameState ? normalizeWorldTheme(gameState.settings.theme) : landingWorld;
  const activeTheme = useMemo(() => getThemeConfig(activeWorldId), [activeWorldId]);
  const cssVars = useMemo(() => getThemeCssVars(activeTheme), [activeTheme]);

  const isInActiveMatch = Boolean(gameState && gameState.phase !== 'LOBBY');

  if (isInActiveMatch) {
    return (
      <>
        <GamePage onOpenRules={() => setIsRulesOpen(true)} />
        <HowToPlayModal
          isOpen={isRulesOpen}
          onClose={() => setIsRulesOpen(false)}
          themeConfig={activeTheme}
        />
      </>
    );
  }

  // Full-viewport redesigned Lobby owns its own Room Information Header
  if (gameState && gameState.phase === 'LOBBY') {
    return (
      <>
        <LobbyPage onOpenRules={() => setIsRulesOpen(true)} />
        <HowToPlayModal
          isOpen={isRulesOpen}
          onClose={() => setIsRulesOpen(false)}
          themeConfig={activeTheme}
        />
      </>
    );
  }

  return (
    <div
      data-theme={activeTheme.id}
      style={cssVars}
      className="h-screen w-full overflow-hidden flex flex-col"
    >
      <Navbar onOpenRules={() => setIsRulesOpen(true)} themeConfig={activeTheme} />

      <main className="flex-1 min-h-0 flex flex-col">
        <LandingPage
          onOpenRules={() => setIsRulesOpen(true)}
          selectedWorld={landingWorld}
          onChangeWorld={setLandingWorld}
        />
      </main>

      <HowToPlayModal
        isOpen={isRulesOpen}
        onClose={() => setIsRulesOpen(false)}
        themeConfig={activeTheme}
      />
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

export default App;
