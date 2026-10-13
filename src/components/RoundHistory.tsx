"use client";

import React from "react";
import { Round, Move, RoundResult } from "../types/game";

export interface RoundHistoryProps {
  history: Round[];
}

const EMOJI_MAP: Record<Move, string> = {
  rock: "✊",
  paper: "✋",
  scissors: "✌️",
};

const RESULT_BADGES: Record<RoundResult, { label: string; class: string }> = {
  win: { label: "WIN", class: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  loss: { label: "LOSS", class: "bg-rose-100 text-rose-800 border-rose-200" },
  draw: { label: "DRAW", class: "bg-amber-100 text-amber-800 border-amber-200" },
  invalid: { label: "INVALID", class: "bg-slate-100 text-slate-600 border-slate-200" },
};

export const RoundHistory: React.FC<RoundHistoryProps> = ({ history }) => {
  if (!history || history.length === 0) {
    return (
      <div className="w-full bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm text-center text-xs text-slate-400">
        No rounds played yet in this session.
      </div>
    );
  }

  return (
    <div className="w-full bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col gap-3">
      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
        ROUND HISTORY ({history.length})
      </h4>

      <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
        {history.map((round) => {
          const badge = RESULT_BADGES[round.result];
          const pEmoji = round.playerMove ? EMOJI_MAP[round.playerMove] : "❓";
          const cEmoji = EMOJI_MAP[round.computerMove];

          return (
            <div
              key={round.id}
              className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs font-medium"
            >
              <span className="text-slate-400 font-semibold w-14">
                Round {round.roundNumber}
              </span>

              <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
                <span>{pEmoji}</span>
                <span className="text-slate-300 text-[10px]">vs</span>
                <span>{cEmoji}</span>
              </div>

              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badge.class}`}
              >
                {badge.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
