# RPS AI — Product Requirements Document

**Product:** RPS AI (Webcam Rock Paper Scissors)
**Platform:** Browser (desktop first, responsive to mobile widths)
**Status:** Draft v1.0, derived from *RPS AI — Complete Product and Implementation Plan*
**Items marked "(proposed)"** are not in the source plan and need confirmation.

---

## 1. Overview

RPS AI is a polished browser game where the player's hand is the controller. Using local webcam hand tracking, the game detects Rock, Paper or Scissors in real time, reveals the computer's pre-selected move at the same instant, scores the round, and moves straight into the next one.

> **One-line spec:** A browser game that uses local webcam hand tracking to detect Rock, Paper or Scissors, synchronizes it with a pre-selected randomized computer move, reveals both simultaneously, updates a live scoreboard and streak, and rolls into the next round through a responsive light-theme UI.

**Positioning:** *"Play Rock Paper Scissors with your hands — live, simultaneous, and camera-powered."* The experience is the product; the AI opponent is not the differentiator.

## 2. Problem & Opportunity

Webcam gesture demos usually feel like image classifiers: submit a frame, get a label. Players don't feel like they are playing an opponent. RPS AI closes that gap by making the **game loop** (countdown, lock, simultaneous reveal, result) fast, fair and satisfying, with gesture recognition as invisible infrastructure.

## 3. Goals & Non-Goals

### Goals
1. The first 30 seconds feel magical: camera, hand, countdown, gesture, reveal, result, "Again?".
2. Landing page to first round in **under 15 seconds**.
3. The player never feels the computer waited to see their move.
4. Recognition errors never punish the player.
5. Fully playable without a camera (button fallback).
6. Camera data never leaves the device.

### Non-Goals (MVP)
- Accounts, cloud stats, leaderboards, tournaments
- Multiplayer
- Adaptive or pattern-reading AI (MVP uses uniform randomness)
- Custom ML model training
- Achievements, daily challenges, themes, AI personalities

## 4. Target Users

- Casual players who want a quick, fun, physical browser game
- People trying webcam/AI experiences on a laptop or desktop
- Players who need or prefer non-camera input (accessibility, camera denied, mobile)

## 5. Success Metrics

| Metric | Definition |
|---|---|
| **Valid gesture rate (primary technical metric)** | % of rounds with a valid gesture during the capture window |
| Activation | % of users who start their first round |
| Camera success | % of users who successfully enable the camera |
| Gesture success / failure | % of rounds with a valid gesture vs. returning UNKNOWN |
| Session length | Average rounds played per session |
| Replay rate | % of users who start another match |
| Time to first round | Target < 15 s |

*Numeric targets for the ratio metrics are not set in the source plan (proposed: agree on targets before launch).*

## 6. Scope

### Must Have (MVP)
Webcam permission · live video · hand tracking · R/P/S recognition · stable detection · random computer move · countdown · simultaneous reveal · win/loss/draw logic · scoreboard · round history · restart · button fallback · light responsive UI

### Should Have
Streaks · sound · animations · local statistics · match modes

### Later
Adaptive AI · challenges · achievements · leaderboards · multiplayer · accounts · cloud stats · tournaments

## 7. Core User Flow

1. Open site, see landing UI ("Play with your hand").
2. Allow camera (or choose Play Without Camera).
3. Camera check, show one hand.
4. "Get ready", then 3…2…1.
5. Player gesture is locked at capture.
6. Both moves revealed simultaneously.
7. WIN / LOSS / DRAW shown; score, streak, history update.
8. Next round starts automatically, or Match Complete, then Play Again.

## 8. Functional Requirements

### 8.1 Game Modes
| ID | Requirement |
|---|---|
| GM-1 | **Quick Match** (default): first to 5 wins; draws don't count; restart anytime. |
| GM-2 | **Best of 3**: first to 2 round wins. |
| GM-3 | **Best of 5**: first to 3 round wins (recommended competitive mode). |
| GM-4 | **Endless**: no limit; tracks rounds, wins, losses, draws, win rate, current and best streak. |
| GM-5 | **Challenge Mode** *(Later)*: randomized goals, e.g. "Win 3 in a row", "5 points without a draw", "70% win rate over 10 rounds". |

### 8.2 Round Flow & State Machine
| ID | Requirement |
|---|---|
| RF-1 | Gameplay is driven by an explicit finite state machine, not scattered booleans. |
| RF-2 | States: `IDLE → CAMERA_REQUEST → CAMERA_READY → GET_READY → COUNTDOWN → CAPTURE → REVEAL → RESULT → NEXT_ROUND`, plus `MATCH_COMPLETE` and `ERROR`. |
| RF-3 | Current state must always be visible to the player (GET READY, COUNTDOWN, LOCKED, REVEAL, RESULT). |
| RF-4 | Default timings (all configurable): Get Ready 800 ms · Countdown 3/2/1 at 700 ms each · Capture window 500–800 ms (default 700) · Reveal 600 ms · Result 1200–1800 ms (default 1400) · Next round automatic. |
| RF-5 | Timing variety (shorter "quick rounds", varied countdown) is allowed, but the player must always understand **when the gesture will be captured**. |

### 8.3 Fairness & Simultaneous Reveal
| ID | Requirement |
|---|---|
| FR-1 | The computer move is selected at round start, stored privately, and never shown before REVEAL. |
| FR-2 | The player's move is locked at CAPTURE from the stable gesture. |
| FR-3 | The result is computed only after both moves are fixed, then both are revealed at once. |
| FR-4 | Uniform random selection (1/3 each); use `crypto.getRandomValues` where practical. |

### 8.4 Result, Scoring, Streaks
| ID | Requirement |
|---|---|
| SC-1 | Result is a deterministic engine function returning `win`, `loss`, `draw` or `invalid`. UI components never compute results. |
| SC-2 | Match score: Win +1, Draw 0, Loss 0. |
| SC-3 | XP (kept separate from match score): Win +100, Draw +25, Loss +0, 3-win streak bonus +50, 5-win streak bonus +100. |
| SC-4 | Track `currentStreak` and `bestStreak`; a loss resets the current streak. Streak animation is subtle. |
| SC-5 | Scoreboard shows You vs AI score and streak; secondary stats: rounds, wins, losses, draws, win rate, best streak. |
| SC-6 | Round history shows recent rounds as compact icons with result; it must not dominate the screen. |
| SC-7 | Match Complete screen shows final score, outcome, win rate, best streak, total rounds, Play Again and Main Menu. |

### 8.5 Gesture Recognition
| ID | Requirement |
|---|---|
| GR-1 | Camera via `getUserMedia()`; hand tracking via MediaPipe Tasks Hand Landmarker; all processing runs locally in the browser. |
| GR-2 | Deterministic landmark rules, no custom ML pipeline for v1. **Rock:** four fingers folded, thumb folded or mostly folded. **Paper:** four fingers extended, open palm. **Scissors:** index and middle extended, ring and pinky folded. |
| GR-3 | Output is `ROCK`, `PAPER`, `SCISSORS` or `UNKNOWN`. Uncertain gestures are never forced into R/P/S. |
| GR-4 | UNKNOWN when: no hand, hand too far, low confidence, ambiguous orientation, motion blur, or unexpected multiple hands. |
| GR-5 | Temporal smoothing: 5–10 recent frames; confidence below 0.75 → UNKNOWN; a gesture is stable if it appears in ≥ 70% of recent frames; minimum stable duration applies. |
| GR-6 | Multiple hands: MVP may use the largest / highest-confidence hand; preferred behavior is to show "Please show one hand" for competitive fairness. |
| GR-7 | Failure to detect a gesture is **never** counted as a loss. Show "No clear gesture detected" with **Try Again** and **Use Buttons**. |

### 8.6 Camera, Permission & Onboarding
| ID | Requirement |
|---|---|
| CP-1 | Pre-permission screen: "RPS AI needs camera access to detect your hand gestures. Your video is processed locally." with **Enable Camera**. |
| CP-2 | If denied: "Camera access is unavailable. You can still play using buttons." with **Play Without Camera**. The user is never stuck. |
| CP-3 | Onboarding (under 20 s): allow camera, show one hand, make R/P/S, beat the AI; then a camera check (connected, hand visible, lighting, detection ready). |
| CP-4 | Technical metrics (confidence, lighting) stay out of the primary UI; available only in diagnostics. |
| CP-5 | Lost camera stream: auto-recover once, then show manual retry. |

### 8.7 Fallback & Keyboard Controls
| ID | Requirement |
|---|---|
| FB-1 | On-screen Rock / Paper / Scissors buttons work at all times (accessibility, camera-denied, mobile, testing). |
| FB-2 | Keyboard: **R** Rock · **P** Paper · **S** Scissors · **Space** Start/Next · **Esc** Pause/Exit. |

### 8.8 Settings & Persistence
| ID | Requirement |
|---|---|
| ST-1 | Settings: camera selection, game mode, difficulty, sound on/off, gesture overlay on/off, countdown speed, Reset Stats. No raw ML configuration exposed. |
| ST-2 | Persist locally: best streak, total wins/losses/draws, XP, preferred settings (e.g. `localStorage` key `rps-ai-stats`). Never store webcam images. |

### 8.9 Sound
Optional and never required for gameplay. Countdown tick, reveal impact, win chime, loss low tone, draw click. On/off toggle; must respect browser autoplay restrictions.

### 8.10 Debug Mode
Optional panel (FPS, detection FPS, hand count, gesture, confidence, model/camera status, game state), visible only with `?debug=true` or a dev shortcut.

## 9. UX & Visual Design Requirements

- **Feel:** clean, modern, bright, playful, premium, fast, minimal, mobile-friendly. Avoid heavy gradients, excess glassmorphism, dark gaming aesthetics, neon, crowded dashboards.
- **Theme:** light. White cards on a very light background, rounded corners, subtle shadows; color used semantically (green success, red danger, amber warning, blue/violet accent).
- **Design tokens (starting point, tune in visual QA):** background `#f7f8fc`, surface `#ffffff`, text `#171923` / `#667085`, border `#e4e7ec`, accent `#635bff`, success `#16a34a`, danger `#dc2626`, warning `#d97706`; radii 10/16/24 px; card shadow `0 10px 30px rgba(16,24,40,0.08)`.
- **Visual hierarchy:** (1) game state, (2) webcam/gesture, (3) countdown, (4) player vs AI moves, (5) score, (6) result, (7) history, (8) stats, (9) settings. The player should know what to do within one second.
- **Webcam card** is the primary element: pulsing "● CAMERA LIVE" indicator, subtle hand skeleton/landmark overlay, gesture status.
- **Pre-capture feedback:** show "Your hand is ready ✓" then "LOCKED" rather than the raw detected move during countdown, to preserve suspense.
- **Reveal:** `YOU ? AI` becomes `YOU VS AI` with both moves; scale, slight bounce, icon rotation, glow; confetti for milestones. Keep animations short.
- **Result feedback:** win = short bounce, loss = small shake, draw = soft pulse; randomized short messages per outcome.
- **Mobile layout order:** header, score, webcam, countdown, result, history. No side-by-side large cards on narrow screens.
- **Loading/empty states:** "Preparing hand detection…" with progress, "Starting camera…", "Show one hand inside the frame", "You're ready!".
- **Anti-patterns:** don't look like an ML dashboard; don't over-engineer the AI; don't punish recognition errors; don't hide game state.

## 10. Non-Functional Requirements

| Area | Requirement |
|---|---|
| **Performance** | UI ~60 FPS; gesture processing 15–30 FPS (30+ FPS target); < 100 ms perceived detection latency. Use `requestAnimationFrame` for rendering. |
| **React efficiency** | Camera, model and landmarks live in refs; model is a singleton/memoized; only stable gesture and game result go into React state; no per-landmark or per-frame state updates. |
| **Privacy** | No image upload, no server-side video processing, no storage of frames, no unnecessary recording. Stop all media tracks on exit or unmount. Product promise: "Your camera feed stays on your device." |
| **Security** | HTTPS in production (camera requires a secure context); request no unnecessary permissions. |
| **Accessibility** | Camera is never the only input; keyboard controls; basic accessibility implemented. |
| **Compatibility** | Chrome, Edge, Safari, Firefox. Test desktop webcam, laptop webcam, external USB webcam, and mobile browsers where supported. |
| **Offline** | Works offline after assets load (local processing). |

## 11. Technical Approach

**Stack:** Next.js (or Vite + React for a standalone game), TypeScript, Tailwind CSS, Framer Motion, MediaPipe Hand Landmarker, WebRTC, Canvas 2D. State via `useReducer` (Zustand if it grows; avoid Redux).

**Pipeline:** Webcam → `getUserMedia()` → video frame → hand landmarks → gesture classifier → smoother → game engine → UI + score.

**Engineering principles**
1. Separate vision from gameplay. Vision reports "Paper, 92%"; the game records "player selected Paper".
2. Animations respond to state and never drive it.
3. Fail gracefully: Unknown ≠ loss; camera failure ≠ game over.
4. Keep the loop fast; minimize instructions.
5. Build the simplest version that feels magical.

**Module layout:** `game/` (engine, scoring, randomizer, challenges, state), `vision/` (hand tracker, classifier, smoother, landmark utils), `hooks/` (`useCamera`, `useHandTracking`, `useGame`), `components/` (GameBoard, WebcamView, HandOverlay, ScoreBoard, Countdown, Reveal, RoundHistory, MatchComplete, CameraPermission, SettingsPanel), `types/`, `utils/`.

**Data model**
```ts
type Move = "rock" | "paper" | "scissors";
type RoundResult = "win" | "loss" | "draw" | "invalid";
interface Round { id: string; roundNumber: number; playerMove: Move | null;
  computerMove: Move; result: RoundResult; timestamp: number; confidence?: number; }
interface Score { player: number; computer: number; }
interface GameStats { rounds: number; wins: number; losses: number; draws: number;
  currentStreak: number; bestStreak: number; xp: number; }
```

**API boundaries (keeps the vision model swappable)**
```ts
interface GestureDetector { initialize(): Promise<void>;
  detect(video: HTMLVideoElement): GestureDetection; dispose(): void; }
interface GameEngine { startRound(): void; capturePlayerMove(move: Move): void;
  resolveRound(): Round; reset(): void; }
```

## 12. Error Handling

| Condition | Behavior |
|---|---|
| Camera unavailable / denied | Show button fallback; "Play Without Camera" |
| Model fails to load | "Gesture detection could not be loaded." with **Retry** / **Play With Buttons** |
| Browser unsupported | Concise compatibility message |
| Low confidence | Ask the player to reposition their hand |
| Camera stream lost | Auto-recover once, then manual retry |
| No / unclear gesture | "No clear gesture detected", Try Again / Use Buttons; not a loss |

## 13. Analytics

Anonymous events only: `game_started`, `camera_enabled`, `camera_denied`, `round_started`, `round_completed`, `gesture_unknown`, `match_completed`, `button_fallback_used`. Never record camera frames, face or hand images, or personal identity information.

## 14. Roadmap & Milestones

Build in this order; do not build everything at once.

| Phase | Focus | Deliverable |
|---|---|---|
| 1 | Setup: project, TypeScript, Tailwind, layout, tokens, types, state machine | App launches with static game UI |
| 2 | Webcam: permission, video, denial, stop, errors | Stable live preview |
| 3 | Hand tracking: model, landmarks, overlay, perf measurement | Landmarks visible in real time |
| 4 | Gesture classification: rules, UNKNOWN, confidence, smoothing | Stable gesture detection |
| 5 | Game engine: state machine, AI move, countdown, capture, result, score, streak, match end | Playable RPS game |
| 6 | Premium UI: layout, animations, scoreboard, history, result, match complete, responsive | Polished consumer game |
| 7 | Sound & polish: sounds, controls, haptics where available, tuning | More immersive gameplay |
| 8 | QA and performance optimization | Release candidate |

**Post-MVP:** adaptive AI (Level 2: transparent, difficulty-mode weighting; Level 3: optional pattern challenge) · challenges · achievements · daily challenge · leaderboard (only with accounts and anti-cheat) · themes · AI personalities · multiplayer (WebSocket / Socket.IO / Supabase Realtime / Firebase). Multiplayer only after single-player is reliable.

## 15. QA & Test Matrix

| Scenario | Expected result |
|---|---|
| Camera allowed | Video starts |
| Camera denied | Button fallback appears |
| No hand | UNKNOWN + instruction |
| Rock / Paper / Scissors shown | Correct gesture detected |
| Gesture changes rapidly | Smoothing prevents flicker |
| Two hands | Warning / controlled behavior |
| AI Rock + Player Rock | Draw |
| AI Rock + Player Paper | Player win |
| AI Rock + Player Scissors | Player loss |
| Player reaches target | Match complete |
| Browser refresh | Stats persist |
| Camera disconnect | Recovery / error UI |
| Model fails | Retry / fallback |
| Mobile screen | Responsive layout |

Also test: fast movement, poor lighting, low confidence, match restart, rapid clicking.

## 16. Definition of Done (MVP)

- [ ] Webcam opens reliably; permission errors handled
- [ ] One hand detected; Rock, Paper, Scissors each detected reliably
- [ ] Unknown gestures never create false results
- [ ] Detection is temporally smoothed
- [ ] AI move generated before player reveal; countdown works
- [ ] Player move locked at capture; both moves reveal simultaneously
- [ ] Result, score and streak calculations correct
- [ ] Round history, match completion and restart work
- [ ] Camera fallback controls work
- [ ] UI works on desktop and mobile widths
- [ ] No camera frame uploaded; camera stream stops when appropriate
- [ ] Performance remains smooth; no critical console errors
- [ ] Basic accessibility implemented

## 17. Risks & Open Questions *(proposed, not in source plan)*

**Risks**
- Recognition accuracy varies with lighting, camera quality, hand orientation and thumb position (Rock vs. Paper edge cases).
- Model download size and load time could break the 15-second first-round target.
- Mobile browser support for MediaPipe/WebGL varies.
- Capture-window timing may feel unfair if the player's gesture is still changing at lock time.

**Open questions**
1. Target values for gesture success rate and replay rate?
2. Multiple hands: block the round (preferred) or use the dominant hand for MVP?
3. Vite + React or Next.js for v1?
4. Is XP shown in MVP or held back to "Should Have"?
5. Final brand palette, since tokens above are provisional.

## 18. Strategic Priority

The one critical success condition: **the first 30 seconds must feel magical.** Optimize the loop *Camera → Hand → Countdown → Gesture → Simultaneous AI reveal → Result → Score → "Again?"* first. Build the interaction first, polish the game second, add complexity last.
