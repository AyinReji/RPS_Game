"use client";

import React from "react";
import { HandOverlay } from "./HandOverlay";
import { RPSLoader } from "./RPSLoader";
import { GestureDetection, Gesture } from "../types/game";
import { Camera, Square } from "lucide-react";

export interface WebcamViewProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  stream?: MediaStream | null;
  isCameraActive: boolean;
  isLoading: boolean;
  error: string | null;
  detection: GestureDetection;
  overlayEnabled: boolean;
  onRequestCamera: () => void;
  onStopCamera?: () => void;
}

const GESTURE_LABELS: Record<Gesture, { emoji: string; label: string; color: string }> = {
  rock: { emoji: "✊", label: "ROCK", color: "bg-blue-100 text-blue-800 border-blue-300" },
  paper: { emoji: "✋", label: "PAPER", color: "bg-emerald-100 text-emerald-800 border-emerald-300" },
  scissors: { emoji: "✌️", label: "SCISSORS", color: "bg-purple-100 text-purple-800 border-purple-300" },
  unknown: { emoji: "👋", label: "SHOW HAND", color: "bg-slate-100 text-slate-600 border-slate-300" },
};

export const WebcamView: React.FC<WebcamViewProps> = ({
  videoRef,
  stream,
  isCameraActive,
  isLoading,
  error,
  detection,
  overlayEnabled,
  onRequestCamera,
  onStopCamera,
}) => {
  const currentInfo = GESTURE_LABELS[detection.gesture] || GESTURE_LABELS.unknown;

  // Ensure video element plays as soon as stream or ref mounts
  React.useEffect(() => {
    if (videoRef.current && stream && videoRef.current.srcObject !== stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch((err) => {
        if (err.name !== "AbortError") {
          console.warn("Error playing video:", err);
        }
      });
    }
  }, [stream, videoRef]);

  return (
    <div className="relative w-full aspect-[4/3] sm:aspect-video rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 shadow-xl flex flex-col justify-center items-center group">
      {/* Video Feed */}
      <video
        ref={(el) => {
          if (videoRef) {
            (videoRef as React.MutableRefObject<HTMLVideoElement | null>).current = el;
          }
          if (el && stream && el.srcObject !== stream) {
            el.srcObject = stream;
            el.play().catch(() => {});
          }
        }}
        onLoadedMetadata={(e) => {
          e.currentTarget.play().catch(() => {});
        }}
        autoPlay
        playsInline
        muted
        className={`w-full h-full object-cover transform -scale-x-100 transition-opacity duration-300 ${
          isCameraActive ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Hand Skeleton Overlay */}
      {isCameraActive && (
        <HandOverlay
          landmarks={detection.landmarks}
          videoRef={videoRef}
          enabled={overlayEnabled}
        />
      )}

      {/* Top Status Bar Badges & Stop Camera Button */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-20">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 backdrop-blur-md border border-slate-700/50 text-xs font-semibold text-white shadow-sm pointer-events-none">
          {isCameraActive ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>CAMERA LIVE</span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-slate-400" />
              <span>CAMERA OFF</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isCameraActive && detection.handCount > 1 && (
            <div className="px-3 py-1 rounded-full bg-amber-500/90 text-slate-950 font-bold text-xs backdrop-blur-md animate-bounce pointer-events-none">
              ⚠️ Show 1 hand
            </div>
          )}

          {isCameraActive && onStopCamera && (
            <button
              onClick={onStopCamera}
              className="px-3 py-1 rounded-full bg-rose-600/90 hover:bg-rose-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 backdrop-blur-md active:scale-95"
              title="Stop Camera Stream"
            >
              <Square size={12} className="fill-white" />
              <span>STOP CAMERA</span>
            </button>
          )}
        </div>
      </div>

      {/* Bottom Gesture Recognition Tag */}
      {isCameraActive && (
        <div className="absolute bottom-4 z-20 flex items-center justify-center pointer-events-none">
          <div
            className={`px-4 py-2 rounded-full border shadow-lg backdrop-blur-md flex items-center gap-2 text-sm font-bold tracking-wide transition-all transform duration-200 ${currentInfo.color}`}
          >
            <span className="text-xl">{currentInfo.emoji}</span>
            <span>{currentInfo.label}</span>
            {detection.gesture !== "unknown" && (
              <span className="text-xs font-normal opacity-75">
                {Math.round(detection.confidence * 100)}%
              </span>
            )}
          </div>
        </div>
      )}

      {/* Camera Inactive / Loading Placeholder */}
      {!isCameraActive && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10 bg-slate-950/90 text-white">
          {isLoading ? (
            <RPSLoader />
          ) : (
            <div className="flex flex-col items-center gap-4 max-w-sm">
              <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Camera size={32} />
              </div>
              <div>
                <h3 className="text-lg font-bold">Camera Access Disabled</h3>
                <p className="text-xs text-slate-400 mt-1">
                  {error || "Enable camera to play with real-time hand gestures processed 100% locally."}
                </p>
              </div>
              <button
                onClick={onRequestCamera}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all shadow-lg hover:shadow-indigo-500/25 flex items-center gap-2"
              >
                <Camera size={16} />
                <span>Enable Camera</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
