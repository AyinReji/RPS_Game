import { Gesture, Landmark } from "../types/game";
import { getFingerStates } from "./landmarkUtils";

export interface ClassificationResult {
  gesture: Gesture;
  confidence: number;
}

/**
 * Classifies 21 hand landmarks into Rock, Paper, Scissors, or UNKNOWN.
 *
 * Rules (per user spec):
 *  - ROCK:     Zero fingers extended (closed fist).
 *  - SCISSORS: Only index AND middle fingers extended (ring & pinky folded).
 *  - PAPER:    Three or more fingers extended (open palm).
 */
export function classifyGesture(landmarks: Landmark[]): ClassificationResult {
  if (!landmarks || landmarks.length < 21) {
    return { gesture: "unknown", confidence: 0 };
  }

  const {
    thumbExtended,
    indexExtended,
    middleExtended,
    ringExtended,
    pinkyExtended,
    extendedCount,
  } = getFingerStates(landmarks);

  // ── SCISSORS ─────────────────────────────────────────────────────────
  // Only index + middle are up; ring & pinky must be down.
  if (indexExtended && middleExtended && !ringExtended && !pinkyExtended) {
    return { gesture: "scissors", confidence: 0.95 };
  }

  // ── PAPER ────────────────────────────────────────────────────────────
  // All 4 fingers up, or 3 fingers + thumb open.
  if (extendedCount >= 4) {
    return { gesture: "paper", confidence: 0.98 };
  }
  if (extendedCount === 3 && thumbExtended) {
    return { gesture: "paper", confidence: 0.92 };
  }
  if (extendedCount === 3) {
    return { gesture: "paper", confidence: 0.85 };
  }

  // ── ROCK ─────────────────────────────────────────────────────────────
  // Zero non-thumb fingers extended → closed fist.
  if (extendedCount === 0) {
    return { gesture: "rock", confidence: 0.96 };
  }

  // Ambiguous gestures (single finger pointing, thumbs up, etc.)
  return { gesture: "unknown", confidence: 0.2 };
}
