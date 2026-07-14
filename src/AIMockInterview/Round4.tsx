"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { api } from "./lib/api";

interface Round4Props {
  userId: string;
  sessionId: string;
  onComplete: () => void;
}

const PURPLE = "#2563EB";

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
@keyframes r4bob { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
@keyframes r4blink { 0%,90%,100%{transform:scaleY(1)} 95%{transform:scaleY(0.05)} }
@keyframes r4eyeL { 0%,100%{transform:translateX(0)} 40%{transform:translateX(-3px)} 70%{transform:translateX(3px)} }
@keyframes r4eyeR { 0%,100%{transform:translateX(0)} 40%{transform:translateX(-3px)} 70%{transform:translateX(3px)} }
@keyframes r4bar  { 0%,100%{transform:scaleY(.25)} 50%{transform:scaleY(1)} }
@keyframes r4wave { 0%,100%{transform:scaleY(.3)} 50%{transform:scaleY(1)} }
@keyframes r4pulse{ 0%,100%{opacity:.7} 50%{opacity:1} }
@keyframes r4hand { 0%,100%{transform:rotate(0deg)} 30%{transform:rotate(-18deg)} 60%{transform:rotate(12deg)} }
@keyframes r4fadeup{ from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
@keyframes r4slidein{ from{opacity:0;transform:translateX(-8px)} to{opacity:1;transform:translateX(0)} }
@keyframes r4cursor{ 0%,100%{opacity:1} 50%{opacity:0} }
@keyframes r4spin  { to{transform:rotate(360deg)} }
@keyframes r4ripple{ 0%{transform:scale(.7);opacity:.7} 100%{transform:scale(2.2);opacity:0} }
@keyframes r4pgshim{ 0%{background-position:200% 0} 100%{background-position:-200% 0} }
`;

function Spinner() {
  return (
    <svg style={{ animation: "r4spin .8s linear infinite", display: "inline-block" }} width={15} height={15} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity=".25" />
      <path fill="currentColor" opacity=".75" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
    </svg>
  );
}

function WaveBars({ active, color = PURPLE, count = 5 }: { active: boolean; color?: string; count?: number }) {
  const heights = [6, 10, 14, 10, 8, 12, 6, 10, 14];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 2, height: 22 }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{
          width: 3, borderRadius: 2, background: color,
          height: active ? heights[i % heights.length] : 4,
          transformOrigin: "center bottom",
          animation: active ? `r4bar .7s ease-in-out infinite` : "none",
          animationDelay: `${i * 0.1}s`,
          transition: "height .3s",
          opacity: active ? 1 : 0.4,
        }} />
      ))}
    </div>
  );
}

function AlexCharacter({ talking, emotion }: { talking: boolean; emotion: "neutral" | "happy" | "sad" }) {
  const mouthPath = emotion === "happy"
    ? "M 88 128 Q 100 142 112 128"
    : emotion === "sad"
    ? "M 90 133 Q 100 126 110 133"
    : "M 90 128 Q 100 136 110 128";

  const lBrow = emotion === "happy"
    ? "M80 100 Q88 95 96 100"
    : emotion === "sad"
    ? "M80 106 Q88 102 96 106"
    : "M80 103 Q88 99 96 103";

  const rBrow = emotion === "happy"
    ? "M104 100 Q112 95 120 100"
    : emotion === "sad"
    ? "M104 102 Q112 106 120 102"
    : "M104 103 Q112 99 120 103";

  const mouthAnim = talking
    ? { animation: "r4bob .22s ease-in-out infinite alternate" }
    : {};

  return (
    <svg
      width="200" height="210" viewBox="0 0 200 210"
      style={{ position: "absolute", bottom: 0, left: "50%", transform: "translateX(-50%)", animation: "r4bob 3s ease-in-out infinite" }}
    >
      {/* Shadow */}
      <ellipse cx="100" cy="196" rx="38" ry="6" fill="#b8aedc" opacity=".4" />

      {/* Body */}
      <rect x="72" y="145" width="56" height="50" rx="8" fill="#5a3fa0" />
      <rect x="76" y="145" width="48" height="10" rx="4" fill="#6b4db5" />

      {/* Left arm (waving) */}
      <g style={{ transformOrigin: "72px 158px", animation: "r4hand 2.5s ease-in-out infinite" }}>
        <rect x="48" y="148" width="26" height="14" rx="7" fill="#5a3fa0" />
        <ellipse cx="48" cy="155" rx="9" ry="9" fill="#f5c9a0" />
      </g>

      {/* Right arm */}
      <rect x="126" y="148" width="26" height="14" rx="7" fill="#5a3fa0" />
      <ellipse cx="152" cy="155" rx="9" ry="9" fill="#f5c9a0" />

      {/* Legs */}
      <rect x="84" y="188" width="14" height="16" rx="4" fill="#3d2a7a" />
      <rect x="102" y="188" width="14" height="16" rx="4" fill="#3d2a7a" />
      <rect x="82" y="198" width="18" height="8" rx="3" fill="#2a1d5c" />
      <rect x="100" y="198" width="18" height="8" rx="3" fill="#2a1d5c" />

      {/* Head */}
      <ellipse cx="100" cy="110" rx="36" ry="38" fill="#f5c9a0" />

      {/* Hair */}
      <ellipse cx="100" cy="88" rx="38" ry="30" fill="#2563EB" />
      <ellipse cx="100" cy="80" rx="36" ry="22" fill="#6a3de0" />

      {/* Ears */}
      <ellipse cx="65" cy="112" rx="7" ry="9" fill="#f5c9a0" />
      <ellipse cx="135" cy="112" rx="7" ry="9" fill="#f5c9a0" />

      {/* Left eye */}
      <ellipse cx="88" cy="112" rx="9" ry="10" fill="#fff" />
      <ellipse cx="88" cy="113" rx="5" ry="5" fill="#3d2a7a" style={{ animation: "r4eyeL 4s ease-in-out infinite" }} />
      <ellipse cx="90" cy="111" rx="2" ry="2" fill="#fff" opacity=".6" />

      {/* Right eye */}
      <ellipse cx="112" cy="112" rx="9" ry="10" fill="#fff" />
      <ellipse cx="112" cy="113" rx="5" ry="5" fill="#3d2a7a" style={{ animation: "r4eyeR 4s ease-in-out infinite" }} />
      <ellipse cx="114" cy="111" rx="2" ry="2" fill="#fff" opacity=".6" />

      {/* Eyebrows */}
      <path d={lBrow} fill="none" stroke="#5a3d20" strokeWidth="2" strokeLinecap="round" style={{ transition: "d .4s" }} />
      <path d={rBrow} fill="none" stroke="#5a3d20" strokeWidth="2" strokeLinecap="round" style={{ transition: "d .4s" }} />

      {/* Mouth */}
      <path d={mouthPath} fill="none" stroke="#c47a50" strokeWidth="2.5" strokeLinecap="round"
        style={{ transition: "d .3s ease", ...(talking ? mouthAnim : {}) }} />

      {/* Cheeks */}
      <ellipse cx="78" cy="122" rx="5" ry="3" fill="#e8a080" opacity=".5" />
      <ellipse cx="122" cy="122" rx="5" ry="3" fill="#e8a080" opacity=".5" />
    </svg>
  );
}

function ScreenBars({ active }: { active: boolean }) {
  const bars = [
    { h: 8, c: "#2563EB", d: "0s" },
    { h: 14, c: "#9366FF", d: ".1s" },
    { h: 18, c: "#5B8DEF", d: ".2s" },
    { h: 14, c: "#9366FF", d: ".1s" },
    { h: 10, c: "#2563EB", d: ".15s" },
    { h: 16, c: "#5B8DEF", d: ".25s" },
    { h: 12, c: "#9366FF", d: ".05s" },
    { h: 8,  c: "#2563EB", d: ".2s"  },
    { h: 14, c: "#5B8DEF", d: ".1s"  },
  ];
  return (
    <>
      {bars.map((b, i) => (
        <rect key={i}
          x={68 + i * 7} y={19 - b.h / 2} width={4} height={b.h} rx={2}
          fill={b.c}
          style={active ? { animation: `r4bar .6s ease-in-out infinite`, animationDelay: b.d } : { opacity: 0.3 }}
        />
      ))}
    </>
  );
}

export default function Round4({ userId, sessionId, onComplete }: Round4Props) {
  const [question, setQuestion]           = useState("");
  const [options, setOptions]             = useState<string[]>([]);
  const [correctAnswer, setCorrectAnswer] = useState<number | null>(null);
  const [explanation, setExplanation]     = useState("");
  const [category, setCategory]           = useState("");
  const [difficulty, setDifficulty]       = useState("");
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [feedback, setFeedback]           = useState("");
  const [isCorrect, setIsCorrect]         = useState<boolean | null>(null);
  const [questionNo, setQuestionNo]       = useState(1);
  const [totalQ, setTotalQ]               = useState(8);
  const [timeLeft, setTimeLeft]           = useState(90);
  const [loading, setLoading]             = useState(true);
  const [submitting, setSubmitting]       = useState(false);
  const [submitted, setSubmitted]         = useState(false);
  const [summary, setSummary]             = useState<any>(null);
  const [roundComplete, setRoundComplete] = useState(false);
  const [error, setError]                 = useState("");
  const [talking, setTalking]             = useState(false);
  const [displayedText, setDisplayedText] = useState("");
  const [typingDone, setTypingDone]       = useState(false);
  const [emotion, setEmotion]             = useState<"neutral" | "happy" | "sad">("neutral");
  const [playCount, setPlayCount]         = useState(0);
  const [canReplay, setCanReplay]         = useState(false);

  const timerRef     = useRef<ReturnType<typeof setInterval> | null>(null);
  const submittedRef = useRef(false);
  const typingRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const talkingRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const fullQuestion = useRef("");

  const stopTimer   = () => { clearInterval(timerRef.current!); };
  const stopVoice   = () => { window.speechSynthesis?.cancel(); };
  const stopTyping  = () => { clearInterval(typingRef.current!); clearInterval(talkingRef.current!); };

  function startTimer(s: number) {
    stopTimer();
    setTimeLeft(s);
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current!); return 0; }
        return t - 1;
      });
    }, 1000);
  }

  useEffect(() => {
    if (timeLeft === 0 && !submittedRef.current) doSubmit(null, true);
  }, [timeLeft]); // eslint-disable-line

  useEffect(() => () => { stopTimer(); stopVoice(); stopTyping(); }, []);

  function typeQuestion(text: string, onDone: () => void) {
    stopTyping();
    fullQuestion.current = text;
    setDisplayedText("");
    setTypingDone(false);
    setTalking(true);
    let i = 0;
    typingRef.current = setInterval(() => {
      i++;
      setDisplayedText(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(typingRef.current!);
        setTalking(false);
        setTypingDone(true);
        onDone();
      }
    }, 26);
  }

  const speak = useCallback((text: string, onEnd?: () => void) => {
    if (!window.speechSynthesis || !text) { onEnd?.(); return; }
    stopVoice();
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = "en-US"; utt.rate = 0.88; utt.pitch = 1; utt.volume = 1;
    utt.onend = () => onEnd?.();
    utt.onerror = () => onEnd?.();
    const go = () => {
      const voices = window.speechSynthesis.getVoices();
      const pick = voices.find(v => v.lang === "en-US" && v.localService)
        || voices.find(v => v.lang.startsWith("en-US"))
        || voices.find(v => v.lang.startsWith("en"));
      if (pick) utt.voice = pick;
      window.speechSynthesis.speak(utt);
    };
    if (window.speechSynthesis.getVoices().length > 0) {
      go();
    } else {
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.onvoiceschanged = null;
        go();
      };
      setTimeout(() => { if (window.speechSynthesis.getVoices().length > 0) go(); }, 500);
    }
  }, []);

  const loadQuestion = useCallback(async () => {
    stopTimer(); stopVoice(); stopTyping();
    submittedRef.current = false;
    setLoading(true); setSelectedOption(null); setFeedback(""); setIsCorrect(null);
    setSubmitted(false); setExplanation(""); setError(""); setDisplayedText("");
    setTypingDone(false); setTalking(false); setEmotion("neutral");
    setPlayCount(0); setCanReplay(false);
    try {
      const data = await api.generateCommunicationQuestion(userId, sessionId);
      if (data.error) { setError(data.error); setLoading(false); return; }
      if (data.completed) {
        if (data.round_summary) setSummary(data.round_summary);
        setRoundComplete(true); setLoading(false); return;
      }
      const q = data.question || "";
      const opts = Array.isArray(data.options) ? data.options : [];
      setQuestion(q); setOptions(opts);
      setCorrectAnswer(data.correctAnswer != null ? Number(data.correctAnswer) : null);
      setCategory(data.category || ""); setDifficulty(data.difficulty || "");
      setQuestionNo(data.question_no ?? 1); setTotalQ(data.total_questions ?? 8);
      setLoading(false);
      const tl = data.timeLimit ?? 90;
      const warmup = () => {
        setTalking(true);
        setPlayCount(1);
        setTypingDone(false);
        speak(q, () => {
          setTalking(false);
          setTypingDone(true);
          startTimer(tl);
          setCanReplay(true);
        });
      };
      if (window.speechSynthesis.getVoices().length > 0) {
        setTimeout(warmup, 400);
      } else {
        window.speechSynthesis.onvoiceschanged = () => {
          window.speechSynthesis.onvoiceschanged = null;
          setTimeout(warmup, 400);
        };
        setTimeout(warmup, 800);
      }
    } catch {
      setError("Failed to load question. Please try again.");
      setLoading(false);
    }
  }, [userId, sessionId, speak]); // eslint-disable-line

  useEffect(() => { loadQuestion(); }, []); // eslint-disable-line

  async function doSubmit(option: number | null, timedOut = false) {
    if (submittedRef.current || submitting) return;
    submittedRef.current = true;
    stopTimer(); stopVoice(); stopTyping(); setTalking(false);
    setSubmitted(true); setSubmitting(true);
    const chosen = option ?? selectedOption ?? 0;
    try {
      const data = await api.submitCommunicationQuestionAnswer({ userId, sessionId, questionNo, selectedOption: chosen });
      const correct = data.is_correct ?? false;
      setIsCorrect(correct);
      setEmotion(correct ? "happy" : "sad");
      setFeedback(data.feedback || "");
      setExplanation(data.explanation || "");
      if (data.completed && data.round_summary) { setSummary(data.round_summary); setRoundComplete(true); }

    } catch { /* silent */ } finally { setSubmitting(false); }
  }

  const pct = Math.round((timeLeft / 90) * 100);
  const r = 20, circ = 2 * Math.PI * r;
  const timerColor = timeLeft <= 10 ? "#E24B4A" : timeLeft <= 20 ? "#BA7517" : PURPLE;
  const progPct = (questionNo / totalQ) * 100;

  /* ── Summary ── */
  if (roundComplete) {
    return (
      <div style={{ maxWidth: 680, margin: "0 auto", animation: "r4fadeup .4s ease" }}>
        <style>{STYLES}</style>
        <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 16, overflow: "hidden" }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", borderBottom: "0.5px solid var(--color-border-tertiary)", background: "var(--color-background-secondary)" }}>
            <div style={{ width: 30, height: 30, borderRadius: "50%", background: PURPLE, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12, fontWeight: 500 }}>4</div>
            <div style={{ flex: 1, fontSize: 13, fontWeight: 500, color: "var(--color-text-primary)" }}>Round 4 — Communication</div>
          </div>
          {/* Body */}
          <div style={{ padding: "32px 24px", textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
            <div style={{ fontSize: 20, fontWeight: 600, color: "var(--color-text-primary)", marginBottom: 6 }}>Round 4 Complete!</div>
            <div style={{ fontSize: 13, color: "var(--color-text-secondary)", marginBottom: 24, lineHeight: 1.6 }}>
              Great job! Let's continue to the final round.
            </div>
            <button
              onClick={onComplete}
              onMouseEnter={e => { e.currentTarget.style.background = "#6A3EE8"; e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 4px 10px rgba(123,77,255,.35)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = PURPLE; e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}
              style={{ width: "100%", padding: "13px", background: PURPLE, color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer", letterSpacing: ".01em", transition: "background .15s, transform .15s, box-shadow .15s" }}
            >
              Continue to Round 5 — HR Interview →
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) return (
    <div style={{ maxWidth: 680, margin: "0 auto" }}>
      <style>{STYLES}</style>
      <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 16, overflow: "hidden" }}>
        {/* Header skeleton */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", borderBottom: "0.5px solid var(--color-border-tertiary)", background: "var(--color-background-secondary)" }}>
          <div style={{ width: 30, height: 30, borderRadius: "50%", background: PURPLE, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12, fontWeight: 500 }}>4</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-primary)" }}>Round 4 — Communication</div>
            <div style={{ height: 3, background: "var(--color-border-tertiary)", borderRadius: 2, marginTop: 5 }} />
          </div>
          <div style={{ fontSize: 12, padding: "4px 10px", borderRadius: 99, background: "#2563EB14", color: PURPLE, border: `1px solid #2563EB30` }}>--</div>
        </div>
        {/* Room with character */}
        <div style={{ background: "#e8f0fd", position: "relative", height: 220 }}>
          <svg width="100%" height="220" viewBox="0 0 680 220" style={{ position: "absolute", top: 0, left: 0 }}>
            <rect width="680" height="220" fill="#e8f0fd" />
            <rect x="0" y="160" width="680" height="60" fill="#c7ddfa" />
            <rect x="0" y="158" width="680" height="6" fill="#a9c8f5" />
          </svg>
          <AlexCharacter talking={false} emotion="neutral" />
          <div style={{ position: "absolute", top: 12, left: 16, background: "rgba(45,32,64,.7)", borderRadius: 99, padding: "4px 12px" }}>
            <span style={{ fontSize: 10, color: "#a9c8f0", fontWeight: 500 }}>Alex — AI Interviewer</span>
          </div>
          <div style={{ position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)", background: PURPLE, borderRadius: 99, padding: "5px 14px", display: "flex", alignItems: "center", gap: 6 }}>
            <Spinner />
            <span style={{ fontSize: 11, color: "#fff", fontWeight: 500 }}>Preparing question…</span>
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

  if (error) return (
    <div style={{ maxWidth: 680, margin: "0 auto" }}>
      <style>{STYLES}</style>
      <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 16, padding: 32, textAlign: "center" }}>
        <div style={{ fontSize: 14, color: "var(--color-text-danger)", marginBottom: 16 }}>{error}</div>
        <button onClick={loadQuestion}
          onMouseEnter={e => { e.currentTarget.style.background = "#6A3EE8"; e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 4px 10px rgba(123,77,255,.35)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = PURPLE; e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}
          style={{ padding: "10px 24px", background: PURPLE, color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 500, cursor: "pointer", transition: "background .15s, transform .15s, box-shadow .15s" }}>
          Retry
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", animation: "r4fadeup .4s ease" }}>
      <style>{STYLES}</style>

      <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 16, overflow: "hidden" }}>

        {/* ── Header ── */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", borderBottom: "0.5px solid var(--color-border-tertiary)", background: "var(--color-background-secondary)" }}>
          <div style={{ width: 30, height: 30, borderRadius: "50%", background: PURPLE, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12, fontWeight: 500, flexShrink: 0 }}>4</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-primary)" }}>Round 4 — Communication</div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
              <div style={{ flex: 1, height: 3, background: "var(--color-border-tertiary)", borderRadius: 2, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${progPct}%`, background: `linear-gradient(90deg,${PURPLE},#5B8DEF,${PURPLE})`, backgroundSize: "200% 100%", borderRadius: 2, transition: "width .6s ease", animation: "r4pgshim 2s linear infinite" }} />
              </div>
              <span style={{ fontSize: 11, color: "var(--color-text-tertiary)", flexShrink: 0 }}>Q {questionNo}/{totalQ}</span>
            </div>
          </div>
          {difficulty && (
            <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 99, background: "#2563EB14", color: PURPLE, border: `1px solid #2563EB30`, fontWeight: 500, textTransform: "capitalize" }}>{difficulty}</span>
          )}
          {/* Circular timer */}
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
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 500, color: timerColor }}>
              {submitted ? "✓" : timeLeft}
            </div>
          </div>
        </div>

        {/* ── Room / Character ── */}
        <div style={{ background: "#e8f0fd", position: "relative", height: 220 }}>
          <svg width="100%" height="220" viewBox="0 0 680 220" style={{ position: "absolute", top: 0, left: 0 }}>
            <rect width="680" height="220" fill="#e8f0fd" />
            <rect x="0" y="160" width="680" height="60" fill="#c7ddfa" />
            <rect x="0" y="158" width="680" height="6" fill="#a9c8f5" />
            <rect x="40" y="20" width="100" height="70" rx="4" fill="#ccc4e8" opacity=".5" />
            <rect x="44" y="24" width="92" height="62" rx="2" fill="#b8aedc" opacity=".5" />
            <rect x="540" y="30" width="100" height="70" rx="4" fill="#ccc4e8" opacity=".5" />
            <rect x="544" y="34" width="92" height="62" rx="2" fill="#b8aedc" opacity=".5" />

            {/* Desk monitor */}
            <rect x="295" y="100" width="90" height="60" rx="6" fill="#2d2040" />
            <rect x="299" y="104" width="82" height="50" rx="3" fill="#3d2e60" />
            <ScreenBars active={talking} />
            <rect x="334" y="160" width="12" height="12" fill="#4a3575" />
            <rect x="320" y="170" width="40" height="5" rx="2" fill="#3a2865" />
          </svg>

          <AlexCharacter talking={talking} emotion={emotion} />

          {/* Live badge */}
          <div style={{ position: "absolute", top: 12, right: 16, background: PURPLE, borderRadius: 99, padding: "4px 10px", display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff", animation: "r4pulse 1s infinite" }} />
            <span style={{ fontSize: 10, color: "#fff", fontWeight: 500 }}>LIVE</span>
          </div>

          {/* Name tag */}
          <div style={{ position: "absolute", top: 12, left: 16, background: "rgba(45,32,64,.75)", borderRadius: 99, padding: "4px 12px" }}>
            <span style={{ fontSize: 10, color: "#a9c8f0", fontWeight: 500 }}>Alex — AI Interviewer</span>
          </div>

          {/* Category chip bottom */}
          {category && (
            <div style={{ position: "absolute", bottom: 10, right: 14, background: "rgba(45,32,64,.6)", borderRadius: 99, padding: "3px 10px" }}>
              <span style={{ fontSize: 10, color: "#a9c8f0", textTransform: "capitalize" }}>{category.replace(/_/g, " ")}</span>
            </div>
          )}
        </div>

        {/* ── Voice status bar ── */}
        <div style={{ padding: "16px 18px 0" }}>
          <div style={{ background: "var(--color-background-secondary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 12, padding: "13px 15px", marginBottom: 14, display: "flex", alignItems: "center", gap: 10 }}>
            <WaveBars active={talking} color={PURPLE} count={7} />
            <span style={{ fontSize: 12, fontWeight: 500, color: PURPLE, textTransform: "uppercase", letterSpacing: ".08em", flex: 1 }}>
              {talking ? "Alex is asking… listen carefully" : typingDone ? "Question delivered — select your answer" : "Preparing question…"}
            </span>
            {canReplay && playCount < 2 && (
              <button
                onClick={() => { setPlayCount(p => p + 1); setTalking(true); speak(question, () => setTalking(false)); }}
                onMouseEnter={e => { e.currentTarget.style.background = "#6A3EE8"; }}
                onMouseLeave={e => { e.currentTarget.style.background = PURPLE; }}
                style={{ fontSize: 11, padding: "4px 10px", borderRadius: 6, background: PURPLE, color: "#fff", border: "none", cursor: "pointer", flexShrink: 0, transition: "background .15s" }}
              >
                🔊 Replay ({2 - playCount} left)
              </button>
            )}
          </div>
        </div>

        {/* ── Options ── */}
        {typingDone && (
          <div style={{ padding: "0 18px", display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
            {options.map((opt, idx) => {
              const isSel = selectedOption === idx;
              // After submit: if correctAnswer is known use it, otherwise fall back to isCorrect state for selected option
              const border = isSel && !submitted ? `1.5px solid ${PURPLE}` : "1.5px solid var(--color-border-tertiary)";
              const bg = isSel && !submitted ? "#2563EB0C" : "var(--color-background-primary)";
              const letter = String.fromCharCode(65 + idx);
              return (
                <div key={idx}
                  onClick={() => !submitted && !submitting && setSelectedOption(idx)}
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", borderRadius: 10, border, background: bg, cursor: submitted ? "default" : "pointer", transition: "border-color .15s, background .15s, transform .12s", animation: `r4slidein .3s ease ${idx * 0.07}s both` }}
                  onMouseEnter={e => { if (!submitted) (e.currentTarget as HTMLDivElement).style.transform = "translateX(3px)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateX(0)"; }}
                >
                  <div style={{ width: 26, height: 26, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 500, flexShrink: 0, border: isSel && !submitted ? `1.5px solid ${PURPLE}` : "1.5px solid var(--color-border-secondary)", background: isSel && !submitted ? PURPLE : "var(--color-background-secondary)", color: isSel && !submitted ? "#fff" : "var(--color-text-secondary)", transition: "all .15s" }}>
                    {letter}
                  </div>
                  <span style={{ fontSize: 13, color: "var(--color-text-primary)", lineHeight: 1.5 }}>{opt}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Feedback hidden — real interview mode */}

        {/* ── Action button ── */}
        <div style={{ padding: "0 18px 18px" }}>
          {/* Show nothing while AI is still speaking/reading the question */}
          {!submitted && !typingDone && (
            <div style={{ textAlign: "center", padding: 12, fontSize: 12, color: "var(--color-text-tertiary)", background: "var(--color-background-secondary)", borderRadius: 10 }}>
              <Spinner /> Wait for question to finish loading…
            </div>
          )}
          {!submitted && typingDone && (
            <button
              disabled={selectedOption === null || submitting}
              onClick={() => { stopVoice(); doSubmit(selectedOption); }}
              onMouseEnter={e => { if (selectedOption !== null && !submitting) { e.currentTarget.style.background = "#6A3EE8"; e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 4px 10px rgba(123,77,255,.35)"; } }}
              onMouseLeave={e => { e.currentTarget.style.background = selectedOption === null ? "#9ca3af" : PURPLE; e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}
              style={{ width: "100%", padding: 12, background: selectedOption === null ? "#9ca3af" : PURPLE, color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 500, cursor: selectedOption === null ? "not-allowed" : "pointer", opacity: selectedOption === null ? 0.6 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "background .15s, transform .15s, box-shadow .15s" }}
            >
              {submitting ? <><Spinner /> Evaluating…</> : "Submit Answer"}
            </button>
          )}
          {submitted && !roundComplete && questionNo < totalQ && (
            <button
              onClick={() => { stopVoice(); loadQuestion(); }}
              onMouseEnter={e => { e.currentTarget.style.background = "#15803d"; e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 4px 10px rgba(22,163,74,.35)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "#16a34a"; e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}
              style={{ width: "100%", padding: 12, background: "#16a34a", color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, transition: "background .15s, transform .15s, box-shadow .15s" }}
            >
              Next Question → ({questionNo + 1}/{totalQ})
            </button>
          )}
          {submitted && !roundComplete && submitting && (
            <div style={{ textAlign: "center", padding: 12, fontSize: 13, color: "var(--color-text-tertiary)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <Spinner /> Processing…
            </div>
          )}
        </div>

      </div>
    </div>
  );
}