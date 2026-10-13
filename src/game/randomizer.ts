import { Move } from "../types/game";

const MOVES: Move[] = ["rock", "paper", "scissors"];

/**
 * Returns a cryptographically uniform random computer move.
 * Selected at the beginning of each round before user capture.
 */
export function chooseComputerMove(): Move {
  if (typeof window !== "undefined" && window.crypto && window.crypto.getRandomValues) {
    const array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    const index = array[0] % MOVES.length;
    return MOVES[index];
  }

  const fallbackIndex = Math.floor(Math.random() * MOVES.length);
  return MOVES[fallbackIndex];
}
