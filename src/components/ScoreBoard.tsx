"use client";

import React from "react";
import { Score, GameStats, GameMode } from "../types/game";
import { getMatchTargetWins } from "../game/gameState";
import { Flame, Trophy, Zap, RefreshCw } from "lucide-react";

export interface ScoreBoardProps {
  score: Score;
  stats: GameStats;
  mode: GameMode;
  onRestartMatch: () => void;
}

export const ScoreBoard: React.FC<ScoreBoardProps> = ({
  score,
  stats,
  mode,
  onRestartMatch,
}) => {
  const targetWins = getMatchTargetWins(mode);
  const winRate =
    stats.rounds > 0
      ? Math.round((stats.wins / stats.rounds) * 100)
      : 0;

  return (
    <div className="w-full bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col gap-4">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 font-bold text-xs uppercase tracking-wider">
            {mode.replace("_", " ")} MODE
          </span>
          {targetWins && (
            <span className="text-xs text-slate-500 font-medium">
              (First to {targetWins})
            </span>
          )}
        </div>

        <button
          onClick={onRestartMatch}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          title="Restart Current Match"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Main Score Area */}
      <div className="flex items-center justify-around py-1">
        {/* Player Score */}
        <div className="flex flex-col items-center">
          <span className="text-xs font-bold text-slate-400 tracking-wider uppercase mb-1">
            YOU
          </span>
          <span className="text-5xl font-black text-slate-900 tracking-tight">
            {score.player}
          </span>
        </div>

        <div className="text-2xl font-black text-slate-300 select-none">:</div>

        {/* AI Score */}
        <div className="flex flex-col items-center">
          <span className="text-xs font-bold text-slate-400 tracking-wider uppercase mb-1">
            AI OPPONENT
          </span>
          <span className="text-5xl font-black text-slate-900 tracking-tight">
            {score.computer}
          </span>
        </div>
      </div>

      {/* Streak and XP Bar */}
      <div className="grid grid-cols-2 gap-2 pt-2">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50 border border-amber-200/60 text-amber-900">
          <Flame size={18} className="text-amber-500 fill-amber-500" />
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
              STREAK
            </span>
            <span className="text-xs font-extrabold">
              {stats.currentStreak} {stats.currentStreak === 1 ? "Win" : "Wins"}
              <span className="text-[10px] font-normal text-amber-600 ml-1">
                (Best: {stats.bestStreak})
              </span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-indigo-50 border border-indigo-200/60 text-indigo-900">
          <Zap size={18} className="text-indigo-600 fill-indigo-600" />
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700">
              TOTAL XP
            </span>
            <span className="text-xs font-extrabold">{stats.xp} PTS</span>
          </div>
        </div>
      </div>

      {/* Secondary Stats Footer */}
      <div className="grid grid-cols-4 gap-1 text-center pt-2 border-t border-slate-100 text-xs">
        <div>
          <span className="text-slate-400 block text-[10px]">Rounds</span>
          <span className="font-bold text-slate-700">{stats.rounds}</span>
        </div>
        <div>
          <span className="text-slate-400 block text-[10px]">Wins</span>
          <span className="font-bold text-emerald-600">{stats.wins}</span>
        </div>
        <div>
          <span className="text-slate-400 block text-[10px]">Losses</span>
          <span className="font-bold text-rose-600">{stats.losses}</span>
        </div>
        <div>
          <span className="text-slate-400 block text-[10px]">Win Rate</span>
          <span className="font-bold text-slate-700">{winRate}%</span>
        </div>
      </div>
    </div>
  );
};
