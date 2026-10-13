import { Gesture } from "../types/game";
import { ClassificationResult } from "./gestureClassifier";

export class GestureSmoother {
  private buffer: ClassificationResult[] = [];
  private readonly maxWindowSize: number;
  private readonly confidenceThreshold: number;
  private currentStableGesture: Gesture = "unknown";

  constructor(
    windowSize: number = 5,
    confidenceThreshold: number = 0.5,
    _stabilityRatio: number = 0.33
  ) {
    this.maxWindowSize = windowSize;
    this.confidenceThreshold = confidenceThreshold;
  }

  public addDetection(detection: ClassificationResult): Gesture {
    this.buffer.push(detection);
    if (this.buffer.length > this.maxWindowSize) {
      this.buffer.shift();
    }

    return this.getStableGesture();
  }

  public getStableGesture(): Gesture {
    if (this.buffer.length === 0) return "unknown";

    const counts: Record<Gesture, number> = {
      rock: 0,
      paper: 0,
      scissors: 0,
      unknown: 0,
    };

    const weightedScores: Record<Gesture, number> = {
      rock: 0,
      paper: 0,
      scissors: 0,
      unknown: 0,
    };

    this.buffer.forEach((item, index) => {
      // Recent frames get progressively higher weight (1.0 up to 2.0)
      const recencyWeight = 1 + index / this.buffer.length;
      if (item.confidence >= this.confidenceThreshold) {
        counts[item.gesture]++;
        weightedScores[item.gesture] += recencyWeight * item.confidence;
      } else {
        counts["unknown"]++;
        weightedScores["unknown"] += recencyWeight * 0.5;
      }
    });

    // Find the gesture with the highest weighted score
    let bestGesture: Gesture = "unknown";
    let maxScore = 0;

    for (const g of ["rock", "paper", "scissors"] as Gesture[]) {
      if (weightedScores[g] > maxScore) {
        maxScore = weightedScores[g];
        bestGesture = g;
      }
    }

    // Require at least 2 consistent frames in buffer to switch to a move
    if (bestGesture !== "unknown" && counts[bestGesture] >= 2) {
      this.currentStableGesture = bestGesture;
      return bestGesture;
    }

    // If buffer is predominantly unknown (e.g. hand moved away from frame)
    if (counts.unknown >= Math.ceil(this.buffer.length * 0.6)) {
      this.currentStableGesture = "unknown";
      return "unknown";
    }

    return this.currentStableGesture;
  }

  public reset(): void {
    this.buffer = [];
    this.currentStableGesture = "unknown";
  }
}
