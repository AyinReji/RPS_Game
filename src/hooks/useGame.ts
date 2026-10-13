"use client";

import { useReducer, useEffect, useCallback, useRef } from "react";
import confetti from "canvas-confetti";
import {
  gameReducer,
  initialGameState,
  GameState,
} from "../game/gameState";
import { Move, GameMode, GameSettings } from "../types/game";
import {
  loadStats,
  saveStats,
  loadSettings,
  saveSettings,
  clearStats as clearLocalStorageStats,
} from "../utils/storage";
import { sound } from "../utils/sound";

export interface UseGameReturn {
  state: GameState;
  startCameraRequest: () => void;
  onCameraGranted: () => void;
  onCameraDenied: (msg?: string) => void;
  useFallbackControls: () => void;
  startGame: () => void;
  makePlayerMove: (move: Move) => void;
  restartMatch: () => void;
  setGameMode: (mode: GameMode) => void;
  updateSettings: (newSettings: Partial<GameSettings>) => void;
  resetAllStats: () => void;
}

export function useGame(): UseGameReturn {
  const [state, dispatch] = useReducer(
    gameReducer,
    null,
    () => initialGameState(loadSettings())
  );

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Load initial saved stats on mount
  useEffect(() => {
    const saved = loadStats();
    dispatch({ type: "LOAD_INITIAL_STATS", stats: saved });
  }, []);

  // Sync sound setting
  useEffect(() => {
    sound.enabled = state.settings.soundEnabled;
  }, [state.settings.soundEnabled]);

  // Persist settings whenever changed
  useEffect(() => {
    saveSettings(state.settings);
  }, [state.settings]);

  // Handle State Machine timers and automated transitions
  useEffect(() => {
    clearTimer();

    if (state.status === "GET_READY") {
      // 800ms GET READY delay
      timerRef.current = setTimeout(() => {
        dispatch({ type: "TICK_COUNTDOWN" });
      }, 800);
    } else if (state.status === "COUNTDOWN") {
      sound.playTick();
      const speed = state.settings.countdownSpeedMs || 700;
      timerRef.current = setTimeout(() => {
        dispatch({ type: "TICK_COUNTDOWN" });
      }, speed);
    } else if (state.status === "REVEAL") {
      sound.playReveal();
      // 600ms reveal transition
      timerRef.current = setTimeout(() => {
        dispatch({ type: "SHOW_RESULT" });
      }, 600);
    } else if (state.status === "RESULT") {
      // Audio feedback & stats persistence
      if (state.lastRoundResult) {
        if (state.lastRoundResult.result === "win") {
          sound.playWin();
          if (state.stats.currentStreak >= 3) {
            try {
              confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
            } catch {
              // Ignore confetti error
            }
          }
        } else if (state.lastRoundResult.result === "loss") {
          sound.playLoss();
        } else {
          sound.playDraw();
        }
      }

      saveStats(state.stats);

      // Auto-advance to next round after 1600ms
      timerRef.current = setTimeout(() => {
        dispatch({ type: "PREPARE_NEXT_ROUND" });
      }, 1600);
    } else if (state.status === "MATCH_COMPLETE") {
      saveStats(state.stats);
      if (state.score.player > state.score.computer) {
        sound.playWin();
        try {
          confetti({ particleCount: 120, spread: 90, origin: { y: 0.5 } });
        } catch {
          // Ignore confetti error
        }
      } else {
        sound.playLoss();
      }
    }

    return () => {
      clearTimer();
    };
  }, [
    state.status,
    state.currentCountdown,
    state.settings.countdownSpeedMs,
    state.lastRoundResult,
    state.stats,
    state.score,
    clearTimer,
  ]);

  const startCameraRequest = useCallback(() => {
    dispatch({ type: "START_CAMERA_REQUEST" });
  }, []);

  const onCameraGranted = useCallback(() => {
    dispatch({ type: "CAMERA_GRANTED" });
  }, []);

  const onCameraDenied = useCallback((msg?: string) => {
    dispatch({ type: "CAMERA_DENIED", message: msg });
  }, []);

  const useFallbackControls = useCallback(() => {
    dispatch({ type: "USE_FALLBACK_CONTROLS" });
  }, []);

  const startGame = useCallback(() => {
    dispatch({ type: "START_GAME" });
  }, []);

  const makePlayerMove = useCallback(
    (move: Move) => {
      sound.playCapture();
      dispatch({ type: "CAPTURE_GESTURE", gesture: move });
    },
    []
  );

  const restartMatch = useCallback(() => {
    dispatch({ type: "RESTART_MATCH" });
  }, []);

  const setGameMode = useCallback((mode: GameMode) => {
    dispatch({ type: "SET_MODE", mode });
  }, []);

  const updateSettings = useCallback((newSettings: Partial<GameSettings>) => {
    dispatch({ type: "UPDATE_SETTINGS", settings: newSettings });
  }, []);

  const resetAllStats = useCallback(() => {
    const fresh = clearLocalStorageStats();
    dispatch({ type: "CLEAR_STATS" });
  }, []);

  return {
    state,
    startCameraRequest,
    onCameraGranted,
    onCameraDenied,
    useFallbackControls,
    startGame,
    makePlayerMove,
    restartMatch,
    setGameMode,
    updateSettings,
    resetAllStats,
  };
}
