import React, { useRef, useState, useEffect, useCallback } from "react";
import MonacoEditor from "@monaco-editor/react";
import { api } from "./lib/api";
import { ExamImageType } from "./lib/examImageTypes";
import { Modal } from "antd";
import axiosInstance from "../utils/axiosInstance";
import BASE_URL from "../Config";
import { CameraVerification } from "./components/CameraVerification";
import { SpinnerIcon } from "./components/SpinnerIcon";
import { InterviewHeader } from "./components/InterviewHeader";
import { ExamProctorCamera } from "./components/ExamProctorCamera";
import Round4 from './Round4';
import Round5 from './Round5';
import Round3CodingPage from './Round3CodingPage';
import Round3ParagraphPage from './Round3ParagraphPage';

const FLOW_STATE_KEY = "aiMockInterviewFlowState";

/* ─── DESIGN SYSTEM — Refined Premium ─── */
const GLOBAL_CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&family=DM+Mono:wght@400;500&display=swap');

:root {
  --brand:#2563EB;--brand-hover:#1D4ED8;
  --brand-tint:rgba(37,99,235,.06);--brand-ring:rgba(37,99,235,.12);
  --success:#059669;--success-tint:rgba(5,150,105,.07);
  --warning:#B45309;--warning-tint:rgba(180,83,9,.07);
  --danger:#DC2626;--danger-tint:rgba(220,38,38,.07);
  --info:#0891B2;--info-tint:rgba(8,145,178,.07);

  --bg:linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  --bg-overlay:rgba(255,255,255,0.95);
  --surface:#FFFFFF;
  --surface-raised:#FFFFFF;
  --s1:#F4F4F2;
  --s2:#EBEBEA;

  --border:rgba(0,0,0,.08);
  --border-soft:rgba(0,0,0,.05);
  --border-strong:rgba(0,0,0,.13);

  --t1:#111110;--t2:#3A3A38;--t3:#717170;--t4:#A8A8A6;

  --r-xs:3px;--r-sm:5px;--r-md:8px;--r-lg:11px;--r-xl:14px;--r-2xl:18px;--r-full:999px;

  --sh-xs:0 1px 2px rgba(0,0,0,.04);
  --sh-sm:0 1px 3px rgba(0,0,0,.05),0 1px 2px rgba(0,0,0,.03);
  --sh-md:0 3px 8px rgba(0,0,0,.05),0 1px 3px rgba(0,0,0,.04);

  --font:'DM Sans',sans-serif;
  --mono:'DM Mono',monospace;

  --ease:.18s ease;
}

.theme-dark {
  --bg:linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  --bg-overlay:rgba(22,22,22,0.95);
  --surface:#161614;
  --surface-raised:#1C1C1A;
  --s1:#1F1F1D;
  --s2:#252523;
  --border:rgba(255,255,255,.07);
  --border-soft:rgba(255,255,255,.04);
  --border-strong:rgba(255,255,255,.12);
  --t1:#F0F0EE;--t2:#C8C8C4;--t3:#888884;--t4:#555552;
  --brand-tint:rgba(37,99,235,.1);--brand-ring:rgba(37,99,235,.18);
  --success-tint:rgba(5,150,105,.1);
  --warning-tint:rgba(180,83,9,.1);
  --danger-tint:rgba(220,38,38,.1);
  --info-tint:rgba(8,145,178,.1);
  --sh-xs:0 1px 2px rgba(0,0,0,.25);
  --sh-sm:0 1px 3px rgba(0,0,0,.3);
  --sh-md:0 3px 8px rgba(0,0,0,.35);
}

*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}

.ai-bg{
  min-height:100vh;background:var(--bg);font-family:var(--font);
  color:var(--t1);line-height:1.55;-webkit-font-smoothing:antialiased;
  font-size:14px;position:relative;
}
.ai-bg::before{
  content:'';position:fixed;inset:0;background:var(--bg-overlay);
  z-index:0;pointer-events:none;
}
.ai-bg > *{position:relative;z-index:1;}

/* ── Buttons ── */
.btn{
  display:inline-flex;align-items:center;justify-content:center;gap:6px;
  font-family:var(--font);font-size:13px;font-weight:500;
  border:1px solid transparent;cursor:pointer;border-radius:var(--r-md);
  padding:7px 14px;transition:all var(--ease);white-space:nowrap;line-height:1;
  letter-spacing:-.01em;
}
.btn:disabled{opacity:.4;cursor:not-allowed;pointer-events:none;}
.btn:focus-visible{outline:2px solid var(--brand);outline-offset:2px;}

.btn-primary{background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;border-color:transparent;position:relative;overflow:hidden;}
.btn-primary::before{content:'';position:absolute;inset:0;background:linear-gradient(135deg,#764ba2,#667eea);opacity:0;transition:opacity .3s ease;}
.btn-primary:not(:disabled):hover::before{opacity:1;}
.btn-primary > *{position:relative;z-index:1;}
.btn-primary-lg{padding:9px 20px;font-size:13.5px;border-radius:var(--r-lg);}

.btn-outline{background:var(--surface);color:var(--t2);border-color:var(--border-strong);}
.btn-outline:not(:disabled):hover{border-color:var(--brand);color:var(--brand);background:var(--brand-tint);}

.btn-ghost{background:transparent;color:var(--t3);border-color:transparent;padding:5px 9px;}
.btn-ghost:hover{background:var(--s1);color:var(--t1);}

.btn-success{background:var(--success);color:#fff;border-color:var(--success);}
.btn-success:not(:disabled):hover{background:#047857;}

.btn-icon{padding:6px;border-radius:var(--r-md);background:var(--s1);border-color:var(--border);color:var(--t3);font-size:15px;line-height:1;}
.btn-icon:hover{background:var(--s2);color:var(--t1);}

/* ── Layout ── */
.ai-main{max-width:1100px;margin:0 auto;padding:28px 20px 80px;}

/* ── Cards ── */
.card{background:var(--surface);border:1px solid var(--border);border-radius:var(--r-xl);overflow:hidden;transition:transform .3s ease;}
.card:hover{transform:translateY(-2px);}
.card-header{display:flex;align-items:center;gap:11px;padding:15px 18px;border-bottom:1px solid var(--border-soft);background:var(--surface);}
.card-body{padding:18px;}

/* ── Two-col ── */
.two-col{display:grid;grid-template-columns:1fr 1fr;gap:14px;align-items:start;}
@media(max-width:720px){.two-col{grid-template-columns:1fr;}}

/* ── Labels / Tags ── */
.section-label{font-size:10.5px;font-weight:600;letter-spacing:.07em;text-transform:uppercase;color:var(--t4);margin-bottom:7px;}

.tag{display:inline-flex;align-items:center;padding:2px 9px;border-radius:var(--r-full);font-size:11.5px;font-weight:500;margin:2px 3px 2px 0;}
.tag-skill{background:var(--brand-tint);color:var(--brand);border:1px solid var(--brand-ring);}
.tag-domain{background:var(--info-tint);color:var(--info);border:1px solid rgba(8,145,178,.15);}
.tag-exp{background:var(--success-tint);color:var(--success);border:1px solid rgba(5,150,105,.15);}

.chip{display:inline-flex;align-items:center;padding:2px 8px;border-radius:var(--r-xs);font-size:11px;font-weight:500;background:var(--s1);color:var(--t3);border:1px solid var(--border);}

/* ── Dropzone ── */
.dropzone{border:1.5px dashed var(--border-strong);border-radius:var(--r-lg);padding:28px 20px;text-align:center;cursor:pointer;transition:all var(--ease);background:var(--s1);}
.dropzone:hover,.dropzone.active{border-color:var(--brand);background:var(--brand-tint);}
.dropzone-icon{font-size:24px;margin-bottom:9px;line-height:1;}
.dropzone-title{font-size:13.5px;font-weight:600;color:var(--t1);margin-bottom:2px;}
.dropzone-sub{font-size:12px;color:var(--t3);}

/* ── Info box ── */
.info-box{background:var(--brand-tint);border:1px solid var(--brand-ring);border-radius:var(--r-lg);padding:11px 14px;font-size:12.5px;color:var(--t2);line-height:1.6;}
.info-box-title{font-weight:600;color:var(--brand);font-size:10.5px;margin-bottom:4px;text-transform:uppercase;letter-spacing:.06em;}

/* ── Progress ── */
.progress-wrap{width:100%;height:3px;background:var(--s2);border-radius:var(--r-full);overflow:hidden;}
.progress-fill{height:100%;background:linear-gradient(90deg,#667eea,#764ba2);border-radius:var(--r-full);transition:width .6s cubic-bezier(.34,1.56,.64,1);position:relative;overflow:hidden;}
.progress-fill::after{content:'';position:absolute;inset:0;background:linear-gradient(90deg,transparent,rgba(255,255,255,.3),transparent);animation:shimmer 2s infinite;}
@keyframes shimmer{0%{transform:translateX(-100%)}100%{transform:translateX(100%)}}

/* ─────────────────────────────────────────
   WELCOME SCREEN — Soft & Airy
──────────────────────────────────────── */
.welcome-root{max-width:1050px;margin:0 auto;}

.welcome-eyebrow{
  display:inline-flex;align-items:center;gap:6px;
  padding:3px 10px 3px 8px;
  background:var(--brand-tint);
  color:var(--brand);border:1px solid var(--brand-ring);
  border-radius:var(--r-full);font-size:11.5px;font-weight:500;
  margin-bottom:20px;letter-spacing:.01em;
}
.welcome-eyebrow-dot{width:5px;height:5px;border-radius:50%;background:var(--brand);flex-shrink:0;}

.ai-typing-row{
  display:flex;align-items:center;gap:9px;
  margin-bottom:22px;
  padding:8px 14px;
  background:var(--surface);border:1px solid var(--border);
  border-radius:var(--r-xl);width:fit-content;
}
.ai-typing-text{font-size:13px;color:var(--t2);font-family:var(--mono);}
.cursor-blink{display:inline-block;width:2px;height:12px;background:var(--brand);margin-left:2px;vertical-align:middle;animation:blink .85s step-end infinite;}
@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}

.welcome-title{
  font-family:var(--font);font-size:clamp(32px,4.5vw,48px);font-weight:300;
  line-height:1.12;color:var(--t1);letter-spacing:-1px;margin-bottom:12px;
  animation:fadeInUp .8s ease;
}
.welcome-title strong{font-weight:600;background:linear-gradient(135deg,#667eea,#764ba2);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}
@keyframes fadeInUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
.welcome-sub{font-size:15.5px;color:var(--t3);line-height:1.65;max-width:500px;margin-bottom:26px;font-weight:400;}

.cta-row{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px;}
.cta-hint{font-size:11.5px;color:var(--t4);margin-bottom:32px;}

/* Stats strip */
.stats-row{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:36px;}
.stat-chip{
  display:flex;align-items:center;gap:6px;
  padding:5px 11px;
  background:var(--surface);border:1px solid var(--border);
  border-radius:var(--r-full);font-size:12px;color:var(--t2);font-weight:400;
}
.stat-dot{width:5px;height:5px;border-radius:50%;}

/* Rounds strip */
.rounds-strip{
  display:grid;
  grid-template-columns:repeat(5,1fr);
  gap:8px;margin-bottom:36px;
}
@media(max-width:860px){.rounds-strip{grid-template-columns:repeat(3,1fr);}}
@media(max-width:560px){.rounds-strip{grid-template-columns:1fr 1fr;}}

.round-pill{
  background:var(--surface);border:1px solid var(--border);
  border-radius:var(--r-xl);padding:14px 14px 13px;
  transition:all .3s ease;
  position:relative;overflow:hidden;animation:slideInUp .5s ease backwards;
}
.round-pill::before{
  content:'';position:absolute;top:0;left:0;right:0;height:3px;
  background:var(--rc,var(--brand));opacity:.8;
  transition:height .3s ease;
}
.round-pill:hover{border-color:var(--border-strong);transform:translateY(-4px);}
.round-pill:hover::before{height:5px;}
@keyframes slideInUp{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}
.round-pill:nth-child(1){animation-delay:.1s;}
.round-pill:nth-child(2){animation-delay:.2s;}
.round-pill:nth-child(3){animation-delay:.3s;}
.round-pill:nth-child(4){animation-delay:.4s;}
.round-pill:nth-child(5){animation-delay:.5s;}

.round-pill-num{
  width:26px;height:26px;border-radius:var(--r-sm);
  display:flex;align-items:center;justify-content:center;
  font-weight:600;font-size:12px;color:#fff;margin-bottom:10px;
  background:var(--rc,var(--brand));
}
.round-pill-name{font-size:12.5px;font-weight:600;color:var(--t1);margin-bottom:3px;line-height:1.3;}
.round-pill-meta{font-size:11px;color:var(--t4);margin-bottom:6px;}
.round-pill-desc{font-size:11.5px;color:var(--t3);line-height:1.5;}

/* How it works */
.how-section{
  background:var(--surface);border:1px solid var(--border);
  border-radius:var(--r-2xl);padding:24px 26px;
}
.how-head{margin-bottom:18px;}
.how-kicker{font-size:10.5px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--brand);margin-bottom:5px;}
.how-title{font-size:17px;font-weight:600;color:var(--t1);letter-spacing:-.3px;margin-bottom:4px;}
.how-sub{font-size:13px;color:var(--t3);line-height:1.6;max-width:420px;}

.how-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;}
@media(max-width:700px){.how-grid{grid-template-columns:1fr 1fr;}}

.how-step{
  padding:14px;background:var(--s1);border:1px solid var(--border-soft);
  border-radius:var(--r-lg);
}
.how-step-n{
  font-family:var(--mono);font-size:10.5px;font-weight:500;color:var(--brand);
  background:var(--brand-tint);border:1px solid var(--brand-ring);
  padding:2px 7px;border-radius:var(--r-xs);margin-bottom:9px;display:inline-block;
}
.how-step-t{font-size:12.5px;font-weight:600;color:var(--t1);margin-bottom:3px;}
.how-step-d{font-size:11.5px;color:var(--t3);line-height:1.5;}

/* ─────────────────────────────────────────
   UPLOAD CARD
──────────────────────────────────────── */
.upload-card{max-width:480px;margin:20px auto;}

/* ─────────────────────────────────────────
   PROFILE / RESUME PARSED
──────────────────────────────────────── */
.profile-header{display:flex;align-items:center;gap:11px;padding:14px 16px;border-bottom:1px solid var(--border-soft);}
.profile-avatar{
  width:36px;height:36px;border-radius:50%;background:var(--brand);
  display:flex;align-items:center;justify-content:center;
  font-weight:600;font-size:14px;color:#fff;flex-shrink:0;
}
.profile-name{font-size:14px;font-weight:600;color:var(--t1);}
.profile-ok{font-size:11px;color:var(--success);margin-top:2px;}

/* ─────────────────────────────────────────
   ANALYSING SCREEN
──────────────────────────────────────── */
.analyzing-wrap{display:flex;justify-content:center;padding:48px 16px;}
.analyzing-card{
  background:var(--surface);border:1px solid var(--border);
  border-radius:var(--r-2xl);padding:38px 30px;text-align:center;
  max-width:450px;width:100%;
  animation:scaleIn .5s ease;
}
@keyframes scaleIn{from{opacity:0;transform:scale(.9)}to{opacity:1;transform:scale(1)}}
.spin-bot{font-size:32px;margin-bottom:14px;animation:float 2.2s ease-in-out infinite;}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}

.progress-steps{margin-top:6px;text-align:left;}
.progress-step{
  display:flex;align-items:center;gap:9px;
  padding:8px 0;font-size:12.5px;color:var(--t2);
  border-bottom:1px solid var(--border-soft);
}
.progress-step:last-child{border-bottom:none;}
.progress-step-dot{
  width:6px;height:6px;border-radius:50%;background:var(--brand);flex-shrink:0;
  animation:pulse 1.4s ease-in-out infinite;
}
@keyframes pulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.5);opacity:.5}}

/* ─────────────────────────────────────────
   CAMERA
──────────────────────────────────────── */
.camera-wrap{max-width:420px;margin:28px auto;}
.camera-header{text-align:center;margin-bottom:16px;}
.camera-preview{border-radius:var(--r-xl);overflow:hidden;border:1px solid var(--border);margin-bottom:12px;}
.camera-actions{display:flex;flex-direction:column;gap:8px;}

/* ─────────────────────────────────────────
   MODAL
──────────────────────────────────────── */
.modal-overlay{
  position:fixed;inset:0;z-index:1000;
  background:rgba(0,0,0,.35);
  backdrop-filter:blur(4px);
  display:flex;align-items:center;justify-content:center;padding:20px;
  animation:fadeIn .16s ease;
}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
.modal-box{
  background:var(--surface);border:1px solid var(--border);
  border-radius:var(--r-2xl);padding:28px 24px;max-width:400px;width:100%;
  text-align:center;animation:modalSlideUp .4s cubic-bezier(.34,1.56,.64,1);
}
@keyframes modalSlideUp{from{transform:translateY(30px) scale(.95);opacity:0}to{transform:translateY(0) scale(1);opacity:1}}
.modal-icon{font-size:28px;margin-bottom:12px;}
.modal-title{font-size:17px;font-weight:600;color:var(--t1);margin-bottom:7px;letter-spacing:-.3px;}
.modal-msg{font-size:13px;color:var(--t3);line-height:1.65;white-space:pre-line;}

/* ─────────────────────────────────────────
   PRE-INTERVIEW — Assessment Structure
──────────────────────────────────────── */
.round-row{display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid var(--border-soft);}
.round-row:last-child{border-bottom:none;padding-bottom:0;}
.round-num{
  width:24px;height:24px;flex-shrink:0;border-radius:var(--r-sm);
  display:flex;align-items:center;justify-content:center;
  font-weight:600;font-size:10.5px;color:#fff;
}
.round-info-name{font-size:12.5px;font-weight:600;color:var(--t1);}
.round-info-sub{font-size:11px;color:var(--t3);margin-top:1px;margin-bottom:4px;}
.round-chips{display:flex;gap:4px;flex-wrap:wrap;}

/* ─────────────────────────────────────────
   QUESTION HEADER
──────────────────────────────────────── */
.q-header{
  display:flex;align-items:center;gap:11px;
  padding:14px 18px;border-bottom:1px solid var(--border-soft);
  background:var(--surface);flex-wrap:wrap;
}
.q-round-badge{
  width:28px;height:28px;border-radius:var(--r-sm);
  display:flex;align-items:center;justify-content:center;
  font-weight:700;font-size:12px;color:#fff;flex-shrink:0;
}
.round-desc-bar{
  background:var(--brand-tint);border-bottom:1px solid var(--brand-ring);
  padding:6px 18px;font-size:11.5px;color:var(--brand);font-weight:500;
}

/* ── Timer ── */
.timer-chip{
  display:inline-flex;align-items:center;gap:4px;
  padding:4px 10px;border-radius:var(--r-md);font-family:var(--mono);
  font-size:12px;font-weight:500;border:1px solid;
}
.timer-normal{background:var(--s1);border-color:var(--border);color:var(--t2);}
.timer-urgent{background:var(--danger-tint);border-color:rgba(220,38,38,.2);color:var(--danger);animation:urgentPulse .9s ease infinite;}
@keyframes urgentPulse{0%,100%{opacity:1}50%{opacity:.65}}
.timer-stopped{background:var(--s2);border-color:var(--border-soft);color:var(--t4);}

/* ── Question box ── */
.q-box{
  background:var(--s1);border:1px solid var(--border-soft);
  border-radius:var(--r-lg);padding:16px 18px;overflow:hidden;
}
.q-section{padding:9px 0;border-bottom:1px solid var(--border-soft);}
.q-section:last-child{border-bottom:none;padding-bottom:0;}
.q-section:first-child{padding-top:0;}
.q-section-label{font-size:9.5px;font-weight:700;text-transform:uppercase;letter-spacing:.09em;margin-bottom:5px;}

/* ── MCQ ── */
.mcq-option{
  display:flex;align-items:center;gap:9px;padding:9px 12px;
  border:1px solid var(--border);border-radius:var(--r-lg);cursor:pointer;
  margin-bottom:6px;transition:all .3s ease;background:var(--surface);user-select:none;
  animation:fadeIn .4s ease backwards;
}
.mcq-option:nth-child(1){animation-delay:.05s;}
.mcq-option:nth-child(2){animation-delay:.1s;}
.mcq-option:nth-child(3){animation-delay:.15s;}
.mcq-option:nth-child(4){animation-delay:.2s;}
@keyframes fadeIn{from{opacity:0;transform:translateX(-10px)}to{opacity:1;transform:translateX(0)}}
.mcq-option:hover:not(.disabled){border-color:var(--brand);background:var(--brand-tint);transform:translateX(4px);}
.mcq-option.selected{border-color:var(--brand);background:var(--brand-tint);}
.mcq-option.correct{border-color:var(--success);background:var(--success-tint);animation:correctPulse .5s ease;}
.mcq-option.incorrect{border-color:var(--danger);background:var(--danger-tint);animation:shake .4s ease;}
.mcq-option.disabled{cursor:not-allowed;}
@keyframes correctPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.02)}}
@keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-5px)}75%{transform:translateX(5px)}}
.mcq-radio{width:15px;height:15px;border-radius:50%;border:1.5px solid var(--border-strong);flex-shrink:0;display:flex;align-items:center;justify-content:center;}
.mcq-option.selected .mcq-radio{border-color:var(--brand);}
.mcq-dot{width:6px;height:6px;border-radius:50%;background:var(--brand);}
.mcq-letter{font-family:var(--mono);font-size:11px;font-weight:500;color:var(--t4);width:13px;flex-shrink:0;}
.mcq-text{font-size:13px;color:var(--t1);line-height:1.5;}

/* ── Textarea ── */
.ai-textarea{
  width:100%;background:var(--surface);border:1px solid var(--border-strong);
  border-radius:var(--r-lg);padding:11px 13px;font-family:var(--font);font-size:13px;
  color:var(--t1);resize:vertical;transition:border-color var(--ease),box-shadow var(--ease);line-height:1.6;
}
.ai-textarea:focus{outline:none;border-color:var(--brand);box-shadow:0 0 0 3px var(--brand-ring);}
.ai-textarea:disabled{background:var(--s1);color:var(--t4);cursor:not-allowed;}
.ai-textarea.mono{font-family:var(--mono);font-size:12.5px;}

.char-counter{font-family:var(--mono);font-size:11.5px;font-weight:500;}
.char-ok{color:var(--success);}
.char-warn{color:var(--warning);}

/* ── Language select ── */
.lang-select{
  padding:6px 10px;background:var(--surface);color:var(--t1);
  border:1px solid var(--border-strong);border-radius:var(--r-md);
  font-family:var(--font);font-size:12.5px;cursor:pointer;
}
.lang-select:focus{outline:none;border-color:var(--brand);}

/* ── Code terminal ── */
.code-terminal{border:1px solid var(--border);border-radius:var(--r-lg);overflow:hidden;}
.code-terminal-bar{display:flex;align-items:center;justify-content:space-between;padding:6px 11px;background:#141414;border-bottom:1px solid rgba(255,255,255,.06);}
.code-terminal-dots{display:flex;gap:5px;}
.code-terminal-dot{width:8px;height:8px;border-radius:50%;}
.code-terminal-label{font-family:var(--mono);font-size:10.5px;font-weight:500;}
.code-terminal-body{background:#0F0F0F;padding:11px 13px;}
.code-label{font-family:var(--mono);font-size:9.5px;font-weight:600;letter-spacing:.1em;color:#555;margin-bottom:4px;}
.code-output-text{font-family:var(--mono);font-size:12px;color:#3FB950;white-space:pre-wrap;}
.code-error-text{font-family:var(--mono);font-size:12px;color:#F85149;white-space:pre-wrap;}

/* ── Feedback ── */
.feedback-box{background:var(--success-tint);border:1px solid rgba(5,150,105,.18);border-radius:var(--r-lg);padding:12px 14px;margin-bottom:12px;}
.feedback-label{font-size:10px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:var(--success);margin-bottom:5px;}
.feedback-text{font-size:13px;color:var(--t2);line-height:1.65;}

/* ── Attempt card ── */
.attempt-card{border:1px solid var(--border);border-radius:var(--r-lg);overflow:hidden;margin-bottom:7px;background:var(--surface);transition:border-color var(--ease);}
.attempt-card:hover{border-color:var(--border-strong);}
.attempt-card-header{display:flex;justify-content:space-between;align-items:center;padding:11px 13px;cursor:pointer;transition:background var(--ease);}
.attempt-card-header:hover{background:var(--s1);}

/* ── Spinner ── */
.spinner{animation:spin .7s linear infinite;}
@keyframes spin{to{transform:rotate(360deg)}}

/* ── Header (global nav) ── */
.ai-header{position:sticky;top:0;z-index:100;background:rgba(255,255,255,0.95);backdrop-filter:blur(16px);border-bottom:1px solid var(--border);box-shadow:0 1px 3px rgba(0,0,0,0.05);}
.theme-dark .ai-header{background:rgba(22,22,20,0.95);box-shadow:0 1px 3px rgba(0,0,0,0.3);}
.ai-header-inner{max-width:1100px;margin:0 auto;padding:0 20px;height:64px;display:flex;align-items:center;justify-content:space-between;gap:14px;}
.ai-logo-group{display:flex;align-items:center;gap:14px;}
.ai-logo-divider{width:1px;height:28px;background:var(--border);}
.ai-header-label{display:flex;flex-direction:column;gap:2px;}
.ai-header-title{font-size:16px;font-weight:600;color:var(--t1);line-height:1.2;letter-spacing:-.02em;}
.ai-header-sub{font-size:11.5px;color:var(--t3);line-height:1.2;font-weight:400;}
.ai-header-actions{display:flex;align-items:center;gap:10px;}
.theme-toggle{display:inline-flex;align-items:center;gap:7px;padding:8px 14px;background:var(--s1);border:1px solid var(--border);border-radius:var(--r-md);font-size:13px;font-weight:500;color:var(--t2);cursor:pointer;transition:all .3s ease;}
.theme-toggle:hover{background:var(--s2);color:var(--t1);border-color:var(--border-strong);transform:translateY(-1px);box-shadow:0 2px 4px rgba(0,0,0,0.08);}
.theme-dark .theme-toggle:hover{box-shadow:0 2px 4px rgba(0,0,0,0.4);}
.ai-user-chip{display:flex;align-items:center;gap:9px;padding:6px 14px 6px 6px;background:var(--s1);border:1px solid var(--border);border-radius:var(--r-full);transition:all .3s ease;}
.ai-user-chip:hover{background:var(--s2);border-color:var(--border-strong);transform:translateY(-1px);box-shadow:0 2px 4px rgba(0,0,0,0.08);}
.theme-dark .ai-user-chip:hover{box-shadow:0 2px 4px rgba(0,0,0,0.4);}
.ai-avatar{width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#667eea,#764ba2);display:flex;align-items:center;justify-content:center;font-weight:600;font-size:11px;color:#fff;flex-shrink:0;box-shadow:0 2px 8px rgba(102,126,234,0.3);}
.theme-dark .ai-avatar{box-shadow:0 2px 8px rgba(102,126,234,0.5);}
.ai-user-name{font-size:13.5px;font-weight:500;color:var(--t1);max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}

/* ── Proctor cam ── */
.exam-proctor-camera{position:fixed;bottom:16px;right:16px;z-index:200;width:140px;border-radius:var(--r-lg);overflow:hidden;border:2px solid var(--border);background:#000;transition:all .3s ease;}
.exam-proctor-camera:hover{transform:scale(1.05);border-color:var(--brand);}
.exam-proctor-video{width:100%;display:block;aspect-ratio:4/3;object-fit:cover;}
.exam-proctor-status{display:flex;align-items:center;gap:6px;padding:5px 8px;background:rgba(0,0,0,.75);font-size:10px;color:#999;backdrop-filter:blur(4px);}
.exam-proctor-status.warning{background:rgba(220,38,38,.8);color:#fff;}
.exam-proctor-dot{width:6px;height:6px;border-radius:50%;background:#22C55E;flex-shrink:0;animation:pulse 1.4s ease-in-out infinite;}
.exam-proctor-status.warning .exam-proctor-dot{background:#fff;}

/* ── Round 3 Done ── */
.r3-done{max-width:480px;margin:60px auto;text-align:center;}

/* ── Login loading ── */
.login-loading{display:flex;justify-content:center;align-items:center;min-height:100vh;}

/* ── Coding Split Layout ── */
.coding-split{display:grid;grid-template-columns:1fr 1fr;gap:0;height:calc(100vh - 120px);min-height:560px;border:1px solid var(--border);border-radius:var(--r-xl);overflow:hidden;background:var(--surface);}
@media(max-width:860px){.coding-split{grid-template-columns:1fr;height:auto;}}
.coding-left{overflow-y:auto;border-right:1px solid var(--border);display:flex;flex-direction:column;}
.coding-right{display:flex;flex-direction:column;background:#1e1e1e;}
.coding-editor-bar{display:flex;align-items:center;gap:8px;padding:7px 12px;background:#252526;border-bottom:1px solid rgba(255,255,255,.07);flex-shrink:0;}
.coding-editor-wrap{flex:1;overflow:hidden;}
.coding-bottom{border-top:1px solid var(--border);background:var(--surface);flex-shrink:0;max-height:220px;overflow-y:auto;}

/* ── Eval loading ── */
.eval-step{display:flex;align-items:center;gap:8px;padding:6px 0;font-size:12px;color:var(--t3);}
.eval-step-dot{width:6px;height:6px;border-radius:50%;background:var(--brand);flex-shrink:0;animation:pulse 1.2s ease-in-out infinite;}
.eval-step.done .eval-step-dot{background:var(--success);animation:none;}
.eval-step.done{color:var(--success);}

/* ── Violation badge ── */
.violation-bar{position:fixed;top:52px;left:0;right:0;z-index:300;background:var(--danger);color:#fff;font-size:12px;font-weight:500;padding:5px 16px;display:flex;align-items:center;gap:8px;}
`;

export default function InterviewPage() {
  function cryptoRandom() {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto)
      return crypto.randomUUID();
    return `sess-${Math.random().toString(36).slice(2)}`;
  }

  function decodeHtmlEntities(text: string): string {
    const textarea = document.createElement("textarea");
    textarea.innerHTML = text;
    return textarea.value;
  }

  const [user, setUser] = useState<{ id: string; name: string } | null>(null);
  const [sessionId] = useState<string>(() => cryptoRandom());
  const [parsed, setParsed] = useState<any>(null);
  const [yearsOfExperience, setYearsOfExperience] = useState<number>(0);
  const [round, setRound] = useState<number | null>(null);
  const [qNo, setQNo] = useState<number>(0);
  const [totalQ, setTotalQ] = useState<number>(0);
  const [question, setQuestion] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [timeLeft, setTimeLeft] = useState(30);
  const [timePerQuestion, setTimePerQuestion] = useState(30);
  const [showWelcome, setShowWelcome] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [showAnalyzing, setShowAnalyzing] = useState(false);
  const [showAnalysisMessage, setShowAnalysisMessage] = useState(false);
  const [showCameraVerification, setShowCameraVerification] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [candidateId, setCandidateId] = useState<string | null>(null);
  const [sessionStatsId, setSessionStatsId] = useState<string | null>(null);
  const [uploadingExamImage, setUploadingExamImage] = useState(false);

  const getTimeLimit = (r: number) => ({ 1: 30, 2: 120, 3: 300 }[r] || 30);
  const getQuestionCount = (r: number) => ({ 1: 12, 2: 5, 3: 3 }[r] || 5);

  const isNonTechnical = (skills: string[], domains: string[], isTechnicalFlag?: boolean | null) => {
    // If backend explicitly set is_technical, trust it
    if (isTechnicalFlag === true)  return false;
    if (isTechnicalFlag === false) return true;
    const kw = [
      "hr", "human resource", "marketing", "sales", "finance", "accounting",
      "business", "management", "admin", "operations", "customer service", "support",
    ];
    return [...(skills || []), ...(domains || [])]
      .join(" ")
      .toLowerCase()
      .split(" ")
      .some((w) => kw.includes(w));
  };

  const [roundType, setRoundType] = useState<string>("");
  const [roundDescription, setRoundDescription] = useState<string>("");
  const [selectedOption, setSelectedOption] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const answerRef = useRef<HTMLTextAreaElement>(null);
  const monacoValueRef = useRef<string>("");
  const [editorCode, setEditorCode] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [loginLoading, setLoginLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [evalSteps, setEvalSteps] = useState<string[]>([]);
  const [timerStopped, setTimerStopped] = useState(false);
  const questionRef = useRef<HTMLDivElement>(null);
  const [askedQuestions, setAskedQuestions] = useState<string[]>([]);
  const [codeOutput, setCodeOutput] = useState<string>("");
  const [codeError, setCodeError] = useState<string>("");
  const [codeEvalResult, setCodeEvalResult] = useState<any>(null);
  const [currentCodingQuestion, setCurrentCodingQuestion] = useState<any>(null);
  const [codePerQuestion, setCodePerQuestion] = useState<Record<number, string>>({});
  const [selectedLanguage, setSelectedLanguage] = useState<string>("python");
  const [isFrontendQuestion] = useState<boolean>(false);
  const [lineCount, setLineCount] = useState<number>(1);
  const [charCount, setCharCount] = useState<number>(0);
  const [violations, setViolations] = useState<string[]>([]);
  const [violationMsg, setViolationMsg] = useState<string>("");
  const [copyPasteBlocked, setCopyPasteBlocked] = useState<boolean>(true);
  const [modal, setModal] = useState<{
    show: boolean;
    type: "success" | "error";
    title: string;
    message: string;
    onClose?: () => void;
  } | null>(null);
  const [typingText, setTypingText] = useState("");
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [analysisTypingText, setAnalysisTypingText] = useState("");
  const [showFeedback, setShowFeedback] = useState(false);
  const [currentFeedback, setCurrentFeedback] = useState<{
    score: number;
    feedback: string;
    userAnswer: string;
  } | null>(null);
  const [nextQuestionData, setNextQuestionData] = useState<any>(null);
  const [dragOver, setDragOver] = useState(false);
  const [candidateResult, setCandidateResult] = useState<any>(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [resultLoading, setResultLoading] = useState(false);
  const [showRound3, setShowRound3] = useState(false);
  const [showRound4, setShowRound4] = useState(false);
  const [showRound5, setShowRound5] = useState(false);
  const [round3Done, setRound3Done] = useState(false);
  const [selectedAttempt, setSelectedAttempt] = useState<number | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const savedTheme = localStorage.getItem("aiInterviewTheme");
    return savedTheme === "dark" ? "dark" : "light";
  });
  const [flowHydrated, setFlowHydrated] = useState(false);
  const [interviewConfig, setInterviewConfig] = useState<any>(null);
  const [configLoading, setConfigLoading] = useState(true);

  useEffect(() => {
    fetch(`${BASE_URL}/api/admin/interview-config`)
      .then(r => r.json())
      .then(data => {
        setInterviewConfig(data.rounds || data);
        setConfigLoading(false);
      })
      .catch(() => setConfigLoading(false));
  }, []);

  const aiMessages = [
    "Analyzing your skills and experience...",
    "Generating personalized interview questions...",
    "Preparing your assessment rounds...",
    "Ready to evaluate your technical expertise!",
  ];

  const [codeVerified, setCodeVerified] = useState(false);
  const [codeEmail, setCodeEmail] = useState('');
  const [codeInput, setCodeInput] = useState('');
  const [codeVerifying, setCodeVerifying] = useState(false);
  const [applicationData, setApplicationData] = useState<any>(null);
  const [assessmentError, setAssessmentError] = useState('');

  useEffect(() => {
    if (!user) return;
    const uid = localStorage.getItem("userId");
    if (!uid) return;
    api
      .getCandidate(uid)
      .then((data: any) => {
        if (data?.statistics?.totalQuestions > 0) setCandidateResult(data);
      })
      .catch(() => {});
  }, [user]);

  async function openPreviousResults() {
    if (!user) return;
    const uid = localStorage.getItem("user")
      ? JSON.parse(localStorage.getItem("user")!).id
      : null;
    if (!uid) return;
    setResultLoading(true);
    try {
      const data = await api.getCandidate(uid);
      if (data?.attempts?.length > 0 || data?.summary?.totalAttempts > 0) {
        setCandidateResult(data);
        setSelectedAttempt(null);
        setShowResultModal(true);
      } else {
        alert("No previous interview data found.");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setResultLoading(false);
    }
  }

  useEffect(() => {
    if (showWelcome) setCurrentMessageIndex(0);
  }, [showWelcome]);

  useEffect(() => {
    if (!showWelcome) return;
    const msg = aiMessages[currentMessageIndex];
    let i = 0;
    setTypingText("");
    const t = setInterval(() => {
      if (i < msg.length) {
        setTypingText(msg.slice(0, i + 1));
        i++;
      } else {
        clearInterval(t);
        setTimeout(
          () => setCurrentMessageIndex((p) => (p + 1) % aiMessages.length),
          2000
        );
      }
    }, 80);
    return () => clearInterval(t);
  }, [currentMessageIndex, showWelcome]);

  const handleLogin = async () => {
    setLoginLoading(true);
    const stored =
      localStorage.getItem("profileData") ||
      localStorage.getItem("user") ||
      localStorage.getItem("whatsappNumber") ||
      localStorage.getItem("mobileNumber") ||
      "";
    let userId = "",
      phone = "",
      name = "";
    if (stored) {
      const parsedData = JSON.parse(stored);
      userId = localStorage.getItem("userId") || "";
      phone =
        parsedData.mobileNumber ||
        parsedData.whatsappNumber ||
        parsedData ||
        "";
      name =
        parsedData.userFirstName && parsedData.userLastName
          ? `${parsedData.userFirstName} ${parsedData.userLastName}`
          : parsedData.userName || "";
    }
    if (!userId && !phone) {
      Modal.warning({
        title: "Login Required",
        content: "Please login to continue. You need to have a valid profile with phone number.",
        onOk: () => {
          // Stay on the same page - user needs to login through main app
          setLoginLoading(false);
        }
      });
      setLoginLoading(false);
      return;
    }
    setLoading(true);
    try {
      let profileData = null;
      if (userId) {
        const profileResponse = await axiosInstance.get(
          `${BASE_URL}/user-service/getProfile/${userId}`
        );
        if (profileResponse) {
          profileData = await profileResponse.data;
          if (profileData) {
            phone =
              profileData.mobileNumber ||
              profileData.whatsappNumber ||
              phone;
            name =
              profileData.userName ||
              `${profileData.firstName || ""} ${" "} ${
                profileData.lastName || ""
              }` ||
              name;
            if (
              !profileData.mobileVerified &&
              !profileData.whatsappVerified
            ) {
              Modal.warning({
                title: "Verification Required",
                content:
                  "Please verify your mobile or WhatsApp number.",
              });
              setLoading(false);
              return;
            }
          }
        }
      }
      if (!phone) {
        Modal.warning({
          title: "Profile Incomplete",
          content:
            "Phone number not found. Please update your profile.",
        });
        setLoading(false);
        return;
      }
      if (!name) {
        Modal.warning({
          title: "Profile Incomplete",
          content: "Name not found. Please complete your profile.",
        });
        setLoading(false);
        return;
      }
      const data = await api.login({ phone_number: phone, name });
      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
        Modal.success({
          title: "Welcome",
          content: `Welcome, ${data.user.name}!`,
        });
        window.location.href = "/interview";
      } else if (data.error) {
        Modal.error({ title: "Login Failed", content: data.error });
      } else {
        Modal.error({
          title: "Login Failed",
          content: "Please try again.",
        });
      }
    } catch (err) {
      console.error("Login error:", err);
      Modal.error({
        title: "Error",
        content: "An error occurred. Please try again.",
      });
    } finally {
      setLoading(false);
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    Modal.confirm({
      title: "Logout Confirmation",
      content: "Are you sure you want to logout? Your current progress will be saved.",
      okText: "Yes, Logout",
      cancelText: "Cancel",
      onOk: () => {
        // Clear all session data
        localStorage.removeItem("user");
        localStorage.removeItem("userId");
        localStorage.removeItem("profileData");
        sessionStorage.removeItem(FLOW_STATE_KEY);
        sessionStorage.removeItem("redirectPath");
        
        // Reset all states
        setUser(null);
        setParsed(null);
        setCandidateId(null);
        setSessionStatsId(null);
        setCapturedImage(null);
        setQuestion("");
        setRound(null);
        setShowWelcome(true);
        setShowUpload(false);
        setShowCameraVerification(false);
        setShowRound3(false);
        setShowRound4(false);
        setShowRound5(false);
        setLoginLoading(true);
        
        // Show success message
        Modal.success({
          title: "Logged Out",
          content: "You have been logged out successfully. Please login again to continue.",
          onOk: () => {
            // Reload the page to trigger fresh login
            window.location.reload();
          }
        });
      }
    });
  };

  useEffect(() => {
    if (question && timeLeft > 0 && !timerStopped) {
      const t = setTimeout(() => setTimeLeft((x) => x - 1), 1000);
      return () => clearTimeout(t);
    } else if (
      question &&
      timeLeft === 0 &&
      !loading &&
      !submitting &&
      !showFeedback &&
      !timerStopped
    ) {
      setTimerStopped(true);
      submitAnswer();
    }
  }, [timeLeft, question, loading, submitting, showFeedback, round, selectedOption, timerStopped]);

  async function onUploadResume() {
    if (!user || !selectedFile) return;
    const allowedTypes = [".pdf", ".doc", ".docx", ".txt"];
    const fileExtension = selectedFile.name
      .toLowerCase()
      .substring(selectedFile.name.lastIndexOf("."));
    if (!allowedTypes.includes(fileExtension)) {
      setModal({
        show: true,
        type: "error",
        title: "Invalid File Type",
        message: `Please upload a valid resume file.\n\nSupported formats: PDF, DOC, DOCX, TXT\nYour file: ${fileExtension.toUpperCase()}`,
      });
      return;
    }
    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("userId", user.id);
    setShowUpload(false);
    setShowAnalyzing(true);
    setStatus("AI Bot analyzing resume...");
    try {
      const data = await api.uploadResume(formData);
      setShowAnalyzing(false);
      if (data?.success && data?.parsed) {
        setParsed(data.parsed);
        if (data.id) {
          setCandidateId(data.id);
        }
        const years =
          data.parsed.experience || data.parsed.years_of_experience || 0;
        setYearsOfExperience(years);
        setShowAnalyzing(false);
        setShowAnalysisMessage(true);
        const message =
          "AI analysis complete! We've extracted your details from the resume. Please complete camera verification to continue.";
        let charIndex = 0;
        setAnalysisTypingText("");
        const typingInterval = setInterval(() => {
          if (charIndex < message.length) {
            setAnalysisTypingText(message.slice(0, charIndex + 1));
            charIndex++;
          } else {
            clearInterval(typingInterval);
            setTimeout(() => {
              setShowAnalysisMessage(false);
              setShowCameraVerification(true);
            }, 1500);
          }
        }, 50);
      } else if (data?.error) {
        setShowAnalyzing(false);
        setShowUpload(true);
        let errorMessage = "Please upload a proper resume file.";
        if (data.error.includes("format") || data.error.includes("type"))
          errorMessage =
            "Invalid file format. Please upload a PDF, DOC, DOCX, or TXT file.";
        else if (data.error.includes("size"))
          errorMessage =
            "File too large. Please upload a file smaller than 10MB.";
        else if (
          data.error.includes("corrupt") ||
          data.error.includes("damaged")
        )
          errorMessage =
            "File appears to be corrupted. Please try uploading a different file.";
        else if (
          data.error.includes("content") ||
          data.error.includes("text")
        )
          errorMessage =
            "Unable to extract text from resume. Please ensure your file contains readable text.";
        setModal({
          show: true,
          type: "error",
          title: "Resume Upload Failed",
          message: errorMessage,
        });
        setParsed(null);
      } else {
        setShowAnalyzing(false);
        setShowUpload(true);
        setModal({
          show: true,
          type: "error",
          title: "Resume Processing Failed",
          message:
            "Resume upload completed but could not extract profile data. Please try uploading a different resume file.",
        });
        setParsed(null);
      }
    } catch (error) {
      setShowAnalyzing(false);
      setShowUpload(true);
      let errorMessage = "Please upload a proper resume file.";
      if (error instanceof Error) {
        if (
          error.message.includes("network") ||
          error.message.includes("fetch")
        )
          errorMessage =
            "Network error. Please check your connection and try again.";
        else if (error.message.includes("timeout"))
          errorMessage =
            "Upload timed out. Please try again with a smaller file.";
      }
      setModal({
        show: true,
        type: "error",
        title: "Upload Error",
        message: errorMessage,
      });
      setParsed(null);
      console.error("Upload error:", error);
    }
  }

  function dataUrlToFile(
    dataUrl: string,
    filename = "candidate-image.jpg"
  ): File {
    if (!dataUrl.startsWith("data:")) throw new Error("Invalid image data");
    const [header, base64] = dataUrl.split(",");
    if (!base64) throw new Error("Invalid image data");
    const mime = header.match(/:(.*?);/)?.[1] || "image/jpeg";
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new File([bytes], filename, { type: mime });
  }

  async function createExamSession(): Promise<string> {
    if (!candidateId)
      throw new Error(
        "Please upload your resume again before continuing to the interview."
      );
    const userId = user?.id || localStorage.getItem("userId") || "";
    if (!userId) throw new Error("Please log in again before continuing.");
    const sessionRes = await api.createSessionStats({
      candidateId,
      userId,
      status: "started",
    });
    const id = sessionRes.data?.id;
    if (!id) throw new Error("Failed to create exam session");
    setSessionStatsId(id);
    return id;
  }

  async function continueToInterviewAfterCapture() {
    if (!user || !capturedImage) return;
    setUploadingExamImage(true);
    try {
      const localSessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
      setSessionStatsId(localSessionId);

      // Upload the captured image to backend
      try {
        const imageFile = dataUrlToFile(capturedImage, 'candidate-verification.jpg');
        const formData = new FormData();
        formData.append('file', imageFile);
        formData.append('userId', user.id);
        formData.append('sessionStatsId', localSessionId);
        formData.append('type', ExamImageType.CANDIDATE_IMAGE);
        await api.uploadExamImage(formData);
      } catch (uploadErr) {
        console.warn('Candidate image upload failed (non-blocking):', uploadErr);
      }

      setShowCameraVerification(false);
    } finally {
      setUploadingExamImage(false);
    }
  }

  async function verifyAssessmentCode() {
    if (!codeEmail.trim() || !codeInput.trim()) {
      setAssessmentError('Please enter both email and assessment code.');
      return;
    }
    setCodeVerifying(true);
    setAssessmentError('');
    try {
      const res = await fetch(`${BASE_URL}/api/applications/validate-assessment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: codeEmail.trim(), code: codeInput.trim().toUpperCase() }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setAssessmentError(data.message || data.error || 'Invalid email or assessment code.');
        return;
      }
      setApplicationData(data.application);
      setCodeVerified(true);
      // Store candidate name as user for interview
      const appUser = { id: data.application.id?.toString() || codeEmail, name: data.application.name || codeEmail };
      localStorage.setItem('user', JSON.stringify(appUser));
      setUser(appUser);
      // Auto-set parsed resume from application data so upload screen is skipped
      const app = data.application;
      if (app) {
        const parsedFromApp = app.parsed_resume || {};
        const skills = Array.isArray(app.matched_skills) ? app.matched_skills
          : (typeof app.matched_skills === 'string' ? JSON.parse(app.matched_skills || '[]') : []);
        const domains = parsedFromApp.domains
          ? (Array.isArray(parsedFromApp.domains) ? parsedFromApp.domains : [parsedFromApp.domain].filter(Boolean))
          : (parsedFromApp.domain ? [parsedFromApp.domain] : []);
        setParsed({
          name: app.name,
          email: app.email,
          skills: skills,
          domains,
          experience: app.experience_years || 0,
          years_of_experience: app.experience_years || 0,
          is_technical: app.is_technical ?? null,
          ...parsedFromApp,
        });
        setYearsOfExperience(app.experience_years || 0);
        setCandidateId(app.id?.toString() || null);
        // Register candidate in admin panel
        fetch(`${BASE_URL}/api/admin/register-candidate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: appUser.id,
            name: app.name,
            email: app.email,
            skills,
            domains: parsedFromApp.domains || [],
            experience: app.experience_years || 0,
            appliedAt: app.applied_at || app.appliedAt,
          }),
        }).catch(() => {});
        // Go directly to camera verification, skip upload
        setShowWelcome(false);
        setShowUpload(false);
        setShowCameraVerification(true);
      }
    } catch {
      setAssessmentError('Could not connect to server. Please try again.');
    } finally {
      setCodeVerifying(false);
    }
  }

  async function startInterview() {
    if (!user) {
      alert("Please log in to start the interview");
      window.location.href = "/login";
      return;
    }
    if (!parsed) {
      alert("Please upload and parse your resume first");
      return;
    }
    if (!capturedImage) {
      alert("Please complete camera verification first");
      setShowCameraVerification(true);
      return;
    }
    if (showRound4 || showRound5) return;
    // Skip sessionStatsId check for assessment-code flow
    if (!sessionStatsId && !applicationData) {
      alert(
        "Please complete camera verification and click Continue to Interview first."
      );
      return;
    }
    setLoading(true);
    setAskedQuestions([]);
    round3DoneRef.current = false;
    try {
      const data = await api.startInterview({
        userId: user.id,
        sessionId,
        skills: parsed?.skills || [],
        domain: parsed?.domains?.[0] || "General",
        askedQuestions: askedQuestions,
        yearsOfExperience: yearsOfExperience,
        isNonTechnical: isNonTechnical(
          parsed?.skills || [],
          parsed?.domains || []
        ),
      });
      setLoading(false);
      if (data.error) throw new Error(data.error);
      if (data.finished) {
        setStatus("success:" + data.message);
        return;
      }
      if (data.resume) {
        setStatus("Continuing Round " + data.round);
        const contData = await api.startInterview({
          userId: user.id,
          sessionId,
          yearsOfExperience: yearsOfExperience,
        });
        if (contData.question) {
          setRound(contData.round);
          setQNo(contData.question_no);
          setTotalQ(contData.total_questions || getQuestionCount(contData.round));
          setQuestion(contData.question);
          setAskedQuestions((prev) => [...prev, contData.question]);
          const ntCont = isNonTechnical(
            parsed?.skills || [],
            parsed?.domains || []
          );
          const roundTypes = {
            1: "Skill Check",
            2: "Scenario Round",
            3: ntCont ? "Professional Assessment" : "Coding Challenge",
          };
          const roundDescriptions = {
            1: "Technical MCQs to evaluate your fundamentals",
            2: "Real-world scenario questions based on your experience (Need 60% to qualify)",
            3: ntCont
              ? "Professional assessment questions based on your domain (Need 70% to qualify)"
              : "Coding challenge with input/output format and constraints",
          };
          setRoundType(
            roundTypes[contData.round as keyof typeof roundTypes] || ""
          );
          setRoundDescription(
            roundDescriptions[contData.round as keyof typeof roundDescriptions] ||
              ""
          );
          const timeLimit = getTimeLimit(contData.round);
          setTimePerQuestion(timeLimit);
          setTimeLeft(timeLimit);
          setTimerStopped(false);
          setStatus("");
          if (answerRef.current) answerRef.current.value = "";
          setCodeOutput("");
          setCodeError("");
          setLineCount(1);
          setCharCount(0);
          setSelectedOption("");
        } else {
          setStatus("warning:Could not fetch question");
        }
        return;
      }
      setRound(data.round);
      setQNo(data.question_no);
      setTotalQ(data.total_questions || getQuestionCount(data.round));
      setQuestion(data.question);
      setAskedQuestions([data.question]);
      const ntMain = isNonTechnical(
        parsed?.skills || [],
        parsed?.domains || []
      );
      const roundTypes = {
        1: "Skill Check",
        2: "Scenario Round",
        3: ntMain ? "Professional Assessment" : "Coding Challenge",
      };
      const roundDescriptions = {
        1: "Technical MCQs to evaluate your fundamentals (Need 70% to qualify)",
        2: "Real-world scenario questions based on your experience (Need 60% to qualify, min 300 chars)",
        3: isNonTechnical(parsed?.skills || [], parsed?.domains || [], parsed?.is_technical)
          ? "Professional assessment questions based on your domain (Need 70% to qualify)"
          : "Coding challenge with input/output format and constraints (Need 70% to qualify)",
      };
      setRoundType(roundTypes[data.round as keyof typeof roundTypes] || "");
      setRoundDescription(
        roundDescriptions[data.round as keyof typeof roundDescriptions] || ""
      );
      const timeLimit = getTimeLimit(data.round);
      setTimePerQuestion(timeLimit);
      setTimeLeft(timeLimit);
      setTimerStopped(false);
      setStatus("");
      if (answerRef.current) answerRef.current.value = "";
      setCodeOutput("");
      setCodeError("");
      setLineCount(1);
      setCharCount(0);
      setSelectedOption("");
      if (
        data.round === 3 &&
        data.codingQuestion &&
        !isNonTechnical(parsed?.skills || [], parsed?.domains || [], parsed?.is_technical)
      ) {
        setCurrentCodingQuestion(data.codingQuestion);
        setQuestion(
          data.question ||
            (typeof data.codingQuestion === "object"
              ? data.codingQuestion.text ||
                data.codingQuestion.description ||
                ""
              : data.codingQuestion)
        );
        setQNo(data.question_no || 1);
        setTotalQ(data.total_questions || 3);
        goToRound3();
        return;
      }
      if (data.round === 3 && data.codingQuestion) {
        setCurrentCodingQuestion(data.codingQuestion);
        if (
          answerRef.current &&
          data.codingQuestion.boilerplate?.[selectedLanguage]
        ) {
          answerRef.current.value =
            data.codingQuestion.boilerplate[selectedLanguage];
        }
      }
      setTimeout(() => {
        questionRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 500);
    } catch (err: any) {
      console.error("Start interview error:", err);
      setLoading(false);
      alert("Failed to start interview: " + err.message);
    }
  }

  function getPlaceholder(lang: string) {
    switch (lang) {
      case "python":
        return "def function_name():\n    # Write your code here\n    pass";
      case "java":
        return "public static int maxSubarraySum(int[] arr) {\n    // Write your code here\n    return 0;\n}";
      default:
        return "def function_name():\n    # Write your code here\n    pass";
    }
  }

  const blockClipboardAction = (
    _e: React.ClipboardEvent<HTMLTextAreaElement>
  ) => {
    if (!copyPasteBlocked) return;
    _e.preventDefault();
    const msg = `Copy/paste blocked at ${new Date().toLocaleTimeString()}`;
    setViolations((v) => [...v, msg]);
    setViolationMsg('Copy/paste is disabled during the assessment.');
    setTimeout(() => setViolationMsg(''), 3000);
  };

  async function runCode() {
    const code =
      monacoValueRef.current?.trim() ||
      answerRef.current?.value?.trim() ||
      "";
    if (!code) {
      setCodeError("Please write your code before running.");
      setCodeOutput("");
      return;
    }
    setLoading(true);
    setCodeOutput("");
    setCodeError("");
    setCodeEvalResult(null);
    try {
      const result = await api.codeRunner({ code, language: selectedLanguage });
      if (result?.success) {
        setCodeOutput(result.output || "Code executed successfully.");
        setCodeError("");
      } else {
        setCodeOutput("");
        setCodeError(result?.error || "Code execution failed.");
      }
    } catch (error: any) {
      setCodeError(error?.message || "Code runner error.");
      setCodeOutput("");
    } finally {
      setLoading(false);
    }
  }

  async function evaluateCode() {
    const code =
      monacoValueRef.current?.trim() ||
      answerRef.current?.value?.trim() ||
      "";
    if (!code) {
      setCodeError("Please write your code before submitting.");
      return;
    }
    if (!currentCodingQuestion?.questionId) {
      submitAnswer();
      return;
    }
    setCodePerQuestion((prev) => ({
      ...prev,
      [currentCodingQuestion.questionId]: code,
    }));
    setEvaluating(true);
    setSubmitting(true);
    setLoading(true);
    setCodeEvalResult(null);
    setCodeOutput("");
    setCodeError("");
    setEvalSteps([]);
    const steps = [
      "Compiling your code...",
      "Running hidden test cases...",
      "Comparing outputs...",
      "Generating score...",
    ];
    let si = 0;
    const stepTimer = setInterval(() => {
      if (si < steps.length) {
        setEvalSteps((s) => [...s, steps[si]]);
        si++;
      } else {
        clearInterval(stepTimer);
      }
    }, 600);
    try {
      const result = await api.evaluateCode({
        code,
        language: selectedLanguage,
        questionId: currentCodingQuestion.questionId,
      });
      clearInterval(stepTimer);
      setEvalSteps(steps);
      setCodeEvalResult(result);
      await submitAnswer(result.score);
    } catch (err: any) {
      clearInterval(stepTimer);
      setCodeError(err?.message || "Evaluation failed.");
    } finally {
      setLoading(false);
      setSubmitting(false);
      setEvaluating(false);
    }
  }

  useEffect(() => {
    if (question && round === 3) {
      if (answerRef.current) {
        answerRef.current.value = "";
        const event = new Event("input", { bubbles: true });
        answerRef.current.dispatchEvent(event);
      }
      setEditorCode("");
      monacoValueRef.current = "";
      setCodeOutput("");
      setCodeError("");
      setLineCount(1);
      setCharCount(0);
      setCodeEvalResult(null);
      const boilerplate =
        currentCodingQuestion?.boilerplate?.[selectedLanguage] || "";
      if (boilerplate) {
        setTimeout(() => {
          setEditorCode(boilerplate);
          monacoValueRef.current = boilerplate;
        }, 0);
      }
    }
  }, [question, round]);

  useEffect(() => {
    if (round === 3 && selectedLanguage)
      console.log(`Code will be executed in ${selectedLanguage.toUpperCase()}.`);
  }, [selectedLanguage, round]);

  // Anti-cheat: block Ctrl+C / Ctrl+V / Ctrl+X globally
  // copyPasteBlocked=true  → "Copy OFF" (red)  → BLOCK
  // copyPasteBlocked=false → "Copy ON"  (green) → ALLOW
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!copyPasteBlocked) return; // Copy ON → allow everything
      if (e.ctrlKey && ['c','v','x','C','V','X'].includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
        const msg = `Copy/paste blocked at ${new Date().toLocaleTimeString()}`;
        setViolations(v => [...v, msg]);
        setViolationMsg('Copy/paste is disabled during the assessment.');
        setTimeout(() => setViolationMsg(''), 3000);
        if (user?.id && sessionStatsId) {
          fetch(`${BASE_URL}/api/upload-exam-image`, {
            method: 'POST',
            body: (() => { const f = new FormData(); f.append('userId', user.id); f.append('sessionStatsId', sessionStatsId); f.append('type', 'COPY_PASTE_VIOLATION'); f.append('violationType', `CTRL_${e.key.toUpperCase()}`); f.append('file', new Blob([JSON.stringify({ event: msg, round, qNo })], { type: 'application/json' }), 'violation.json'); return f; })()
          }).catch(() => {});
        }
      }
    };
    document.addEventListener('keydown', onKeyDown, true);
    return () => document.removeEventListener('keydown', onKeyDown, true);
  }, [copyPasteBlocked, user, sessionStatsId, round, qNo]);

  // Anti-cheat: tab switch detection
  useEffect(() => {
    if (!question || round !== 3) return;
    const onVisibility = () => {
      if (document.hidden) {
        const msg = `⚠ Tab switch at ${new Date().toLocaleTimeString()}`;
        setViolations((v) => [...v, msg]);
        setViolationMsg("Tab switch detected! This has been flagged.");
        setTimeout(() => setViolationMsg(""), 4000);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [question, round]);

  // Preserve Monaco code per question
  useEffect(() => {
    if (round !== 3 || !currentCodingQuestion?.questionId) return;
    const saved = codePerQuestion[currentCodingQuestion.questionId];
    monacoValueRef.current =
      saved ||
      currentCodingQuestion?.boilerplate?.[selectedLanguage] ||
      "";
  }, [currentCodingQuestion?.questionId, selectedLanguage]);

  const round3DoneRef = React.useRef(false);

  function goToRound3() {
    setQuestion('');
    setRound(null);
    setStatus('');
    setShowFeedback(false);
    setCurrentFeedback(null);
    setNextQuestionData(null);
    setTimerStopped(false);
    setCharCount(0);
    setLoading(false);
    setSubmitting(false);
    setShowWelcome(false);
    setRound3Done(false);
    const nt = isNonTechnical(parsed?.skills || [], parsed?.domains || [], parsed?.is_technical);
    setModal({
      show: true,
      type: 'success',
      title: 'Round 2 Complete!',
      message: nt
        ? 'Great work on the Scenario Round!\n\nNext up: Round 3 — Professional Assessment (Reading & Writing)'
        : 'Great work on the Scenario Round!\n\nNext up: Round 3 — Coding Challenge',
      onClose: () => { setShowRound3(true); },
    });
  }

  function goToRound4() {
    round3DoneRef.current = true;
    setShowRound3(false);
    setQuestion("");
    setRound(null);
    setStatus("");
    setShowFeedback(false);
    setCurrentFeedback(null);
    setNextQuestionData(null);
    setTimerStopped(false);
    setCharCount(0);
    setLoading(false);
    setSubmitting(false);
    setShowWelcome(false);
    setRound3Done(false);
    setModal({
      show: true,
      type: "success",
      title: "Round 3 Complete!",
      message:
        "Great work finishing Round 3!\n\nNext up: Round 4 — Communication Round (Voice MCQ)",
      onClose: () => {
        setShowRound4(true);
      },
    });
  }

  async function submitAnswer(codeScore?: number) {
    if (!user || !question || submitting) return;
    const isTimeExpired = timeLeft <= 0 || timerStopped;
    let ans = "";
    if (round === 1) {
      ans = selectedOption || "No option selected";
    } else {
      ans =
        round === 3 && !nonTechnical
          ? monacoValueRef.current?.trim() || "No answer provided"
          : answerRef.current?.value?.trim() || "No answer provided";
      if (round === 2 && ans.length < 300 && !isTimeExpired) {
        alert(
          "Answer too short. Minimum 300 characters required. Current: " +
            ans.length
        );
        return;
      }
    }
    setTimerStopped(true);
    setSubmitting(true);
    setLoading(true);
    setStatus("Evaluating your answer...");
    try {
      const questionText =
        typeof question === "object"
          ? (question as any).text || JSON.stringify(question)
          : question;
      const data = await api.submitAnswer({
        userId: user.id,
        sessionId,
        domain: parsed?.domains?.[0] || "General",
        question: questionText,
        answer: ans,
        language: selectedLanguage,
        askedQuestions: askedQuestions,
        currentRound: round,
        currentQuestionNo: qNo,
        totalQuestions: totalQ,
        isTimeExpired: isTimeExpired,
        codeScore: codeScore ?? undefined,
      });
      setLoading(false);
      if (data.error) {
        if (data.error.includes("Answer too short") && round === 1) {
          /* ignore */
        } else if (
          data.error.includes("Answer too short") &&
          round === 2 &&
          timeLeft > 0
        ) {
          alert(data.error);
          setSubmitting(false);
          setTimerStopped(false);
          return;
        } else if (data.error === "Interview not started") {
          try {
            const restartData = await api.startInterview({
              userId: user.id,
              sessionId,
              skills: parsed?.skills || [],
              domain: parsed?.domains?.[0] || "General",
              yearsOfExperience: yearsOfExperience,
            });
            if (restartData.question) {
              setRound(restartData.round);
              setQNo(restartData.question_no);
              setTotalQ(restartData.total_questions);
              setQuestion(restartData.question);
              setTimeLeft(
                restartData.timeLimit || getTimeLimit(restartData.round)
              );
              setTimePerQuestion(
                restartData.timeLimit || getTimeLimit(restartData.round)
              );
              return;
            }
          } catch (restartErr) {
            console.error("Failed to restart interview:", restartErr);
          }
          alert(
            "Interview session lost. Please refresh the page to start a new interview."
          );
          setQuestion("");
          setRound(null);
          return;
        }
        throw new Error(data.error);
      }
      if (data.advancedTo) {
        setStatus("success:Passed Round " + data.doneRound);
        setQuestion("");
        if (
          data.advancedTo === 4 ||
          data.roundType === "communication"
        ) {
          goToRound4();
          return;
        }
        if (
          data.advancedTo === 3 &&
          !isNonTechnical(parsed?.skills || [], parsed?.domains || [], parsed?.is_technical)
        ) {
          goToRound3();
          return;
        }
        const roundNames: { [key: number]: string } = {
          1: "Skill Check",
          2: "Scenario Round",
          3: "Coding Challenge",
        };
        setModal({
          show: true,
          type: "success",
          title: `Round ${data.doneRound} — ${roundNames[data.doneRound]} Completed`,
          message: `Round ${data.doneRound} completed!\n\nProceed to Round ${data.advancedTo} and continue your assessment.`,
          onClose: () => {
            if (data.nextQuestion) {
              setRound(data.advancedTo);
              setQNo(1);
              setTotalQ(
                data.total_questions || getQuestionCount(data.advancedTo)
              );
              setQuestion(data.nextQuestion);
              setAskedQuestions([data.nextQuestion]);
              const ntA = isNonTechnical(
                parsed?.skills || [],
                parsed?.domains || []
              );
              const roundTypes = {
                1: "Skill Check",
                2: "Scenario Round",
                3: ntA ? "Professional Assessment" : "Coding Challenge",
              };
              const roundDescriptions = {
                1: "Technical MCQs to evaluate your fundamentals (Need 70% to qualify)",
                2: "Real-world scenario questions based on your experience (Need 60% to qualify, min 300 chars)",
                3: ntA
                  ? "Professional assessment questions based on your domain (Need 70% to qualify)"
                  : "Coding challenge with input/output format and constraints (Need 70% to qualify)",
              };
              setRoundType(
                roundTypes[data.advancedTo as keyof typeof roundTypes] || ""
              );
              setRoundDescription(
                roundDescriptions[
                  data.advancedTo as keyof typeof roundDescriptions
                ] || ""
              );
              const timeLimit = getTimeLimit(data.advancedTo);
              setTimePerQuestion(timeLimit);
              setTimeLeft(timeLimit);
              setTimerStopped(false);
              setSelectedOption("");
              if (answerRef.current) answerRef.current.value = "";
              setCodeOutput("");
              setCodeError("");
              setLineCount(1);
              setCharCount(0);
              setStatus("");
            }
          },
        });
        return;
      }
      if (data.doneRound && data.passed === false) {
        const ntB = isNonTechnical(
          parsed?.skills || [],
          parsed?.domains || []
        );
        const roundNames: { [key: number]: string } = {
          1: "Skill Check",
          2: "Scenario Round",
          3: ntB ? "Professional Assessment" : "Coding Challenge",
        };
        setModal({
          show: true,
          type: "success",
          title: `Round ${data.doneRound} — ${roundNames[data.doneRound]} Completed`,
          message: `Round ${data.doneRound} completed!\n\nProceed to Round ${
            data.advancedTo || data.doneRound + 1
          } and continue your assessment.`,
          onClose: () => {
            if (data.nextQuestion) {
              setRound(data.advancedTo || data.doneRound + 1);
              setQNo(1);
              setTotalQ(
                data.total_questions ||
                  getQuestionCount(data.advancedTo || data.doneRound + 1)
              );
              setQuestion(data.nextQuestion);
              setAskedQuestions([data.nextQuestion]);
              const ntC = isNonTechnical(
                parsed?.skills || [],
                parsed?.domains || []
              );
              const roundTypesB = {
                1: "Skill Check",
                2: "Scenario Round",
                3: ntC ? "Professional Assessment" : "Coding Challenge",
              };
              const roundDescriptionsB = {
                1: "Technical MCQs to evaluate your fundamentals (Need 70% to qualify)",
                2: "Real-world scenario questions based on your experience (Need 60% to qualify, min 300 chars)",
                3: ntC
                  ? "Professional assessment questions based on your domain (Need 70% to qualify)"
                  : "Coding challenge with input/output format and constraints (Need 70% to qualify)",
              };
              const nextRound = data.advancedTo || data.doneRound + 1;
              setRoundType(
                roundTypesB[nextRound as keyof typeof roundTypesB] || ""
              );
              setRoundDescription(
                roundDescriptionsB[
                  nextRound as keyof typeof roundDescriptionsB
                ] || ""
              );
              const timeLimit = getTimeLimit(nextRound);
              setTimePerQuestion(timeLimit);
              setTimeLeft(timeLimit);
              setTimerStopped(false);
              setSelectedOption("");
              if (answerRef.current) answerRef.current.value = "";
              setCodeOutput("");
              setCodeError("");
              setLineCount(1);
              setCharCount(0);
              setStatus("");
            }
          },
        });
        return;
      }
      if (data.finished) {
        if (data.doneRound === 3) {
          goToRound4();
          return;
        }
        setStatus("success:" + data.message);
        setQuestion("");
        return;
      }
      if (data.last) {
        if (
          data.doneRound === 3 ||
          (round === 3 && qNo >= totalQ)
        ) {
          goToRound4();
          return;
        }
        setCurrentFeedback({
          score: Number(data.last.score || 0),
          feedback: data.last.feedback || "",
          userAnswer: ans,
        });
        setShowFeedback(true);
        if (data.question) {
          setNextQuestionData(data);
        }
        return;
      }
      if (data.question) {
        const expectedCount = getQuestionCount(data.round);
        if (data.round === round && data.question_no > expectedCount) {
          if (data.round < 3) {
            setQuestion("");
            alert(
              `Round ${data.round} Completed!\n\nAll ${expectedCount} questions answered.\n\nRefresh the page to start Round ${
                data.round + 1
              }.`
            );
          } else {
            setQuestion("");
            alert(`Assessment Completed!\n\nAll rounds finished successfully!`);
          }
          return;
        }
        const nextQ = data.codingQuestion || data.question;
        if (
          data.round === 3 &&
          data.codingQuestion &&
          !isNonTechnical(parsed?.skills || [], parsed?.domains || [], parsed?.is_technical)
        ) {
          setCurrentCodingQuestion(data.codingQuestion);
          setQNo(data.question_no || 1);
          setTotalQ(data.total_questions || 3);
          goToRound3();
          return;
        }
        if (data.round === 3 && data.codingQuestion)
          setCurrentCodingQuestion(data.codingQuestion);
        setRound(data.round);
        setQNo(data.question_no);
        setTotalQ(data.total_questions || expectedCount);
        setQuestion(nextQ);
        setAskedQuestions((prev) => [
          ...prev,
          typeof nextQ === "object" ? nextQ.text : nextQ,
        ]);
        const timeLimit = getTimeLimit(data.round);
        setTimePerQuestion(timeLimit);
        setTimeLeft(timeLimit);
        setTimerStopped(false);
        setSelectedOption("");
        if (answerRef.current) answerRef.current.value = "";
        setCodeOutput("");
        setCodeError("");
        setLineCount(1);
        setCharCount(0);
        setCodeEvalResult(null);
        setStatus("");
      }
    } catch (err: any) {
      console.error("Submit answer error:", err);
      setLoading(false);
      let errorMessage = "An unexpected error occurred. Please try again.";
      if (err.message?.includes("Failed to fetch"))
        errorMessage =
          "Network connection error. Please check your internet connection and try again.";
      else if (err.message?.includes("timeout"))
        errorMessage =
          "Request timed out. Please try submitting your answer again.";
      else if (err.message) errorMessage = err.message;
      setModal({
        show: true,
        type: "error",
        title: "Submission Error",
        message: errorMessage,
      });
    } finally {
      if (!round3DoneRef.current) setSubmitting(false);
    }
  }

  /* ─────────────────────────────────────────
     RENDER GUARDS
  ──────────────────────────────────────── */
  // Assessment code gate — show before everything
  if (!codeVerified) {
    return (
      <>
        <style>{GLOBAL_CSS}</style>
        <div className={`ai-bg theme-light`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
          <div style={{ background: 'white', borderRadius: 16, padding: '36px 32px', width: '100%', maxWidth: 420, border: '1px solid #e5e7eb' }}>
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111827', margin: 0, letterSpacing: '-0.3px' }}>Enter Assessment Code</h2>
              <p style={{ fontSize: 13, color: '#6b7280', marginTop: 6 }}>Use the email and code from your invitation</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email Address</label>
                <input
                  type="email"
                  value={codeEmail}
                  onChange={e => setCodeEmail(e.target.value)}
                  placeholder="your@email.com"
                  style={{ width: '100%', padding: '11px 13px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Assessment Code</label>
                <input
                  type="text"
                  value={codeInput}
                  onChange={e => setCodeInput(e.target.value.toUpperCase())}
                  placeholder="JD2025-XXXXXX"
                  style={{ width: '100%', padding: '11px 13px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 16, fontWeight: 700, letterSpacing: '3px', outline: 'none', boxSizing: 'border-box', fontFamily: 'monospace', textTransform: 'uppercase' }}
                  onKeyDown={e => e.key === 'Enter' && verifyAssessmentCode()}
                />
              </div>
              {assessmentError && (
                <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, fontSize: 13, color: '#dc2626' }}>
                  {assessmentError}
                </div>
              )}
              <button
                onClick={verifyAssessmentCode}
                disabled={codeVerifying}
                style={{ width: '100%', padding: '12px', background: codeVerifying ? '#e0e7ff' : 'linear-gradient(135deg,#667eea,#764ba2)', color: codeVerifying ? '#4f46e5' : 'white', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: codeVerifying ? 'not-allowed' : 'pointer' }}
              >
                {codeVerifying ? 'Verifying...' : 'Start Assessment →'}
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!user) {
    if (!loginLoading) return null;
    return (
      <>
        <style>{GLOBAL_CSS}</style>
        <div className={`ai-bg theme-${theme}`}>
          <div className="login-loading">
            <div
              className="analyzing-card"
              style={{
                maxWidth: 360,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <SpinnerIcon />
              <div
                style={{
                  marginTop: 14,
                  fontSize: 15,
                  fontWeight: 600,
                  color: "var(--t1)",
                  marginBottom: 5,
                }}
              >
                Logging you in
              </div>
              <div style={{ fontSize: 12.5, color: "var(--t3)" }}>
                Verifying your profile…
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  const roundColors = ["", "#0F7B3A", "#2563EB", "#B45309", "#7B4DFF", "#E91E8C"];
  const languageOptions = [
    { value: "python", label: "Python" },
    { value: "javascript", label: "JavaScript" },
    { value: "java", label: "Java" },
    { value: "c", label: "C" },
    { value: "cpp", label: "C++" },
  ];
  const nonTechnical = parsed
    ? isNonTechnical(parsed.skills, parsed.domains, parsed?.is_technical)
    : false;

  const ModalAlert = () =>
    modal?.show ? (
      <div className="modal-overlay">
        <div className="modal-box">
          <div className="modal-icon">
            {modal.type === "success" ? "✅" : "⚠️"}
          </div>
          <h3 className="modal-title">{modal.title}</h3>
          <p className="modal-msg">{modal.message}</p>
          <button
            className="btn btn-primary btn-primary-lg"
            style={{ marginTop: 22, width: "100%" }}
            onClick={() => {
              setModal(null);
              modal.onClose?.();
            }}
          >
            {modal.type === "success" ? "Continue →" : "Got it"}
          </button>
        </div>
      </div>
    ) : null;

  /* ─── Round 3 Non-Technical: Paragraph Writing ─── */
  if (showRound3 && isNonTechnical(parsed?.skills || [], parsed?.domains || [], parsed?.is_technical)) {
    return (
      <>
        <style>{GLOBAL_CSS}</style>
        <div className={`ai-bg theme-${theme}`}>
          <ModalAlert />
          <InterviewHeader theme={theme} user={user}
            onToggleTheme={() => setTheme(p => p === 'light' ? 'dark' : 'light')}
            onLogout={handleLogout}
            copyPasteBlocked={copyPasteBlocked}
            onToggleCopyPaste={() => setCopyPasteBlocked(p => !p)}
          />
          <div style={{ maxWidth: 840, margin: '0 auto', padding: '28px 20px 80px' }}>
            <Round3ParagraphPage
              userId={user.id}
              sessionId={sessionId}
              parsed={parsed}
              onComplete={() => { setShowRound3(false); goToRound4(); }}
            />
          </div>
        </div>
      </>
    );
  }

  /* ─── Round 3 (Fullscreen Coding) ─── */
  if (
    showRound3 &&
    !isNonTechnical(parsed?.skills || [], parsed?.domains || [], parsed?.is_technical)
  ) {
    return (
      <>
        <style>{GLOBAL_CSS}</style>
        <ModalAlert />
        <Round3CodingPage
          userId={user.id}
          sessionId={sessionId}
          parsed={parsed}
          initialQuestion={currentCodingQuestion || question}
          initialQNo={qNo || 1}
          initialTotalQ={totalQ || 3}
          onComplete={() => {
            setShowRound3(false);
            goToRound4();
          }}
        />
      </>
    );
  }

  /* ─── Round 4 ─── */
  if (showRound4) {
    return (
      <>
        <style>{GLOBAL_CSS}</style>
        <div className={`ai-bg theme-${theme}`}>
          <ModalAlert />
          <InterviewHeader
            theme={theme}
            user={user}
            onToggleTheme={() =>
              setTheme((p) => (p === "light" ? "dark" : "light"))
            }
            onLogout={handleLogout}
            copyPasteBlocked={copyPasteBlocked}
            onToggleCopyPaste={() => setCopyPasteBlocked(p => !p)}
          />
          <div
            style={{ maxWidth: 840, margin: "0 auto", padding: "28px 20px 80px" }}
          >
            <Round4
              userId={user.id}
              sessionId={sessionId}
              onComplete={() => {
                setShowRound4(false);
                setShowRound5(true);
              }}
            />
          </div>
        </div>
      </>
    );
  }

  /* ─── Round 5 ─── */
  if (showRound5) {
    return (
      <>
        <style>{GLOBAL_CSS}</style>
        <div className={`ai-bg theme-${theme}`}>
          <ModalAlert />
          <InterviewHeader
            theme={theme}
            user={user}
            onToggleTheme={() =>
              setTheme((p) => (p === "light" ? "dark" : "light"))
            }
            onLogout={handleLogout}
            copyPasteBlocked={copyPasteBlocked}
            onToggleCopyPaste={() => setCopyPasteBlocked(p => !p)}
          />
          <div
            style={{ maxWidth: 840, margin: "0 auto", padding: "28px 20px 80px" }}
          >
            <Round5
              userId={user.id}
              sessionId={sessionId}
              onComplete={async () => {
                setShowRound5(false);
                // Save final result to backend
                try {
                  const uid = user?.id || '';
                  const userEmail = parsed?.email || applicationData?.email || '';
                  const commRes = await fetch(`${BASE_URL}/api/communication/results/` + uid).then(r => r.json()).catch(() => ({}));
                  const overallScore = commRes?.percentage ?? 70;
                  await fetch(`${BASE_URL}/api/admin/save-result`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      userId: uid,
                      name: parsed?.name || user?.name || '',
                      email: userEmail,
                      skills: parsed?.skills || [],
                      overallScore,
                    }),
                  });
                  // Mark assessment as completed so code cannot be reused
                  if (applicationData?.id) {
                    await fetch(`${BASE_URL}/api/applications/${applicationData.id}/status`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ status: 'completed' }),
                    }).catch(() => {});
                  }
                } catch {}
                setModal({
                  show: true,
                  type: "success",
                  title: "Assessment Complete",
                  message:
                    "Thank you for completing this assessment.\n\nWe have received your responses and our team will review them shortly.\n\nYou will be notified about the results soon.\n\nThank you for your time and effort.",
                  onClose: () => {
                    sessionStorage.removeItem(FLOW_STATE_KEY);
                    setShowWelcome(true);
                    setParsed(null);
                    setCandidateId(null);
                    setSessionStatsId(null);
                    setCapturedImage(null);
                    setQuestion("");
                    setRound(null);
                  },
                });
              }}
            />
          </div>
        </div>
      </>
    );
  }

  /* ─────────────────────────────────────────
     MAIN RENDER
  ──────────────────────────────────────── */
  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <div className={`ai-bg theme-${theme}`}>

        {/* ── Results Modal ── */}
        {showResultModal && candidateResult && (
          <div
            className="modal-overlay"
            onClick={() => {
              setShowResultModal(false);
              setSelectedAttempt(null);
            }}
          >
            <div
              className="modal-box"
              style={{
                maxWidth: 620,
                textAlign: "left",
                maxHeight: "88vh",
                overflowY: "auto",
                padding: "24px 28px",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: 18,
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 17,
                      fontWeight: 600,
                      color: "var(--t1)",
                      letterSpacing: "-.3px",
                    }}
                  >
                    {candidateResult.name}
                  </div>
                  <div
                    style={{ fontSize: 12, color: "var(--t3)", marginTop: 3 }}
                  >
                    Interview Performance Summary
                  </div>
                </div>
                <button
                  className="btn btn-outline"
                  style={{ padding: "5px 11px", fontSize: 12 }}
                  onClick={() => {
                    setShowResultModal(false);
                    setSelectedAttempt(null);
                  }}
                >
                  Close
                </button>
              </div>

              {candidateResult.skills?.length > 0 && (
                <div style={{ marginBottom: 10 }}>
                  <div className="section-label">Skills</div>
                  <div>
                    {candidateResult.skills.map((s: string, i: number) => (
                      <span key={i} className="tag tag-skill">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {candidateResult.domains?.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <div className="section-label">Domain</div>
                  <div>
                    {candidateResult.domains.map((d: string, i: number) => (
                      <span key={i} className="tag tag-domain">
                        {d}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {candidateResult.summary && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3,1fr)",
                    gap: 7,
                    marginBottom: 18,
                  }}
                >
                  {[
                    {
                      label: "Total Attempts",
                      value: candidateResult.summary.totalAttempts,
                      color: "var(--brand)",
                    },
                    {
                      label: "Best Score",
                      value: candidateResult.summary.bestScore + "%",
                      color: "var(--success)",
                    },
                    {
                      label: "Latest Score",
                      value: candidateResult.summary.latestScore + "%",
                      color: "var(--warning)",
                    },
                  ].map((s, i) => (
                    <div
                      key={i}
                      style={{
                        padding: "11px",
                        borderRadius: "var(--r-lg)",
                        border: "1px solid var(--border)",
                        background: "var(--s1)",
                        textAlign: "center",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 10,
                          fontWeight: 600,
                          color: "var(--t4)",
                          textTransform: "uppercase",
                          letterSpacing: ".07em",
                          marginBottom: 4,
                        }}
                      >
                        {s.label}
                      </div>
                      <div
                        style={{
                          fontSize: 20,
                          fontWeight: 600,
                          color: s.color,
                        }}
                      >
                        {s.value}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="section-label">Attempts</div>
              {(candidateResult.attempts || []).map((attempt: any) => {
                const isOpen = selectedAttempt === attempt.attemptNumber;
                const rN: any = {
                  1: "Skill Check",
                  2: "Scenario Round",
                  3: "Coding / Assessment",
                };
                const rC: any = {
                  1: "#0F7B3A",
                  2: "#2563EB",
                  3: "#B45309",
                };
                const score = parseFloat(attempt.overallScore || "0");
                const scoreColor =
                  score >= 60
                    ? "var(--success)"
                    : score >= 40
                    ? "var(--warning)"
                    : "var(--danger)";
                return (
                  <div key={attempt.attemptNumber} className="attempt-card">
                    <div
                      className="attempt-card-header"
                      onClick={() =>
                        setSelectedAttempt(
                          isOpen ? null : attempt.attemptNumber
                        )
                      }
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 9,
                        }}
                      >
                        <div
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: "var(--r-md)",
                            background: "var(--brand)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 11,
                            fontWeight: 600,
                            color: "#fff",
                          }}
                        >
                          #{attempt.attemptNumber}
                        </div>
                        <div>
                          <div
                            style={{
                              fontSize: 13,
                              fontWeight: 600,
                              color: "var(--t1)",
                            }}
                          >
                            Attempt {attempt.attemptNumber}
                          </div>
                          <div
                            style={{ fontSize: 11, color: "var(--t3)" }}
                          >
                            {new Date(attempt.date).toLocaleDateString(
                              "en-IN",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              }
                            )}{" "}
                            · {attempt.totalQuestions} questions
                          </div>
                        </div>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        <div style={{ textAlign: "right" }}>
                          <div
                            style={{
                              fontSize: 15,
                              fontWeight: 600,
                              color: scoreColor,
                            }}
                          >
                            {attempt.overallScore}%
                          </div>
                          <div
                            style={{ fontSize: 10.5, color: "var(--t3)" }}
                          >
                            {attempt.status}
                          </div>
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            color: "var(--t4)",
                            transform: isOpen ? "rotate(180deg)" : "none",
                            transition: "transform .2s",
                          }}
                        >
                          ▾
                        </div>
                      </div>
                    </div>
                    {isOpen && (
                      <div style={{ padding: "0 14px 14px" }}>
                        <div
                          className="section-label"
                          style={{ marginTop: 4 }}
                        >
                          Round Breakdown
                        </div>
                        {(attempt.roundBreakdown || []).map((rb: any) => (
                          <div
                            key={rb.round}
                            style={{
                              marginBottom: 7,
                              padding: "11px",
                              borderRadius: "var(--r-md)",
                              border: "1px solid var(--border)",
                              background: "var(--s1)",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                marginBottom: 7,
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 7,
                                }}
                              >
                                <div
                                  style={{
                                    width: 20,
                                    height: 20,
                                    borderRadius: "var(--r-xs)",
                                    background: rC[rb.round],
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: 10,
                                    fontWeight: 600,
                                    color: "#fff",
                                  }}
                                >
                                  {rb.round}
                                </div>
                                <span
                                  style={{
                                    fontSize: 12.5,
                                    fontWeight: 600,
                                    color: "var(--t1)",
                                  }}
                                >
                                  {rN[rb.round]}
                                </span>
                              </div>
                              <div>
                                <span
                                  style={{
                                    fontSize: 13.5,
                                    fontWeight: 600,
                                    color: rC[rb.round],
                                  }}
                                >
                                  {rb.percentage}%
                                </span>
                                <span
                                  style={{
                                    fontSize: 11,
                                    color: "var(--t3)",
                                    marginLeft: 5,
                                  }}
                                >
                                  {rb.scored}/{rb.maxScore} pts
                                </span>
                              </div>
                            </div>
                            <div className="progress-wrap">
                              <div
                                className="progress-fill"
                                style={{
                                  width: `${Math.min(
                                    parseFloat(rb.percentage),
                                    100
                                  )}%`,
                                  background: rC[rb.round],
                                }}
                              />
                            </div>
                            <div
                              style={{
                                fontSize: 11,
                                color: "var(--t3)",
                                marginTop: 4,
                              }}
                            >
                              {rb.questionsAnswered} questions answered
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Alert Modal ── */}
        <ModalAlert />

        {/* ── Violation bar ── */}
        {violationMsg && (
          <div className="violation-bar">
            <span>⚠️ {violationMsg}</span>
            <span
              style={{ marginLeft: "auto", fontSize: 11, opacity: 0.8 }}
            >
              {violations.length} total flag
              {violations.length > 1 ? "s" : ""}
            </span>
          </div>
        )}

        {/* ── Header ── */}
        <InterviewHeader
          theme={theme}
          user={user}
          onToggleTheme={() =>
            setTheme((p) => (p === "light" ? "dark" : "light"))
          }
          onLogout={handleLogout}
          copyPasteBlocked={copyPasteBlocked}
          onToggleCopyPaste={() => setCopyPasteBlocked(p => !p)}
        />

        {/* ── Proctor cam ── */}
        <ExamProctorCamera
          active={
            Boolean(question || showRound4 || showRound5) && !showRound3
          }
          userId={user?.id || localStorage.getItem("userId") || ""}
          sessionStatsId={sessionStatsId || ""}
        />

        <main className="ai-main">

          {/* ══════════════════════════════════════
              CAMERA VERIFICATION
          ══════════════════════════════════════ */}
          {showCameraVerification && !capturedImage && (
            <CameraVerification
              onCapture={(imageData: string) => {
                setCapturedImage(imageData);
              }}
            />
          )}

          {showCameraVerification && capturedImage && (
            <div className="camera-wrap">
              <div className="camera-header">
                <h2
                  style={{
                    fontSize: 18,
                    fontWeight: 600,
                    marginBottom: 5,
                    color: "var(--t1)",
                  }}
                >
                  Verification complete
                </h2>
                <p style={{ color: "var(--t3)", fontSize: 13 }}>
                  Your photo has been captured successfully
                </p>
              </div>
              <div className="camera-preview">
                <img
                  src={capturedImage}
                  alt="Captured"
                  style={{ width: "100%", display: "block" }}
                />
              </div>
              <div className="camera-actions">
                <button
                  className="btn btn-outline"
                  style={{ width: "100%" }}
                  onClick={() => {
                    setCapturedImage(null);
                    setShowCameraVerification(true);
                  }}
                >
                  Retake photo
                </button>
                <button
                  className="btn btn-primary btn-primary-lg"
                  style={{ width: "100%" }}
                  onClick={continueToInterviewAfterCapture}
                  disabled={uploadingExamImage}
                >
                  {uploadingExamImage ? (
                    <>
                      <svg
                        className="spinner"
                        width={14}
                        height={14}
                        viewBox="0 0 24 24"
                      >
                        <circle
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="3"
                          fill="none"
                          opacity=".25"
                        />
                        <path
                          fill="currentColor"
                          opacity=".75"
                          d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z"
                        />
                      </svg>{" "}
                      Uploading…
                    </>
                  ) : (
                    "Continue to Interview →"
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════
              WELCOME SCREEN
          ══════════════════════════════════════ */}
          {showWelcome && !round3Done && !showRound4 && !showRound5 && (
            <div className="welcome-root">

              {/* Hero */}
              <div className="welcome-eyebrow">
                <span className="welcome-eyebrow-dot" />
                AI-Powered Assessment
              </div>

              <div className="ai-typing-row">
                <span style={{ fontSize: 16 }}>🤖</span>
                <span className="ai-typing-text">
                  {typingText}
                  <span className="cursor-blink" />
                </span>
              </div>

              <h1 className="welcome-title">
                Ace your next
                <br />
                <strong>tech interview</strong>
              </h1>
              <p className="welcome-sub">
                Upload your resume and get a personalised AI interview tailored
                to your skills, experience, and target role.
              </p>

              <div className="cta-row">
                <button
                  className="btn btn-primary btn-primary-lg"
                  onClick={() => {
                    setShowWelcome(false);
                    setShowUpload(true);
                  }}
                >
                  Start Interview →
                </button>
              </div>
              <div className="cta-hint">
                Upload resume · AI questions · Instant scored feedback
              </div>

              {/* Stats */}
              {!configLoading && interviewConfig && (
                <div className="stats-row">
                  <div className="stat-chip">
                    <div
                      className="stat-dot"
                      style={{ background: "var(--brand)" }}
                    />
                    <span>
                      {Math.round(
                        interviewConfig.reduce(
                          (sum: number, r: any) =>
                            sum + r.questions * r.time_limit,
                          0
                        ) / 60
                      )}{" "}
                      min total
                    </span>
                  </div>
                  <div className="stat-chip">
                    <div
                      className="stat-dot"
                      style={{ background: "var(--info)" }}
                    />
                    <span>
                      {interviewConfig.reduce(
                        (sum: number, r: any) => sum + r.questions,
                        0
                      )}{" "}
                      questions
                    </span>
                  </div>
                  <div className="stat-chip">
                    <div
                      className="stat-dot"
                      style={{ background: "var(--success)" }}
                    />
                    <span>Instant AI feedback</span>
                  </div>
                  <div className="stat-chip">
                    <div
                      className="stat-dot"
                      style={{ background: "var(--warning)" }}
                    />
                    <span>{interviewConfig.length} rounds</span>
                  </div>
                </div>
              )}

              {/* Rounds grid */}
              <div className="section-label" style={{ marginBottom: 10 }}>
                Assessment Rounds
              </div>

              {configLoading ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "20px",
                    color: "var(--t3)",
                  }}
                >
                  <SpinnerIcon />
                  <div style={{ marginTop: 8, fontSize: 12 }}>
                    Loading rounds...
                  </div>
                </div>
              ) : interviewConfig ? (
                <div className="rounds-strip">
                  {interviewConfig.map((r: any) => {
                    const roundInfo: any = {
                      1: {
                        name: "Skill Check",
                        desc: "Core technical MCQs on your fundamentals and role knowledge.",
                        color: "#0F7B3A",
                      },
                      2: {
                        name: "Scenario Round",
                        desc: "Written responses to real-world problems and judgement calls.",
                        color: "#2563EB",
                      },
                      3: {
                        name: "Coding Challenge",
                        desc: "Live coding with execution, I/O validation, and constraints.",
                        color: "#B45309",
                      },
                      4: {
                        name: "Communication",
                        desc: "Behavioural MCQs read aloud via voice — listen and select.",
                        color: "#7B4DFF",
                      },
                      5: {
                        name: "HR Interview",
                        desc: "Voice-based open HR questions with AI feedback.",
                        color: "#E91E8C",
                      },
                    };
                    const info = roundInfo[r.round] || {
                      name: r.label,
                      desc: "",
                      color: "#2563EB",
                    };
                    return (
                      <div
                        key={r.round}
                        className="round-pill"
                        style={{ "--rc": info.color } as any}
                      >
                        <div
                          className="round-pill-num"
                          style={{ background: info.color }}
                        >
                          {r.round}
                        </div>
                        <div className="round-pill-name">{info.name}</div>
                        <div className="round-pill-meta">
                          {r.questions} qu · {r.time_limit}s each
                        </div>
                        <p className="round-pill-desc">{info.desc}</p>
                      </div>
                    );
                  })}
                </div>
              ) : null}

              {/* How it works */}
              <div className="how-section">
                <div className="how-head">
                  <div className="how-kicker">How It Works</div>
                  <h2 className="how-title">Four steps to interview-ready</h2>
                  <p className="how-sub">
                    A guided flow that turns your resume into a personalised,
                    scored interview across all 5 rounds.
                  </p>
                </div>
                <div className="how-grid">
                  {[
                    {
                      step: "01",
                      title: "Upload Resume",
                      desc: "AI parses your skills, domain, and years of experience.",
                    },
                    {
                      step: "02",
                      title: "Questions Generated",
                      desc: "Tailored questions based on your exact skill set and seniority.",
                    },
                    {
                      step: "03",
                      title: "Timed Rounds",
                      desc: "Work through skill checks, scenarios, and a coding challenge.",
                    },
                    {
                      step: "04",
                      title: "Instant Feedback",
                      desc: "Receive a score, per-answer feedback, and tips to improve.",
                    },
                  ].map((item) => (
                    <div className="how-step" key={item.title}>
                      <div className="how-step-n">{item.step}</div>
                      <div className="how-step-t">{item.title}</div>
                      <p className="how-step-d">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════
              UPLOAD SCREEN
          ══════════════════════════════════════ */}
          {showUpload && (
            <div className="upload-card">
              <div className="card">
                <div className="card-header">
                  <button
                    className="btn btn-ghost"
                    onClick={() => {
                      setShowUpload(false);
                      setShowWelcome(true);
                    }}
                  >
                    ← Back
                  </button>
                  <div>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: "var(--t1)",
                      }}
                    >
                      Upload Resume
                    </div>
                    <div style={{ fontSize: 12, color: "var(--t3)" }}>
                      AI will analyse your skills and experience
                    </div>
                  </div>
                </div>
                <div className="card-body">
                  <div
                    className={`dropzone${dragOver ? " active" : ""}`}
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOver(true);
                    }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragOver(false);
                      const f = e.dataTransfer.files[0];
                      if (f) setSelectedFile(f);
                    }}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx,.txt"
                      style={{ display: "none" }}
                      onChange={(e) =>
                        setSelectedFile(e.target.files?.[0] || null)
                      }
                    />
                    <div className="dropzone-icon">
                      {selectedFile ? "📄" : "📁"}
                    </div>
                    {selectedFile ? (
                      <>
                        <div className="dropzone-title">
                          {selectedFile.name}
                        </div>
                        <div
                          className="dropzone-sub"
                          style={{ color: "var(--brand)" }}
                        >
                          ✓ Selected — click to change
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="dropzone-title">
                          Drop your resume here
                        </div>
                        <div className="dropzone-sub">
                          or click to browse — PDF, DOC, DOCX, TXT
                        </div>
                      </>
                    )}
                  </div>
                  <button
                    className="btn btn-primary btn-primary-lg"
                    style={{ width: "100%", marginTop: 12 }}
                    disabled={!selectedFile}
                    onClick={onUploadResume}
                  >
                    {selectedFile
                      ? "Analyse Resume →"
                      : "Select a file to continue"}
                  </button>
                  <div className="info-box" style={{ marginTop: 12 }}>
                    <div className="info-box-title">What happens next</div>
                    AI extracts your skills & experience · Personalised questions
                    are generated · You get instant scored feedback
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════
              ANALYSING
          ══════════════════════════════════════ */}
          {(showAnalyzing || showAnalysisMessage) && (
            <div className="analyzing-wrap">
              <div className="analyzing-card">
                <div className="spin-bot">🤖</div>
                {showAnalyzing ? (
                  <>
                    <div
                      style={{
                        fontSize: 16,
                        fontWeight: 600,
                        color: "var(--t1)",
                        marginBottom: 5,
                      }}
                    >
                      Analysing your resume
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        color: "var(--t3)",
                        marginBottom: 20,
                      }}
                    >
                      AI is processing your profile…
                    </div>
                    <div className="progress-steps">
                      {[
                        "Parsing document structure",
                        "Extracting technical skills",
                        "Generating question matrix",
                      ].map((s, i) => (
                        <div key={i} className="progress-step">
                          <div
                            className="progress-step-dot"
                            style={{ animationDelay: `${i * 0.3}s` }}
                          />
                          <span>{s}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <div
                      style={{
                        fontSize: 16,
                        fontWeight: 600,
                        color: "var(--t1)",
                        marginBottom: 12,
                      }}
                    >
                      Analysis complete!
                    </div>
                    <div className="info-box">
                      <p
                        style={{
                          fontSize: 13,
                          color: "var(--brand)",
                          lineHeight: 1.65,
                        }}
                      >
                        {analysisTypingText}
                        <span className="cursor-blink" />
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════
              PRE-INTERVIEW — Resume + Structure
          ══════════════════════════════════════ */}
          {!showWelcome &&
            !showUpload &&
            !showAnalyzing &&
            !showAnalysisMessage &&
            !showCameraVerification &&
            !showRound4 &&
            !showRound5 &&
            !round3Done &&
            !question && (
              <div className="two-col">

                {/* Left — Resume card */}
                <div className="card">
                  {!parsed ? (
                    <>
                      <div className="card-header">
                        <div
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: "var(--r-md)",
                            background: "var(--brand-tint)",
                            border: "1px solid var(--brand-ring)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 11,
                            fontWeight: 600,
                            color: "var(--brand)",
                          }}
                        >
                          CV
                        </div>
                        <div>
                          <div
                            style={{
                              fontSize: 13.5,
                              fontWeight: 600,
                              color: "var(--t1)",
                            }}
                          >
                            Upload Resume
                          </div>
                          <div style={{ fontSize: 11.5, color: "var(--t3)" }}>
                            Required to start
                          </div>
                        </div>
                      </div>
                      <div className="card-body">
                        <div
                          className="dropzone"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf,.doc,.docx,.txt"
                            style={{ display: "none" }}
                            onChange={(e) =>
                              setSelectedFile(e.target.files?.[0] || null)
                            }
                          />
                          <div className="dropzone-icon">
                            {selectedFile ? "📄" : "📁"}
                          </div>
                          {selectedFile ? (
                            <>
                              <div className="dropzone-title">
                                {selectedFile.name}
                              </div>
                              <div
                                className="dropzone-sub"
                                style={{ color: "var(--brand)" }}
                              >
                                ✓ Click to change
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="dropzone-title">
                                Click to upload
                              </div>
                              <div className="dropzone-sub">
                                PDF, DOC, DOCX, TXT
                              </div>
                            </>
                          )}
                        </div>
                        <div
                          style={{ display: "flex", gap: 8, marginTop: 12 }}
                        >
                          <button
                            className="btn btn-primary"
                            style={{ flex: 1 }}
                            disabled={loading || !selectedFile}
                            onClick={onUploadResume}
                          >
                            {loading ? (
                              <>
                                <SpinnerIcon /> Parsing…
                              </>
                            ) : (
                              "Analyse Resume"
                            )}
                          </button>
                          {selectedFile && (
                            <button
                              className="btn btn-outline"
                              onClick={() => {
                                setSelectedFile(null);
                                if (fileInputRef.current)
                                  fileInputRef.current.value = "";
                              }}
                            >
                              Clear
                            </button>
                          )}
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="profile-header">
                        <div className="profile-avatar">
                          {parsed.name
                            ? parsed.name.charAt(0).toUpperCase()
                            : "C"}
                        </div>
                        <div>
                          <div className="profile-name">
                            {parsed.name || "Candidate"}
                          </div>
                          <div className="profile-ok">✓ Profile extracted</div>
                        </div>
                      </div>
                      <div className="card-body">
                        {parsed.skills?.length > 0 && (
                          <div style={{ marginBottom: 14 }}>
                            <div className="section-label">Skills</div>
                            <div>
                              {parsed.skills.map((s: string, i: number) => (
                                <span key={i} className="tag tag-skill">
                                  {s}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {yearsOfExperience > 0 && (
                          <div style={{ marginBottom: 14 }}>
                            <div className="section-label">Experience</div>
                            <span className="tag tag-exp">
                              {yearsOfExperience}{" "}
                              {yearsOfExperience === 1 ? "year" : "years"}
                            </span>
                          </div>
                        )}
                        {parsed.domains?.length > 0 && (
                          <div style={{ marginBottom: 14 }}>
                            <div className="section-label">Domains</div>
                            <div>
                              {parsed.domains.map((d: string, i: number) => (
                                <span key={i} className="tag tag-domain">
                                  {d}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        <div
                          style={{
                            paddingTop: 12,
                            borderTop: "1px solid var(--border-soft)",
                          }}
                        >
                          <button
                            className="btn btn-outline"
                            style={{ width: "100%" }}
                            onClick={() => {
                              setParsed(null);
                              setSelectedFile(null);
                              setCapturedImage(null);
                              setShowCameraVerification(false);
                              setStatus("");
                              sessionStorage.removeItem(FLOW_STATE_KEY);
                              if (fileInputRef.current)
                                fileInputRef.current.value = "";
                            }}
                          >
                            Replace Resume
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Right — Assessment structure */}
                <div className="card">
                  <div className="card-header">
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: "var(--r-md)",
                        background: "var(--info-tint)",
                        border: "1px solid rgba(8,145,178,.15)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 13,
                        fontWeight: 600,
                        color: "var(--info)",
                      }}
                    >
                      5
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: 13.5,
                          fontWeight: 600,
                          color: "var(--t1)",
                        }}
                      >
                        Assessment Structure
                      </div>
                      <div style={{ fontSize: 11.5, color: "var(--t3)" }}>
                        {configLoading
                          ? "Loading..."
                          : interviewConfig
                          ? `${interviewConfig.length} rounds · ${interviewConfig.reduce(
                              (sum: number, r: any) => sum + r.questions,
                              0
                            )} questions`
                          : "5 rounds · 34 questions"}
                      </div>
                    </div>
                  </div>
                  <div className="card-body">
                    {configLoading ? (
                      <div
                        style={{
                          textAlign: "center",
                          padding: "20px",
                          color: "var(--t3)",
                        }}
                      >
                        <SpinnerIcon />
                        <div style={{ marginTop: 8, fontSize: 12 }}>
                          Loading configuration...
                        </div>
                      </div>
                    ) : (interviewConfig || [
                      { round: 1, questions: 12, time_limit: 30, label: 'Skill Check' },
                      { round: 2, questions: 5, time_limit: 120, label: 'Scenario Round' },
                      { round: 3, questions: 3, time_limit: 300, label: 'Coding Challenge' },
                      { round: 4, questions: 8, time_limit: 60, label: 'Communication' },
                      { round: 5, questions: 6, time_limit: 120, label: 'HR Interview' },
                    ]).length > 0 ? (
                      (interviewConfig || [
                        { round: 1, questions: 12, time_limit: 30, label: 'Skill Check' },
                        { round: 2, questions: 5, time_limit: 120, label: 'Scenario Round' },
                        { round: 3, questions: 3, time_limit: 300, label: 'Coding Challenge' },
                        { round: 4, questions: 8, time_limit: 60, label: 'Communication' },
                        { round: 5, questions: 6, time_limit: 120, label: 'HR Interview' },
                      ]).map((r: any) => {
                        const roundNames: any = {
                          1: {
                            name: "Skill Check",
                            sub: "Multiple choice fundamentals",
                            color: "#0F7B3A",
                          },
                          2: {
                            name: "Scenario Round",
                            sub: "Real-world problem solving",
                            color: "#2563EB",
                          },
                          3: {
                            name:
                              parsed &&
                              isNonTechnical(
                                parsed.skills,
                                parsed.domains
                              )
                                ? "Professional Assessment"
                                : "Coding Challenge",
                            sub:
                              parsed &&
                              isNonTechnical(
                                parsed.skills,
                                parsed.domains
                              )
                                ? "Domain-specific questions"
                                : "Live coding challenges",
                            color: "#B45309",
                          },
                          4: {
                            name: "Communication Round",
                            sub: "HR behavioural MCQs (voice)",
                            color: "#7B4DFF",
                          },
                          5: {
                            name: "HR Interview",
                            sub: "Open-ended voice answers",
                            color: "#E91E8C",
                          },
                        };
                        const info = roundNames[r.round] || {
                          name: r.label,
                          sub: "",
                          color: "#2563EB",
                        };
                        return (
                          <div
                            key={r.round}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              padding: "9px 0",
                              borderBottom: "1px solid var(--border-soft)",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 9,
                              }}
                            >
                              <div
                                className="round-num"
                                style={{ background: info.color }}
                              >
                                {r.round}
                              </div>
                              <div>
                                <div className="round-info-name">
                                  {info.name}
                                </div>
                                <div className="round-info-sub">
                                  {info.sub}
                                </div>
                              </div>
                            </div>
                            <div
                              style={{
                                display: "flex",
                                gap: 6,
                                flexShrink: 0,
                              }}
                            >
                              <div className="chip">{r.questions} qs</div>
                              <div className="chip">{r.time_limit}s</div>
                            </div>
                          </div>
                        );
                      })
                    ) : null}

                    <div
                      style={{
                        paddingTop: 16,
                        borderTop: "1px solid var(--border-soft)",
                        marginTop: 4,
                      }}
                    >
                      {parsed ? (
                        <button
                          className="btn btn-primary btn-primary-lg"
                          style={{ width: "100%" }}
                          disabled={loading || showRound4 || showRound5}
                          onClick={startInterview}
                        >
                          {loading ? (
                            <>
                              <SpinnerIcon /> Starting…
                            </>
                          ) : showRound4 || showRound5 ? (
                            "Assessment Complete ✓"
                          ) : (
                            "Start Assessment →"
                          )}
                        </button>
                      ) : (
                        <div
                          style={{
                            textAlign: "center",
                            fontSize: 13,
                            color: "var(--t3)",
                            padding: "13px",
                            background: "var(--s1)",
                            borderRadius: "var(--r-lg)",
                            border: "1px solid var(--border)",
                          }}
                        >
                          Upload your resume to begin
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

          {/* ══════════════════════════════════════
              ROUND 3 DONE → START ROUND 4
          ══════════════════════════════════════ */}
          {round3Done && !showRound4 && !showRound5 && (
            <div className="r3-done">
              <div className="card">
                <div style={{ padding: "44px 32px", textAlign: "center" }}>
                  <div style={{ fontSize: 40, marginBottom: 14 }}>🎉</div>
                  <div
                    style={{
                      fontSize: 19,
                      fontWeight: 600,
                      color: "var(--t1)",
                      marginBottom: 7,
                    }}
                  >
                    Round 3 Complete!
                  </div>
                  <div
                    style={{
                      fontSize: 13.5,
                      color: "var(--t3)",
                      marginBottom: 28,
                      lineHeight: 1.65,
                    }}
                  >
                    Great work on the Coding Challenge.
                    <br />
                    Next: Round 4 — Communication (Voice MCQ)
                  </div>
                  <button
                    className="btn btn-primary btn-primary-lg"
                    style={{ width: "100%" }}
                    onClick={() => {
                      setRound3Done(false);
                      setShowRound4(true);
                    }}
                  >
                    Start Round 4 — Communication →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════
              QUESTION VIEW
          ══════════════════════════════════════ */}
          {question && !showRound4 && !showRound5 && (
            <div
              style={{ maxWidth: 840, margin: "0 auto" }}
              ref={questionRef}
            >
              <div className="card">

                {/* Header */}
                <div className="q-header">
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div
                      className="q-round-badge"
                      style={{ background: roundColors[round || 1] }}
                    >
                      {round}
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: 13.5,
                          fontWeight: 600,
                          color: "var(--t1)",
                        }}
                      >
                        Round {round}: {roundType}
                      </div>
                      <div
                        style={{
                          fontSize: 11.5,
                          color: "var(--t3)",
                          marginTop: 1,
                        }}
                      >
                        Question {qNo} of {totalQ}
                      </div>
                    </div>
                  </div>
                  <div
                    style={{
                      flex: 1,
                      maxWidth: 160,
                      display: "flex",
                      flexDirection: "column",
                      gap: 4,
                      margin: "0 14px",
                    }}
                  >
                    <div className="progress-wrap">
                      <div
                        className="progress-fill"
                        style={{ width: `${(qNo / totalQ) * 100}%` }}
                      />
                    </div>
                    <div
                      style={{
                        fontSize: 10.5,
                        color: "var(--t4)",
                        textAlign: "center",
                      }}
                    >
                      {qNo}/{totalQ} complete
                    </div>
                  </div>
                  <div
                    className={`timer-chip ${
                      timerStopped
                        ? "timer-stopped"
                        : timeLeft <= 10
                        ? "timer-urgent"
                        : "timer-normal"
                    }`}
                  >
                    <span>⏱</span>
                    <span>{timerStopped ? "Done" : timeLeft + "s"}</span>
                  </div>
                </div>

                {roundDescription && (
                  <div className="round-desc-bar">{roundDescription}</div>
                )}

                <div style={{ padding: "20px 22px" }}>

                  {/* ── Question content ── */}
                  <div style={{ marginBottom: 16 }}>
                    {round === 3 && !nonTechnical ? (
                      <div className="q-box">
                        {(() => {
                          const cq =
                            typeof question === "object"
                              ? (question as any)
                              : null;
                          if (cq?.isCodingQuestion) {
                            return (
                              <>
                                <div className="q-section">
                                  <div
                                    className="q-section-label"
                                    style={{ color: "var(--brand)" }}
                                  >
                                    Problem
                                  </div>
                                  <p
                                    style={{
                                      fontSize: 13.5,
                                      color: "var(--t1)",
                                      lineHeight: 1.65,
                                    }}
                                  >
                                    {cq.description}
                                  </p>
                                </div>
                                {cq.examples?.length > 0 && (
                                  <div className="q-section">
                                    <div
                                      className="q-section-label"
                                      style={{ color: "var(--info)" }}
                                    >
                                      Example
                                    </div>
                                    {cq.examples.map(
                                      (ex: any, i: number) => (
                                        <div
                                          key={i}
                                          style={{
                                            fontFamily: "var(--mono)",
                                            fontSize: 12.5,
                                          }}
                                        >
                                          <span
                                            style={{
                                              color: "var(--success)",
                                            }}
                                          >
                                            Input: {ex.input}
                                          </span>
                                          <br />
                                          <span
                                            style={{
                                              color: "var(--brand)",
                                            }}
                                          >
                                            Output: {ex.output}
                                          </span>
                                        </div>
                                      )
                                    )}
                                  </div>
                                )}
                                {cq.constraints?.length > 0 && (
                                  <div className="q-section">
                                    <div
                                      className="q-section-label"
                                      style={{ color: "var(--warning)" }}
                                    >
                                      Constraints
                                    </div>
                                    {cq.constraints.map(
                                      (c: string, i: number) => (
                                        <p
                                          key={i}
                                          style={{
                                            fontSize: 12.5,
                                            color: "var(--t1)",
                                          }}
                                        >
                                          • {c}
                                        </p>
                                      )
                                    )}
                                  </div>
                                )}
                              </>
                            );
                          }

                          const questionText =
                            typeof question === "string"
                              ? question
                              : JSON.stringify(question);
                          const lines = questionText.split("\n");
                          let cs = "",
                            sc: string[] = [];
                          const secs: {
                            type: string;
                            content: string[];
                          }[] = [];
                          lines.forEach((line) => {
                            const t = line
                              .trim()
                              .replace(/^\*+\s*/, "")
                              .replace(/\*+$/, "")
                              .trim();
                            if (!t) return;
                            const lower = t.toLowerCase();
                            if (
                              lower.startsWith("problem:") ||
                              lower.startsWith("problem") ||
                              lower.startsWith("given:") ||
                              lower.startsWith("given")
                            ) {
                              if (cs) secs.push({ type: cs, content: sc });
                              cs = "problem";
                              sc = [
                                t.replace(/^(problem|given)[:\s]*/i, ""),
                              ];
                            } else if (
                              lower.startsWith("function:") ||
                              lower.startsWith("function signature:")
                            ) {
                              if (cs) secs.push({ type: cs, content: sc });
                              cs = "function";
                              sc = [
                                t.replace(
                                  /^function(\s+signature)?[:\s]*/i,
                                  ""
                                ),
                              ];
                            } else if (
                              lower.startsWith("example:") ||
                              lower.startsWith("example")
                            ) {
                              if (cs) secs.push({ type: cs, content: sc });
                              cs = "example";
                              sc = [];
                            } else if (
                              lower.startsWith("constraint:") ||
                              lower.startsWith("constraints:")
                            ) {
                              if (cs) secs.push({ type: cs, content: sc });
                              cs = "constraints";
                              sc = [
                                t.replace(/^constraints?[:\s]*/i, ""),
                              ];
                            } else if (cs) {
                              sc.push(t.replace(/^[-#•\s]+/, ""));
                            } else {
                              cs = "problem";
                              sc = [t];
                            }
                          });
                          if (cs) secs.push({ type: cs, content: sc });

                          if (secs.length === 0) {
                            return (
                              <div className="q-section">
                                <div
                                  className="q-section-label"
                                  style={{ color: "var(--brand)" }}
                                >
                                  Problem
                                </div>
                                <pre
                                  style={{
                                    fontSize: 13.5,
                                    color: "var(--t1)",
                                    lineHeight: 1.65,
                                    whiteSpace: "pre-wrap",
                                    fontFamily: "var(--font)",
                                  }}
                                >
                                  {questionText}
                                </pre>
                              </div>
                            );
                          }

                          return secs.map((s, i) => {
                            if (s.type === "problem")
                              return (
                                <div key={i} className="q-section">
                                  <div
                                    className="q-section-label"
                                    style={{ color: "var(--brand)" }}
                                  >
                                    Problem
                                  </div>
                                  {s.content.map((l, j) => (
                                    <p
                                      key={j}
                                      style={{
                                        fontSize: 13.5,
                                        color: "var(--t1)",
                                        lineHeight: 1.65,
                                        marginBottom: 8,
                                      }}
                                    >
                                      {l}
                                    </p>
                                  ))}
                                </div>
                              );
                            if (s.type === "function")
                              return (
                                <div key={i} className="q-section">
                                  <div
                                    className="q-section-label"
                                    style={{ color: "var(--success)" }}
                                  >
                                    Function Signature
                                  </div>
                                  <pre
                                    style={{
                                      fontSize: 12.5,
                                      fontFamily: "var(--mono)",
                                      color: "var(--t1)",
                                      background: "var(--s1)",
                                      padding: "8px 12px",
                                      borderRadius: "var(--r-md)",
                                      overflowX: "auto",
                                    }}
                                  >
                                    {s.content.join("\n")}
                                  </pre>
                                </div>
                              );
                            if (s.type === "example")
                              return (
                                <div key={i} className="q-section">
                                  <div
                                    className="q-section-label"
                                    style={{ color: "var(--info)" }}
                                  >
                                    Examples
                                  </div>
                                  {s.content.map((l, j) => (
                                    <div
                                      key={j}
                                      style={{
                                        fontSize: 12.5,
                                        fontFamily: "var(--mono)",
                                        color: l
                                          .toLowerCase()
                                          .includes("input")
                                          ? "var(--success)"
                                          : l
                                              .toLowerCase()
                                              .includes("output")
                                          ? "var(--brand)"
                                          : "var(--t1)",
                                        marginBottom: 4,
                                      }}
                                    >
                                      {l}
                                    </div>
                                  ))}
                                </div>
                              );
                            if (s.type === "constraints")
                              return (
                                <div key={i} className="q-section">
                                  <div
                                    className="q-section-label"
                                    style={{ color: "var(--warning)" }}
                                  >
                                    Constraints
                                  </div>
                                  {s.content.map((l, j) => (
                                    <p
                                      key={j}
                                      style={{
                                        fontSize: 12.5,
                                        color: "var(--t1)",
                                        marginBottom: 4,
                                      }}
                                    >
                                      • {l}
                                    </p>
                                  ))}
                                </div>
                              );
                            return null;
                          });
                        })()}
                      </div>
                    ) : round === 2 || (round === 3 && nonTechnical) ? (
                      <div className="q-box">
                        {decodeHtmlEntities(question)
                          .split("\n")
                          .map((line, i) => {
                            const t = line.trim();
                            if (!t) return null;
                            if (
                              t.startsWith("**Situation:**") ||
                              t.startsWith(
                                "**Read the following passage:**"
                              )
                            )
                              return (
                                <div key={i} className="q-section">
                                  <div
                                    className="q-section-label"
                                    style={{ color: "var(--success)" }}
                                  >
                                    Passage
                                  </div>
                                  <p
                                    style={{
                                      fontSize: 13.5,
                                      color: "var(--t1)",
                                      lineHeight: 1.65,
                                    }}
                                  >
                                    {t
                                      .replace(
                                        /\*\*(Situation|Read the following passage):\*\*/i,
                                        ""
                                      )
                                      .trim()}
                                  </p>
                                </div>
                              );
                            if (
                              t.startsWith("**Question:**") ||
                              t.startsWith("**Task:**")
                            )
                              return (
                                <div key={i} className="q-section">
                                  <div
                                    className="q-section-label"
                                    style={{ color: "var(--info)" }}
                                  >
                                    Task
                                  </div>
                                  <p
                                    style={{
                                      fontSize: 13.5,
                                      color: "var(--t1)",
                                      lineHeight: 1.65,
                                      fontWeight: 500,
                                    }}
                                  >
                                    {t
                                      .replace(
                                        /\*\*(Question|Task):\*\*/i,
                                        ""
                                      )
                                      .trim()}
                                  </p>
                                </div>
                              );
                            return (
                              <p
                                key={i}
                                style={{
                                  fontSize: 13.5,
                                  color: "var(--t2)",
                                  marginBottom: 5,
                                }}
                              >
                                {t}
                              </p>
                            );
                          })}
                      </div>
                    ) : (
                      <h3
                        style={{
                          fontSize: 15,
                          fontWeight: 500,
                          color: "var(--t1)",
                          lineHeight: 1.65,
                        }}
                      >
                        {question
                          .split(/[ABCD]\)/)[0]
                          .replace("Question:", "")
                          .trim()}
                      </h3>
                    )}
                  </div>

                  {/* ── MCQ Options ── */}
                  {round === 1 && question.includes("A)") && (
                    <div style={{ marginBottom: 16 }}>
                      {["A", "B", "C", "D"].map((opt) => {
                        const text = question
                          .split(`${opt})`)[1]
                          ?.split(/[\n\r]|[BCD]\)/)[0]
                          ?.trim();
                        if (!text) return null;
                        const isSel = selectedOption === opt;
                        const showResult = showFeedback && currentFeedback;
                        const isCorrectOpt =
                          showResult && isSel && currentFeedback!.score >= 5;
                        const isWrongOpt =
                          showResult && isSel && currentFeedback!.score < 5;
                        return (
                          <label
                            key={opt}
                            className={`mcq-option${
                              isSel && !showFeedback ? " selected" : ""
                            }${isCorrectOpt ? " correct" : ""}${
                              isWrongOpt ? " incorrect" : ""
                            }${showFeedback ? " disabled" : ""}`}
                            onClick={() =>
                              !showFeedback && setSelectedOption(opt)
                            }
                          >
                            <div className="mcq-radio">
                              {isSel && !showFeedback && (
                                <div className="mcq-dot" />
                              )}
                            </div>
                            <span className="mcq-letter">{opt}.</span>
                            <span className="mcq-text">{text}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}

                  {/* ── Text Answer (Round 2 & Round 3 Non-Technical) ── */}
                  {(round === 2 || (round === 3 && nonTechnical)) && (
                    <div style={{ marginBottom: 16 }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: 7,
                        }}
                      >
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: "var(--t1)",
                          }}
                        >
                          Your Answer
                        </div>
                        <span
                          className={
                            charCount >= 300
                              ? "char-counter char-ok"
                              : "char-counter char-warn"
                          }
                        >
                          {charCount} / 300 min
                        </span>
                      </div>
                      <textarea
                        ref={answerRef}
                        disabled={timeLeft <= 0 || showFeedback}
                        className="ai-textarea"
                        placeholder={
                          timeLeft <= 0
                            ? "Time expired — submitted automatically"
                            : "Write your detailed answer here (minimum 300 characters)..."
                        }
                        style={{ minHeight: 210 }}
                        onChange={(e) => setCharCount(e.target.value.length)}
                        onPaste={blockClipboardAction}
                        onCopy={blockClipboardAction}
                        onCut={blockClipboardAction}
                        autoComplete="off"
                        spellCheck={false}
                        key={"q-" + qNo}
                        defaultValue=""
                      />
                    </div>
                  )}

                  {/* Round 3 coding is handled by Round3CodingPage (fullscreen) */}

                  {/* Feedback Display — hidden */}

                  {/* Feedback next button */}
                  {showFeedback && currentFeedback && (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        marginTop: 12,
                      }}
                    >
                      <button
                        className="btn btn-primary"
                        onClick={() => {
                          if (nextQuestionData?.__goToRound4) {
                            setShowFeedback(false);
                            setCurrentFeedback(null);
                            setNextQuestionData(null);
                            setQuestion("");
                            setTimerStopped(false);
                            setCharCount(0);
                            setShowWelcome(false);
                            setShowRound4(true);
                            return;
                          }
                          if (nextQuestionData?.question) {
                            setRound(nextQuestionData.round);
                            setQNo(nextQuestionData.question_no);
                            setTotalQ(
                              nextQuestionData.total_questions ||
                                getQuestionCount(nextQuestionData.round)
                            );
                            setQuestion(nextQuestionData.question);
                            setAskedQuestions((p) => [
                              ...p,
                              nextQuestionData.question,
                            ]);
                            setTimePerQuestion(
                              getTimeLimit(nextQuestionData.round)
                            );
                            setTimeLeft(getTimeLimit(nextQuestionData.round));
                            setSelectedOption("");
                            if (answerRef.current)
                              answerRef.current.value = "";
                            setCodeOutput("");
                            setCodeError("");
                            setLineCount(1);
                            setCharCount(0);
                            setNextQuestionData(null);
                          }
                          setShowFeedback(false);
                          setCurrentFeedback(null);
                          setTimerStopped(false);
                          setCharCount(0);
                        }}
                      >
                        {nextQuestionData?.__goToRound4
                          ? "Start Round 4 →"
                          : "Next Question →"}
                      </button>
                    </div>
                  )}

                  {/* Submit */}
                  <div
                    style={{
                      paddingTop: 14,
                      borderTop: "1px solid var(--border-soft)",
                    }}
                  >
                    {!showFeedback ? (
                      <button
                        className="btn btn-primary btn-primary-lg"
                        style={{ width: "100%" }}
                        disabled={
                          loading ||
                          submitting ||
                          evaluating ||
                          (round === 1 && !selectedOption)
                        }
                        onClick={() => submitAnswer()}
                      >
                        {evaluating ? (
                          <>
                            <SpinnerIcon /> Evaluating…
                          </>
                        ) : loading || submitting ? (
                          <>
                            <SpinnerIcon />{" "}
                            {submitting ? "Submitting…" : "Running…"}
                          </>
                        ) : timeLeft <= 0 ? (
                          "Submit Answer (Time Expired)"
                        ) : (
                          "Submit Answer →"
                        )}
                      </button>
                    ) : (
                      <div
                        style={{
                          textAlign: "center",
                          fontSize: 13,
                          color: "var(--t3)",
                        }}
                      >
                        Click "Next Question" above to continue
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}

