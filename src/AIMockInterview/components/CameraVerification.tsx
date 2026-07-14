"use client";

import React, { useEffect, useRef, useState } from "react";
// FaceMesh loaded via CDN script at runtime (same approach as ExamProctorCamera)

interface CameraVerificationProps {
  onCapture: (imageData: string) => void;
}

type FaceState = "loading" | "no-face" | "multiple" | "ok";

const FACE_STATE_COPY: Record<FaceState, { label: string; hint: string }> = {
  loading: { label: "Detecting face…", hint: "Starting face detection…" },
  "no-face": { label: "No face detected", hint: "Position your face inside the frame" },
  multiple: { label: "Multiple people detected", hint: "Only the candidate should be visible — please ensure you're alone" },
  ok: { label: "Face verified — ready to capture", hint: "Hold still and click capture" },
};

export function CameraVerification({ onCapture }: CameraVerificationProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const capturedRef = useRef(false);
  const isMountedRef = useRef(true);
  const faceMeshRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);

  const [status, setStatus] = useState<"prompt" | "granted" | "denied">("prompt");
  const [message, setMessage] = useState("Starting camera…");
  const [ready, setReady] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [faceState, setFaceState] = useState<FaceState>("loading");

  useEffect(() => {
    isMountedRef.current = true;
    startCamera();
    return () => {
      isMountedRef.current = false;
      streamRef.current?.getTracks().forEach(t => t.stop());
      if (cameraRef.current?.stop) cameraRef.current.stop();
      cameraRef.current = null;
      if (faceMeshRef.current) {
        faceMeshRef.current.close();
        faceMeshRef.current = null;
      }
    };
  }, []);

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" },
      });
      if (!isMountedRef.current) { stream.getTracks().forEach(t => t.stop()); return; }
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setStatus("granted");
      setMessage("Camera ready");
      setReady(true);
      startFaceDetection();
    } catch {
      if (isMountedRef.current) { setStatus("denied"); setMessage("Camera access denied"); }
    }
  }

  async function startFaceDetection() {
    try {
      const loadScript = (src: string): Promise<void> =>
        new Promise((resolve, reject) => {
          if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
          const s = document.createElement("script");
          s.src = src; s.onload = () => resolve(); s.onerror = reject;
          document.head.appendChild(s);
        });

      await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js");
      await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js");

      if (!isMountedRef.current) return;

      const FaceMesh = (window as any).FaceMesh;
      const Camera = (window as any).Camera;
      if (!FaceMesh || !Camera) return;

      const faceMesh = new FaceMesh({
        locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
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
        if (faceCount === 0) setFaceState("no-face");
        else if (faceCount > 1) setFaceState("multiple");
        else setFaceState("ok");
      });

      faceMeshRef.current = faceMesh;

      if (videoRef.current) {
        const camera = new Camera(videoRef.current, {
          onFrame: async () => {
            if (!videoRef.current || !faceMeshRef.current) return;
            try { await faceMeshRef.current.send({ image: videoRef.current }); } catch { /* transient */ }
          },
          width: 640,
          height: 480,
        });
        camera.start();
        cameraRef.current = camera;
      }
    } catch {
      // Face detection unavailable — fail open so camera capture still works,
      // just without the live face-count guard.
      if (isMountedRef.current) setFaceState("ok");
    }
  }

  function captureImage() {
    if (capturedRef.current || !videoRef.current || faceState !== "ok") return;
    capturedRef.current = true;
    setCapturing(true);
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (cameraRef.current?.stop) cameraRef.current.stop();
    onCapture(canvas.toDataURL("image/jpeg", 0.9));
  }

  if (status === "denied") {
    return (
      <div style={{ maxWidth: 440, margin: "40px auto", padding: 32, textAlign: "center", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16 }}>
        <div style={{ width: 52, height: 52, borderRadius: 14, background: "var(--danger-tint)", border: "1px solid rgba(220,38,38,.18)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 22 }}>
          <svg width="22" height="22" fill="none" stroke="var(--danger)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>
        </div>
        <div style={{ fontSize: 16, fontWeight: 600, color: "var(--t1)", marginBottom: 8 }}>Camera Access Required</div>
        <p style={{ fontSize: 13, color: "var(--t3)", marginBottom: 20, lineHeight: 1.6 }}>
          Please allow camera access in your browser settings and try again.
        </p>
        <button className="btn btn-primary" style={{ padding: "10px 24px", fontSize: 13 }} onClick={() => { capturedRef.current = false; setStatus("prompt"); startCamera(); }}>
          Retry Camera
        </button>
      </div>
    );
  }

  const faceCopy = FACE_STATE_COPY[faceState];
  const frameBorderColor = !ready ? "var(--border)"
    : faceState === "ok" ? "rgba(5,150,105,0.5)"
    : faceState === "loading" ? "rgba(37,99,235,0.4)"
    : "rgba(220,38,38,0.5)";
  const badgeBg = !ready ? "rgba(0,0,0,0.6)"
    : faceState === "ok" ? "rgba(5,150,105,0.85)"
    : faceState === "loading" ? "rgba(0,0,0,0.6)"
    : "rgba(220,38,38,0.85)";

  return (
    <div style={{ maxWidth: 520, margin: "32px auto", padding: "0 16px" }}>

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: "var(--brand-tint)", border: "1px solid var(--brand-ring)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
          <svg width="20" height="20" fill="none" stroke="var(--brand)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>
        </div>
        <div style={{ fontSize: 17, fontWeight: 700, color: "var(--t1)", letterSpacing: "-0.3px" }}>Identity Verification</div>
        <div style={{ fontSize: 13, color: "var(--t3)", marginTop: 4 }}>Position your face within the frame and click capture</div>
      </div>

      {/* Camera frame */}
      <div style={{ position: "relative", width: "100%", aspectRatio: "4/3", borderRadius: 16, overflow: "hidden", background: "#0a0a0a", border: `2px solid ${frameBorderColor}`, boxShadow: ready ? "0 0 0 4px rgba(37,99,235,0.08)" : "none", transition: "border-color .3s, box-shadow .3s" }}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)", display: "block" }}
        />

        {/* Face oval guide */}
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          transform: "translate(-50%, -52%)",
          width: "42%", height: "62%",
          border: `2px dashed ${faceState === "ok" ? "rgba(5,150,105,0.7)" : ready ? "rgba(37,99,235,0.6)" : "rgba(255,255,255,0.25)"}`,
          borderRadius: "50%", pointerEvents: "none",
          transition: "border-color .3s",
        }} />

        {/* Corner brackets */}
        {["topleft","topright","bottomleft","bottomright"].map(pos => (
          <div key={pos} style={{
            position: "absolute",
            ...(pos.includes("top") ? { top: 12 } : { bottom: 12 }),
            ...(pos.includes("left") ? { left: 12 } : { right: 12 }),
            width: 20, height: 20,
            borderTop: pos.includes("top") ? `2px solid ${ready ? "var(--brand)" : "rgba(255,255,255,0.3)"}` : "none",
            borderBottom: pos.includes("bottom") ? `2px solid ${ready ? "var(--brand)" : "rgba(255,255,255,0.3)"}` : "none",
            borderLeft: pos.includes("left") ? `2px solid ${ready ? "var(--brand)" : "rgba(255,255,255,0.3)"}` : "none",
            borderRight: pos.includes("right") ? `2px solid ${ready ? "var(--brand)" : "rgba(255,255,255,0.3)"}` : "none",
            transition: "border-color .3s",
          }} />
        ))}

        {/* Status badge top */}
        <div style={{
          position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)",
          display: "flex", alignItems: "center", gap: 6,
          padding: "4px 12px", borderRadius: 20,
          background: badgeBg,
          backdropFilter: "blur(8px)",
          fontSize: 11, fontWeight: 600, color: "#fff",
          transition: "background .3s",
          maxWidth: "90%",
          textAlign: "center",
        }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: faceState === "ok" ? "#4ade80" : ready ? "#fbbf24" : "#94a3b8", animation: ready ? "pulse 1.4s ease-in-out infinite" : "none", flexShrink: 0 }} />
          {!ready ? "Starting camera…" : faceCopy.label}
        </div>

        {/* Loading overlay */}
        {!ready && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)" }}>
            <div style={{ width: 28, height: 28, border: "3px solid rgba(255,255,255,0.2)", borderTop: "3px solid white", borderRadius: "50%", animation: "spin .8s linear infinite" }} />
          </div>
        )}
      </div>

      {/* Live face-state hint (replaces the static tips once camera is live) */}
      {ready && faceState !== "ok" && (
        <div style={{
          display: "flex", alignItems: "center", gap: 8, marginTop: 12,
          padding: "10px 14px", borderRadius: 10,
          background: faceState === "loading" ? "var(--brand-tint)" : "var(--danger-tint)",
          border: `1px solid ${faceState === "loading" ? "var(--brand-ring)" : "rgba(220,38,38,.18)"}`,
        }}>
          <span style={{ fontSize: 16, flexShrink: 0 }}>{faceState === "loading" ? "🔍" : faceState === "multiple" ? "⚠️" : "🙈"}</span>
          <span style={{ fontSize: 12.5, color: faceState === "loading" ? "var(--t2)" : "var(--danger)", fontWeight: 500 }}>{faceCopy.hint}</span>
        </div>
      )}

      {/* Info row — shown once face is verified, replacing the hint above */}
      {ready && faceState === "ok" && (
        <div style={{ display: "flex", gap: 8, marginTop: 12, marginBottom: 4 }}>
          {[
            { icon: "💡", text: "Good lighting on your face" },
            { icon: "👤", text: "Centre yourself in frame" },
            { icon: "📷", text: "Remove glasses if needed" },
          ].map(tip => (
            <div key={tip.text} style={{ flex: 1, padding: "8px 10px", background: "var(--s1)", border: "1px solid var(--border-soft)", borderRadius: 10, textAlign: "center" }}>
              <div style={{ fontSize: 14, marginBottom: 3 }}>{tip.icon}</div>
              <div style={{ fontSize: 10.5, color: "var(--t3)", lineHeight: 1.4 }}>{tip.text}</div>
            </div>
          ))}
        </div>
      )}

      {/* Capture button */}
      <button
        className="btn btn-primary btn-primary-lg"
        style={{ width: "100%", fontSize: 14, padding: "13px", borderRadius: 12, marginTop: 12 }}
        onClick={captureImage}
        disabled={!ready || faceState !== "ok" || capturing}
      >
        {capturing ? (
          <><div style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid white", borderRadius: "50%", animation: "spin .7s linear infinite" }} /> Capturing…</>
        ) : faceState === "ok" ? (
          <><svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg> Capture Photo</>
        ) : (
          <>Waiting for a clear, single face…</>
        )}
      </button>
    </div>
  );
}
