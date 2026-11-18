import React from 'react';
import { motion } from 'framer-motion';

interface DiceFaceProps {
  value: number;
  index: number;
  isRolling: boolean;
  isDouble?: boolean;
}

// 3x3 grid pip positions (indices 0..8) for standard die faces 1..6
const PIP_LAYOUTS: Record<number, number[]> = {
  1: [4],
  2: [2, 6],
  3: [2, 4, 6],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8]
};

/**
 * Tactile tabletop ivory-and-brass die face with authentic pip patterns
 * and lightweight GPU-accelerated Framer Motion tumble/settle physics.
 */
export const DiceFace: React.FC<DiceFaceProps> = React.memo(
  ({ value, index, isRolling, isDouble = false }) => {
    const safeVal = Math.min(6, Math.max(1, Math.round(value) || 1));
    const activePips = PIP_LAYOUTS[safeVal] || PIP_LAYOUTS[1];
    const dir = index % 2 === 0 ? 1 : -1;

    return (
      <motion.div
        data-testid={`dice-face-${index}`}
        data-dice-value={safeVal}
        aria-label={`Die ${index + 1}: ${safeVal}`}
        animate={
          isRolling
            ? {
                rotate: [0, 24 * dir, -22 * dir, 14 * dir, -10 * dir, 0],
                y: [0, -10, -3, -8, -2, 0],
                scale: [1, 1.09, 0.96, 1.06, 0.98, 1]
              }
            : {
                rotate: 0,
                y: 0,
                scale: 1
              }
        }
        transition={
          isRolling
            ? {
                duration: 0.32,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: index * 0.04
              }
            : {
                type: 'spring',
                stiffness: 420,
                damping: 20,
                mass: 0.7
              }
        }
        className={`w-12 h-12 sm:w-16 sm:h-16 rounded-2xl p-2 sm:p-2.5 bg-gradient-to-br from-[#FFFDF8] via-[#F7EFE0] to-[#DFCFAF] border-2 grid grid-cols-3 grid-rows-3 gap-0.5 sm:gap-1 place-items-center shadow-[0_6px_14px_rgba(0,0,0,0.45),inset_0_2px_3px_rgba(255,255,255,0.9)] will-change-transform ${
          isDouble && !isRolling
            ? 'border-[#FCE794] ring-2 ring-[#D4AF37]/70'
            : 'border-[#B88A2E]'
        }`}
      >
        {Array.from({ length: 9 }).map((_, cellIdx) => {
          const hasPip = activePips.includes(cellIdx);
          return (
            <span
              key={cellIdx}
              data-pip={hasPip ? 'active' : 'empty'}
              className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full transition-opacity duration-75 ${
                hasPip
                  ? safeVal === 1
                    ? 'bg-[#8B1A1A] shadow-[inset_0_1px_2px_rgba(0,0,0,0.65)] opacity-100 scale-110'
                    : 'bg-[#1D120A] shadow-[inset_0_1px_2px_rgba(0,0,0,0.75)] opacity-100'
                  : 'opacity-0'
              }`}
            />
          );
        })}
      </motion.div>
    );
  }
);

DiceFace.displayName = 'DiceFace';
