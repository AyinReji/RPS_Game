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
 * Checks if a specific finger (Tip, DIP, PIP, MCP) is extended.
 * In an extended finger, the tip extends outwards away from the wrist and MCP joint.
 * In a curled finger (fist), the tip curls backwards towards the MCP/palm and wrist.
 */
function isFingerExtended(
  tip: Landmark,
  dip: Landmark,
  pip: Landmark,
  mcp: Landmark,
  wrist: Landmark
): boolean {
  const dTipWrist = distance(tip, wrist);
  const dPipWrist = distance(pip, wrist);
  const dDipWrist = distance(dip, wrist);

  const dTipMcp = distance(tip, mcp);
  const dPipMcp = distance(pip, mcp);
  const dDipMcp = distance(dip, mcp);

  // A finger is extended if:
  // 1. Tip is further from wrist than PIP joint and DIP joint
  // 2. Tip is further from MCP joint than PIP and DIP joints
  const extendedFromWrist = dTipWrist > dPipWrist * 1.05 && dTipWrist > dDipWrist;
  const extendedFromMcp = dTipMcp > dPipMcp * 1.15 && dTipMcp > dDipMcp * 0.95;

  return extendedFromWrist && extendedFromMcp;
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

  // Index (8: Tip, 7: DIP, 6: PIP, 5: MCP)
  const indexExtended = isFingerExtended(
    landmarks[8],
    landmarks[7],
    landmarks[6],
    landmarks[5],
    wrist
  );

  // Middle (12: Tip, 11: DIP, 10: PIP, 9: MCP)
  const middleExtended = isFingerExtended(
    landmarks[12],
    landmarks[11],
    landmarks[10],
    landmarks[9],
    wrist
  );

  // Ring (16: Tip, 15: DIP, 14: PIP, 13: MCP)
  const ringExtended = isFingerExtended(
    landmarks[16],
    landmarks[15],
    landmarks[14],
    landmarks[13],
    wrist
  );

  // Pinky (20: Tip, 19: DIP, 18: PIP, 17: MCP)
  const pinkyExtended = isFingerExtended(
    landmarks[20],
    landmarks[19],
    landmarks[18],
    landmarks[17],
    wrist
  );

  // Thumb (4: Tip, 3: IP, 2: MCP, 1: CMC, 17: Pinky MCP)
  const thumbTipToPinkyMcp = distance(landmarks[4], landmarks[17]);
  const thumbIpToPinkyMcp = distance(landmarks[3], landmarks[17]);
  const thumbTipToWrist = distance(landmarks[4], wrist);
  const thumbMcpToWrist = distance(landmarks[2], wrist);

  const thumbExtended =
    thumbTipToPinkyMcp > thumbIpToPinkyMcp * 1.15 && thumbTipToWrist > thumbMcpToWrist * 1.1;

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
