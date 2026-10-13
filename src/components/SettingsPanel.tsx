"use client";

import React from "react";
import { GameMode, GameSettings } from "../types/game";
import { Volume2, VolumeX, Eye, EyeOff, Trash2, Camera } from "lucide-react";

export interface SettingsPanelProps {
  settings: GameSettings;
  devices: MediaDeviceInfo[];
  onUpdateSettings: (settings: Partial<GameSettings>) => void;
  onResetStats: () => void;
}

const MODES: Array<{ id: GameMode; label: string; desc: string }> = [
  { id: "quick", label: "Quick Match", desc: "First to 5 wins" },
  { id: "best_of_3", label: "Best of 3", desc: "First to 2 wins" },
  { id: "best_of_5", label: "Best of 5", desc: "First to 3 wins" },
  { id: "endless", label: "Endless", desc: "No round limit" },
];

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  settings,
  devices,
  onUpdateSettings,
  onResetStats,
}) => {
  return (
    <div className="w-full bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col gap-5">
      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-3">
        GAME SETTINGS
      </h4>

      {/* Game Mode Selection */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-bold text-slate-700">Game Mode</label>
        <div className="grid grid-cols-2 gap-2">
          {MODES.map((m) => {
            const isSelected = settings.mode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => onUpdateSettings({ mode: m.id })}
                className={`p-3 rounded-xl border text-left flex flex-col gap-0.5 transition-all ${
                  isSelected
                    ? "border-indigo-600 bg-indigo-50/60 text-indigo-950 font-bold shadow-sm"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                }`}
              >
                <span className="text-xs font-extrabold">{m.label}</span>
                <span className="text-[10px] text-slate-400 font-normal">{m.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Camera Device Dropdown */}
      {devices.length > 0 && (
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Camera size={14} className="text-slate-400" />
            <span>Camera Device</span>
          </label>
          <select
            value={settings.cameraDeviceId}
            onChange={(e) => onUpdateSettings({ cameraDeviceId: e.target.value })}
            className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-medium bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {devices.map((d, i) => (
              <option key={d.deviceId || i} value={d.deviceId}>
                {d.label || `Camera ${i + 1}`}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Toggles */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        {/* Sound Toggle */}
        <button
          onClick={() => onUpdateSettings({ soundEnabled: !settings.soundEnabled })}
          className={`p-3 rounded-xl border flex items-center justify-between text-xs font-semibold transition-all ${
            settings.soundEnabled
              ? "border-emerald-200 bg-emerald-50/60 text-emerald-900"
              : "border-slate-200 bg-slate-50 text-slate-500"
          }`}
        >
          <div className="flex items-center gap-2">
            {settings.soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            <span>Sound Effects</span>
          </div>
          <span className="text-[10px] font-bold uppercase">
            {settings.soundEnabled ? "ON" : "OFF"}
          </span>
        </button>

        {/* Hand Skeleton Overlay Toggle */}
        <button
          onClick={() => onUpdateSettings({ overlayEnabled: !settings.overlayEnabled })}
          className={`p-3 rounded-xl border flex items-center justify-between text-xs font-semibold transition-all ${
            settings.overlayEnabled
              ? "border-indigo-200 bg-indigo-50/60 text-indigo-900"
              : "border-slate-200 bg-slate-50 text-slate-500"
          }`}
        >
          <div className="flex items-center gap-2">
            {settings.overlayEnabled ? <Eye size={16} /> : <EyeOff size={16} />}
            <span>Hand Overlay</span>
          </div>
          <span className="text-[10px] font-bold uppercase">
            {settings.overlayEnabled ? "ON" : "OFF"}
          </span>
        </button>
      </div>

      {/* Danger Zone: Reset Stats */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
        <span className="text-xs text-slate-400">Clear all local statistics</span>
        <button
          onClick={onResetStats}
          className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center gap-1.5 transition-colors"
        >
          <Trash2 size={14} />
          <span>Reset Stats</span>
        </button>
      </div>
    </div>
  );
};
