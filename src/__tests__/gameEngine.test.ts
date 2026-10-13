import { describe, it, expect } from "vitest";
import { resolveRound } from "../game/scoring";
import { gameReducer, initialGameState } from "../game/gameState";
import { Move, RoundResult } from "../types/game";
import { GestureSmoother } from "../vision/gestureSmoother";

describe("Rock Paper Scissors Game Engine", () => {
  describe("resolveRound - All 9 combinations", () => {
    const cases: Array<[Move, Move, RoundResult]> = [
      ["rock", "rock", "draw"],
      ["rock", "paper", "loss"],
      ["rock", "scissors", "win"],
      ["paper", "rock", "win"],
      ["paper", "paper", "draw"],
      ["paper", "scissors", "loss"],
      ["scissors", "rock", "loss"],
      ["scissors", "paper", "win"],
      ["scissors", "scissors", "draw"],
    ];

    cases.forEach(([player, computer, expected]) => {
      it(`Player: ${player} vs Computer: ${computer} should resolve to ${expected}`, () => {
        const result = resolveRound(player, computer);
        expect(result).toBe(expected);
      });
    });

    it("Null player move resolves to invalid", () => {
      expect(resolveRound(null, "rock")).toBe("invalid");
    });
  });

  describe("gameReducer state transitions", () => {
    it("START_GAME transitions status to GET_READY and resets countdown", () => {
      const state = initialGameState();
      const nextState = gameReducer(state, { type: "START_GAME" });
      expect(nextState.status).toBe("GET_READY");
      expect(nextState.currentCountdown).toBe(3);
    });

    it("TICK_COUNTDOWN decrements countdown from 3 to 2, 1, and 0 (CAPTURE)", () => {
      let state = initialGameState();
      state = gameReducer(state, { type: "START_GAME" });

      state = gameReducer(state, { type: "TICK_COUNTDOWN" }); // 3 -> 2
      expect(state.status).toBe("COUNTDOWN");
      expect(state.currentCountdown).toBe(2);

      state = gameReducer(state, { type: "TICK_COUNTDOWN" }); // 2 -> 1
      expect(state.status).toBe("COUNTDOWN");
      expect(state.currentCountdown).toBe(1);

      state = gameReducer(state, { type: "TICK_COUNTDOWN" }); // 1 -> 0 (CAPTURE)
      expect(state.status).toBe("CAPTURE");
      expect(state.currentCountdown).toBe(0);
    });

    it("CAPTURE_GESTURE locks player move and transitions to REVEAL", () => {
      let state = initialGameState();
      state = gameReducer(state, { type: "CAPTURE_GESTURE", gesture: "rock" });
      expect(state.playerMove).toBe("rock");
      expect(state.status).toBe("REVEAL");
    });

    it("SHOW_RESULT calculates outcome, updates score, streaks and XP", () => {
      let state = initialGameState();
      state.playerMove = "paper";
      state.computerMove = "rock"; // paper beats rock -> WIN

      const nextState = gameReducer(state, { type: "SHOW_RESULT" });
      expect(nextState.score.player).toBe(1);
      expect(nextState.score.computer).toBe(0);
      expect(nextState.stats.wins).toBe(1);
      expect(nextState.stats.currentStreak).toBe(1);
      expect(nextState.stats.xp).toBe(100);
    });
  });

  describe("GestureSmoother", () => {
    it("returns unknown for empty buffer", () => {
      const smoother = new GestureSmoother(5);
      expect(smoother.getStableGesture()).toBe("unknown");
    });

    it("requires at least 2 consistent frames to establish gesture and ignores single noisy frames", () => {
      const smoother = new GestureSmoother(5);

      // Single frame does not immediately lock in
      expect(smoother.addDetection({ gesture: "scissors", confidence: 0.95 })).toBe("unknown");

      // Second frame locks in scissors
      expect(smoother.addDetection({ gesture: "scissors", confidence: 0.95 })).toBe("scissors");

      // One noisy frame does not immediately break scissors
      expect(smoother.addDetection({ gesture: "rock", confidence: 0.8 })).toBe("scissors");

      // Two consecutive rock frames switch to rock cleanly
      expect(smoother.addDetection({ gesture: "rock", confidence: 0.9 })).toBe("rock");
    });
  });
});
