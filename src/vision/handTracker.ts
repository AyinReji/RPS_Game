import { GestureDetection, Landmark } from "../types/game";
import { classifyGesture } from "./gestureClassifier";
import { GestureSmoother } from "./gestureSmoother";

export class HandTracker {
  private handLandmarker: any = null;
  private smoother = new GestureSmoother(6, 0.6, 0.5);
  private initPromise: Promise<boolean> | null = null;
  private isReady = false;
  private lastTimestamp = -1;

  public async initialize(): Promise<boolean> {
    if (this.isReady) return true;

    // If already initializing, wait for the same promise (fixes React Strict Mode double-mount)
    if (this.initPromise) return this.initPromise;

    this.initPromise = this._doInit();
    return this.initPromise;
  }

  private async _doInit(): Promise<boolean> {
    console.log("[HandTracker] Initializing MediaPipe HandLandmarker...");
    try {
      const vision = await import("@mediapipe/tasks-vision");
      const { HandLandmarker, FilesetResolver } = vision;

      const fileset = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
      );

      const landmarkerOptions = {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
          delegate: "GPU" as const,
        },
        runningMode: "VIDEO" as const,
        numHands: 2,
        minHandDetectionConfidence: 0.5,
        minHandPresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      };

      try {
        // Try with GPU delegate first
        this.handLandmarker = await HandLandmarker.createFromOptions(fileset, landmarkerOptions);
      } catch {
        // Fallback to CPU delegate if GPU initialization fails
        this.handLandmarker = await HandLandmarker.createFromOptions(fileset, {
          ...landmarkerOptions,
          baseOptions: {
            ...landmarkerOptions.baseOptions,
            delegate: "CPU",
          },
        });
      }

      this.isReady = true;
      console.log("[HandTracker] ✅ MediaPipe HandLandmarker initialized successfully");
      return true;
    } catch (err) {
      console.error("[HandTracker] ❌ Failed to initialize MediaPipe HandLandmarker:", err);
      this.isReady = false;
      this.initPromise = null; // Allow retry
      return false;
    }
  }

  public detect(video: HTMLVideoElement, timestampMs: number): GestureDetection {
    if (!this.isReady || !this.handLandmarker) {
      return {
        gesture: "unknown",
        confidence: 0,
        landmarks: null,
        handCount: 0,
      };
    }

    // MediaPipe requires strictly increasing timestamps — skip duplicate frames
    const ts = Math.round(timestampMs);
    if (ts <= this.lastTimestamp) {
      return {
        gesture: "unknown",
        confidence: 0,
        landmarks: null,
        handCount: 0,
      };
    }
    this.lastTimestamp = ts;

    try {
      const results = this.handLandmarker.detectForVideo(video, ts);

      if (!results || !results.landmarks || results.landmarks.length === 0) {
        this.smoother.addDetection({ gesture: "unknown", confidence: 0 });
        return {
          gesture: "unknown",
          confidence: 0,
          landmarks: null,
          handCount: 0,
        };
      }

      const handCount = results.landmarks.length;

      // Select primary hand (largest bounding box / closest to camera)
      let primaryHandIndex = 0;
      if (handCount > 1) {
        let maxArea = -1;
        results.landmarks.forEach((hand: Array<{ x: number; y: number }>, idx: number) => {
          let minX = 1, maxX = 0, minY = 1, maxY = 0;
          hand.forEach((lm) => {
            if (lm.x < minX) minX = lm.x;
            if (lm.x > maxX) maxX = lm.x;
            if (lm.y < minY) minY = lm.y;
            if (lm.y > maxY) maxY = lm.y;
          });
          const area = (maxX - minX) * (maxY - minY);
          if (area > maxArea) {
            maxArea = area;
            primaryHandIndex = idx;
          }
        });
      }

      const primaryLandmarks: Landmark[] = results.landmarks[primaryHandIndex].map(
        (lm: { x: number; y: number; z: number }) => ({
          x: lm.x,
          y: lm.y,
          z: lm.z,
        })
      );

      const classification = classifyGesture(primaryLandmarks);
      const stableGesture = this.smoother.addDetection(classification);

      return {
        gesture: stableGesture,
        confidence: classification.confidence,
        landmarks: results.landmarks as Landmark[][],
        handCount,
        rawGesture: classification.gesture,
      };
    } catch (err) {
      console.warn("Hand detection error:", err);
      return {
        gesture: "unknown",
        confidence: 0,
        landmarks: null,
        handCount: 0,
      };
    }
  }

  public resetSmoother(): void {
    this.smoother.reset();
  }

  public dispose(): void {
    if (this.handLandmarker) {
      try {
        this.handLandmarker.close();
      } catch {
        // Ignore close error
      }
      this.handLandmarker = null;
    }
    this.isReady = false;
  }
}

export const handTracker = new HandTracker();
