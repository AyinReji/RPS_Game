"use client";

import React from "react";
import { GestureDetection, GameStatus } from "../types/game";
import { Activity } from "lucide-react";

export interface DebugPanelProps {
  fps: number;
  detectionFps: number;
  detection: GestureDetection;
  status: GameStatus;
  isCameraActive: boolean;
  isModelReady: boolean;
}

export const DebugPanel: React.FC<DebugPanelProps> = ({
  fps,
  detectionFps,
  detection,
  status,
  isCameraActive,
  isModelReady,
}) => {
  return (
    <div className="fixed bottom-4 right-4 z-50 bg-slate-950/90 text-emerald-400 p-4 rounded-2xl border border-emerald-500/30 shadow-2xl backdrop-blur-md text-xs font-mono w-72 flex flex-col gap-2">
      <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2 text-white font-bold">
        <div className="flex items-center gap-1.5">
          <Activity size={14} className="text-emerald-400 animate-pulse" />
          <span>VISION DIAGNOSTICS</span>
        </div>
        <span className="text-[10px] text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
          DEBUG
        </span>
      </div>

      <div className="grid grid-cols-2 gap-1.5 pt-1">
        <div>
          <span className="text-slate-400 block text-[10px]">Render FPS:</span>
          <span className="text-white font-bold">{fps}</span>
        </div>
        <div>
          <span className="text-slate-400 block text-[10px]">Vision FPS:</span>
          <span className="text-white font-bold">{detectionFps}</span>
        </div>
        <div>
          <span className="text-slate-400 block text-[10px]">Hand Count:</span>
          <span className="text-white font-bold">{detection.handCount}</span>
        </div>
        <div>
          <span className="text-slate-400 block text-[10px]">Confidence:</span>
          <span className="text-white font-bold">
            {Math.round(detection.confidence * 100)}%
          </span>
        </div>
      </div>

      <div className="border-t border-emerald-500/20 pt-2 flex flex-col gap-1">
        <div>
          <span className="text-slate-400 text-[10px]">Stable Gesture: </span>
          <span className="text-amber-300 font-bold uppercase">{detection.gesture}</span>
        </div>
        <div>
          <span className="text-slate-400 text-[10px]">Raw Gesture: </span>
          <span className="text-indigo-300 font-bold uppercase">{detection.rawGesture || "none"}</span>
        </div>
        <div>
          <span className="text-slate-400 text-[10px]">Game FSM State: </span>
          <span className="text-pink-400 font-bold">{status}</span>
        </div>
        <div>
          <span className="text-slate-400 text-[10px]">Model / Camera: </span>
          <span className="text-white font-bold">
            {isModelReady ? "READY" : "LOADING"} / {isCameraActive ? "LIVE" : "OFF"}
          </span>
        </div>
      </div>
    </div>
  );
};
