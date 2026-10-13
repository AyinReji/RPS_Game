import {
  GameStatus,
  GameMode,
  Move,
  Round,
  Score,
  GameStats,
  GameSettings,
} from "../types/game";
import { resolveRound } from "./scoring";
import { chooseComputerMove } from "./randomizer";
import { DEFAULT_STATS, DEFAULT_SETTINGS } from "../utils/storage";

export interface GameState {
  status: GameStatus;
  mode: GameMode;
  roundNumber: number;
  currentCountdown: number; // 3, 2, 1, 0
  playerMove: Move | null;
  computerMove: Move;
  lastRoundResult: Round | null;
  score: Score;
  stats: GameStats;
  history: Round[];
  settings: GameSettings;
  errorMessage: string | null;
  hasCameraPermission: boolean;
  isUsingFallbackControls: boolean;
}

export type GameAction =
  | { type: "START_CAMERA_REQUEST" }
  | { type: "CAMERA_GRANTED" }
  | { type: "CAMERA_DENIED"; message?: string }
  | { type: "USE_FALLBACK_CONTROLS" }
  | { type: "START_GAME" }
  | { type: "TICK_COUNTDOWN" }
  | { type: "CAPTURE_GESTURE"; gesture: Move | null }
  | { type: "REVEAL_MOVES" }
  | { type: "SHOW_RESULT" }
  | { type: "PREPARE_NEXT_ROUND" }
  | { type: "RESTART_MATCH" }
  | { type: "SET_MODE"; mode: GameMode }
  | { type: "UPDATE_SETTINGS"; settings: Partial<GameSettings> }
  | { type: "LOAD_INITIAL_STATS"; stats: GameStats }
  | { type: "CLEAR_STATS" }
  | { type: "SET_ERROR"; message: string };

export function getMatchTargetWins(mode: GameMode): number | null {
  switch (mode) {
    case "quick":
      return 5;
    case "best_of_3":
      return 2;
    case "best_of_5":
      return 3;
    case "endless":
      return null;
  }
}

export function initialGameState(initialSettings: GameSettings = DEFAULT_SETTINGS): GameState {
  return {
    status: "IDLE",
    mode: initialSettings.mode || "quick",
    roundNumber: 1,
    currentCountdown: 3,
    playerMove: null,
    computerMove: chooseComputerMove(),
    lastRoundResult: null,
    score: { player: 0, computer: 0 },
    stats: DEFAULT_STATS,
    history: [],
    settings: initialSettings,
    errorMessage: null,
    hasCameraPermission: false,
    isUsingFallbackControls: false,
  };
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "START_CAMERA_REQUEST":
      return {
        ...state,
        status: "CAMERA_REQUEST",
        errorMessage: null,
      };

    case "CAMERA_GRANTED":
      return {
        ...state,
        status: "CAMERA_READY",
        hasCameraPermission: true,
        errorMessage: null,
      };

    case "CAMERA_DENIED":
      return {
        ...state,
        status: "IDLE",
        hasCameraPermission: false,
        isUsingFallbackControls: true,
        errorMessage: action.message || "Camera access was denied or unavailable.",
      };

    case "USE_FALLBACK_CONTROLS":
      return {
        ...state,
        isUsingFallbackControls: true,
        status: state.status === "IDLE" ? "CAMERA_READY" : state.status,
      };

    case "START_GAME": {
      const nextComputerMove = chooseComputerMove();
      return {
        ...state,
        status: "GET_READY",
        currentCountdown: 3,
        playerMove: null,
        computerMove: nextComputerMove,
        errorMessage: null,
      };
    }

    case "TICK_COUNTDOWN": {
      if (state.currentCountdown > 1) {
        return {
          ...state,
          status: "COUNTDOWN",
          currentCountdown: state.currentCountdown - 1,
        };
      }
      return {
        ...state,
        status: "CAPTURE",
        currentCountdown: 0,
      };
    }

    case "CAPTURE_GESTURE": {
      // Generate computer move at capture time (simultaneous reveal)
      const aiMove = chooseComputerMove();
      console.log(`[GameState] CAPTURE: player=${action.gesture}, computer=${aiMove}`);
      return {
        ...state,
        playerMove: action.gesture,
        computerMove: aiMove,
        status: "REVEAL",
      };
    }

    case "SHOW_RESULT": {
      const result = resolveRound(state.playerMove, state.computerMove);
      const newRound: Round = {
        id: `${Date.now()}-${state.roundNumber}`,
        roundNumber: state.roundNumber,
        playerMove: state.playerMove,
        computerMove: state.computerMove,
        result,
        timestamp: Date.now(),
      };

      const newScore = { ...state.score };
      if (result === "win") newScore.player += 1;
      if (result === "loss") newScore.computer += 1;

      // Update streaks & XP
      let newCurrentStreak = state.stats.currentStreak;
      if (result === "win") {
        newCurrentStreak += 1;
      } else if (result === "loss") {
        newCurrentStreak = 0;
      }

      const newBestStreak = Math.max(state.stats.bestStreak, newCurrentStreak);

      let xpGained = 0;
      if (result === "win") xpGained += 100;
      if (result === "draw") xpGained += 25;
      if (result === "win" && newCurrentStreak === 3) xpGained += 50;
      if (result === "win" && newCurrentStreak === 5) xpGained += 100;

      const newStats: GameStats = {
        rounds: state.stats.rounds + 1,
        wins: state.stats.wins + (result === "win" ? 1 : 0),
        losses: state.stats.losses + (result === "loss" ? 1 : 0),
        draws: state.stats.draws + (result === "draw" ? 1 : 0),
        currentStreak: newCurrentStreak,
        bestStreak: newBestStreak,
        xp: state.stats.xp + xpGained,
      };

      const newHistory = [newRound, ...state.history];

      // Check match target completion
      const targetWins = getMatchTargetWins(state.mode);
      const isMatchComplete =
        targetWins !== null &&
        (newScore.player >= targetWins || newScore.computer >= targetWins);

      return {
        ...state,
        status: isMatchComplete ? "MATCH_COMPLETE" : "RESULT",
        lastRoundResult: newRound,
        score: newScore,
        stats: newStats,
        history: newHistory,
      };
    }

    case "PREPARE_NEXT_ROUND": {
      const nextComputerMove = chooseComputerMove();
      return {
        ...state,
        status: "GET_READY",
        roundNumber: state.roundNumber + 1,
        currentCountdown: 3,
        playerMove: null,
        computerMove: nextComputerMove,
      };
    }

    case "RESTART_MATCH": {
      const nextComputerMove = chooseComputerMove();
      return {
        ...state,
        status: "CAMERA_READY",
        roundNumber: 1,
        currentCountdown: 3,
        playerMove: null,
        computerMove: nextComputerMove,
        lastRoundResult: null,
        score: { player: 0, computer: 0 },
      };
    }

    case "SET_MODE":
      return {
        ...state,
        mode: action.mode,
        settings: { ...state.settings, mode: action.mode },
        roundNumber: 1,
        score: { player: 0, computer: 0 },
        lastRoundResult: null,
        status: "CAMERA_READY",
      };

    case "UPDATE_SETTINGS":
      return {
        ...state,
        settings: { ...state.settings, ...action.settings },
        ...(action.settings.mode ? { mode: action.settings.mode } : {}),
      };

    case "LOAD_INITIAL_STATS":
      return {
        ...state,
        stats: action.stats,
      };

    case "CLEAR_STATS":
      return {
        ...state,
        stats: DEFAULT_STATS,
      };

    case "SET_ERROR":
      return {
        ...state,
        status: "ERROR",
        errorMessage: action.message,
      };

    default:
      return state;
  }
}
