import { GameStats, GameSettings } from "../types/game";

const STATS_KEY = "rps-ai-stats-v1";
const SETTINGS_KEY = "rps-ai-settings-v1";

export const DEFAULT_STATS: GameStats = {
  rounds: 0,
  wins: 0,
  losses: 0,
  draws: 0,
  currentStreak: 0,
  bestStreak: 0,
  xp: 0,
};

export const DEFAULT_SETTINGS: GameSettings = {
  cameraDeviceId: "",
  mode: "quick",
  soundEnabled: true,
  overlayEnabled: true,
  countdownSpeedMs: 700,
  debugMode: false,
};

export function loadStats(): GameStats {
  if (typeof window === "undefined") return DEFAULT_STATS;
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (!raw) return DEFAULT_STATS;
    return { ...DEFAULT_STATS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_STATS;
  }
}

export function saveStats(stats: GameStats): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch (err) {
    console.warn("Failed to save stats to localStorage", err);
  }
}

export function loadSettings(): GameSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: GameSettings): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (err) {
    console.warn("Failed to save settings to localStorage", err);
  }
}

export function clearStats(): GameStats {
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(STATS_KEY);
    } catch (err) {
      console.warn("Failed to clear stats", err);
    }
  }
  return DEFAULT_STATS;
}
