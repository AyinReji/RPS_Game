"use client";

import React from "react";
import { Camera, ShieldCheck, Gamepad2 } from "lucide-react";

export interface CameraPermissionProps {
  onEnableCamera: () => void;
  onUseFallback: () => void;
}

export const CameraPermission: React.FC<CameraPermissionProps> = ({
  onEnableCamera,
  onUseFallback,
}) => {
  return (
    <div className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xl flex flex-col items-center text-center gap-6">
      {/* Icon Header */}
      <div className="w-20 h-20 rounded-3xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-inner">
        <Camera size={40} />
      </div>

      {/* Content */}
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">
          Play Rock Paper Scissors with your Webcam!
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 max-w-sm">
          RPS AI detects your hand gestures in real time using local computer vision.
        </p>
      </div>

      {/* Privacy Promise Badge */}
      <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200/60 text-xs text-slate-600 font-medium">
        <ShieldCheck size={18} className="text-emerald-600 shrink-0" />
        <span>Your video is processed 100% locally. No video is uploaded or recorded.</span>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 w-full pt-2">
        <button
          onClick={onEnableCamera}
          className="flex-1 py-3.5 px-5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-all shadow-lg hover:shadow-indigo-500/25 flex items-center justify-center gap-2"
        >
          <Camera size={18} />
          <span>Enable Camera</span>
        </button>

        <button
          onClick={onUseFallback}
          className="py-3.5 px-5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition-all flex items-center justify-center gap-2"
        >
          <Gamepad2 size={18} />
          <span>Play With Buttons</span>
        </button>
      </div>
    </div>
  );
};
