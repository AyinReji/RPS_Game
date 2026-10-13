import { Landmark } from "../types/game";

export interface FingerStates {
  thumbExtended: boolean;
  indexExtended: boolean;
  middleExtended: boolean;
  ringExtended: boolean;
  pinkyExtended: boolean;
  extendedCount: number;
}

export function distance(a: Landmark, b: Landmark): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = (a.z || 0) - (b.z || 0);
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Checks if a specific finger (Tip, PIP, MCP) is extended relative to the wrist and MCP joint.
 */
function isFingerExtended(
  tip: Landmark,
  pip: Landmark,
  mcp: Landmark,
  wrist: Landmark
): boolean {
  const tipWristDist = distance(tip, wrist);
  const pipWristDist = distance(pip, wrist);

  const tipMcpDist = distance(tip, mcp);
  const pipMcpDist = distance(pip, mcp);

  // A finger is extended if tip is significantly further from wrist than PIP,
  // OR significantly further from MCP than PIP is from MCP.
  // Using 1.15x threshold to avoid false positives on loosely curled fingers
  // while still detecting genuinely extended fingers reliably.
  return tipWristDist > pipWristDist * 1.15 || tipMcpDist > pipMcpDist * 1.15;
}

/**
 * Analyzes finger extension states based on MediaPipe 21 3D hand landmarks.
 */
export function getFingerStates(landmarks: Landmark[]): FingerStates {
  if (!landmarks || landmarks.length < 21) {
    return {
      thumbExtended: false,
      indexExtended: false,
      middleExtended: false,
      ringExtended: false,
      pinkyExtended: false,
      extendedCount: 0,
    };
  }

  const wrist = landmarks[0];

  // Index (8: Tip, 6: PIP, 5: MCP)
  const indexExtended = isFingerExtended(landmarks[8], landmarks[6], landmarks[5], wrist);

  // Middle (12: Tip, 10: PIP, 9: MCP)
  const middleExtended = isFingerExtended(landmarks[12], landmarks[10], landmarks[9], wrist);

  // Ring (16: Tip, 14: PIP, 13: MCP)
  const ringExtended = isFingerExtended(landmarks[16], landmarks[14], landmarks[13], wrist);

  // Pinky (20: Tip, 18: PIP, 17: MCP)
  const pinkyExtended = isFingerExtended(landmarks[20], landmarks[18], landmarks[17], wrist);

  // Thumb (4: Tip, 3: IP, 2: MCP, 17: Pinky MCP)
  const thumbTipToPinkyMcp = distance(landmarks[4], landmarks[17]);
  const thumbIpToPinkyMcp = distance(landmarks[3], landmarks[17]);
  const thumbExtended = thumbTipToPinkyMcp > thumbIpToPinkyMcp * 1.05;

  let extendedCount = 0;
  if (indexExtended) extendedCount++;
  if (middleExtended) extendedCount++;
  if (ringExtended) extendedCount++;
  if (pinkyExtended) extendedCount++;

  return {
    thumbExtended,
    indexExtended,
    middleExtended,
    ringExtended,
    pinkyExtended,
    extendedCount,
  };
}
