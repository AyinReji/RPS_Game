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

  const { indexExtended, middleExtended, ringExtended, pinkyExtended, extendedCount } =
    getFingerStates(landmarks);

  // ── SCISSORS ─────────────────────────────────────────────────────────
  // Only index + middle are up; ring & pinky must be down.
  if (indexExtended && middleExtended && !ringExtended && !pinkyExtended) {
    return { gesture: "scissors", confidence: 0.95 };
  }

  // ── PAPER ────────────────────────────────────────────────────────────
  // Three or more fingers extended → open hand.
  if (extendedCount >= 3) {
    return { gesture: "paper", confidence: extendedCount >= 4 ? 0.95 : 0.85 };
  }

  // ── ROCK ─────────────────────────────────────────────────────────────
  // Zero fingers extended → closed fist.
  if (extendedCount === 0) {
    return { gesture: "rock", confidence: 0.95 };
  }

  // One finger extended (not a clear gesture) – lean toward rock since
  // the user expects a fist to always be rock, and one-finger wobble is common.
  if (extendedCount === 1) {
    return { gesture: "rock", confidence: 0.75 };
  }

  // Two fingers but NOT the index+middle combo → ambiguous
  return { gesture: "unknown", confidence: 0.3 };
}
