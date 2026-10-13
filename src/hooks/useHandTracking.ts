"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { GestureDetection } from "../types/game";
import { handTracker } from "../vision/handTracker";
import { openCvTracker } from "../vision/openCvTracker";

export interface UseHandTrackingOptions {
  enabled: boolean;
  videoRef: React.RefObject<HTMLVideoElement | null>;
}

export interface UseHandTrackingReturn {
  detection: GestureDetection;
  isModelLoading: boolean;
  isModelReady: boolean;
  fps: number;
  detectionFps: number;
  modelError: string | null;
}

const DEFAULT_DETECTION: GestureDetection = {
  gesture: "unknown",
  confidence: 0,
  landmarks: null,
  handCount: 0,
};

export function useHandTracking({
  enabled,
  videoRef,
}: UseHandTrackingOptions): UseHandTrackingReturn {
  const [detection, setDetection] = useState<GestureDetection>(DEFAULT_DETECTION);
  const [isModelLoading, setIsModelLoading] = useState<boolean>(true);
  const [isModelReady, setIsModelReady] = useState<boolean>(false);
  const [modelError, setModelError] = useState<string | null>(null);
  const [fps, setFps] = useState<number>(0);
  const [detectionFps, setDetectionFps] = useState<number>(0);

  const animFrameId = useRef<number | null>(null);
  const frameCount = useRef<number>(0);
  const detectionCount = useRef<number>(0);
  const lastFpsUpdate = useRef<number>(performance.now());
  const lastDetectTime = useRef<number>(0);
  // Track whether MediaPipe init succeeded — starts null (unknown), set after init
  const mediaPipeReady = useRef<boolean | null>(null);

  // Throttle detection to ~30 FPS to avoid MediaPipe timestamp collisions
  const DETECT_INTERVAL_MS = 33;

  // Initialize MediaPipe model
  useEffect(() => {
    let isMounted = true;

    async function initModel() {
      setIsModelLoading(true);
      setModelError(null);
      console.log("[useHandTracking] Starting model initialization...");

      const success = await handTracker.initialize();

      if (isMounted) {
        mediaPipeReady.current = success;
        setIsModelReady(true);
        setIsModelLoading(false);

        if (success) {
          console.log("[useHandTracking] ✅ MediaPipe ready — using MediaPipe for detection");
        } else {
          console.warn("[useHandTracking] ⚠️ MediaPipe failed — using OpenCV fallback");
        }
      }
    }

    initModel();

    return () => {
      isMounted = false;
    };
  }, []);

  // Detection RAF loop
  const processFrame = useCallback(() => {
    if (
      !enabled ||
      !videoRef.current ||
      videoRef.current.readyState < 2 ||
      videoRef.current.videoWidth === 0 ||
      videoRef.current.videoHeight === 0
    ) {
      animFrameId.current = requestAnimationFrame(processFrame);
      return;
    }

    const now = performance.now();
    frameCount.current++;

    if (now - lastFpsUpdate.current >= 1000) {
      console.log(
        `[HandTracking] FPS: ${frameCount.current} | Detections: ${detectionCount.current} | MediaPipe: ${mediaPipeReady.current}`
      );
      setFps(frameCount.current);
      setDetectionFps(detectionCount.current);
      frameCount.current = 0;
      detectionCount.current = 0;
      lastFpsUpdate.current = now;
    }

    // Throttle detection to ~30 FPS
    if (now - lastDetectTime.current < DETECT_INTERVAL_MS) {
      animFrameId.current = requestAnimationFrame(processFrame);
      return;
    }
    lastDetectTime.current = now;

    const video = videoRef.current;
    if (video) {
      // Try MediaPipe first if it's ready
      if (mediaPipeReady.current === true) {
        try {
          const result = handTracker.detect(video, now);
          if (result && result.handCount > 0) {
            detectionCount.current++;
            setDetection(result);
          } else {
            // MediaPipe didn't find a hand — try OpenCV as secondary
            const cvResult = openCvTracker.detect(video);
            if (cvResult.handCount > 0) {
              detectionCount.current++;
              setDetection(cvResult);
            } else {
              setDetection(DEFAULT_DETECTION);
            }
          }
        } catch (err) {
          console.warn("[HandTracking] MediaPipe runtime error, falling back to OpenCV:", err);
          mediaPipeReady.current = false;
        }
      } else {
        // OpenCV-only fallback
        try {
          const cvResult = openCvTracker.detect(video);
          detectionCount.current++;
          setDetection(cvResult);
        } catch {
          setDetection(DEFAULT_DETECTION);
        }
      }
    }

    animFrameId.current = requestAnimationFrame(processFrame);
  }, [enabled, videoRef]);

  useEffect(() => {
    if (enabled) {
      animFrameId.current = requestAnimationFrame(processFrame);
    } else {
      setDetection(DEFAULT_DETECTION);
    }

    return () => {
      if (animFrameId.current !== null) {
        cancelAnimationFrame(animFrameId.current);
      }
    };
  }, [enabled, processFrame]);

  return {
    detection,
    isModelLoading,
    isModelReady,
    fps,
    detectionFps,
    modelError,
  };
}
