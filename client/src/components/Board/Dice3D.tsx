import React, { useRef, useEffect } from 'react';
import type { DiceThemeConfig, WorldThemeId } from '../../themes/types.js';
import { getThemeConfig } from '../../themes/index.js';
import { soundEngine } from '../../services/audio.js';

export interface Dice3DProps {
  value: number;
  index: number;
  isRolling: boolean;
  isDouble?: boolean;
  worldId?: WorldThemeId;
  diceConfig?: DiceThemeConfig;
  size?: number;
  /** Optional deterministic mid-roll preview angle (degrees) for static visual snapshots */
  midRollPreview?: boolean;
}

const PIP_LAYOUTS: Record<number, number[]> = {
  1: [4],
  2: [2, 6],
  3: [2, 4, 6],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8]
};

/**
 * Exact 3D cube Euler rotations bringing face N cleanly to the front (+Z)
 * with a slight natural tabletop tilt so adjacent cube edges stay visible.
 */
const SETTLED_ROTATIONS: Record<number, { rx: number; ry: number }> = {
  1: { rx: -10, ry: 12 },
  2: { rx: -10, ry: -78 },
  3: { rx: -100, ry: 12 },
  4: { rx: 80, ry: 12 },
  5: { rx: -10, ry: 102 },
  6: { rx: -10, ry: 192 }
};

/**
 * Real 6-face CSS 3D cube die with world-specific materials (ivory, tactical steel,
 * carved wood, obsidian cyber glass), multi-axis tumble, bounce, dynamic ground shadow,
 * and authoritative final face settle.
 */
export const Dice3D: React.FC<Dice3DProps> = React.memo(
  ({
    value,
    index,
    isRolling,
    isDouble = false,
    worldId = 'original',
    diceConfig,
    size = 48,
    midRollPreview = false
  }) => {
    const cfg = diceConfig ?? getThemeConfig(worldId).dice;
    const safeVal = Math.min(6, Math.max(1, Math.round(value) || 1));
    const half = size / 2;
    const spinCountRef = useRef(0);
    const prevRollingRef = useRef(false);

    useEffect(() => {
      if (isRolling && !prevRollingRef.current) {
        spinCountRef.current += 1;
        if (index === 0) {
          soundEngine.playWorldDiceRoll(cfg.soundStyle);
        }
      }
      prevRollingRef.current = isRolling;
    }, [isRolling, index, cfg.soundStyle]);

    const settled = SETTLED_ROTATIONS[safeVal] ?? SETTLED_ROTATIONS[1];
    const extraSpin = (spinCountRef.current % 2) * 360;

    const faces: Array<{ faceNum: number; transform: string; isAlt?: boolean }> = [
      { faceNum: 1, transform: `rotateY(0deg) translateZ(${half}px)` },
      { faceNum: 6, transform: `rotateY(180deg) translateZ(${half}px)`, isAlt: true },
      { faceNum: 2, transform: `rotateY(90deg) translateZ(${half}px)`, isAlt: true },
      { faceNum: 5, transform: `rotateY(-90deg) translateZ(${half}px)` },
      { faceNum: 3, transform: `rotateX(90deg) translateZ(${half}px)` },
      { faceNum: 4, transform: `rotateX(-90deg) translateZ(${half}px)`, isAlt: true }
    ];

    const pipSize = Math.max(6, Math.round(size * 0.165));
    const midRollTransform =
      index % 2 === 0
        ? 'rotateX(228deg) rotateY(142deg) rotateZ(24deg)'
        : 'rotateX(-138deg) rotateY(222deg) rotateZ(-28deg)';

    const settledTransform = `rotateX(${settled.rx + extraSpin}deg) rotateY(${settled.ry + extraSpin}deg)`;

    return (
      <div
        data-testid={`dice-face-${index}`}
        data-dice-value={safeVal}
        data-dice-rolling={isRolling || midRollPreview ? 'true' : 'false'}
        data-dice-material={cfg.material}
        aria-label={`Die ${index + 1}: ${safeVal}`}
        className="tv-die-stage"
        style={{ width: size, height: size }}
      >
        {/* Dynamic contact shadow underneath the 3D die */}
        <div
          className={`tv-die-shadow ${isRolling && !midRollPreview ? 'tv-die-shadow-rolling' : ''}`}
          style={{
            transform: midRollPreview ? 'scale(0.68)' : undefined,
            opacity: midRollPreview ? 0.42 : undefined
          }}
          aria-hidden="true"
        />

        {/* Bounce wrapper */}
        <div
          className={`tv-die-bounce ${isRolling && !midRollPreview ? (index % 2 === 0 ? 'tv-die-bounce-a' : 'tv-die-bounce-b') : ''}`}
          style={{
            transform: midRollPreview ? `translateY(${index % 2 === 0 ? -10 : -14}px)` : undefined
          }}
        >
          {/* 3D Cube */}
          <div
            className={`tv-die-cube ${
              isRolling && !midRollPreview
                ? index % 2 === 0
                  ? 'tv-die-tumble-a'
                  : 'tv-die-tumble-b'
                : ''
            }`}
            style={{
              width: size,
              height: size,
              transform: isRolling && !midRollPreview
                ? undefined
                : midRollPreview
                ? midRollTransform
                : settledTransform
            }}
          >
            {faces.map(({ faceNum, transform, isAlt }) => {
              const pips = PIP_LAYOUTS[faceNum];
              return (
                <div
                  key={faceNum}
                  className="tv-die-face"
                  data-face={faceNum}
                  style={{
                    width: size,
                    height: size,
                    transform,
                    background: isAlt
                      ? `linear-gradient(145deg, ${cfg.faceBg}, ${cfg.faceBgAlt})`
                      : `linear-gradient(135deg, ${cfg.faceBg} 0%, ${cfg.faceBgAlt} 100%)`,
                    borderColor: isDouble && !isRolling ? 'var(--accent)' : cfg.faceBorder,
                    borderRadius: cfg.borderRadius,
                    boxShadow:
                      cfg.material === 'cyber_glass'
                        ? `inset 0 0 8px rgba(25, 240, 255, 0.22), 0 0 6px rgba(25, 240, 255, 0.25)`
                        : cfg.material === 'steel'
                        ? `inset 0 1px 2px rgba(255, 255, 255, 0.2), inset 0 -2px 4px rgba(0, 0, 0, 0.55)`
                        : cfg.material === 'toy_plush'
                        ? `inset 0 3px 5px rgba(255, 255, 255, 0.85), inset 0 -3px 6px rgba(92, 68, 135, 0.28), 0 4px 10px rgba(18, 10, 30, 0.35)`
                        : `inset 0 2px 3px rgba(255, 255, 255, 0.58), inset 0 -2px 4px rgba(0, 0, 0, 0.18)`
                  }}
                >
                  {Array.from({ length: 9 }).map((_, cellIdx) => {
                    const active = pips.includes(cellIdx);
                    const isCenterOne = faceNum === 1 && cellIdx === 4;
                    return (
                      <span
                        key={cellIdx}
                        data-pip={active ? (faceNum === safeVal ? 'active' : 'side-active') : 'empty'}
                        className="tv-die-pip"
                        style={{
                          width: isCenterOne ? pipSize + 2 : pipSize,
                          height: isCenterOne ? pipSize + 2 : pipSize,
                          opacity: active ? 1 : 0,
                          backgroundColor: isCenterOne ? cfg.pipOneColor : cfg.pipColor,
                          boxShadow: active
                            ? cfg.material === 'cyber_glass' || cfg.material === 'steel'
                              ? `0 0 6px ${cfg.pipGlow ?? cfg.pipColor}`
                              : `inset 0 1px 2px rgba(0, 0, 0, 0.55)`
                            : 'none'
                        }}
                      />
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }
);

Dice3D.displayName = 'Dice3D';
