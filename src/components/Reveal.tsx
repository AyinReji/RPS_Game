"use client";

import React from "react";
import { motion } from "framer-motion";
import { Move, RoundResult } from "../types/game";
import { Trophy, Frown, Equal, AlertCircle } from "lucide-react";

export interface RevealProps {
  playerMove: Move | null;
  computerMove: Move;
  result: RoundResult | null;
}

const MOVE_ICONS: Record<Move, { emoji: string; label: string }> = {
  rock: { emoji: "✊", label: "ROCK" },
  paper: { emoji: "✋", label: "PAPER" },
  scissors: { emoji: "✌️", label: "SCISSORS" },
};

export const Reveal: React.FC<RevealProps> = ({
  playerMove,
  computerMove,
  result,
}) => {
  const playerIcon = playerMove ? MOVE_ICONS[playerMove] : null;
  const computerIcon = MOVE_ICONS[computerMove];

  let bannerBg = "bg-slate-800 text-white";
  let bannerText = "REVEALING...";
  let BannerIcon = Equal;

  if (result === "win") {
    bannerBg = "bg-emerald-600 text-white shadow-emerald-500/30";
    bannerText = "YOU WIN!";
    BannerIcon = Trophy;
  } else if (result === "loss") {
    bannerBg = "bg-rose-600 text-white shadow-rose-500/30";
    bannerText = "AI WINS!";
    BannerIcon = Frown;
  } else if (result === "draw") {
    bannerBg = "bg-amber-500 text-slate-950 shadow-amber-500/30";
    bannerText = "IT'S A DRAW!";
    BannerIcon = Equal;
  } else if (result === "invalid") {
    bannerBg = "bg-slate-700 text-white shadow-slate-500/30";
    bannerText = "NO CLEAR GESTURE DETECTED";
    BannerIcon = AlertCircle;
  }

  return (
    <div className="w-full bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-xl flex flex-col items-center gap-6 text-white relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 opacity-50" />

      {/* Outcome Banner */}
      {result && (
        <motion.div
          initial={{ scale: 0.8, y: -20, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className={`px-6 py-2.5 rounded-full font-black text-base sm:text-lg tracking-wider flex items-center gap-2 shadow-lg z-10 ${bannerBg}`}
        >
          <BannerIcon size={20} />
          <span>{bannerText}</span>
        </motion.div>
      )}

      {/* Moves Comparison */}
      <div className="flex items-center justify-around w-full z-10 py-2">
        {/* Player Move */}
        <motion.div
          initial={{ x: -40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="flex flex-col items-center gap-2"
        >
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            YOU
          </span>
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-5xl sm:text-6xl shadow-inner">
            {playerIcon ? playerIcon.emoji : "❓"}
          </div>
          <span className="text-sm font-extrabold text-slate-200 uppercase">
            {playerIcon ? playerIcon.label : "NO GESTURE"}
          </span>
        </motion.div>

        {/* VS Divider */}
        <div className="text-xl sm:text-2xl font-black text-indigo-400 tracking-tighter opacity-80">
          VS
        </div>

        {/* AI Move */}
        <motion.div
          initial={{ x: 40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="flex flex-col items-center gap-2"
        >
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            AI OPPONENT
          </span>
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-5xl sm:text-6xl shadow-inner">
            {computerIcon.emoji}
          </div>
          <span className="text-sm font-extrabold text-slate-200 uppercase">
            {computerIcon.label}
          </span>
        </motion.div>
      </div>
    </div>
  );
};
