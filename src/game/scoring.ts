import { Move, RoundResult } from "../types/game";

/**
 * Pure deterministic resolution function for Rock Paper Scissors round.
 * Rock beats Scissors
 * Scissors beats Paper
 * Paper beats Rock
 * Equal moves result in Draw
 */
export function resolveRound(
  playerMove: Move | null,
  computerMove: Move
): RoundResult {
  if (!playerMove) {
    return "invalid";
  }

  if (playerMove === computerMove) {
    return "draw";
  }

  if (
    (playerMove === "rock" && computerMove === "scissors") ||
    (playerMove === "paper" && computerMove === "rock") ||
    (playerMove === "scissors" && computerMove === "paper")
  ) {
    return "win";
  }

  return "loss";
}
