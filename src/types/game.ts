export type Move = "rock" | "paper" | "scissors";
export type Gesture = Move | "unknown";
export type RoundResult = "win" | "loss" | "draw" | "invalid";
export type GameMode = "quick" | "best_of_3" | "best_of_5" | "endless";

export type GameStatus =
  | "IDLE"
  | "CAMERA_REQUEST"
  | "CAMERA_READY"
  | "GET_READY"
  | "COUNTDOWN"
  | "CAPTURE"
  | "REVEAL"
  | "RESULT"
  | "NEXT_ROUND"
  | "MATCH_COMPLETE"
  | "ERROR";

export interface Landmark {
  x: number;
  y: number;
  z: number;
}

export interface GestureDetection {
  gesture: Gesture;
  confidence: number;
  landmarks: Landmark[][] | null;
  handCount: number;
  rawGesture?: string;
}

export interface Round {
  id: string;
  roundNumber: number;
  playerMove: Move | null;
  computerMove: Move;
  result: RoundResult;
  timestamp: number;
  confidence?: number;
}

export interface Score {
  player: number;
  computer: number;
}

export interface GameStats {
  rounds: number;
  wins: number;
  losses: number;
  draws: number;
  currentStreak: number;
  bestStreak: number;
  xp: number;
}

export interface GameSettings {
  cameraDeviceId: string;
  mode: GameMode;
  soundEnabled: boolean;
  overlayEnabled: boolean;
  countdownSpeedMs: number;
  debugMode: boolean;
}
