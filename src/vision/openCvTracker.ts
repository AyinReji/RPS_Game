import { GestureDetection, Gesture, Landmark } from "../types/game";
import { GestureSmoother } from "./gestureSmoother";

/**
 * Pure HTML5 Canvas 2D / OpenCV-style Computer Vision Hand Detector.
 * Runs 100% locally without external CDN WASM network dependencies.
 * Uses multi-color-space skin thresholding with wide ranges for all skin tones,
 * palm center of mass, convex hull peak detection, and contour analysis.
 */
export class OpenCVTracker {
  private smoother = new GestureSmoother(5, 0.6, 0.5);
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private prevFrame: Uint8ClampedArray | null = null;

  private getContext(): CanvasRenderingContext2D | null {
    if (typeof window === "undefined") return null;
    if (!this.canvas) {
      this.canvas = document.createElement("canvas");
    }
    // Process at 200x150 for better detection accuracy while staying fast
    const targetW = 200;
    const targetH = 150;
    if (this.canvas.width !== targetW || this.canvas.height !== targetH) {
      this.canvas.width = targetW;
      this.canvas.height = targetH;
    }
    if (!this.ctx) {
      this.ctx = this.canvas.getContext("2d", { willReadFrequently: true });
    }
    return this.ctx;
  }

  /**
   * Multi-color-space skin detection that works across all skin tones.
   * Combines YCrCb and HSV checks with very wide thresholds.
   */
  private isSkinPixel(r: number, g: number, b: number): boolean {
    // Rule 1: Very basic RGB checks — skin is never too dark or pure gray
    if (r < 30 && g < 30 && b < 30) return false; // Too dark / black
    const maxC = Math.max(r, g, b);
    const minC = Math.min(r, g, b);
    if (maxC - minC < 8 && maxC < 200) return false; // Gray (non-white)

    // Rule 2: YCrCb — widely used for skin detection (very wide range)
    const Cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;
    const Cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
    const ycrcbSkin = Cr >= 130 && Cr <= 200 && Cb >= 70 && Cb <= 140;

    // Rule 3: HSV-based check for broader coverage
    // Convert to HSV
    const maxV = maxC / 255;
    const minV = minC / 255;
    const delta = maxV - minV;
    let h = 0;
    if (delta > 0) {
      if (maxC === r) h = 60 * (((g - b) / (maxC - minC)) % 6);
      else if (maxC === g) h = 60 * ((b - r) / (maxC - minC) + 2);
      else h = 60 * ((r - g) / (maxC - minC) + 4);
      if (h < 0) h += 360;
    }
    const s = maxV > 0 ? delta / maxV : 0;
    // Skin hue is roughly 0-50° (reddish-yellowish), saturation > 0.1, value > 0.15
    const hsvSkin = (h <= 55 || h >= 340) && s >= 0.08 && maxV >= 0.15;

    // Rule 4: Simple RGB ratio — skin tends to have R > G > B or R > B
    const rgbRatio = r > g && r > b && (r - g) < 120;

    // Pass if any TWO rules agree
    let score = 0;
    if (ycrcbSkin) score++;
    if (hsvSkin) score++;
    if (rgbRatio) score++;
    return score >= 2;
  }

  public detect(video: HTMLVideoElement): GestureDetection {
    if (!video || video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) {
      return { gesture: "unknown", confidence: 0, landmarks: null, handCount: 0 };
    }

    const w = 200;
    const h = 150;
    const ctx = this.getContext();
    if (!ctx) {
      return { gesture: "unknown", confidence: 0, landmarks: null, handCount: 0 };
    }

    try {
      ctx.drawImage(video, 0, 0, w, h);
      const imgData = ctx.getImageData(0, 0, w, h);
      const data = imgData.data;

      // Skin thresholding & centroid calculation
      let sumX = 0;
      let sumY = 0;
      let skinPixelCount = 0;

      const skinPoints: Array<{ x: number; y: number }> = [];

      // Also track motion from previous frame
      let motionPixels = 0;
      let motionSumX = 0;
      let motionSumY = 0;

      for (let y = 0; y < h; y += 2) {
        for (let x = 0; x < w; x += 2) {
          const idx = (y * w + x) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];

          const isSkin = this.isSkinPixel(r, g, b);

          // Motion detection (difference from previous frame)
          let hasMotion = false;
          if (this.prevFrame) {
            const dr = Math.abs(r - this.prevFrame[idx]);
            const dg = Math.abs(g - this.prevFrame[idx + 1]);
            const db = Math.abs(b - this.prevFrame[idx + 2]);
            hasMotion = (dr + dg + db) > 40;
          }

          if (isSkin) {
            sumX += x;
            sumY += y;
            skinPixelCount++;
            skinPoints.push({ x: x / w, y: y / h });
          }

          if (hasMotion && isSkin) {
            motionPixels++;
            motionSumX += x;
            motionSumY += y;
          }
        }
      }

      // Save current frame for next motion comparison
      this.prevFrame = new Uint8ClampedArray(data);

      // Lower threshold: 50 skin pixels is enough (was 150)
      if (skinPixelCount < 50) {
        const gesture = this.smoother.addDetection({ gesture: "unknown", confidence: 0 });
        return { gesture, confidence: 0, landmarks: null, handCount: 0 };
      }

      // Use motion-weighted centroid if available, otherwise pure skin centroid
      let cx: number, cy: number;
      if (motionPixels > 20) {
        cx = (motionSumX / motionPixels) / w;
        cy = (motionSumY / motionPixels) / h;
      } else {
        cx = (sumX / skinPixelCount) / w;
        cy = (sumY / skinPixelCount) / h;
      }

      // Find top contour peaks (fingertips) above or around centroid
      const peaks: Array<{ x: number; y: number }> = [];
      const minPeakDist = 0.07;

      // Sort points by distance from centroid — looking for peaks above the palm
      const distThreshold = 0.12;
      const candidates = skinPoints
        .filter((p) => p.y < cy + 0.1) // Only points at or above lower palm
        .map((p) => {
          const dx = p.x - cx;
          const dy = p.y - cy;
          return { ...p, dist: Math.sqrt(dx * dx + dy * dy) };
        })
        .filter((p) => p.dist > distThreshold)
        .sort((a, b) => b.dist - a.dist);

      // Filter local maxima peaks
      for (const cand of candidates) {
        let isNewPeak = true;
        for (const pk of peaks) {
          const dx = cand.x - pk.x;
          const dy = cand.y - pk.y;
          if (Math.sqrt(dx * dx + dy * dy) < minPeakDist) {
            isNewPeak = false;
            break;
          }
        }
        if (isNewPeak && peaks.length < 5) {
          peaks.push({ x: cand.x, y: cand.y });
        }
      }

      // Also measure the spread of skin pixels as a secondary signal
      let spreadX = 0;
      let spreadY = 0;
      for (const p of skinPoints) {
        spreadX += Math.abs(p.x - cx);
        spreadY += Math.abs(p.y - cy);
      }
      spreadX /= skinPoints.length;
      spreadY /= skinPoints.length;
      const totalSpread = spreadX + spreadY;

      // Classify gesture by peak count + spread
      const peakCount = peaks.length;
      let rawGesture: Gesture = "unknown";
      let confidence = 0.8;

      if (peakCount <= 1) {
        rawGesture = "rock"; // Fist closed or 1 peak
      } else if (peakCount === 2) {
        rawGesture = "scissors"; // 2 finger peaks (Index & Middle)
      } else if (peakCount >= 3) {
        rawGesture = "paper"; // Open palm (3, 4 or 5 finger peaks)
      }

      // Use spread as secondary confirmation
      // Wide spread = likely open hand, tight = likely fist
      if (rawGesture === "rock" && totalSpread > 0.2) {
        rawGesture = "paper"; // Too spread out for a fist
        confidence = 0.7;
      }

      const stableGesture = this.smoother.addDetection({ gesture: rawGesture, confidence });

      // Build synthetic landmarks for rendering HandOverlay
      const landmarks: Landmark[][] = [
        [
          { x: cx, y: cy, z: 0 }, // Wrist / Palm Center (0)
          // Thumb
          { x: cx - 0.05, y: cy - 0.02, z: 0 }, { x: cx - 0.08, y: cy - 0.05, z: 0 }, { x: cx - 0.1, y: cy - 0.08, z: 0 }, { x: peaks[0]?.x || cx - 0.12, y: peaks[0]?.y || cy - 0.1, z: 0 },
          // Index
          { x: cx - 0.03, y: cy - 0.08, z: 0 }, { x: cx - 0.04, y: cy - 0.12, z: 0 }, { x: cx - 0.05, y: cy - 0.15, z: 0 }, { x: peaks[0]?.x || cx - 0.05, y: peaks[0]?.y || cy - 0.2, z: 0 },
          // Middle
          { x: cx, y: cy - 0.09, z: 0 }, { x: cx, y: cy - 0.14, z: 0 }, { x: cx, y: cy - 0.18, z: 0 }, { x: peaks[1]?.x || cx, y: peaks[1]?.y || cy - 0.22, z: 0 },
          // Ring
          { x: cx + 0.03, y: cy - 0.08, z: 0 }, { x: cx + 0.04, y: cy - 0.12, z: 0 }, { x: cx + 0.05, y: cy - 0.15, z: 0 }, { x: peaks[2]?.x || cx + 0.05, y: peaks[2]?.y || cy - 0.19, z: 0 },
          // Pinky
          { x: cx + 0.06, y: cy - 0.06, z: 0 }, { x: cx + 0.08, y: cy - 0.09, z: 0 }, { x: cx + 0.1, y: cy - 0.12, z: 0 }, { x: peaks[3]?.x || cx + 0.11, y: peaks[3]?.y || cy - 0.15, z: 0 },
        ],
      ];

      return {
        gesture: stableGesture,
        confidence,
        landmarks,
        handCount: 1,
        rawGesture,
      };
    } catch (err) {
      console.warn("OpenCV tracker error:", err);
      return { gesture: "unknown", confidence: 0, landmarks: null, handCount: 0 };
    }
  }

  public resetSmoother(): void {
    this.smoother.reset();
  }
}

export const openCvTracker = new OpenCVTracker();
