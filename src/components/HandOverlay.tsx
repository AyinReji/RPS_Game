"use client";

import React, { useEffect, useRef } from "react";
import { Landmark } from "../types/game";

export interface HandOverlayProps {
  landmarks: Landmark[][] | null;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  enabled: boolean;
}

// MediaPipe 21 hand connection pairs for drawing skeleton vectors
const CONNECTIONS = [
  // Palm
  [0, 1], [1, 2], [2, 3], [3, 4], // Thumb
  [0, 5], [5, 6], [6, 7], [7, 8], // Index
  [5, 9], [9, 10], [10, 11], [11, 12], // Middle
  [9, 13], [13, 14], [14, 15], [15, 16], // Ring
  [13, 17], [0, 17], [17, 18], [18, 19], [19, 20], // Pinky
];

export const HandOverlay: React.FC<HandOverlayProps> = ({
  landmarks,
  videoRef,
  enabled,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Match canvas internal resolution to video frame dimensions
    const width = video && video.videoWidth > 0 ? video.videoWidth : 640;
    const height = video && video.videoHeight > 0 ? video.videoHeight : 480;

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    ctx.clearRect(0, 0, width, height);

    if (!enabled || !landmarks || landmarks.length === 0) {
      return;
    }

    for (const hand of landmarks) {
      if (!hand || hand.length < 21) continue;

      // Enable neon glow effect
      ctx.shadowBlur = 10;
      ctx.shadowColor = "#635bff";
      ctx.strokeStyle = "#818cf8"; // Bright indigo vector lines
      ctx.lineWidth = 4;
      ctx.lineCap = "round";

      // Draw skeleton connecting lines
      for (const [i, j] of CONNECTIONS) {
        const p1 = hand[i];
        const p2 = hand[j];
        if (p1 && p2) {
          ctx.beginPath();
          ctx.moveTo(p1.x * width, p1.y * height);
          ctx.lineTo(p2.x * width, p2.y * height);
          ctx.stroke();
        }
      }

      // Draw joint nodes
      hand.forEach((lm, idx) => {
        const cx = lm.x * width;
        const cy = lm.y * height;

        ctx.beginPath();
        // Finger tips (4, 8, 12, 16, 20) in glowing emerald green
        if ([4, 8, 12, 16, 20].includes(idx)) {
          ctx.shadowColor = "#10b981";
          ctx.fillStyle = "#34d399";
          ctx.arc(cx, cy, 7, 0, 2 * Math.PI);
        } else {
          ctx.shadowColor = "#635bff";
          ctx.fillStyle = "#ffffff";
          ctx.arc(cx, cy, 4.5, 0, 2 * Math.PI);
        }
        ctx.fill();

        ctx.strokeStyle = "#4f46e5";
        ctx.lineWidth = 2;
        ctx.stroke();
      });

      // Reset shadow blur
      ctx.shadowBlur = 0;
    }
  }, [landmarks, videoRef, enabled]);

  if (!enabled) return null;

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-10 w-full h-full object-cover transform -scale-x-100"
    />
  );
};
