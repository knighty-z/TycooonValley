import { useState, useCallback, useEffect, useRef } from 'react';
import type { ActivityLog } from '@tycoonvale/shared';
import type { HudToastItem, HudToastKind } from '../components/HUD/ToastStack.js';
import { soundEngine } from '../services/audio.js';

const MAX_TOASTS = 3;
const AUTO_DISMISS_MS = 4200;

function playSoundForToastKind(kind: HudToastKind): void {
  switch (kind) {
    case 'rent':
      soundEngine.play('pay_rent');
      break;
    case 'money':
      soundEngine.play('receive_money');
      break;
    case 'card':
      soundEngine.play('card_draw');
      break;
    case 'jail':
      soundEngine.play('jail');
      break;
    case 'bankrupt':
      soundEngine.play('bankrupt');
      break;
    case 'buy':
      soundEngine.play('buy_property');
      break;
    case 'error':
      soundEngine.play('error');
      break;
    default:
      break;
  }
}

function mapActivityToToast(log: ActivityLog): { kind: HudToastKind; title: string } | null {
  switch (log.type) {
    case 'rent':
      return { kind: 'rent', title: 'Rent Paid' };
    case 'tax':
      return { kind: 'rent', title: 'Tax Assessed' };
    case 'card':
      return { kind: 'card', title: 'Event Card' };
    case 'jail':
      return { kind: 'jail', title: 'Detained' };
    case 'bankrupt':
      return { kind: 'bankrupt', title: 'Bankruptcy' };
    case 'buy':
      return { kind: 'buy', title: 'Property Claimed' };
    case 'system':
      if (/collect|jackpot|passed|received|bonus/i.test(log.text)) {
        return { kind: 'money', title: 'Funds Received' };
      }
      return null;
    default:
      return null;
  }
}

export function useHudToasts(
  activityLogs?: ActivityLog[],
  errorMessage?: string | null,
  initialToasts?: HudToastItem[]
) {
  const [toasts, setToasts] = useState<HudToastItem[]>(() => (initialToasts ?? []).slice(-MAX_TOASTS));
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const seenLogIdsRef = useRef<Set<string>>(
    new Set((activityLogs ?? []).map(l => l.id))
  );
  const lastErrorRef = useRef<string | null>(null);

  const dismissToast = useCallback((id: string) => {
    const t = timersRef.current.get(id);
    if (t) {
      clearTimeout(t);
      timersRef.current.delete(id);
    }
    setToasts(prev => prev.filter(item => item.id !== id));
  }, []);

  const pushToast = useCallback(
    (kind: HudToastKind, title: string, message: string, persist = false) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts(prev => {
        const next = [...prev, { id, kind, title, message }];
        if (next.length > MAX_TOASTS) {
          const evicted = next.slice(0, next.length - MAX_TOASTS);
          evicted.forEach(item => {
            const existingTimer = timersRef.current.get(item.id);
            if (existingTimer) {
              clearTimeout(existingTimer);
              timersRef.current.delete(item.id);
            }
          });
          return next.slice(-MAX_TOASTS);
        }
        return next;
      });

      if (!persist) {
        const timer = setTimeout(() => {
          timersRef.current.delete(id);
          setToasts(prev => prev.filter(item => item.id !== id));
        }, AUTO_DISMISS_MS);
        timersRef.current.set(id, timer);
      }
    },
    []
  );

  // Convert newly arriving live activity logs into corner toasts
  useEffect(() => {
    if (!activityLogs || activityLogs.length === 0) return;
    const unseen = activityLogs.filter(l => !seenLogIdsRef.current.has(l.id));
    if (unseen.length === 0) return;

    for (const log of unseen) {
      seenLogIdsRef.current.add(log.id);
    }

    // Emit at most the 2 newest unseen toast-worthy events to avoid bursts
    for (const log of unseen.slice(0, 2).reverse()) {
      const mapped = mapActivityToToast(log);
      if (mapped) {
        playSoundForToastKind(mapped.kind);
        pushToast(mapped.kind, mapped.title, log.text);
      }
    }
  }, [activityLogs, pushToast]);

  // Surface backend errors as clean corner error toasts
  useEffect(() => {
    if (errorMessage && errorMessage !== lastErrorRef.current) {
      lastErrorRef.current = errorMessage;
      pushToast('error', 'Action Notice', errorMessage);
    } else if (!errorMessage) {
      lastErrorRef.current = null;
    }
  }, [errorMessage, pushToast]);

  // Cleanup all timers on unmount
  useEffect(() => {
    return () => {
      timersRef.current.forEach(timer => clearTimeout(timer));
      timersRef.current.clear();
    };
  }, []);

  return { toasts, pushToast, dismissToast };
}
