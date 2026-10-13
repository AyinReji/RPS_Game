"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Cpu } from "lucide-react";

export interface RPSLoaderProps {
  message?: string;
}

const GESTURES = [
  { emoji: "✊", label: "ROCK", color: "from-blue-500 to-indigo-600", text: "text-blue-400" },
  { emoji: "✋", label: "PAPER", color: "from-emerald-400 to-teal-600", text: "text-emerald-400" },
  { emoji: "✌️", label: "SCISSORS", color: "from-purple-500 to-pink-600", text: "text-purple-400" },
];

const LOADING_STEPS = [
  "Initializing local vision engine...",
  "Loading MediaPipe neural hand landmarker...",
  "Calibrating webcam resolution...",
  "Warming up real-time gesture pipeline...",
];

export const RPSLoader: React.FC<RPSLoaderProps> = ({ message }) => {
  const [index, setIndex] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);

  // Cycle gestures every 500ms
  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % GESTURES.length);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Cycle loading step text
  useEffect(() => {
    const interval = setInterval(() => {
      setStepIndex((prev) => (prev + 1) % LOADING_STEPS.length);
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  const currentGesture = GESTURES[index];

  return (
    <div className="flex flex-col items-center justify-center p-6 text-center z-20">
      {/* Animated Glowing Ring & Cycling Hand Gesture */}
      <div className="relative w-28 h-28 flex items-center justify-center mb-5">
        {/* Pulsing Backlight Halo */}
        <motion.div
          animate={{ scale: [1, 1.25, 1], opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className={`absolute inset-0 rounded-full bg-gradient-to-r ${currentGesture.color} blur-xl`}
        />

        {/* Outer Rotating Dotted Orbit */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 rounded-full border-2 border-dashed border-indigo-400/40"
        />

        {/* Inner Card Container */}
        <div className="relative w-24 h-24 rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl flex items-center justify-center backdrop-blur-md overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.span
              key={currentGesture.label}
              initial={{ scale: 0.3, opacity: 0, rotate: -30 }}
              animate={{ scale: 1.1, opacity: 1, rotate: 0 }}
              exit={{ scale: 1.4, opacity: 0, rotate: 30 }}
              transition={{ type: "spring", stiffness: 350, damping: 18 }}
              className="text-5xl select-none filter drop-shadow-md"
            >
              {currentGesture.emoji}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>

      {/* Title & Animated Status Line */}
      <div className="flex flex-col items-center gap-1.5 max-w-xs">
        <div className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-widest text-indigo-400">
          <Cpu size={14} className="animate-spin" />
          <span>AI VISION ENGINE</span>
        </div>

        <p className="text-sm font-semibold text-white tracking-wide">
          {message || LOADING_STEPS[stepIndex]}
        </p>

        {/* Animated Progress Bar */}
        <div className="w-48 h-1.5 bg-slate-800 rounded-full overflow-hidden mt-2 relative">
          <motion.div
            animate={{ x: ["-100%", "100%"] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
            className={`w-full h-full bg-gradient-to-r ${currentGesture.color} rounded-full`}
          />
        </div>

        <span className="text-[10px] text-slate-400 mt-2 flex items-center gap-1 font-medium">
          <Sparkles size={11} className="text-amber-400" />
          100% Local On-Device Processing
        </span>
      </div>
    </div>
  );
};
