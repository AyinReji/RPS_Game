"use client";

import React, { useEffect, useState, useRef } from "react";
import { useGame } from "../hooks/useGame";
import { useCamera } from "../hooks/useCamera";
import { useHandTracking } from "../hooks/useHandTracking";
import { ScoreBoard } from "./ScoreBoard";
import { WebcamView } from "./WebcamView";
import { Countdown } from "./Countdown";
import { Reveal } from "./Reveal";
import { RoundHistory } from "./RoundHistory";
import { MatchComplete } from "./MatchComplete";
import { CameraPermission } from "./CameraPermission";
import { FallbackControls } from "./FallbackControls";
import { SettingsPanel } from "./SettingsPanel";
import { DebugPanel } from "./DebugPanel";
import { Settings, Sparkles, Gamepad2 } from "lucide-react";
import { Move } from "../types/game";

export const GameBoard: React.FC = () => {
  const {
    state,
    startCameraRequest,
    onCameraGranted,
    onCameraDenied,
    useFallbackControls,
    startGame,
    makePlayerMove,
    restartMatch,
    updateSettings,
    resetAllStats,
  } = useGame();

  const {
    videoRef,
    isCameraActive,
    isLoading: isCameraLoading,
    error: cameraError,
    devices,
    startCamera,
    stopCamera,
    switchCamera,
  } = useCamera();

  const {
    detection,
    isModelLoading,
    isModelReady,
    fps,
    detectionFps,
  } = useHandTracking({
    enabled: isCameraActive,
    videoRef,
  });

  const [activeTab, setActiveTab] = useState<"game" | "settings">("game");
  const [isDebugMode, setIsDebugMode] = useState<boolean>(false);
  const lastDetectedMoveRef = useRef<Move | null>(null);

  // Continuously record valid gesture to ensure zero input drops
  useEffect(() => {
    if (
      detection.gesture === "rock" ||
      detection.gesture === "paper" ||
      detection.gesture === "scissors"
    ) {
      lastDetectedMoveRef.current = detection.gesture;
    }
  }, [detection.gesture]);

  // Check URL query parameters for ?debug=true
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("debug") === "true" || state.settings.debugMode) {
        setIsDebugMode(true);
      }
    }
  }, [state.settings.debugMode]);

  // Trigger camera startup when requested
  const handleRequestCamera = async () => {
    startCameraRequest();
    onCameraGranted();
    const success = await startCamera();
    if (!success) {
      onCameraDenied(cameraError || "Camera permission denied.");
    }
  };

  const handleStopCamera = () => {
    stopCamera();
    useFallbackControls();
  };

  // Capture moment gesture locking
  // Gives a 500ms sampling window during CAPTURE to let detection stabilize
  useEffect(() => {
    if (state.status === "GET_READY") {
      lastDetectedMoveRef.current = null;
    } else if (state.status === "CAPTURE") {
      // Check the current gesture immediately
      const currentGesture = detection.gesture;
      if (
        currentGesture === "rock" ||
        currentGesture === "paper" ||
        currentGesture === "scissors"
      ) {
        lastDetectedMoveRef.current = currentGesture;
      }

      // Wait a short window for detection to stabilize, then commit
      const captureTimer = setTimeout(() => {
        const finalGesture = lastDetectedMoveRef.current;
        console.log(
          `[GameBoard] CAPTURE committed: gesture=${finalGesture}, live=${detection.gesture}`
        );
        if (finalGesture) {
          makePlayerMove(finalGesture);
        } else {
          // No gesture detected at all — use whatever is live
          const live = detection.gesture;
          if (live === "rock" || live === "paper" || live === "scissors") {
            makePlayerMove(live);
          } else {
            makePlayerMove(null as any);
          }
        }
      }, 400);

      return () => clearTimeout(captureTimer);
    }
  }, [state.status]); // Only trigger on status change, not on every gesture update

  // Keyboard shortcut listener (Section 28 & PRD 8.7 FB-2)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) {
        return;
      }

      const key = e.key.toLowerCase();

      if (key === " ") {
        e.preventDefault();
        if (state.status === "CAMERA_READY" || state.status === "IDLE" || state.status === "RESULT") {
          startGame();
        } else if (state.status === "COUNTDOWN" || state.status === "GET_READY") {
          restartMatch();
        }
      } else if (key === "r") {
        if (state.status === "CAMERA_READY" || state.status === "IDLE") {
          startGame();
          setTimeout(() => makePlayerMove("rock"), 100);
        } else if (state.status === "CAPTURE" || state.status === "COUNTDOWN" || state.status === "GET_READY") {
          makePlayerMove("rock");
        }
      } else if (key === "p") {
        if (state.status === "CAMERA_READY" || state.status === "IDLE") {
          startGame();
          setTimeout(() => makePlayerMove("paper"), 100);
        } else if (state.status === "CAPTURE" || state.status === "COUNTDOWN" || state.status === "GET_READY") {
          makePlayerMove("paper");
        }
      } else if (key === "s") {
        if (state.status === "CAMERA_READY" || state.status === "IDLE") {
          startGame();
          setTimeout(() => makePlayerMove("scissors"), 100);
        } else if (state.status === "CAPTURE" || state.status === "COUNTDOWN" || state.status === "GET_READY") {
          makePlayerMove("scissors");
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [state.status, startGame, makePlayerMove, restartMatch]);

  return (
    <div className="min-h-screen bg-[#f7f8fc] text-[#171923] flex flex-col items-center justify-between p-4 sm:p-6 font-sans">
      {/* Top Navbar */}
      <header className="w-full max-w-5xl flex items-center justify-between py-3 px-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm mb-6">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-md shadow-indigo-500/20">
            ✊
          </div>
          <div>
            <h1 className="text-base font-black text-slate-900 tracking-tight leading-none">
              RPS AI
            </h1>
            <p className="text-[10px] font-semibold text-slate-400 mt-0.5">
              Webcam Real-Time Rock Paper Scissors
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab("game")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === "game"
                ? "bg-white text-indigo-600 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Gamepad2 size={14} />
            <span>Play</span>
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === "settings"
                ? "bg-white text-indigo-600 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Settings size={14} />
            <span>Settings</span>
          </button>
        </div>
      </header>

      {/* Main Content Body */}
      <main className="w-full max-w-5xl flex-1 flex flex-col items-center justify-center mb-6">
        {/* Onboarding Permission Card */}
        {!state.hasCameraPermission && !state.isUsingFallbackControls ? (
          <CameraPermission
            onEnableCamera={handleRequestCamera}
            onUseFallback={useFallbackControls}
          />
        ) : activeTab === "settings" ? (
          <div className="w-full max-w-lg">
            <SettingsPanel
              settings={state.settings}
              devices={devices}
              onUpdateSettings={(newSettings) => {
                updateSettings(newSettings);
                if (newSettings.cameraDeviceId && newSettings.cameraDeviceId !== state.settings.cameraDeviceId) {
                  switchCamera(newSettings.cameraDeviceId);
                }
              }}
              onResetStats={resetAllStats}
            />
          </div>
        ) : (
          /* Game Grid Layout */
          <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Webcam & Active Reveal */}
            <div className="lg:col-span-7 flex flex-col gap-5 w-full">
              <div className="relative w-full">
                <WebcamView
                  videoRef={videoRef}
                  isCameraActive={isCameraActive}
                  isLoading={isCameraLoading || isModelLoading}
                  error={cameraError}
                  detection={detection}
                  overlayEnabled={state.settings.overlayEnabled}
                  onRequestCamera={handleRequestCamera}
                  onStopCamera={handleStopCamera}
                />

                {/* Countdown Overlay */}
                <Countdown
                  status={state.status}
                  count={state.currentCountdown}
                />
              </div>

              {/* Move Reveal & Outcome Display */}
              {(state.status === "REVEAL" || state.status === "RESULT") && (
                <Reveal
                  playerMove={state.playerMove}
                  computerMove={state.computerMove}
                  result={state.lastRoundResult?.result || null}
                />
              )}

              {/* Manual Control Fallback Buttons */}
              <FallbackControls
                status={state.status}
                onSelectMove={makePlayerMove}
                onStartGame={startGame}
                onStopRound={restartMatch}
                isUsingFallbackControls={state.isUsingFallbackControls}
              />
            </div>

            {/* Right Column: Scoreboard & History */}
            <div className="lg:col-span-5 flex flex-col gap-5 w-full">
              <ScoreBoard
                score={state.score}
                stats={state.stats}
                mode={state.mode}
                onRestartMatch={restartMatch}
              />

              <RoundHistory history={state.history} />
            </div>
          </div>
        )}

        {/* End of Match Dialog */}
        {state.status === "MATCH_COMPLETE" && (
          <MatchComplete
            score={state.score}
            stats={state.stats}
            mode={state.mode}
            onPlayAgain={restartMatch}
            onChangeMode={() => setActiveTab("settings")}
          />
        )}
      </main>

      {/* Diagnostics Debug Overlay */}
      {isDebugMode && (
        <DebugPanel
          fps={fps}
          detectionFps={detectionFps}
          detection={detection}
          status={state.status}
          isCameraActive={isCameraActive}
          isModelReady={isModelReady}
        />
      )}

      {/* Footer */}
      <footer className="w-full max-w-5xl text-center py-4 border-t border-slate-200/60 text-xs text-slate-400 flex items-center justify-between">
        <span>RPS AI — Local Browser Hand Recognition Game</span>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-emerald-600 font-semibold">
            <Sparkles size={14} /> 100% On-Device Privacy
          </span>
        </div>
      </footer>
    </div>
  );
};
