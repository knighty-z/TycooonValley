import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ThemeConfig } from '../../themes/types.js';
import { Loader2 } from 'lucide-react';

export interface LaunchTransitionOverlayProps {
  visible: boolean;
  mode: 'countdown' | 'creating' | 'joining' | 'launching';
  countdownValue?: number;
  themeConfig: ThemeConfig;
  subtitle?: string;
}

export const LaunchTransitionOverlay: React.FC<LaunchTransitionOverlayProps> = React.memo(
  ({ visible, mode, countdownValue = 3, themeConfig, subtitle }) => {
    const headingTransform = themeConfig.fonts.headingUppercase ? 'uppercase' : 'none';

    const label =
      mode === 'creating'
        ? `Preparing ${themeConfig.name} Table`
        : mode === 'joining'
        ? 'Connecting to Match Lobby'
        : mode === 'launching'
        ? `Entering ${themeConfig.name}`
        : 'Match Starting';

    return (
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            data-testid="launch-transition-overlay"
            data-theme={themeConfig.id}
            style={{
              backgroundColor: 'color-mix(in srgb, var(--bg) 92%, #000000)'
            }}
            className="fixed inset-0 z-50 backdrop-blur-md flex items-center justify-center p-6"
          >
            <div
              data-chamfered={themeConfig.chamfered ? 'true' : 'false'}
              className="tv-pregame-surface max-w-sm w-full p-7 text-center space-y-4"
            >
              {themeConfig.id === 'wompwomp' && (
                <div className="flex justify-center">
                  <img
                    src="/tokens/wompwomp/peach.png"
                    alt="WorldWompWomp Mascot"
                    draggable={false}
                    className="w-16 h-16 object-contain animate-token-bob drop-shadow-[0_8px_14px_rgba(0,0,0,0.45)]"
                  />
                </div>
              )}

              <div
                className="text-[10px] font-bold uppercase tracking-[0.24em]"
                style={{ color: 'var(--accent)', fontFamily: 'var(--font-heading)' }}
              >
                {themeConfig.name}
              </div>

              {mode === 'countdown' ? (
                <motion.div
                  key={countdownValue}
                  initial={{ scale: 0.72, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 1.25, opacity: 0 }}
                  transition={{ duration: 0.28 }}
                  style={{
                    fontFamily: 'var(--font-heading)',
                    color: 'var(--accent)'
                  }}
                  className="text-7xl font-black leading-none tabular-nums"
                >
                  {countdownValue}
                </motion.div>
              ) : (
                <div className="flex justify-center py-2">
                  <Loader2
                    className="w-10 h-10 animate-spin"
                    style={{ color: 'var(--accent)' }}
                  />
                </div>
              )}

              <div className="space-y-1">
                <h2
                  style={{
                    fontFamily: 'var(--font-heading)',
                    textTransform: headingTransform
                  }}
                  className="text-lg font-extrabold tracking-wider"
                >
                  {label}
                </h2>
                <p className="text-xs opacity-75">
                  {subtitle ||
                    (mode === 'countdown'
                      ? 'Syncing all players onto the board...'
                      : 'Establishing live room state...')}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }
);

LaunchTransitionOverlay.displayName = 'LaunchTransitionOverlay';
