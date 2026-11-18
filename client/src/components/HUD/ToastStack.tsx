import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { ThemeConfig } from '../../themes/index.js';
import {
  Coins,
  Sparkles,
  Lock,
  Skull,
  ShoppingBag,
  AlertTriangle,
  Info,
  X
} from 'lucide-react';

export type HudToastKind = 'rent' | 'money' | 'card' | 'jail' | 'bankrupt' | 'buy' | 'error' | 'info';

export interface HudToastItem {
  id: string;
  kind: HudToastKind;
  title: string;
  message: string;
}

export interface ToastStackProps {
  toasts: HudToastItem[];
  themeConfig: ThemeConfig;
  onDismiss: (id: string) => void;
}

function getToastVisuals(kind: HudToastKind): {
  Icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  barColor: string;
} {
  switch (kind) {
    case 'rent':
      return { Icon: Coins, barColor: '#F59E0B' };
    case 'money':
      return { Icon: Coins, barColor: '#10B981' };
    case 'card':
      return { Icon: Sparkles, barColor: '#38BDF8' };
    case 'jail':
      return { Icon: Lock, barColor: '#FB923C' };
    case 'bankrupt':
    case 'error':
      return { Icon: kind === 'bankrupt' ? Skull : AlertTriangle, barColor: '#EF4444' };
    case 'buy':
      return { Icon: ShoppingBag, barColor: 'var(--accent)' };
    default:
      return { Icon: Info, barColor: 'var(--accent)' };
  }
}

/**
 * World-themed corner notification stack.
 * Strictly capped to at most 3 simultaneous toasts to prevent visual clutter.
 */
export const ToastStack: React.FC<ToastStackProps> = React.memo(({ toasts, themeConfig, onDismiss }) => {
  const visible = toasts.slice(-3);
  const chamferedAttr = themeConfig.chamfered ? 'true' : 'false';

  return (
    <div
      aria-live="polite"
      aria-label="Game Notifications"
      data-testid="hud-toast-stack"
      className="fixed top-3 right-3 z-[60] w-72 max-w-[calc(100vw-24px)] space-y-2 pointer-events-none"
    >
      <AnimatePresence initial={false}>
        {visible.map(toast => {
          const { Icon, barColor } = getToastVisuals(toast.kind);
          return (
            <motion.div
              key={toast.id}
              data-testid={`hud-toast-${toast.kind}`}
              initial={{ opacity: 0, x: 24, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 24, scale: 0.96 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              data-chamfered={chamferedAttr}
              style={{
                backgroundColor: 'var(--board)',
                borderColor: 'var(--tile-border)',
                borderLeftColor: barColor,
                color: 'var(--board-ink)',
                borderRadius: themeConfig.chamfered ? '0px' : 'var(--radius-tile)',
                fontFamily: 'var(--font-body)'
              }}
              className="pointer-events-auto border border-l-4 px-3 py-2 shadow-2xl flex items-start gap-2.5"
            >
              <div
                className="w-6 h-6 rounded flex items-center justify-center shrink-0 mt-0.5"
                style={{
                  backgroundColor: `color-mix(in srgb, ${barColor} 18%, var(--bg))`,
                  color: barColor
                }}
              >
                <Icon className="w-3.5 h-3.5" />
              </div>

              <div className="flex-1 min-w-0">
                <div
                  style={{
                    fontFamily: 'var(--font-heading)',
                    textTransform: themeConfig.fonts.headingUppercase ? 'uppercase' : 'none'
                  }}
                  className="text-[11px] font-bold tracking-wider leading-tight"
                >
                  {toast.title}
                </div>
                <p className="text-xs opacity-85 leading-snug break-words mt-0.5">{toast.message}</p>
              </div>

              <button
                type="button"
                onClick={() => onDismiss(toast.id)}
                aria-label="Dismiss notification"
                className="tv-hud-focus p-0.5 opacity-60 hover:opacity-100 shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
});

ToastStack.displayName = 'ToastStack';
