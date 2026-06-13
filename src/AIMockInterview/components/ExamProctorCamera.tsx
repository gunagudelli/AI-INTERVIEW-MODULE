"use client";

import React, { useEffect, useRef, useState } from "react";
// FaceMesh and Camera loaded via CDN scripts at runtime
import { api } from "../lib/api";
import {
  ExamImageType,
  ProctorViolationType,
} from "../lib/examImageTypes";

export { ProctorViolationType };

const ALERT_DURATION_MS = 2000;
/** Alert when head yaw exceeds this (degrees left/right from camera). */
const HEAD_YAW_THRESHOLD_DEG = 8;
const HEAD_TURN_HOLD_MS = 450;

type ViolationConfig = {
  message: string;
  statusLabel: string;
  uploadCooldownMs: number;
  uiCooldownMs: number;
};

const PROCTOR_VIOLATIONS: Record<ProctorViolationType, ViolationConfig> = {
  [ProctorViolationType.NO_FACE]: {
    message:
      "Face not detected. Please keep your face visible during the exam.",
    statusLabel: "Face not visible",
    uploadCooldownMs: 20000,
    uiCooldownMs: 2500,
  },
  [ProctorViolationType.MULTIPLE_FACES]: {
    message:
      "Multiple faces detected. Only the candidate should be visible.",
    statusLabel: "Multiple faces",
    uploadCooldownMs: 15000,
    uiCooldownMs: 2500,
  },
  [ProctorViolationType.HEAD_TURN_LEFT]: {
    message:
      "Head turned too far left. Please face the camera directly.",
    statusLabel: "Head position",
    uploadCooldownMs: 20000,
    uiCooldownMs: 2500,
  },
  [ProctorViolationType.HEAD_TURN_RIGHT]: {
    message:
      "Head turned too far right. Please face the camera directly.",
    statusLabel: "Head position",
    uploadCooldownMs: 20000,
    uiCooldownMs: 2500,
  },
  [ProctorViolationType.FACE_OFF_CENTER]: {
    message: "Please keep your face centered in the camera.",
    statusLabel: "Attention",
    uploadCooldownMs: 25000,
    uiCooldownMs: 3000,
  },
  [ProctorViolationType.FACE_TOO_FAR]: {
    message: "Face is too far from the camera.",
    statusLabel: "Attention",
    uploadCooldownMs: 25000,
    uiCooldownMs: 3000,
  },
  [ProctorViolationType.CAMERA_ERROR]: {
    message: "Camera access is required during the exam.",
    statusLabel: "Camera required",
    uploadCooldownMs: 30000,
    uiCooldownMs: 5000,
  },
  [ProctorViolationType.COPY_PASTE]: {
    message: "Copy/paste detected. This has been flagged.",
    statusLabel: "Copy/paste",
    uploadCooldownMs: 10000,
    uiCooldownMs: 2000,
  },
};

type Landmark = { x: number; y: number; z?: number };

function estimateHeadYawDegrees(landmarks: Landmark[]): number | null {
  const nose = landmarks[1];
  const leftEye = landmarks[33];
  const rightEye = landmarks[263];
  const leftCheek = landmarks[234];
  const rightCheek = landmarks[454];
  if (!nose || !leftEye || !rightEye || !leftCheek || !rightCheek) {
    return null;
  }

  const eyeSpan = Math.hypot(rightEye.x - leftEye.x, rightEye.y - leftEye.y);
  if (eyeSpan < 1e-5) return null;

  const faceCenterX = (leftCheek.x + rightCheek.x) / 2;
  const eyeMidX = (leftEye.x + rightEye.x) / 2;
  const blendOffset = (nose.x - faceCenterX) * 0.55 + (nose.x - eyeMidX) * 0.45;

  const yawRad = Math.atan2(blendOffset, eyeSpan * 0.95);
  return (yawRad * 180) / Math.PI;
}

interface ExamProctorCameraProps {
  active: boolean;
  userId: string;
  sessionStatsId: string;
}

export function ExamProctorCamera({
  active,
  userId,
  sessionStatsId,
}: ExamProctorCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const faceMeshRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  const noFaceSinceRef = useRef<number | null>(null);
  const attentionViolationSinceRef = useRef<number | null>(null);
  const headTurnViolationSinceRef = useRef<number | null>(null);
  const alertClearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastUploadAtByTypeRef = useRef<Partial<Record<ProctorViolationType, number>>>(
    {},
  );
  const lastUiAlertAtByTypeRef = useRef<
    Partial<Record<ProctorViolationType, number>>
  >({});
  const userIdRef = useRef(userId);
  const sessionStatsIdRef = useRef(sessionStatsId);
  const isMountedRef = useRef(true);

  const [status, setStatus] = useState("Camera starting...");
  const [warning, setWarning] = useState("");
  const [activeViolation, setActiveViolation] =
    useState<ProctorViolationType | null>(null);

  useEffect(() => {
    userIdRef.current = userId;
    sessionStatsIdRef.current = sessionStatsId;
  }, [userId, sessionStatsId]);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    isMountedRef.current = true;

    const clearTransientAlert = () => {
      if (!isMountedRef.current) return;
      setActiveViolation(null);
      setWarning("");
      setStatus("Monitoring active");
    };

    const scheduleClearAlert = () => {
      if (alertClearTimerRef.current) {
        clearTimeout(alertClearTimerRef.current);
      }
      alertClearTimerRef.current = setTimeout(() => {
        alertClearTimerRef.current = null;
        clearTransientAlert();
      }, ALERT_DURATION_MS);
    };

    const uploadProctorScreenshot = async (violationType: ProctorViolationType) => {
      const uid = userIdRef.current;
      const sid = sessionStatsIdRef.current;
      const video = videoRef.current;
      const now = Date.now();
      const config = PROCTOR_VIOLATIONS[violationType];

      if (!uid || !sid || !video?.videoWidth || !video?.videoHeight) return;

      const lastUpload = lastUploadAtByTypeRef.current[violationType] ?? 0;
      if (now - lastUpload < config.uploadCooldownMs) return;

      lastUploadAtByTypeRef.current[violationType] = now;

      try {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.drawImage(video, 0, 0);
        const blob = await new Promise<Blob | null>((resolve) => {
          canvas.toBlob((b) => resolve(b), "image/jpeg", 0.85);
        });
        if (!blob) return;

        const formData = new FormData();
        formData.append("file", blob, `proctor-${violationType}-${now}.jpg`);
        formData.append("userId", uid);
        formData.append("sessionStatsId", sid);
        formData.append("type", ExamImageType.CANDIDATE_EXAM_PROXY);
        formData.append("violationType", violationType);

        await api.uploadExamImageSilent(formData);
      } catch {
        // Silent — no UI feedback on success or failure
      }
    };

    const showViolationAlert = (violationType: ProctorViolationType) => {
      if (!isMountedRef.current) return;

      const config = PROCTOR_VIOLATIONS[violationType];
      const now = Date.now();
      const lastUi = lastUiAlertAtByTypeRef.current[violationType] ?? 0;
      const shouldRefreshUi = now - lastUi >= config.uiCooldownMs;

      if (shouldRefreshUi) {
        lastUiAlertAtByTypeRef.current[violationType] = now;
        setActiveViolation(violationType);
        setStatus(config.statusLabel);
        setWarning(config.message);
        scheduleClearAlert();
      }

      void uploadProctorScreenshot(violationType);
    };

    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 320, height: 240, facingMode: "user" },
          audio: false,
        });

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        const loadScript = (src: string): Promise<void> =>
          new Promise((resolve, reject) => {
            if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
            const s = document.createElement("script");
            s.src = src; s.onload = () => resolve(); s.onerror = reject;
            document.head.appendChild(s);
          });

        await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js");
        await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js");

        const FaceMesh = (window as any).FaceMesh;
        const Camera = (window as any).Camera;
        if (!FaceMesh || !Camera) return;

        const faceMesh = new FaceMesh({
          locateFile: (file: string) =>
            `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
        });

        faceMesh.setOptions({
          maxNumFaces: 3,
          refineLandmarks: false,
          minDetectionConfidence: 0.55,
          minTrackingConfidence: 0.55,
        });

        faceMesh.onResults((results: any) => {
          if (!isMountedRef.current) return;

          const faceCount = results.multiFaceLandmarks?.length || 0;
          const now = Date.now();

          if (faceCount === 0) {
            if (!noFaceSinceRef.current) noFaceSinceRef.current = now;
            attentionViolationSinceRef.current = null;
            headTurnViolationSinceRef.current = null;
            if (now - noFaceSinceRef.current > 800) {
              showViolationAlert(ProctorViolationType.NO_FACE);
            }
            return;
          }

          noFaceSinceRef.current = null;

          if (faceCount > 1) {
            attentionViolationSinceRef.current = null;
            headTurnViolationSinceRef.current = null;
            showViolationAlert(ProctorViolationType.MULTIPLE_FACES);
            return;
          }

          const landmarks = results.multiFaceLandmarks?.[0];
          if (landmarks) {
            const yawDeg = estimateHeadYawDegrees(landmarks);
            const nose = landmarks[1];
            const leftEye = landmarks[33];
            const rightEye = landmarks[263];
            const eyeDistance =
              nose && leftEye && rightEye
                ? Math.hypot(rightEye.x - leftEye.x, rightEye.y - leftEye.y)
                : 0;

            let headTurnType: ProctorViolationType | null = null;
            if (yawDeg !== null) {
              if (yawDeg > HEAD_YAW_THRESHOLD_DEG) {
                headTurnType = ProctorViolationType.HEAD_TURN_RIGHT;
              } else if (yawDeg < -HEAD_YAW_THRESHOLD_DEG) {
                headTurnType = ProctorViolationType.HEAD_TURN_LEFT;
              }
            }

            if (headTurnType) {
              attentionViolationSinceRef.current = null;
              if (!headTurnViolationSinceRef.current) {
                headTurnViolationSinceRef.current = now;
              }
              if (now - headTurnViolationSinceRef.current > HEAD_TURN_HOLD_MS) {
                showViolationAlert(headTurnType);
              }
              return;
            }

            headTurnViolationSinceRef.current = null;

            let otherType: ProctorViolationType | null = null;
            if (nose) {
              const centerOffset = Math.hypot(nose.x - 0.5, nose.y - 0.5);
              if (centerOffset > 0.28) {
                otherType = ProctorViolationType.FACE_OFF_CENTER;
              } else if (eyeDistance > 0 && eyeDistance < 0.06) {
                otherType = ProctorViolationType.FACE_TOO_FAR;
              }
            }

            if (otherType) {
              headTurnViolationSinceRef.current = null;
              if (!attentionViolationSinceRef.current) {
                attentionViolationSinceRef.current = now;
              }
              if (now - attentionViolationSinceRef.current > 900) {
                showViolationAlert(otherType);
              }
              return;
            }
          }

          attentionViolationSinceRef.current = null;
          headTurnViolationSinceRef.current = null;
          if (!alertClearTimerRef.current) {
            setWarning("");
            setStatus("Monitoring active");
          }
        });

        faceMeshRef.current = faceMesh;

        if (videoRef.current) {
          const camera = new Camera(videoRef.current, {
            onFrame: async () => {
              if (!videoRef.current || !faceMeshRef.current) return;
              try {
                await faceMeshRef.current.send({ image: videoRef.current });
              } catch {
                // Ignore transient frame analysis errors.
              }
            },
            width: 320,
            height: 240,
          });
          camera.start();
          cameraRef.current = camera;
        }
      } catch (error) {
        console.error("Exam proctor camera failed:", error);
        if (isMountedRef.current) {
          showViolationAlert(ProctorViolationType.CAMERA_ERROR);
        }
      }
    };

    start();

    return () => {
      cancelled = true;
      isMountedRef.current = false;
      if (alertClearTimerRef.current) {
        clearTimeout(alertClearTimerRef.current);
        alertClearTimerRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (faceMeshRef.current) {
        faceMeshRef.current.close();
        faceMeshRef.current = null;
      }
      cameraRef.current = null;
      noFaceSinceRef.current = null;
      attentionViolationSinceRef.current = null;
      headTurnViolationSinceRef.current = null;
    };
  }, [active]);

  if (!active) return null;

  return (
    <div className="exam-proctor-camera">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="exam-proctor-video"
      />
      {activeViolation && (
        <div
          className="exam-proctor-alert-banner"
          role="alert"
          data-violation={activeViolation}
          style={{
            position: "absolute",
            top: 8,
            left: 8,
            right: 8,
            zIndex: 2,
            padding: "8px 10px",
            borderRadius: 8,
            background: "rgba(197, 29, 29, 0.95)",
            color: "#fff",
            fontSize: 11,
            fontWeight: 600,
            textAlign: "center",
            lineHeight: 1.4,
          }}
        >
          <span
            style={{
              display: "block",
              fontSize: 9,
              opacity: 0.9,
              marginBottom: 4,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}
          >
            {PROCTOR_VIOLATIONS[activeViolation].statusLabel}
          </span>
          {PROCTOR_VIOLATIONS[activeViolation].message}
        </div>
      )}
      <div className={`exam-proctor-status${warning ? " warning" : ""}`}>
        <span className="exam-proctor-dot" />
        <span>{warning || status}</span>
      </div>
    </div>
  );
}
