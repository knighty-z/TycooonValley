import type { MovementStyleConfig } from './types.js';

export type MoveTransitionKind = 'step_by_step' | 'direct_slide';

export interface MovePlan {
  kind: MoveTransitionKind;
  fromPosition: number;
  toPosition: number;
  /** Ordered destination tile indices (length >= 1 unless from === to) */
  steps: number[];
  /** Per-step duration in milliseconds (automatically accelerated on longer rolls) */
  stepDurationMs: number;
  /** Total capped duration in milliseconds */
  totalDurationMs: number;
}

/**
 * Computes clockwise tile-by-tile steps around the 40-space square board.
 */
export function computeClockwiseSteps(fromPosition: number, toPosition: number): number[] {
  const from = ((Math.floor(fromPosition) % 40) + 40) % 40;
  const to = ((Math.floor(toPosition) % 40) + 40) % 40;
  if (from === to) return [];

  const steps: number[] = [];
  let curr = from;
  while (curr !== to && steps.length < 40) {
    curr = (curr + 1) % 40;
    steps.push(curr);
  }
  return steps;
}

/**
 * Builds a deterministic movement plan from authoritative server positions.
 * - Normal dice rolls move strictly tile-by-tile along the perimeter (smoothly turning corners).
 * - Long rolls (e.g. 10-12) speed up per step so total time stays capped under `maxTotalDurationMs`.
 * - Non-roll teleports (e.g. Sent to Jail -> 10, Move to Start -> 0, or card jumps > 12 spaces)
 *   use a fast direct slide in the active world's style.
 */
export function buildMovePlan(
  fromPosition: number,
  toPosition: number,
  dice: [number, number] | undefined,
  style: MovementStyleConfig,
  forceDirectSlide = false
): MovePlan {
  const from = ((Math.floor(fromPosition) % 40) + 40) % 40;
  const to = ((Math.floor(toPosition) % 40) + 40) % 40;

  if (from === to) {
    return {
      kind: 'step_by_step',
      fromPosition: from,
      toPosition: to,
      steps: [],
      stepDurationMs: 0,
      totalDurationMs: 0
    };
  }

  const clockwise = computeClockwiseSteps(from, to);
  const diceSum = dice ? (dice[0] || 0) + (dice[1] || 0) : 0;

  // Detect direct slide: explicit flag, Go To Jail corner (30 -> 10), card teleport with 0 dice,
  // or jump larger than a standard double-6 roll (12) when not matching dice sum.
  const isJailTeleport = to === 10 && from !== 10 && (from === 30 || diceSum === 0 || clockwise.length !== diceSum);
  const isStartTeleport = to === 0 && diceSum === 0 && clockwise.length > 12;
  const isCardJump = diceSum === 0 && clockwise.length > 12;

  if (forceDirectSlide || isJailTeleport || isStartTeleport || isCardJump) {
    return {
      kind: 'direct_slide',
      fromPosition: from,
      toPosition: to,
      steps: [to],
      stepDurationMs: style.directSlideMs,
      totalDurationMs: style.directSlideMs
    };
  }

  // Cap total movement time so a roll of 12 feels brisk and never drags
  const rawPerStep = Math.round(style.maxTotalDurationMs / clockwise.length);
  const stepDurationMs = Math.max(style.minStepMs, Math.min(style.maxStepMs, rawPerStep));
  const totalDurationMs = stepDurationMs * clockwise.length;

  return {
    kind: 'step_by_step',
    fromPosition: from,
    toPosition: to,
    steps: clockwise,
    stepDurationMs,
    totalDurationMs
  };
}

/** Smooth cubic ease-in-out for gliding horizontal motion between adjacent tiles */
export function easeInOutCubic(t: number): number {
  const c = Math.max(0, Math.min(1, t));
  return c < 0.5 ? 4 * c * c * c : 1 - Math.pow(-2 * c + 2, 3) / 2;
}

/** Snappier quintic ease-out used for VALORANT tactical stops and direct slides */
export function easeOutQuart(t: number): number {
  const c = Math.max(0, Math.min(1, t));
  return 1 - Math.pow(1 - c, 4);
}
