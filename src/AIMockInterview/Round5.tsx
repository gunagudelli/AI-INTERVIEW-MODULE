"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { api } from "./lib/api";

interface Round5Props {
  userId: string;
  sessionId: string;
  onComplete: () => void;
}

/* ─── Brand colour (matches Round 4 purple style but pink for R5) ─── */
const PINK = "#2563EB";
const GREEN = "#16a34a";   // active mic / voice detected
const GREEN_BG = "#dcfce7";
const GREEN_BORDER = "#86efac";

/* ─── Keyframes ─── */
const STYLES = `
:root {
  --color-background-primary: var(--surface);
  --color-background-secondary: var(--s1);
  --color-border-tertiary: var(--border);
  --color-border-secondary: var(--border-strong);
  --color-text-primary: var(--t1);
  --color-text-secondary: var(--t2);
  --color-text-tertiary: var(--t3);
  --color-text-success: var(--success);
  --color-text-danger: var(--danger);
}
@keyframes r5bob    { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
@keyframes r5bobU   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
@keyframes r5eyeL   { 0%,100%{transform:translateX(0)} 40%{transform:translateX(-3px)} 70%{transform:translateX(3px)} }
@keyframes r5eyeR   { 0%,100%{transform:translateX(0)} 40%{transform:translateX(-3px)} 70%{transform:translateX(3px)} }
@keyframes r5bar    { 0%,100%{transform:scaleY(.2)} 50%{transform:scaleY(1)} }
@keyframes r5spin   { to{transform:rotate(360deg)} }
@keyframes r5cursor { 0%,100%{opacity:1} 50%{opacity:0} }
@keyframes r5fade   { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
@keyframes r5slide  { from{opacity:0;transform:translateX(-8px)} to{opacity:1;transform:translateX(0)} }
@keyframes r5pulse  { 0%,100%{opacity:.7} 50%{opacity:1} }
@keyframes r5hand   { 0%,100%{transform:rotate(0deg)} 30%{transform:rotate(-18deg)} 60%{transform:rotate(12deg)} }
@keyframes r5pgshim { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
@keyframes r5micpulse { 0%,100%{transform:scale(1);opacity:.9} 50%{transform:scale(1.22);opacity:1} }
@keyframes r5countdown { from{transform:scale(1.4);opacity:.5} to{transform:scale(1);opacity:1} }
`;

/* ─── Spinner ─── */
function Spinner() {
  return (
    <svg style={{ animation: "r5spin .8s linear infinite", display: "inline-block", verticalAlign: "middle" }}
      width={14} height={14} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity=".25" />
      <path fill="currentColor" opacity=".75" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
    </svg>
  );
}

/* ─── WaveBars ─── */
function WaveBars({ active, color, count = 5 }: { active: boolean; color: string; count?: number }) {
  const heights = [6, 11, 16, 11, 8, 13, 6];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 2.5, height: 22 }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{
          width: 3, borderRadius: 2, background: color,
          height: active ? heights[i % heights.length] : 4,
          transformOrigin: "center bottom",
          animation: active ? `r5bar .65s ease-in-out infinite` : "none",
          animationDelay: `${i * 0.1}s`,
          transition: "height .3s",
          opacity: active ? 1 : 0.35,
        }} />
      ))}
    </div>
  );
}

/* ─── AI Interviewer character (pink, headset) ─── */
function AICharacter({ talking, emotion }: { talking: boolean; emotion: "neutral" | "happy" | "thinking" }) {
  const mouthPath = emotion === "happy"
    ? "M 88 128 Q 100 142 112 128"
    : emotion === "thinking"
    ? "M 90 132 Q 100 128 110 132"
    : "M 90 128 Q 100 136 110 128";

  const lBrow = emotion === "thinking" ? "M80 103 Q88 97 96 103" : "M80 102 Q88 97 96 102";
  const rBrow = emotion === "thinking" ? "M104 97 Q112 103 120 97" : "M104 102 Q112 97 120 102";

  return (
    <svg width="200" height="210" viewBox="0 0 200 210"
      style={{ position: "absolute", bottom: 0, left: "50%", transform: "translateX(-50%)", animation: "r5bob 3s ease-in-out infinite" }}>
      <ellipse cx="100" cy="198" rx="36" ry="6" fill="#c4448c" opacity=".3" />
      {/* Body */}
      <rect x="72" y="145" width="56" height="52" rx="8" fill="#c2185b" />
      <rect x="76" y="145" width="48" height="11" rx="5" fill="#d81b60" />
      <path d="M 88 145 L 100 162 L 112 145" fill="none" stroke={PINK} strokeWidth="2" />
      {/* Left arm */}
      <g style={{ transformOrigin: "72px 158px", animation: talking ? "r5hand 2.2s ease-in-out infinite" : "none" }}>
        <rect x="48" y="149" width="26" height="13" rx="7" fill="#c2185b" />
        <ellipse cx="48" cy="155" rx="9" ry="9" fill="#fce4ec" />
      </g>
      {/* Right arm */}
      <rect x="126" y="149" width="26" height="13" rx="7" fill="#c2185b" />
      <ellipse cx="152" cy="155" rx="9" ry="9" fill="#fce4ec" />
      {/* Legs */}
      <rect x="84" y="190" width="13" height="14" rx="4" fill="#880e4f" />
      <rect x="103" y="190" width="13" height="14" rx="4" fill="#880e4f" />
      <rect x="82" y="198" width="17" height="8" rx="3" fill="#4a0526" />
      <rect x="101" y="198" width="17" height="8" rx="3" fill="#4a0526" />
      {/* Head */}
      <ellipse cx="100" cy="110" rx="34" ry="36" fill="#fce4ec" />
      {/* Hair */}
      <ellipse cx="100" cy="88" rx="36" ry="28" fill={PINK} />
      <ellipse cx="100" cy="80" rx="34" ry="20" fill="#c2185b" />
      <ellipse cx="70" cy="94" rx="7" ry="13" fill={PINK} style={{ transform: "rotate(-12deg)", transformOrigin: "70px 94px" }} />
      <ellipse cx="130" cy="94" rx="7" ry="13" fill={PINK} style={{ transform: "rotate(12deg)", transformOrigin: "130px 94px" }} />
      {/* Ears */}
      <ellipse cx="67" cy="112" rx="7" ry="9" fill="#fce4ec" />
      <ellipse cx="133" cy="112" rx="7" ry="9" fill="#fce4ec" />
      {/* Left eye */}
      <ellipse cx="88" cy="112" rx="8" ry="9" fill="#fff" />
      <ellipse cx="88" cy="113" rx="4.5" ry="4.5" fill="#880e4f" style={{ animation: "r5eyeL 4s ease-in-out infinite" }} />
      <ellipse cx="90" cy="111" rx="1.5" ry="1.5" fill="#fff" opacity=".7" />
      {/* Right eye */}
      <ellipse cx="112" cy="112" rx="8" ry="9" fill="#fff" />
      <ellipse cx="112" cy="113" rx="4.5" ry="4.5" fill="#880e4f" style={{ animation: "r5eyeR 4s ease-in-out infinite" }} />
      <ellipse cx="114" cy="111" rx="1.5" ry="1.5" fill="#fff" opacity=".7" />
      {/* Eyebrows */}
      <path d={lBrow} fill="none" stroke="#880e4f" strokeWidth="2" strokeLinecap="round" style={{ transition: "d .4s" }} />
      <path d={rBrow} fill="none" stroke="#880e4f" strokeWidth="2" strokeLinecap="round" style={{ transition: "d .4s" }} />
      {/* Mouth */}
      <path d={mouthPath} fill="none" stroke="#c2185b" strokeWidth="2.5" strokeLinecap="round"
        style={{ transition: "d .3s", animation: talking ? "r5bob .22s ease-in-out infinite alternate" : "none" }} />
      {/* Cheeks */}
      <ellipse cx="78" cy="122" rx="5" ry="3" fill={PINK} opacity=".3" />
      <ellipse cx="122" cy="122" rx="5" ry="3" fill={PINK} opacity=".3" />
      {/* Headset */}
      <path d="M 68 100 Q 64 88 72 80" fill="none" stroke="#880e4f" strokeWidth="3" strokeLinecap="round" />
      <rect x="60" y="96" width="10" height="13" rx="4" fill="#ad1457" />
      <path d="M 132 100 Q 136 88 128 80" fill="none" stroke="#880e4f" strokeWidth="3" strokeLinecap="round" />
      <rect x="130" y="96" width="10" height="13" rx="4" fill="#ad1457" />
    </svg>
  );
}

/* ─── User Avatar character (teal/green) ─── */
function UserCharacter({ talking, emotion }: { talking: boolean; emotion: "neutral" | "happy" | "nervous" }) {
  const mouthPath = emotion === "happy"
    ? "M 88 128 Q 100 142 112 128"
    : emotion === "nervous"
    ? "M 92 133 Q 100 129 108 133"
    : "M 91 129 Q 100 137 109 129";

  const lBrow = emotion === "nervous" ? "M80 104 Q88 100 96 104" : "M80 102 Q88 97 96 102";
  const rBrow = emotion === "nervous" ? "M104 104 Q112 100 120 104" : "M104 102 Q112 97 120 102";

  return (
    <svg width="200" height="210" viewBox="0 0 200 210"
      style={{ position: "absolute", bottom: 0, left: "50%", transform: "translateX(-50%)", animation: "r5bobU 3.4s ease-in-out infinite" }}>
      <ellipse cx="100" cy="198" rx="34" ry="6" fill="#00897b" opacity=".3" />
      {/* Body */}
      <rect x="72" y="145" width="56" height="52" rx="8" fill="#00796b" />
      <rect x="76" y="145" width="48" height="11" rx="5" fill="#009688" />
      <rect x="91" y="147" width="18" height="22" rx="3" fill="#00897b" />
      {/* Left arm */}
      <rect x="48" y="149" width="26" height="13" rx="7" fill="#00796b" />
      <ellipse cx="48" cy="155" rx="9" ry="9" fill="#ffe0b2" />
      {/* Right arm — waves when talking */}
      <g style={{ transformOrigin: "152px 155px", animation: talking ? "r5hand 1.8s ease-in-out infinite" : "none" }}>
        <rect x="126" y="149" width="26" height="13" rx="7" fill="#00796b" />
        <ellipse cx="152" cy="155" rx="9" ry="9" fill="#ffe0b2" />
      </g>
      {/* Legs */}
      <rect x="84" y="190" width="13" height="14" rx="4" fill="#004d40" />
      <rect x="103" y="190" width="13" height="14" rx="4" fill="#004d40" />
      <rect x="82" y="198" width="17" height="8" rx="3" fill="#1a2744" />
      <rect x="101" y="198" width="17" height="8" rx="3" fill="#1a2744" />
      {/* Head */}
      <ellipse cx="100" cy="110" rx="34" ry="36" fill="#ffe0b2" />
      {/* Hair */}
      <ellipse cx="100" cy="86" rx="36" ry="26" fill="#2d1b00" />
      <ellipse cx="100" cy="79" rx="32" ry="18" fill="#3e2723" />
      <ellipse cx="70" cy="95" rx="7" ry="12" fill="#2d1b00" style={{ transform: "rotate(-10deg)", transformOrigin: "70px 95px" }} />
      <ellipse cx="130" cy="95" rx="7" ry="12" fill="#2d1b00" style={{ transform: "rotate(10deg)", transformOrigin: "130px 95px" }} />
      {/* Ears */}
      <ellipse cx="67" cy="112" rx="7" ry="9" fill="#ffe0b2" />
      <ellipse cx="133" cy="112" rx="7" ry="9" fill="#ffe0b2" />
      {/* Left eye */}
      <ellipse cx="88" cy="112" rx="8" ry="9" fill="#fff" />
      <ellipse cx="88" cy="113" rx="4.5" ry="4.5" fill="#1b5e20" style={{ animation: "r5eyeL 4.5s ease-in-out infinite" }} />
      <ellipse cx="90" cy="111" rx="1.5" ry="1.5" fill="#fff" opacity=".7" />
      {/* Right eye */}
      <ellipse cx="112" cy="112" rx="8" ry="9" fill="#fff" />
      <ellipse cx="112" cy="113" rx="4.5" ry="4.5" fill="#1b5e20" style={{ animation: "r5eyeR 4.5s ease-in-out infinite" }} />
      <ellipse cx="114" cy="111" rx="1.5" ry="1.5" fill="#fff" opacity=".7" />
      {/* Eyebrows */}
      <path d={lBrow} fill="none" stroke="#3e2723" strokeWidth="2" strokeLinecap="round" style={{ transition: "d .4s" }} />
      <path d={rBrow} fill="none" stroke="#3e2723" strokeWidth="2" strokeLinecap="round" style={{ transition: "d .4s" }} />
      {/* Mouth */}
      <path d={mouthPath} fill="none" stroke="#bf360c" strokeWidth="2.5" strokeLinecap="round"
        style={{ transition: "d .3s", animation: talking ? "r5bob .25s ease-in-out infinite alternate" : "none" }} />
      {/* Cheeks */}
      <ellipse cx="78" cy="122" rx="5" ry="3" fill="#00c9a7" opacity=".25" />
      <ellipse cx="122" cy="122" rx="5" ry="3" fill="#00c9a7" opacity=".25" />
      {/* Sweat when nervous */}
      {emotion === "nervous" && (
        <ellipse cx="124" cy="98" rx="3" ry="5" fill="#80cbc4" opacity=".7" />
      )}
    </svg>
  );
}

/* ─── Screen bars on monitor ─── */
function ScreenBars({ active, color }: { active: boolean; color: string }) {
  const bars = [6, 12, 18, 14, 10, 16, 8, 12, 6];
  return (
    <>
      {bars.map((h, i) => (
        <rect key={i} x={68 + i * 7} y={19 - h / 2} width={4} height={h} rx={2}
          fill={color}
          style={active ? { animation: `r5bar .6s ease-in-out infinite`, animationDelay: `${i * 0.09}s` } : { opacity: 0.3 }}
        />
      ))}
    </>
  );
}

/* ════════════════════════════════════════════ */
type Phase = "ai_speaking" | "user_recording" | "captured" | "analyzing" | "done";

export default function Round5({ userId, sessionId, onComplete }: Round5Props) {
  const [question, setQuestion]         = useState("");
  const [category, setCategory]         = useState("");
  const [difficulty, setDifficulty]     = useState("");
  const [hint, setHint]                 = useState<string | null>(null);
  const [questionNo, setQuestionNo]     = useState(1);
  const [totalQ, setTotalQ]             = useState(6);
  const [timeLeft, setTimeLeft]         = useState(240);
  const [phase, setPhase]               = useState<Phase>("ai_speaking");
  // keep phaseRef in sync so mic restart callbacks always see current phase
  const setPhaseSync = (p: Phase) => { phaseRef.current = p; setPhase(p); };
  const [answerText, setAnswerText]     = useState("");
  const [interimText, setInterimText]   = useState("");
  const [micActive, setMicActive]       = useState(false);  // true = hardware audio detected
  const [voiceDetected, setVoiceDetected] = useState(false); // true = speech actually heard
  const [loading, setLoading]           = useState(true);
  const [submitting, setSubmitting]     = useState(false);
  const [feedback, setFeedback]         = useState("");
  const [score, setScore]               = useState<number | null>(null);
  const [strengths, setStrengths]       = useState<string[]>([]);
  const [improvements, setImprovements] = useState<string[]>([]);
  const [roundComplete, setRoundComplete] = useState(false);
  const [summary, setSummary]           = useState<any>(null);
  const [error, setError]               = useState("");
  const [displayedQ, setDisplayedQ]     = useState("");
  const [typingDone, setTypingDone]     = useState(false);
  const [aiEmotion, setAiEmotion]       = useState<"neutral" | "happy" | "thinking">("neutral");
  const [userEmotion, setUserEmotion]   = useState<"neutral" | "happy" | "nervous">("neutral");
  const [replayCount, setReplayCount]   = useState(0);   // max 2 total plays (1 auto + 1 manual)
  const [countdown, setCountdown]       = useState<number | null>(null);  // 5-4-3-2-1 before analysis

  const timerRef        = useRef<ReturnType<typeof setInterval> | null>(null);
  const recRef          = useRef<any>(null);           // Web Speech (live display)
  const mediaRecRef     = useRef<MediaRecorder | null>(null); // MediaRecorder (Whisper)
  const audioChunksRef  = useRef<Blob[]>([]);
  const submittedRef    = useRef(false);
  const finalRef        = useRef("");
  const interimRef      = useRef("");
  const restartRef      = useRef(false);
  const phaseRef        = useRef<Phase>("ai_speaking"); // tracks phase without stale closure
  const typingRef       = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef    = useRef<ReturnType<typeof setInterval> | null>(null);

  /* ── helpers ── */
  const stopTimer    = () => clearInterval(timerRef.current!);
  const stopVoice    = () => window.speechSynthesis?.cancel();
  const stopTyping   = () => clearInterval(typingRef.current!);
  const stopCountdown = () => clearInterval(countdownRef.current!);

  function startTimer(s: number) {
    stopTimer(); setTimeLeft(s);
    timerRef.current = setInterval(() => {
      setTimeLeft(t => { if (t <= 1) { clearInterval(timerRef.current!); return 0; } return t - 1; });
    }, 1000);
  }

  /* Auto-submit when recording timer hits 0 */
  useEffect(() => {
    if (timeLeft === 0 && phaseRef.current === "user_recording" && !submittedRef.current) {
      handleStopRecording();
    }
  }, [timeLeft]); // eslint-disable-line

  useEffect(() => () => {
    stopTimer(); stopVoice(); stopTyping(); stopCountdown();
    restartRef.current = false;
    if (recRef.current) { recRef.current.onend = null; recRef.current.onerror = null; try { recRef.current.abort(); } catch (_) {} recRef.current = null; }
    if (mediaRecRef.current && mediaRecRef.current.state !== 'inactive') { try { mediaRecRef.current.stop(); } catch (_) {} }
    streamRef.current?.getTracks().forEach(t => t.stop()); streamRef.current = null;
  }, []);

  /* ── Typewriter ── */
  function typeQuestion(text: string, onDone: () => void) {
    stopTyping(); setDisplayedQ(""); setTypingDone(false);
    let i = 0;
    typingRef.current = setInterval(() => {
      i++; setDisplayedQ(text.slice(0, i));
      if (i >= text.length) { clearInterval(typingRef.current!); setTypingDone(true); onDone(); }
    }, 24);
  }

  /* ── TTS ── */
  const speak = useCallback((text: string, onEnd?: () => void) => {
    if (!window.speechSynthesis || !text) { onEnd?.(); return; }
    stopVoice();
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = "en-US"; utt.rate = 0.88; utt.pitch = 1.05; utt.volume = 1;
    const voices = window.speechSynthesis.getVoices();
    const pick =
      voices.find(v => v.lang === "en-US" && v.name.toLowerCase().includes("female")) ||
      voices.find(v => v.lang === "en-US" && v.localService) ||
      voices.find(v => v.lang.startsWith("en-US")) ||
      voices.find(v => v.lang.startsWith("en"));
    if (pick) utt.voice = pick;
    utt.onend = () => onEnd?.();
    utt.onerror = () => onEnd?.();
    const go = () => window.speechSynthesis.speak(utt);
    if (window.speechSynthesis.getVoices().length > 0) go();
    else { window.speechSynthesis.onvoiceschanged = () => { window.speechSynthesis.onvoiceschanged = null; go(); }; }
  }, []);

  /* ─────────────────────────────────────────────────────────────
     MediaRecorder — stays open the FULL 3 minutes.
     Single getUserMedia call → stream reused by both
     MediaRecorder (audio capture) and SpeechRecognition (live text).
  ───────────────────────────────────────────────────────────── */
  const streamRef = useRef<MediaStream | null>(null);

  async function startMediaRecorder() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, sampleRate: 16000 },
      });
      streamRef.current = stream;
      audioChunksRef.current = [];
      const mime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/ogg';
      const mr = new MediaRecorder(stream, { mimeType: mime });
      mr.ondataavailable = (e) => { if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data); };
      mr.start(500); // chunk every 500 ms — keeps recording even during silence
      mediaRecRef.current = mr;
    } catch {
      // mic denied — Web Speech only
    }
  }

  function stopMediaRecorder(): Promise<Blob | null> {
    return new Promise((resolve) => {
      const mr = mediaRecRef.current;
      if (!mr || mr.state === 'inactive') {
        streamRef.current?.getTracks().forEach(t => t.stop());
        streamRef.current = null;
        resolve(null); return;
      }
      mr.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: mr.mimeType || 'audio/webm' });
        streamRef.current?.getTracks().forEach(t => t.stop());
        streamRef.current = null;
        mediaRecRef.current = null;
        resolve(blob.size > 0 ? blob : null);
      };
      mr.stop();
    });
  }

  /* ─────────────────────────────────────────────────────────────
     SpeechRecognition — live text display only.
     Auto-restarts immediately on every onend (Chrome kills it
     after ~7 s silence). restartRef guards against restarts
     after the user has submitted.
  ───────────────────────────────────────────────────────────── */
  function startMic(isRestart = false) {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return; // no SR support — MediaRecorder still captures audio

    if (recRef.current) {
      recRef.current.onend = null;
      recRef.current.onerror = null;
      try { recRef.current.abort(); } catch (_) {}
      recRef.current = null;
    }

    if (!isRestart) {
      finalRef.current = ""; interimRef.current = "";
      setAnswerText(""); setInterimText("");
    }

    const r = new SR();
    r.lang = "en-US";
    r.continuous = true;
    r.interimResults = true;
    r.maxAlternatives = 1;

    r.onaudiostart  = () => setMicActive(true);
    r.onaudioend    = () => setMicActive(false);
    r.onspeechstart = () => setVoiceDetected(true);
    r.onspeechend   = () => setVoiceDetected(false);

    r.onresult = (e: any) => {
      let fin = ""; let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) fin += t + " ";
        else interim += t;
      }
      if (fin) { finalRef.current += fin; setAnswerText(finalRef.current.trim()); }
      interimRef.current = interim;
      setInterimText(interim);
      if (fin || interim) setVoiceDetected(true);
    };

    r.onerror = (e: any) => {
      // "no-speech" and "aborted" are normal — do nothing, onend will restart
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        restartRef.current = false; // mic denied — stop trying
      }
    };

    r.onend = () => {
      setMicActive(false);
      if (!restartRef.current || phaseRef.current !== "user_recording") {
        setVoiceDetected(false); setInterimText(""); return;
      }
      // Flush any pending interim before restarting
      if (interimRef.current.trim().length > 2) {
        finalRef.current += interimRef.current.trim() + " ";
        setAnswerText(finalRef.current.trim());
      }
      interimRef.current = ""; setInterimText("");
      recRef.current = null;
      // Immediate restart — keeps mic open continuously
      setTimeout(() => {
        if (restartRef.current && phaseRef.current === "user_recording") startMic(true);
      }, 80);
    };

    recRef.current = r;
    try { r.start(); } catch (_) {}
  }

  function stopMic() {
    restartRef.current = false;
    if (recRef.current) {
      recRef.current.onend = null;
      recRef.current.onerror = null;
      try { recRef.current.stop(); } catch (_) {}
      recRef.current = null;
    }
    setMicActive(false); setVoiceDetected(false); setInterimText("");
  }

  /* ─────────────────────────────────────────────────────────────
     Stop recording → use Web Speech transcript → analyze
     (No external transcription API needed)
  ───────────────────────────────────────────────────────────── */
  async function handleStopRecording() {
    if (submittedRef.current) return;
    submittedRef.current = true;
    stopTimer(); stopMic();

    // Flush any remaining interim
    if (interimRef.current.trim().length > 2) {
      finalRef.current += interimRef.current.trim() + " ";
    }
    interimRef.current = "";
    const capturedText = finalRef.current.trim();
    setAnswerText(capturedText);
    setInterimText("");
    setPhaseSync("captured");
    setUserEmotion("neutral");

    // Stop MediaRecorder (cleanup only — we use Web Speech text)
    await stopMediaRecorder();

    // 3-second countdown then analyze
    let c = 3;
    setCountdown(c);
    await new Promise<void>(res => {
      countdownRef.current = setInterval(() => {
        c--; setCountdown(c);
        if (c <= 0) { clearInterval(countdownRef.current!); setCountdown(null); res(); }
      }, 1000);
    });

    finalRef.current = capturedText;
    setPhaseSync("analyzing");
    doSubmit();
  }

  /* ── Load question ── */
  const loadQuestion = useCallback(async () => {
    // Clear previous answer immediately before anything else
    finalRef.current = ""; interimRef.current = ""; audioChunksRef.current = [];
    setAnswerText(""); setInterimText("");
    
    stopTimer(); stopVoice(); stopTyping(); stopCountdown(); stopMic();
    void stopMediaRecorder();
    submittedRef.current = false;
    setLoading(true); setPhaseSync("ai_speaking");
    setFeedback(""); setScore(null); setStrengths([]); setImprovements([]);
    setHint(null); setError(""); setMicActive(false); setVoiceDetected(false);
    setDisplayedQ(""); setTypingDone(false); setCountdown(null); setReplayCount(0);
    setAiEmotion("thinking"); setUserEmotion("neutral");
    try {
      const data = await api.generateHRQuestion(userId, sessionId);
      if (data.error) { setError(data.error); setLoading(false); return; }
      if (data.completed) {
        if (data.round_summary) setSummary(data.round_summary);
        setRoundComplete(true); setLoading(false); return;
      }
      const q = data.question || "";
      setQuestion(q); setCategory(data.category || ""); setDifficulty(data.difficulty || "");
      setHint(data.hint || null); setQuestionNo(data.question_no ?? 1); setTotalQ(data.total_questions ?? 6);
      setLoading(false); setAiEmotion("neutral");

      // Start typewriter + TTS simultaneously
      setTimeout(() => {
        typeQuestion(q, () => {});
        setReplayCount(1); // first auto-play counts
        speak(q, () => {
          // After AI finishes speaking → open mic + 3-min timer
          setPhaseSync("user_recording");
          setUserEmotion("nervous");
          startTimer(180);
          restartRef.current = true;  // arm auto-restart BEFORE startMic
          startMic();                 // Web Speech live text
          startMediaRecorder();       // MediaRecorder stays open full 3 min
        });
      }, 400);
    } catch {
      setError("Failed to load question. Please try again.");
      setLoading(false);
    }
  }, [userId, sessionId, speak]); // eslint-disable-line

  useEffect(() => { loadQuestion(); }, []); // eslint-disable-line

  /* ── API Submit ── */
  async function doSubmit() {
    setSubmitting(true);
    const finalAnswer = finalRef.current.trim() || answerText.trim() || "[No answer provided]";
    try {
      const data = await api.submitHRAnswer({ userId, sessionId, questionNo, answerText: finalAnswer });
      const s = data.score ?? 0;
      setScore(s); setFeedback(data.feedback || "");
      setStrengths(data.strengths || []); setImprovements(data.improvements || []);
      setAiEmotion(s >= 7 ? "happy" : "neutral");
      setUserEmotion(s >= 7 ? "happy" : "neutral");
      if (data.completed && data.round_summary) { setSummary(data.round_summary); setRoundComplete(true); }
      else if (data.completed) setRoundComplete(true);
      setPhaseSync("done");
    } catch {
      setFeedback("Could not evaluate answer. Please continue.");
      setPhaseSync("done");
    } finally { setSubmitting(false); }
  }

  /* ── Derived ── */
  const pct = Math.round((timeLeft / 180) * 100);
  const r = 20, circ = 2 * Math.PI * r;
  const timerColor = timeLeft <= 30 ? "#E24B4A" : timeLeft <= 60 ? "#BA7517" : PINK;
  const mins = Math.floor(timeLeft / 60), secs = timeLeft % 60;
  const timerLabel = `${mins}:${secs.toString().padStart(2, "0")}`;
  const progPct = (questionNo / totalQ) * 100;
  const wordCount = answerText.trim().split(/\s+/).filter(Boolean).length;
  const liveText = interimText ? (answerText ? answerText + " " + interimText : interimText) : answerText;

  /* ── Mic indicator state ── */
  // GREEN when audio hardware active + speech actually detected; amber when mic open but silent; gray otherwise
  const micIndicatorColor = voiceDetected ? GREEN : micActive ? "#f59e0b" : "#9ca3af";
  const micIndicatorLabel = voiceDetected ? "🟢 Voice detected — recording" : micActive ? "🎙 Mic open — start speaking" : "⏳ Activating microphone…";

  /* ════════════════════════════════════════════
     SUMMARY
  ════════════════════════════════════════════ */
  if (roundComplete) {
    setTimeout(() => onComplete(), 100);
    return null;
  }

  /* ════════════════════════════════════════════
     LOADING
  ════════════════════════════════════════════ */
  if (loading) return (
    <div style={{ maxWidth: 680, margin: "0 auto" }}>
      <style>{STYLES}</style>
      <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 16, overflow: "hidden" }}>
        {/* Header skeleton */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", borderBottom: "0.5px solid var(--color-border-tertiary)", background: "var(--color-background-secondary)" }}>
          <div style={{ width: 30, height: 30, borderRadius: "50%", background: PINK, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12, fontWeight: 500 }}>5</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-primary)" }}>Round 5 — HR Interview</div>
            <div style={{ height: 3, background: "var(--color-border-tertiary)", borderRadius: 2, marginTop: 5 }} />
          </div>
          <div style={{ fontSize: 12, padding: "4px 10px", borderRadius: 99, background: `${PINK}14`, color: PINK, border: `1px solid ${PINK}30` }}>--</div>
        </div>
        {/* Room */}
        <div style={{ background: "#ede9f9", position: "relative", height: 220 }}>
          <svg width="100%" height="220" viewBox="0 0 680 220" style={{ position: "absolute", top: 0, left: 0 }}>
            <rect width="680" height="220" fill="#f5e6f0" />
            <rect x="0" y="160" width="680" height="60" fill="#e8c8dc" />
            <rect x="0" y="158" width="680" height="6" fill="#d9aecb" />
          </svg>
          {/* Both characters idle */}
          <div style={{ position: "absolute", left: "30%", bottom: 0, transform: "translateX(-50%)", width: 200, height: 210 }}>
            <AICharacter talking={false} emotion="neutral" />
          </div>
          <div style={{ position: "absolute", left: "70%", bottom: 0, transform: "translateX(-50%)", width: 200, height: 210 }}>
            <UserCharacter talking={false} emotion="neutral" />
          </div>
          <div style={{ position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)", background: `${PINK}cc`, borderRadius: 99, padding: "5px 16px", display: "flex", alignItems: "center", gap: 8, whiteSpace: "nowrap" }}>
            <Spinner />
            <span style={{ fontSize: 11, color: "#fff", fontWeight: 500 }}>Preparing interview question…</span>
          </div>
        </div>
        <div style={{ padding: "18px 20px" }}>
          {[90, 70, 55].map((w, i) => (
            <div key={i} style={{ height: 12, background: "var(--color-background-secondary)", borderRadius: 6, marginBottom: 10, width: `${w}%` }} />
          ))}
        </div>
      </div>
    </div>
  );

  /* ── Error ── */
  if (error) return (
    <div style={{ maxWidth: 680, margin: "0 auto" }}>
      <style>{STYLES}</style>
      <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 16, padding: 32, textAlign: "center" }}>
        <div style={{ fontSize: 14, color: "#E24B4A", marginBottom: 16 }}>{error}</div>
        <button onClick={loadQuestion}
          onMouseEnter={e => { e.currentTarget.style.background = "#C71678"; e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 4px 10px rgba(233,30,140,.35)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = PINK; e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}
          style={{ padding: "10px 26px", background: PINK, color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 500, cursor: "pointer", transition: "background .15s, transform .15s, box-shadow .15s" }}>Retry</button>
      </div>
    </div>
  );

  /* ════════════════════════════════════════════
     MAIN — same structure / maxWidth as Round 4
  ════════════════════════════════════════════ */
  return (
    <div style={{ maxWidth: 680, margin: "0 auto", animation: "r5fade .4s ease" }}>
      <style>{STYLES}</style>

      <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 16, overflow: "hidden" }}>

        {/* ══ HEADER — identical structure to Round 4 ══ */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", borderBottom: "0.5px solid var(--color-border-tertiary)", background: "var(--color-background-secondary)" }}>
          <div style={{ width: 30, height: 30, borderRadius: "50%", background: PINK, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12, fontWeight: 500, flexShrink: 0 }}>5</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-primary)" }}>Round 5 — HR Interview</div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
              <div style={{ flex: 1, height: 3, background: "var(--color-border-tertiary)", borderRadius: 2, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${progPct}%`, background: `linear-gradient(90deg,${PINK},#5B8DEF,${PINK})`, backgroundSize: "200% 100%", borderRadius: 2, transition: "width .6s ease", animation: "r5pgshim 2s linear infinite" }} />
              </div>
              <span style={{ fontSize: 11, color: "var(--color-text-tertiary)", flexShrink: 0 }}>Q {questionNo}/{totalQ}</span>
            </div>
          </div>
          {difficulty && (
            <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 99, background: `${PINK}14`, color: PINK, border: `1px solid ${PINK}30`, fontWeight: 500, textTransform: "capitalize" }}>{difficulty}</span>
          )}
          {/* Circular timer — same as Round 4 */}
          <div style={{ position: "relative", width: 48, height: 48, flexShrink: 0 }}>
            <svg width={48} height={48} style={{ transform: "rotate(-90deg)" }}>
              <circle cx={24} cy={24} r={r} fill="none" stroke="var(--color-border-tertiary)" strokeWidth="3" />
              <circle cx={24} cy={24} r={r} fill="none" stroke={timerColor}
                strokeWidth="3"
                strokeDasharray={`${circ * (pct / 100)} ${circ * (1 - pct / 100)}`}
                strokeLinecap="round"
                style={{ transition: "stroke-dasharray .9s linear, stroke .3s" }}
              />
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: phase === "user_recording" ? 10 : 13, fontWeight: 500, color: timerColor }}>
              {phase === "done" || phase === "analyzing" ? "✓" : phase === "user_recording" ? timerLabel : "🎧"}
            </div>
          </div>
        </div>

        {/* ══ ROOM — same height/structure as Round 4 ══ */}
        <div style={{ background: "#f5e6f0", position: "relative", height: 220 }}>
          <svg width="100%" height="220" viewBox="0 0 680 220" style={{ position: "absolute", top: 0, left: 0 }}>
            <rect width="680" height="220" fill="#f5e6f0" />
            <rect x="0" y="160" width="680" height="60" fill="#e8c8dc" />
            <rect x="0" y="158" width="680" height="6" fill="#d9aecb" />
            {/* Windows */}
            <rect x="30" y="20" width="90" height="65" rx="4" fill="#e4ccd8" opacity=".5" />
            <rect x="34" y="24" width="82" height="57" rx="2" fill="#d9b8cc" opacity=".5" />
            <rect x="560" y="20" width="90" height="65" rx="4" fill="#e4ccd8" opacity=".5" />
            <rect x="564" y="24" width="82" height="57" rx="2" fill="#d9b8cc" opacity=".5" />
            {/* AI desk + monitor */}
            <rect x="180" y="152" width="120" height="14" rx="3" fill="#d9aecb" />
            <rect x="220" y="100" width="80" height="54" rx="5" fill="#2d1040" />
            <rect x="224" y="104" width="72" height="44" rx="3" fill="#3d1a55" />
            <ScreenBars active={phase === "ai_speaking"} color={PINK} />
            <rect x="253" y="154" width="14" height="10" fill="#4a1868" />
            <rect x="240" y="162" width="40" height="5" rx="2" fill="#2d1040" />
            {/* User desk + device */}
            <rect x="380" y="152" width="120" height="14" rx="3" fill="#aed8cc" />
            <rect x="418" y="108" width="70" height="46" rx="5" fill="#0a2e28" />
            <rect x="422" y="112" width="62" height="36" rx="3" fill="#0d3830" />
            <ScreenBars active={voiceDetected} color="#00C9A7" />
            <rect x="448" y="154" width="14" height="10" fill="#082018" />
            <rect x="435" y="162" width="40" height="5" rx="2" fill="#0a2e28" />
          </svg>

          {/* AI character — left */}
          <div style={{ position: "absolute", left: "28%", bottom: 0, transform: "translateX(-50%)", width: 200, height: 210 }}>
            <AICharacter talking={phase === "ai_speaking"} emotion={aiEmotion} />
          </div>

          {/* User character — right */}
          <div style={{ position: "absolute", left: "72%", bottom: 0, transform: "translateX(-50%)", width: 200, height: 210 }}>
            <UserCharacter talking={voiceDetected} emotion={userEmotion} />
          </div>

          {/* LIVE badge */}
          <div style={{ position: "absolute", top: 12, right: 16, background: PINK, borderRadius: 99, padding: "4px 10px", display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff", animation: "r5pulse 1s infinite" }} />
            <span style={{ fontSize: 10, color: "#fff", fontWeight: 500 }}>LIVE</span>
          </div>

          {/* AI name tag */}
          <div style={{ position: "absolute", top: 12, left: 16, background: "rgba(45,16,64,.75)", borderRadius: 99, padding: "4px 12px" }}>
            <span style={{ fontSize: 10, color: "#f0b0d0", fontWeight: 500 }}>🤖 AI Interviewer</span>
          </div>

          {/* Active speaking labels */}
          {phase === "ai_speaking" && (
            <div style={{ position: "absolute", bottom: 10, left: 16, background: `${PINK}ee`, borderRadius: 99, padding: "4px 12px", display: "flex", alignItems: "center", gap: 6, animation: "r5fade .3s ease" }}>
              <WaveBars active count={4} color="#fff" />
              <span style={{ fontSize: 10, color: "#fff", fontWeight: 600 }}>AI speaking…</span>
            </div>
          )}
          {phase === "user_recording" && (
            <div style={{ position: "absolute", bottom: 10, right: 16, borderRadius: 99, padding: "4px 12px", display: "flex", alignItems: "center", gap: 6, animation: "r5fade .3s ease",
              background: voiceDetected ? `${GREEN}ee` : micActive ? "#f59e0bee" : "#6b7280ee" }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#fff", animation: voiceDetected || micActive ? "r5micpulse 1s ease-in-out infinite" : "none" }} />
              <WaveBars active={voiceDetected} color="#fff" count={4} />
              <span style={{ fontSize: 10, color: "#fff", fontWeight: 600 }}>
                {voiceDetected ? "Capturing…" : micActive ? "Listening…" : "Opening mic…"}
              </span>
            </div>
          )}

          {/* Category chip */}
          {category && (
            <div style={{ position: "absolute", bottom: 10, left: "50%", transform: "translateX(-50%)", background: "rgba(45,16,64,.6)", borderRadius: 99, padding: "3px 10px" }}>
              <span style={{ fontSize: 10, color: "#f0b0d0", textTransform: "capitalize" }}>{category.replace(/_/g, " ")}</span>
            </div>
          )}
        </div>

        {/* ══ QUESTION BUBBLE — same as Round 4 ══ */}
        <div style={{ padding: "16px 18px 0" }}>
          <div style={{ background: "var(--color-background-secondary)", border: `0.5px solid ${phase === "ai_speaking" ? PINK + "66" : "var(--color-border-tertiary)"}`, borderRadius: 12, padding: "13px 15px", marginBottom: 14, position: "relative", transition: "border-color .4s" }}>
            {/* Speech caret */}
            <div style={{ position: "absolute", top: -8, left: 26, width: 16, height: 16, background: "var(--color-background-secondary)", borderLeft: "0.5px solid var(--color-border-tertiary)", borderTop: "0.5px solid var(--color-border-tertiary)", transform: "rotate(45deg)", clipPath: "polygon(0 0,100% 0,0 100%)" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 7 }}>
              <WaveBars active={phase === "ai_speaking"} color={PINK} count={5} />
              <span style={{ fontSize: 10, fontWeight: 500, color: PINK, textTransform: "uppercase", letterSpacing: ".08em" }}>
                {phase === "ai_speaking" ? "AI is asking…" : typingDone ? "Question" : "Preparing…"}
              </span>
              {/* Replay button — only shown once, max 1 manual replay */}
              {typingDone && phase !== "ai_speaking" && replayCount < 2 && (
                <button
                  onClick={() => {
                    setReplayCount(c => c + 1);
                    speak(question);
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = `${PINK}14`; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "none"; }}
                  style={{ marginLeft: "auto", fontSize: 11, color: PINK, background: "none", border: `1px solid ${PINK}40`, borderRadius: 99, padding: "2px 10px", cursor: "pointer", flexShrink: 0, transition: "background .15s" }}>
                  🔊 Replay
                </button>
              )}
            </div>
            <div style={{ fontSize: 14, color: "var(--color-text-primary)", lineHeight: 1.65 }}>
              {displayedQ}
              {!typingDone && <span style={{ display: "inline-block", width: 2, height: 14, background: PINK, marginLeft: 2, verticalAlign: "middle", animation: "r5cursor .7s infinite" }} />}
            </div>
          </div>
        </div>

        {/* ══ RECORDING SECTION ══ */}
        {phase === "user_recording" && (
          <div style={{ padding: "0 18px", animation: "r5fade .35s ease" }}>
            {/* Mic status bar */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              marginBottom: 10, padding: "10px 14px", borderRadius: 10,
              background: voiceDetected ? GREEN_BG : micActive ? "#fef9c3" : "var(--color-background-secondary)",
              border: `1.5px solid ${voiceDetected ? GREEN_BORDER : micActive ? "#fde047" : "var(--color-border-tertiary)"}`,
              transition: "all .35s",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{
                  width: 10, height: 10, borderRadius: "50%",
                  background: micIndicatorColor, display: "inline-block",
                  animation: voiceDetected || micActive ? "r5micpulse 1s ease-in-out infinite" : "none",
                  transition: "background .3s",
                }} />
                <span style={{ fontSize: 13, fontWeight: 500, color: voiceDetected ? GREEN : micActive ? "#a16207" : "var(--color-text-tertiary)", transition: "color .3s" }}>
                  {micIndicatorLabel}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <WaveBars active={voiceDetected} color={voiceDetected ? GREEN : "#9ca3af"} count={5} />
                {/* Retry mic button — shown when mic not active */}
                {!micActive && !voiceDetected && (
                  <button onClick={() => { stopMic(); setTimeout(() => { restartRef.current = true; startMic(); }, 100); }}
                    onMouseEnter={e => { e.currentTarget.style.background = "#C71678"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = PINK; }}
                    style={{ fontSize: 11, padding: "3px 10px", borderRadius: 6, background: PINK, color: "#fff", border: "none", cursor: "pointer", flexShrink: 0, transition: "background .15s" }}>
                    🎙 Retry Mic
                  </button>
                )}
              </div>
            </div>

            {/* Live transcript */}
            <div style={{ marginBottom: 10, padding: "11px 14px", borderRadius: 10, background: "var(--color-background-secondary)", border: `1px solid ${voiceDetected ? GREEN_BORDER : "var(--color-border-tertiary)"}`, transition: "border-color .3s", minHeight: 60 }}>
              <div style={{ fontSize: 10, fontWeight: 500, color: "var(--color-text-tertiary)", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 5, display: "flex", alignItems: "center", gap: 6 }}>
                <span>🎤 Your answer (live)</span>
                <span style={{ marginLeft: "auto", color: voiceDetected ? GREEN : "var(--color-text-tertiary)" }}>{wordCount} words</span>
              </div>
              {liveText ? (
                <div style={{ fontSize: 13.5, color: "var(--color-text-primary)", lineHeight: 1.65 }}>
                  {answerText}
                  {interimText && <span style={{ color: "var(--color-text-tertiary)", fontStyle: "italic" }}>{answerText ? " " : ""}{interimText}</span>}
                  {voiceDetected && <span style={{ display: "inline-block", width: 2, height: 13, background: GREEN, marginLeft: 3, verticalAlign: "middle", animation: "r5cursor .7s infinite" }} />}
                </div>
              ) : (
                <div style={{ fontSize: 13, color: "var(--color-text-tertiary)", fontStyle: "italic" }}>Start speaking — your words will appear here…</div>
              )}
            </div>

            {/* Fallback text input */}
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 11, color: "var(--color-text-tertiary)", marginBottom: 4 }}>🖊 Or type your answer if mic isn't working:</div>
              <textarea
                placeholder="Type your answer here as a fallback…"
                style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--color-border-tertiary)", fontSize: 13, fontFamily: "inherit", resize: "vertical", minHeight: 70, background: "var(--color-background-secondary)", color: "var(--color-text-primary)", boxSizing: "border-box" }}
                onChange={(e) => { finalRef.current = e.target.value; setAnswerText(e.target.value); }}
                value={answerText}
              />
            </div>

            {hint && (
              <div style={{ marginBottom: 10, padding: "8px 12px", borderRadius: 8, background: `${PINK}0a`, border: `0.5px solid ${PINK}25`, fontSize: 12.5, color: "var(--color-text-tertiary)" }}>
                💡 Hint: {hint}
              </div>
            )}
          </div>
        )}

        {/* ══ CAPTURED — read-only transcript + 5-second countdown ══ */}
        {(phase === "captured" || phase === "analyzing") && (
          <div style={{ padding: "0 18px", animation: "r5fade .35s ease" }}>
            {/* Success banner */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 10, background: GREEN_BG, border: `1px solid ${GREEN_BORDER}`, marginBottom: 12 }}>
              <span style={{ fontSize: 18 }}>✅</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: GREEN }}>Voice captured successfully</div>
                <div style={{ fontSize: 11, color: "#15803d" }}>Transcribing with Whisper AI — {wordCount} words so far</div>
              </div>
              {countdown !== null && (
                <div style={{ marginLeft: "auto", display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: PINK, animation: "r5countdown .9s ease-in-out infinite", lineHeight: 1 }}>{countdown}</div>
                  <div style={{ fontSize: 9, color: "var(--color-text-tertiary)" }}>analyzing…</div>
                </div>
              )}
              {phase === "analyzing" && countdown === null && <Spinner />}
            </div>

            {/* Read-only transcript box */}
            <div style={{ marginBottom: 14, padding: "14px 16px", borderRadius: 12, background: "var(--color-background-secondary)", border: `1.5px solid ${GREEN_BORDER}` }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: GREEN, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                <span>🎤 Your spoken answer</span>
                <span style={{ marginLeft: "auto", fontWeight: 400, color: "var(--color-text-tertiary)" }}>{wordCount} words · voice-to-text</span>
              </div>
              <div style={{ fontSize: 14, color: "var(--color-text-primary)", lineHeight: 1.7, userSelect: "text" }}>
                {answerText || <span style={{ color: "var(--color-text-tertiary)", fontStyle: "italic" }}>No speech detected.</span>}
              </div>
            </div>

            {phase === "analyzing" && (
              <div style={{ textAlign: "center", padding: "12px 0", color: "var(--color-text-tertiary)", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <Spinner /> AI is analyzing your response…
              </div>
            )}
          </div>
        )}

        {/* Feedback hidden — real interview mode */}

        {/* ══ ACTION BUTTON — same padding structure as Round 4 ══ */}
        <div style={{ padding: "0 18px 18px" }}>
          {/* Show message while AI is still speaking */}
          {phase === "ai_speaking" && !typingDone && (
            <div style={{ textAlign: "center", padding: 12, fontSize: 12, color: "var(--color-text-tertiary)", background: "var(--color-background-secondary)", borderRadius: 10 }}>
              <Spinner /> Wait for question to finish loading…
            </div>
          )}
          {phase === "ai_speaking" && typingDone && (
            <div style={{ textAlign: "center", padding: 12, fontSize: 13, color: "var(--color-text-tertiary)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <Spinner /> Microphone will open automatically when AI finishes speaking…
            </div>
          )}
          {phase === "user_recording" && (
            <button
              onClick={() => {
                if (wordCount < 3 && !answerText.trim()) {
                  alert("Please speak or type at least a few words before submitting.");
                  return;
                }
                handleStopRecording();
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "#C71678"; e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 4px 10px rgba(233,30,140,.35)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = PINK; e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}
              style={{ width: "100%", padding: 12, background: PINK, color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "background .15s, transform .15s, box-shadow .15s" }}>
              Done Speaking → Submit Answer
            </button>
          )}
          {phase === "done" && !roundComplete && questionNo < totalQ && (
            <button onClick={loadQuestion}
              onMouseEnter={e => { e.currentTarget.style.background = "#15803d"; e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 4px 10px rgba(22,163,74,.35)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "#16a34a"; e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}
              style={{ width: "100%", padding: 12, background: "#16a34a", color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, transition: "background .15s, transform .15s, box-shadow .15s" }}>
              Next Question → ({questionNo + 1}/{totalQ})
            </button>
          )}
          {phase === "done" && !roundComplete && !submitting && questionNo >= totalQ && (
            <div style={{ textAlign: "center", padding: 12, fontSize: 13, color: "var(--color-text-tertiary)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <Spinner /> Finishing round…
            </div>
          )}
        </div>

      </div>
    </div>
  );
}