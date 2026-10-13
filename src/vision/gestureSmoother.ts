import { Gesture } from "../types/game";
import { ClassificationResult } from "./gestureClassifier";

export class GestureSmoother {
  private buffer: ClassificationResult[] = [];
  private readonly maxWindowSize: number;
  private readonly confidenceThreshold: number;
  private readonly stabilityRatio: number;

  constructor(
    windowSize: number = 3,
    confidenceThreshold: number = 0.5,
    stabilityRatio: number = 0.33
  ) {
    this.maxWindowSize = windowSize;
    this.confidenceThreshold = confidenceThreshold;
    this.stabilityRatio = stabilityRatio;
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

    // Latest detection is prioritized for instant gameplay response
    const latest = this.buffer[this.buffer.length - 1];
    if (latest && latest.confidence >= this.confidenceThreshold && latest.gesture !== "unknown") {
      return latest.gesture;
    }

    const counts: Record<Gesture, number> = {
      rock: 0,
      paper: 0,
      scissors: 0,
      unknown: 0,
    };

    let validCount = 0;
    for (const item of this.buffer) {
      if (item.confidence >= this.confidenceThreshold) {
        counts[item.gesture]++;
        validCount++;
      } else {
        counts["unknown"]++;
      }
    }

    if (validCount === 0) return "unknown";

    for (const gesture of ["rock", "paper", "scissors"] as Gesture[]) {
      if (counts[gesture] >= 1) {
        return gesture;
      }
    }

    return "unknown";
  }

  public reset(): void {
    this.buffer = [];
  }
}
