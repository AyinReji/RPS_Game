"use client";

import { useState, useRef, useCallback, useEffect } from "react";

export interface UseCameraReturn {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  stream: MediaStream | null;
  isCameraActive: boolean;
  isLoading: boolean;
  error: string | null;
  devices: MediaDeviceInfo[];
  selectedDeviceId: string;
  startCamera: (deviceId?: string) => Promise<boolean>;
  stopCamera: () => void;
  switchCamera: (deviceId: string) => Promise<boolean>;
}

export function useCamera(): UseCameraReturn {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setIsLoading(false);
  }, [stream]);

  // Synchronize stream with video element whenever stream or ref mounts
  useEffect(() => {
    if (videoRef.current && stream) {
      if (videoRef.current.srcObject !== stream) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch((err) => {
          if (err.name !== "AbortError") {
            console.warn("Error playing camera stream:", err);
          }
        });
      }
    }
  }, [stream]);

  const updateDevices = useCallback(async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.mediaDevices?.enumerateDevices) {
        const allDevices = await navigator.mediaDevices.enumerateDevices();
        const videoInputDevices = allDevices.filter((d) => d.kind === "videoinput");
        setDevices(videoInputDevices);
      }
    } catch (err) {
      console.warn("Could not enumerate video devices:", err);
    }
  }, []);

  const startCamera = useCallback(
    async (deviceId?: string): Promise<boolean> => {
      setIsLoading(true);
      setError(null);

      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error("Camera API is not supported by your browser context (requires HTTPS or localhost).");
        }

        // Stop existing stream if any
        if (stream) {
          stream.getTracks().forEach((track) => track.stop());
        }

        const constraints: MediaStreamConstraints = {
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: "user",
            ...(deviceId ? { deviceId: { exact: deviceId } } : {}),
          },
          audio: false,
        };

        const newStream = await navigator.mediaDevices.getUserMedia(constraints);
        setStream(newStream);

        if (videoRef.current) {
          videoRef.current.srcObject = newStream;
          try {
            await videoRef.current.play();
          } catch (playError: unknown) {
            if (playError instanceof Error && playError.name !== "AbortError") {
              console.warn("Video play error:", playError);
            }
          }
        }

        setIsCameraActive(true);
        setIsLoading(false);
        if (deviceId) setSelectedDeviceId(deviceId);

        await updateDevices();
        return true;
      } catch (err: unknown) {
        setIsLoading(false);
        setIsCameraActive(false);

        let errorMessage = "Failed to access webcam.";
        if (err instanceof Error) {
          if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
            errorMessage = "Camera permission was denied.";
          } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
            errorMessage = "No camera device found.";
          } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
            errorMessage = "Camera is already in use by another application.";
          } else {
            errorMessage = err.message || errorMessage;
          }
        }

        setError(errorMessage);
        return false;
      }
    },
    [stream, updateDevices]
  );

  const switchCamera = useCallback(
    async (deviceId: string): Promise<boolean> => {
      return await startCamera(deviceId);
    },
    [startCamera]
  );

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  return {
    videoRef,
    stream,
    isCameraActive,
    isLoading,
    error,
    devices,
    selectedDeviceId,
    startCamera,
    stopCamera,
    switchCamera,
  };
}
