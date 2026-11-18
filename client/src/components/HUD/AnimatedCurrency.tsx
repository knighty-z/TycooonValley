import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface AnimatedCurrencyProps {
  value: number;
  prefix?: string;
  className?: string;
  showDelta?: boolean;
  durationMs?: number;
}

/**
 * Lightweight, smooth money counter with eased interpolation and
 * transient floating +/- delta indicator. Isolated to avoid parent re-renders.
 */
export const AnimatedCurrency: React.FC<AnimatedCurrencyProps> = React.memo(
  ({ value, prefix = '$', className = '', showDelta = true, durationMs = 420 }) => {
    const [displayValue, setDisplayValue] = useState<number>(value);
    const [delta, setDelta] = useState<{ amount: number; id: number } | null>(null);
    const prevValueRef = useRef<number>(value);
    const deltaSeqRef = useRef<number>(0);
    const rafRef = useRef<number | null>(null);
    const deltaTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
      const startVal = prevValueRef.current;
      const diff = value - startVal;
      prevValueRef.current = value;

      if (diff === 0) return;

      if (showDelta) {
        if (deltaTimerRef.current) clearTimeout(deltaTimerRef.current);
        deltaSeqRef.current += 1;
        setDelta({ amount: diff, id: deltaSeqRef.current });
        deltaTimerRef.current = setTimeout(() => {
          setDelta(null);
        }, 1150);
      }

      if (rafRef.current) cancelAnimationFrame(rafRef.current);

      const startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();

      const step = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / durationMs, 1);
        // Ease-out cubic for crisp bank-ticker deceleration
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplayValue(Math.round(startVal + diff * eased));

        if (progress < 1) {
          rafRef.current = requestAnimationFrame(step);
        } else {
          setDisplayValue(value);
          rafRef.current = null;
        }
      };

      if (typeof requestAnimationFrame === 'function') {
        rafRef.current = requestAnimationFrame(step);
      } else {
        setDisplayValue(value);
      }

      return () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
      };
    }, [value, durationMs, showDelta]);

    useEffect(() => {
      return () => {
        if (deltaTimerRef.current) clearTimeout(deltaTimerRef.current);
      };
    }, []);

    return (
      <span className={`relative inline-flex items-center tabular-nums ${className}`}>
        <span>
          {prefix}
          {displayValue.toLocaleString()}
        </span>

        <AnimatePresence>
          {delta && (
            <motion.span
              key={delta.id}
              data-testid="currency-delta"
              initial={{ opacity: 0, y: 2, scale: 0.88 }}
              animate={{ opacity: 1, y: -12, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.92 }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
              className={`pointer-events-none absolute -top-1 right-0 whitespace-nowrap text-[10px] font-mono font-black drop-shadow z-20 ${
                delta.amount > 0 ? 'text-emerald-300' : 'text-rose-400'
              }`}
            >
              {delta.amount > 0 ? `+${prefix}${delta.amount}` : `-${prefix}${Math.abs(delta.amount)}`}
            </motion.span>
          )}
        </AnimatePresence>
      </span>
    );
  }
);

AnimatedCurrency.displayName = 'AnimatedCurrency';
