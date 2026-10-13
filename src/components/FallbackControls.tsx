"use client";

import React from "react";
import { Move, GameStatus } from "../types/game";
import { Play, Square } from "lucide-react";

export interface FallbackControlsProps {
  status: GameStatus;
  onSelectMove: (move: Move) => void;
  onStartGame: () => void;
  onStopRound: () => void;
  isUsingFallbackControls: boolean;
}

const MOVES: Array<{ id: Move; label: string; emoji: string; key: string; color: string }> = [
  { id: "rock", label: "ROCK", emoji: "✊", key: "R", color: "hover:border-blue-500 hover:bg-blue-50/50 text-blue-900" },
  { id: "paper", label: "PAPER", emoji: "✋", key: "P", color: "hover:border-emerald-500 hover:bg-emerald-50/50 text-emerald-900" },
  { id: "scissors", label: "SCISSORS", emoji: "✌️", key: "S", color: "hover:border-purple-500 hover:bg-purple-50/50 text-purple-900" },
];

export const FallbackControls: React.FC<FallbackControlsProps> = ({
  status,
  onSelectMove,
  onStartGame,
  onStopRound,
  isUsingFallbackControls,
}) => {
  const isPlayableState = status === "CAMERA_READY" || status === "IDLE";
  const isCaptureState = status === "CAPTURE" || status === "COUNTDOWN" || status === "GET_READY";

  return (
    <div className="w-full bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col items-center gap-4">
      {/* Header bar */}
      <div className="flex items-center justify-between w-full border-b border-slate-100 pb-3">
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          GAME CONTROLS {isUsingFallbackControls ? "(MANUAL MODE)" : ""}
        </h4>
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
          <kbd className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-600 font-mono">
            Space
          </kbd>
          <span>Start / Stop</span>
        </div>
      </div>

      {/* Primary Action Button or Gesture Selection */}
      {isPlayableState ? (
        <button
          onClick={onStartGame}
          className="w-full py-4 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-base transition-all shadow-lg hover:shadow-indigo-500/25 flex items-center justify-center gap-3 group"
        >
          <Play size={20} className="fill-white group-hover:scale-110 transition-transform" />
          <span>START ROUND</span>
        </button>
      ) : isCaptureState ? (
        <button
          onClick={onStopRound}
          className="w-full py-3 px-6 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-sm transition-all shadow-lg flex items-center justify-center gap-2"
        >
          <Square size={16} className="fill-white" />
          <span>STOP ROUND</span>
        </button>
      ) : null}

      {/* Manual Gesture Buttons */}
      <div className="grid grid-cols-3 gap-3 w-full">
        {MOVES.map((m) => {
          const disabled = !isCaptureState && !isUsingFallbackControls;
          return (
            <button
              key={m.id}
              onClick={() => {
                if (isPlayableState) {
                  onStartGame();
                  setTimeout(() => onSelectMove(m.id), 100);
                } else {
                  onSelectMove(m.id);
                }
              }}
              className={`p-3.5 sm:p-4 rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col items-center gap-1.5 transition-all transform active:scale-95 ${m.color} ${
                disabled ? "opacity-60 cursor-pointer" : "hover:-translate-y-0.5"
              }`}
            >
              <span className="text-3xl sm:text-4xl">{m.emoji}</span>
              <div className="flex items-center gap-1">
                <span className="text-xs font-extrabold">{m.label}</span>
                <kbd className="hidden sm:inline-block px-1 py-0.2 rounded bg-slate-100 text-[10px] text-slate-500 font-mono">
                  {m.key}
                </kbd>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
