"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GameStatus } from "../types/game";

export interface CountdownProps {
  status: GameStatus;
  count: number;
}

export const Countdown: React.FC<CountdownProps> = ({ status, count }) => {
  if (status !== "GET_READY" && status !== "COUNTDOWN" && status !== "CAPTURE") {
    return null;
  }

  let displayText = "";
  let subText = "Hold your gesture clearly in front of the camera";

  if (status === "GET_READY") {
    displayText = "GET READY";
  } else if (status === "COUNTDOWN") {
    displayText = count.toString();
  } else if (status === "CAPTURE") {
    displayText = "LOCKED!";
    subText = "Capturing gesture...";
  }

  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-950/40 backdrop-blur-sm rounded-2xl pointer-events-none p-4 text-center">
      <AnimatePresence mode="wait">
        <motion.div
          key={displayText}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 1.5, opacity: 0 }}
          transition={{ duration: 0.25, ease: "backOut" }}
          className="flex flex-col items-center"
        >
          <span className="text-6xl sm:text-8xl font-black text-white drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)] tracking-wider">
            {displayText}
          </span>
          <span className="mt-2 text-sm sm:text-base font-semibold text-white/90 bg-slate-900/80 px-4 py-1.5 rounded-full shadow-lg border border-white/10">
            {subText}
          </span>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
