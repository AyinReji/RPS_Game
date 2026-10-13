"use client";

import React from "react";
import { motion } from "framer-motion";
import { Score, GameStats, GameMode } from "../types/game";
import { Trophy, RefreshCw, Layers, Award } from "lucide-react";

export interface MatchCompleteProps {
  score: Score;
  stats: GameStats;
  mode: GameMode;
  onPlayAgain: () => void;
  onChangeMode: () => void;
}

export const MatchComplete: React.FC<MatchCompleteProps> = ({
  score,
  stats,
  mode,
  onPlayAgain,
  onChangeMode,
}) => {
  const isPlayerWinner = score.player > score.computer;
  const winRate =
    stats.rounds > 0 ? Math.round((stats.wins / stats.rounds) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-2xl flex flex-col items-center text-center gap-6"
      >
        {/* Victory Icon / Badge */}
        <div
          className={`w-20 h-20 rounded-3xl flex items-center justify-center text-white shadow-xl ${
            isPlayerWinner
              ? "bg-gradient-to-tr from-amber-500 to-yellow-400 shadow-amber-500/30"
              : "bg-slate-800 shadow-slate-800/30"
          }`}
        >
          {isPlayerWinner ? <Trophy size={40} /> : <Award size={40} />}
        </div>

        {/* Title */}
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
            MATCH COMPLETE ({mode.replace("_", " ")})
          </span>
          <h2 className="text-3xl font-black text-slate-900 mt-2">
            {isPlayerWinner ? "VICTORY!" : "DEFEAT"}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {isPlayerWinner
              ? "Congratulations! You defeated the AI opponent."
              : "Good effort! Practice your timing and try again."}
          </p>
        </div>

        {/* Score Summary Box */}
        <div className="w-full bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center justify-around">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 uppercase">
              YOU
            </span>
            <span className="text-4xl font-black text-slate-900">
              {score.player}
            </span>
          </div>
          <span className="text-2xl font-bold text-slate-300">:</span>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 uppercase">
              AI
            </span>
            <span className="text-4xl font-black text-slate-900">
              {score.computer}
            </span>
          </div>
        </div>

        {/* Secondary Stats Grid */}
        <div className="grid grid-cols-3 gap-2 w-full text-center text-xs">
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-slate-400 text-[10px] block font-medium">
              Win Rate
            </span>
            <span className="font-extrabold text-slate-800">{winRate}%</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-slate-400 text-[10px] block font-medium">
              Best Streak
            </span>
            <span className="font-extrabold text-amber-600">
              {stats.bestStreak}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-slate-400 text-[10px] block font-medium">
              Total XP
            </span>
            <span className="font-extrabold text-indigo-600">{stats.xp}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <button
            onClick={onPlayAgain}
            className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-all shadow-lg hover:shadow-indigo-500/25 flex items-center justify-center gap-2"
          >
            <RefreshCw size={18} />
            <span>Play Again</span>
          </button>
          <button
            onClick={onChangeMode}
            className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition-all flex items-center justify-center gap-2"
          >
            <Layers size={18} />
            <span>Change Mode</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
