  import React, { useState, useEffect, useRef, useCallback } from "react";
  import MonacoEditor from "@monaco-editor/react";
  import { api } from "./lib/api";
  import { SpinnerIcon } from "./components/SpinnerIcon";

  interface Round3Props {
    userId: string;
    sessionId: string;
    parsed: any;
    initialQuestion: any;
    initialQNo: number;
    initialTotalQ: number;
    onComplete: () => void;
  }

  const LANGUAGES = [
    { value: "java",       label: "Java 17"            },
    { value: "javascript", label: "JavaScript (Node 18)"},
    { value: "typescript", label: "TypeScript 5"        },
    { value: "python",     label: "Python 3.11"         },
    { value: "cpp",        label: "C++ 17"              },
    { value: "c",          label: "C (GCC)"             },
    { value: "go",         label: "Go 1.21"             },
    { value: "csharp",     label: "C# (.NET 8)"         },
    { value: "kotlin",     label: "Kotlin 1.9"          },
    { value: "rust",       label: "Rust 1.75"           },
    { value: "php",        label: "PHP 8.2"             },
    { value: "ruby",       label: "Ruby 3.2"            },
  ];

  // Monaco editor language id mapping
  const MONACO_LANG: Record<string, string> = {
    java: 'java', javascript: 'javascript', typescript: 'typescript',
    python: 'python', cpp: 'cpp', c: 'c', go: 'go',
    csharp: 'csharp', kotlin: 'kotlin', rust: 'rust',
    php: 'php', ruby: 'ruby',
  };

  const BOILERPLATES: Record<string, string> = {
    python:     "from typing import List, Optional, Dict, Any\n\ndef solution():\n    # Write your solution here\n    pass",
    javascript: "function solution() {\n    // Write your solution here\n    return null;\n}",
    typescript: "function solution(): any {\n    // Write your solution here\n    return null;\n}",
    java:       "import java.util.*;\n\nclass Solution {\n    public static Object solution() {\n        // Write your solution here\n        return null;\n    }\n}",
    cpp:        "#include <bits/stdc++.h>\nusing namespace std;\n\nauto solution() {\n    // Write your solution here\n}",
    c:          "#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nint solution() {\n    // Write your solution here\n    return 0;\n}",
    go:         "package main\n\nimport \"fmt\"\n\nfunc solution() interface{} {\n    // Write your solution here\n    return nil\n}\n\nfunc main() {\n    fmt.Println(solution())\n}",
    csharp:     "using System;\nusing System.Collections.Generic;\nusing System.Linq;\n\nclass Solution {\n    public static object Solve() {\n        // Write your solution here\n        return null;\n    }\n}",
    kotlin:     "fun solution(): Any? {\n    // Write your solution here\n    return null\n}",
    rust:       "fn solution() -> i64 {\n    // Write your solution here\n    0\n}",
    php:        "<?php\n\nfunction solution() {\n    // Write your solution here\n    return null;\n}",
    ruby:       "def solution\n  # Write your solution here\n  nil\nend",
  };

  function getBoilerplate(lang: string, parsed: any): string {
    const fn  = parsed?.funcName;
    const sig = parsed?.func?.replace(/`/g, '').trim();
    if (!fn || !sig) return BOILERPLATES[lang] || BOILERPLATES.python;

    if (lang === 'java') {
      const hasImport = /import java/.test(sig);
      return `import java.util.*;\n\nclass Solution {\n    ${sig} {\n        // Write your solution here\n        return null; // TODO: fix return type\n    }\n}`;
    }
    if (lang === 'python') {
      const params = sig.match(/\(([^)]*)\)/)?.[1] || '';
      return `from typing import List, Optional, Dict, Any\n\ndef ${fn}(${params}):\n    # Write your solution here\n    pass`;
    }
    if (lang === 'javascript') {
      const params = sig.match(/\(([^)]*)\)/)?.[1] || '';
      return `function ${fn}(${params}) {\n    // Write your solution here\n    return null;\n}`;
    }
    if (lang === 'typescript') {
      const params = sig.match(/\(([^)]*)\)/)?.[1] || '';
      return `function ${fn}(${params}): any {\n    // Write your solution here\n    return null;\n}`;
    }
    if (lang === 'cpp') {
      return `#include <bits/stdc++.h>\nusing namespace std;\n\n${sig} {\n    // Write your solution here\n}`;
    }
    if (lang === 'c') {
      return `#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\n${sig} {\n    // Write your solution here\n}`;
    }
    if (lang === 'go') {
      return `package main\n\nimport "fmt"\n\n${sig} {\n    // Write your solution here\n    return 0\n}\n\nfunc main() {\n    fmt.Println(${fn}())\n}`;
    }
    if (lang === 'csharp') {
      return `using System;\nusing System.Collections.Generic;\nusing System.Linq;\n\nclass Solution {\n    ${sig} {\n        // Write your solution here\n        return null;\n    }\n}`;
    }
    if (lang === 'kotlin') {
      return `${sig} {\n    // Write your solution here\n    return 0\n}`;
    }
    if (lang === 'rust') {
      return `${sig} {\n    // Write your solution here\n    todo!()\n}`;
    }
    if (lang === 'php') {
      const params = sig.match(/\(([^)]*)\)/)?.[1] || '';
      return `<?php\n\nfunction ${fn}(${params}) {\n    // Write your solution here\n    return null;\n}`;
    }
    if (lang === 'ruby') {
      const params = sig.match(/\(([^)]*)\)/)?.[1] || '';
      return `def ${fn}(${params})\n  # Write your solution here\nend`;
    }
    return BOILERPLATES[lang] || BOILERPLATES.python;
  }

  const NAVBAR_H   = 56;
  const TERMINAL_H = 200;
  const TIME_LIMIT = 300;

  function detectLanguageFromQuestion(raw: string): string {
    if (!raw) return "python";
    // Check explicit **Language:** tag first (most reliable)
    const langTag = raw.match(/\*\*Language:\*\*\s*([\w+#]+)/i)?.[1]?.toLowerCase();
    if (langTag) {
      const aliases: Record<string, string> = {
        'c++': 'cpp', 'c#': 'csharp', 'py': 'python',
        'js': 'javascript', 'ts': 'typescript', 'golang': 'go',
      };
      return aliases[langTag] || langTag;
    }
    // Detect from function signature patterns
    if (/public\s+(static\s+)?[\w<>\[\]]+\s+\w+\s*\(/.test(raw)) return "java";
    if (/^def\s+\w+\s*\(/m.test(raw))  return "python";
    if (/^fun\s+\w+\s*\(/m.test(raw))  return "kotlin";
    if (/^fn\s+\w+\s*\(/m.test(raw))   return "rust";
    if (/^func\s+\w+\s*\(/m.test(raw)) return "go";
    if (/\bfunction\b/.test(raw) && /:\s*\w+/.test(raw)) return "typescript";
    if (/\bfunction\b/.test(raw))       return "javascript";
    if (/static void Main/.test(raw))   return "csharp";
    if (/cout\s*<</.test(raw))          return "cpp";
    if (/printf\s*\(/.test(raw) && !(/cout/.test(raw))) return "c";
    if (/^<\?php/m.test(raw) || /function\s+\w+\s*\(.*\)\s*\{/.test(raw) && /\$/.test(raw)) return "php";
    if (/^def\s+\w+$/m.test(raw))       return "ruby";
    return "python";
  }

  function parseRawQuestion(raw: string) {
    if (!raw) return null;
    const get = (key: string) => {
      const re = new RegExp(`\\*\\*${key}[^:]*:\\*\\*\\s*([\\s\\S]*?)(?=\\*\\*[A-Z]|$)`, "i");
      const m = raw.match(re);
      return m ? m[1].trim() : "";
    };
    const problem    = get("Problem");
    const funcSig    = get("Function");
    const language   = get("Language") || detectLanguageFromQuestion(raw);
    const exampleRaw = get("Example");
    const constsRaw  = get("Constraints");

    const exInput  = (exampleRaw.match(/Input:\s*`?([^`\n]+)`?/i) || [])[1]?.trim() || "";
    const exOutput = (exampleRaw.match(/Output:\s*`?([^`\n]+)`?/i) || [])[1]?.trim() || "";
    const examples = exInput ? [{ input: exInput, output: exOutput }] : [];

    const constraints = constsRaw
      .split(/\n|•/)
      .map((l: string) => l.replace(/^[•\-\*\s]+/, "").trim())
      .filter((l: string) => l.length > 0 && !l.toLowerCase().startsWith("testcase"));

    // Extract function name from signature for backend
    const cleanFunc = funcSig.replace(/`/g, "").trim();
    const funcNameMatch = cleanFunc.match(/(?:public\s+\S+\s+(\w+)\s*\(|def\s+(\w+)\s*\(|function\s+(\w+)\s*\(|(\w+)\s*\()/);
    const funcName = funcNameMatch ? (funcNameMatch[1] || funcNameMatch[2] || funcNameMatch[3] || funcNameMatch[4] || null) : null;

    return { problem, func: cleanFunc, funcName, language, examples, constraints };
  }

  function normalizeQuestion(q: any): any {
    if (!q) return null;
    // Real backend returns { question: "**Problem:...**", questionNo, recommendedLanguage }
    if (q.question && typeof q.question === 'string') {
      const rawText = q.question;
      return {
        questionId:  null,
        title:       'Coding Challenge',
        description: rawText,
        rawText,
        examples:    [],
        constraints: [],
        boilerplate: {},
        parsed:      parseRawQuestion(rawText),
        recommendedLanguage: q.recommendedLanguage || null,
        questionNo:  q.questionNo || null,
        totalQuestions: q.totalQuestions || null,
      };
    }
    if (typeof q === 'string') {
      return {
        questionId: null, title: 'Coding Challenge',
        description: q, rawText: q,
        examples: [], constraints: [], boilerplate: {},
        parsed: parseRawQuestion(q),
      };
    }
    return {
      questionId:  q.questionId ?? q.id ?? null,
      title:       q.title || 'Coding Challenge',
      description: q.description || q.problem || q.questionText || q.text || '',
      rawText:     q.text || q.rawText || q.description || q.problem || q.questionText || '',
      examples:    q.examples    || [],
      constraints: q.constraints || [],
      boilerplate: q.boilerplate || {},
      parsed:      null,
      recommendedLanguage: q.recommendedLanguage || null,
    };
  }

  export default function Round3CodingPage({
    userId, sessionId, parsed,
    initialQuestion, initialQNo, initialTotalQ,
    onComplete,
  }: Round3Props) {
    const first = normalizeQuestion(initialQuestion);
    const detectedLang = first?.parsed?.language || detectLanguageFromQuestion(first?.rawText || "");

    const [question,     setQuestion]     = useState<any>(first);
    const [qNo,          setQNo]          = useState(initialQNo   || 1);
    const [totalQ,       setTotalQ]       = useState(initialTotalQ || 3);
    const [language,     setLanguage]     = useState(detectedLang);
    const [code, setCode] = useState(() => getBoilerplate(detectedLang, first?.parsed));
    const [timeLeft,     setTimeLeft]     = useState(TIME_LIMIT);
    const [timerStopped, setTimerStopped] = useState(false);
    const [splitPos,     setSplitPos]     = useState(45);
    const [isDragging,   setIsDragging]   = useState(false);
    const [running,      setRunning]      = useState(false);
    const [submitting,   setSubmitting]   = useState(false);
    const [evaluating,   setEvaluating]   = useState(false);
    const [evalSteps,    setEvalSteps]    = useState<string[]>([]);
    const [codeOutput,   setCodeOutput]   = useState("");
    const [codeError,    setCodeError]    = useState("");
    const [testResults,  setTestResults]  = useState<any[]>([]);
    const [evalResult,   setEvalResult]   = useState<any>(null);
    const [violations,   setViolations]   = useState<string[]>([]);
    const [violationMsg, setViolationMsg] = useState("");
    const [askedQs,      setAskedQs]      = useState<string[]>([first?.rawText || ""]);
    const [loadingQ,     setLoadingQ]     = useState(!initialQuestion);
    // Computed editor height: full viewport minus navbar and terminal
    const [winH,         setWinH]         = useState(window.innerHeight);

    const containerRef  = useRef<HTMLDivElement>(null);
    const codeRef       = useRef(code);
    const autoRunTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);
    const languageRef   = useRef(language);
    const lastRunOk     = useRef(false);
    codeRef.current     = code;
    languageRef.current = language;

    // Track window height for Monaco
    useEffect(() => {
      const fn = () => setWinH(window.innerHeight);
      window.addEventListener("resize", fn);
      return () => window.removeEventListener("resize", fn);
    }, []);

    // Load question fallback
    useEffect(() => {
      if (initialQuestion) return;
      api.getCodingQuestion(userId, sessionId)
        .then((data: any) => {
          if (data?.question) {
            const q = normalizeQuestion(data.question);
            const lang = q.parsed?.language || detectLanguageFromQuestion(q.rawText || "");
            setQuestion(q);
            setQNo(data.questionNo || 1);
            setTotalQ(data.totalQuestions || 3);
            setAskedQs([q.rawText || ""]);
            setLanguage(lang);
            setCode(getBoilerplate(lang, q.parsed));
          }
        })
        .catch(err => console.error("Failed to load coding question:", err))
        .finally(() => setLoadingQ(false));
    }, []); // eslint-disable-line

    // Timer
    useEffect(() => {
      if (!question || timerStopped || timeLeft <= 0) return;
      const t = setTimeout(() => setTimeLeft(x => x - 1), 1000);
      return () => clearTimeout(t);
    }, [timeLeft, question, timerStopped]);

    useEffect(() => {
      if (timeLeft === 0 && question && !timerStopped && !submitting) {
        setTimerStopped(true);
        handleSubmit(true);
      }
    }, [timeLeft]); // eslint-disable-line

    // Tab switch
    useEffect(() => {
      if (!question) return;
      const fn = () => {
        if (document.hidden) {
          const msg = `⚠ Tab switch at ${new Date().toLocaleTimeString()}`;
          setViolations(v => [...v, msg]);
          setViolationMsg("Tab switch detected! This has been flagged.");
          setTimeout(() => setViolationMsg(""), 4000);
        }
      };
      document.addEventListener("visibilitychange", fn);
      return () => document.removeEventListener("visibilitychange", fn);
    }, [question]);

    // Keyboard shortcuts
    useEffect(() => {
      const fn = (e: KeyboardEvent) => {
        if (e.ctrlKey && !e.shiftKey && e.key === "Enter") { e.preventDefault(); handleRun(); }
        if (e.ctrlKey &&  e.shiftKey && e.key === "Enter") { e.preventDefault(); handleSubmit(false); }
      };
      window.addEventListener("keydown", fn);
      return () => window.removeEventListener("keydown", fn);
    }, []); // eslint-disable-line

    // Resize drag
    useEffect(() => {
      const onMove = (e: MouseEvent) => {
        if (!isDragging || !containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const pos  = ((e.clientX - rect.left) / rect.width) * 100;
        if (pos > 25 && pos < 75) setSplitPos(pos);
      };
      const onUp = () => setIsDragging(false);
      if (isDragging) {
        document.addEventListener("mousemove", onMove);
        document.addEventListener("mouseup",   onUp);
      }
      return () => {
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup",   onUp);
      };
    }, [isDragging]);

    function resetForQuestion(q: any, lang: string) {
      const bp = getBoilerplate(lang, q?.parsed);
      setCode(bp);
      setCodeOutput(""); setCodeError(""); setEvalResult(null); setEvalSteps([]); setTestResults([]);
      setTimeLeft(TIME_LIMIT); setTimerStopped(false);
      lastRunOk.current = false;
    }

    function onLanguageChange(lang: string) {
      setLanguage(lang);
      languageRef.current = lang;
      const bp = getBoilerplate(lang, question?.parsed);
      setCode(bp);
      setCodeOutput(""); setCodeError("");
      lastRunOk.current = false;
    }

    // Debounced auto-run: fires 1.5s after user stops typing
    function onCodeChange(val: string) {
      setCode(val || "");
      if (evaluating || timerStopped) return;
      if (autoRunTimer.current) clearTimeout(autoRunTimer.current);
      autoRunTimer.current = setTimeout(async () => {
        const c = (val || "").trim();
        if (!c || c === BOILERPLATES[languageRef.current]) return;
        if (detectLangMismatch(c, languageRef.current)) return;
        try {
          const result = await api.round3Execute({ code: c, language: languageRef.current, userId, sessionId, questionId: question?.questionId ?? undefined });
          if (result?.success) {
            setCodeOutput(result.output || "(no output)");
          }
        } catch { /* silent */ }
      }, 1500);
    }

    function detectLangMismatch(c: string, lang: string): string | null {
      const hasPythonDef  = /^\s*def \w+\s*\(/m.test(c);
      const hasJSFunction = /\bfunction\b|\bconst\b|\blet\b|\bvar\b/.test(c);
      const hasJavaClass  = /\bclass\b.*\{/.test(c) && /\bpublic\b/.test(c);
      if (lang === "python" && hasJSFunction && !hasPythonDef)
        return "⚠️ Language mismatch: You selected Python but your code looks like JavaScript.\nSwitch the language dropdown to JavaScript, or rewrite in Python.";
      if (lang === "javascript" && hasPythonDef && !hasJSFunction)
        return "⚠️ Language mismatch: You selected JavaScript but your code looks like Python.\nSwitch the language dropdown to Python, or rewrite in JavaScript.";
      if ((lang === "python" || lang === "javascript") && hasJavaClass)
        return `⚠️ Language mismatch: Your code looks like Java. Switch the dropdown to Java.`;
      return null;
    }

    const handleRun = useCallback(async () => {
      const c = codeRef.current.trim();
      if (!c) { setCodeError("Please write your code before running."); return; }

      const langMismatch = detectLangMismatch(c, language);
      if (langMismatch) { setCodeError(langMismatch); setCodeOutput(""); return; }

      setRunning(true); setCodeOutput(""); setCodeError(""); setTestResults([]);
      lastRunOk.current = false;
      try {
        const funcName = question?.parsed?.funcName || null;
        const result = await api.round3Execute({
          code: c, language, userId, sessionId,
          questionId: question?.questionId ?? undefined,
          question: question?.rawText || question?.description || "",
          ...(funcName && { functionName: funcName }),
        });
        
        if (result?.success || result?.validated) {
          lastRunOk.current = true;
          setCodeError("");
          // Backend returns testCaseDetails — map to testResults for display
          const tcs: any[] = result.testCaseDetails || result.testResults || [];
          if (tcs.length > 0) {
            setTestResults(tcs);
            setCodeOutput("");
          } else {
            setCodeOutput(result.output || result.summary || "(no output)");
          }
        } else {
          lastRunOk.current = false;
          setCodeOutput("");
          setCodeError(
            result?.error ||
            result?.summary ||
            result?.message ||
            "Execution failed"
          );
        }
      } catch (err: any) {
        lastRunOk.current = false;
        setCodeError(err?.message || "Execution error");
      } finally { setRunning(false); }
    }, [language, userId, sessionId, question]);

    async function handleSubmit(timeExpired = false) {
      const c = codeRef.current.trim();
      if (!c && !timeExpired) { setCodeError("Please write your code before submitting."); return; }
      if (submitting || evaluating) return;

      setTimerStopped(true); setEvaluating(true); setSubmitting(true);
      setCodeOutput(""); setCodeError(""); setEvalResult(null); setEvalSteps([]);

      const steps = ["Compiling your code...", "Running hidden test cases...", "Comparing outputs...", "Generating score..."];
      let si = 0;
      const stepTimer = setInterval(() => {
        if (si < steps.length) { setEvalSteps(s => [...s, steps[si]]); si++; }
        else clearInterval(stepTimer);
      }, 600);

      try {
        clearInterval(stepTimer);
        setEvalSteps(steps);

        const qId = question?.questionId;

        // Run test cases via round3Execute and show results immediately
        const runResult = await api.round3Execute({
          code: c || "",
          language,
          userId,
          sessionId,
          questionId: qId ?? undefined,
          question: question?.rawText || question?.description || "",
          ...(question?.parsed?.funcName && { functionName: question.parsed.funcName }),
        });
        setEvalResult(runResult);
        const tcs: any[] = runResult.testCaseDetails || runResult.testResults || [];
        if (tcs.length > 0) {
          setTestResults(tcs.map((r: any) => ({ ...r, pass: r.pass ?? r.passed, passed: r.pass ?? r.passed })));
        }
        if (runResult.hasCompileErr || runResult.errorType === 'compile_error') {
          setCodeError(runResult.summary || "Compilation Error");
        } else if (runResult.summary) {
          setCodeOutput(runResult.summary);
        }

        // Always advance the round via submitAnswer
        const questionText = question?.rawText || question?.description || "";
        const data = await api.submitAnswer({
          userId, sessionId,
          question: questionText,
          answer: c || "No answer provided",
          isTimeExpired: timeExpired,
        });

        // Show last score/feedback if provided
        if (data.last) {
          console.log(`✅ Score: ${data.last.score}/10`);
          console.log(`📝 Feedback: ${data.last.feedback}`);
        }

        if (data.advancedTo === 4 || data.roundType === "communication" || data.finished) {
          setTimeout(onComplete, 1200);
          return;
        }

        const nextRaw = data.nextQuestion || data.question;
        if (nextRaw && data.round === 3) {
          const nextQ = normalizeQuestion(nextRaw);
          const nextLang = nextQ.parsed?.language || detectLanguageFromQuestion(nextQ.rawText || "");
          setQuestion(nextQ);
          setQNo(data.question_no || qNo + 1);
          setTotalQ(data.total_questions || totalQ);
          setAskedQs(prev => [...prev, nextQ.rawText || ""]);
          setLanguage(nextLang);
          resetForQuestion(nextQ, nextLang);
          return;
        }

        if (data.last || data.doneRound === 3 || qNo >= totalQ) {
          setTimeout(onComplete, 1200);
        }
      } catch (err: any) {
        clearInterval(stepTimer);
        setCodeError(err?.message || "Submission failed.");
      } finally {
        setEvaluating(false); setSubmitting(false);
      }
    }

    if (loadingQ) {
      return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#0f172a", color: "#e2e8f0", flexDirection: "column", gap: 16 }}>
          <SpinnerIcon />
          <div style={{ fontSize: 15, fontWeight: 600 }}>Loading Round 3…</div>
        </div>
      );
    }

    const timerColor  = timeLeft <= 10 ? "#ef4444" : timeLeft <= 30 ? "#f59e0b" : "#94a3b8";
    const progressPct = (qNo / totalQ) * 100;
    const qTitle      = question?.title || "Coding Challenge";

    const p            = question?.parsed;
    const qDesc        = p?.problem    || question?.description || "";
    const qFunc        = p?.func       || "";
    const qLang        = p?.language   || "";
    const qExamples    = p?.examples?.length   ? p.examples   : (question?.examples    || []);
    const qConstraints = p?.constraints?.length ? p.constraints : (question?.constraints || []);

    // Monaco height = window height - navbar - terminal - terminal header
    const editorHeight = winH - NAVBAR_H - TERMINAL_H - 38;

    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#0f172a", color: "#e2e8f0", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", overflow: "hidden" }}>

        {/* Violation bar */}
        {violationMsg && (
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 999, background: "#b91c1c", color: "#fff", fontSize: 12, fontWeight: 500, padding: "6px 16px", display: "flex", alignItems: "center", gap: 8 }}>
            Warning: {violationMsg}
            <span style={{ marginLeft: "auto", opacity: 0.8 }}>{violations.length} flag{violations.length > 1 ? "s" : ""}</span>
          </div>
        )}

        {/* Navbar */}
        <div style={{ display: "flex", alignItems: "center", height: NAVBAR_H, background: "#0f172a", borderBottom: "1px solid #1e293b", padding: "0 20px", gap: 16, flexShrink: 0, zIndex: 50 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}>
            <span style={{ fontWeight: 700, fontSize: 15, color: "#f1f5f9", whiteSpace: "nowrap", letterSpacing: "0.2px" }}>Code Interview</span>
            <div style={{ width: 1, height: 20, background: "#334155", flexShrink: 0 }} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 260 }}>{qTitle}</div>
              <div style={{ fontSize: 11, color: "#64748b" }}>Question {qNo} of {totalQ}</div>
            </div>
          </div>

          <select value={language} onChange={e => onLanguageChange(e.target.value)} disabled={running || submitting || evaluating}
            style={{ background: "#1e293b", border: "1px solid #334155", color: "#e2e8f0", fontSize: 13, fontWeight: 500, cursor: "pointer", outline: "none", borderRadius: 6, padding: "5px 10px" }}>
            {LANGUAGES.map(l => <option key={l.value} value={l.value} style={{ background: "#1e293b" }}>{l.label}</option>)}
          </select>

          <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 120 }}>
            <div style={{ flex: 1, height: 3, background: "#1e293b", borderRadius: 2, overflow: "hidden" }}>
              <div style={{ width: `${progressPct}%`, height: "100%", background: "#3b82f6", transition: "width .3s" }} />
            </div>
            <span style={{ fontSize: 11, color: "#64748b", whiteSpace: "nowrap" }}>{Math.round(progressPct)}%</span>
          </div>

          <div style={{ padding: "5px 12px", background: timeLeft <= 10 ? "#450a0a" : "#1e293b", border: `1px solid ${timeLeft <= 10 ? "#b91c1c" : "#334155"}`, borderRadius: 6, fontFamily: "monospace", fontSize: 13, fontWeight: 600, color: timerColor, minWidth: 70, textAlign: "center" }}>
            {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, "0")}
          </div>

          <button onClick={handleRun} disabled={running || evaluating || !code.trim()}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 18px", background: "#16a34a", color: "#fff", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: running || evaluating || !code.trim() ? 0.45 : 1 }}>
            {running ? <><SpinnerIcon /> Running</> : <>Run</>}
          </button>

          <button onClick={() => handleSubmit(false)} disabled={submitting || evaluating || running || !code.trim()}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 18px", background: "#1d4ed8", color: "#fff", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: submitting || evaluating || running || !code.trim() ? 0.45 : 1 }}>
            {evaluating || submitting ? <><SpinnerIcon /> {evaluating ? "Evaluating" : "Submitting"}</> : <>Submit</>}
          </button>
        </div>

        {/* Split */}
        <div ref={containerRef} style={{ display: "flex", flex: 1, overflow: "hidden" }}>

          {/* Left — Problem */}
          <div style={{ width: `${splitPos}%`, borderRight: "1px solid #334155", background: "#0f172a", overflowY: "auto", overflowX: "hidden", padding: 24 }}>
            <div style={{ marginBottom: 20, paddingBottom: 16, borderBottom: "1px solid #334155" }}>
              <h1 style={{ fontSize: 20, fontWeight: 700, color: "#f1f5f9", margin: 0 }}>{qTitle}</h1>
            </div>

            {qDesc && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: "#3b82f6", marginBottom: 8 }}>Problem</div>
                <p style={{ fontSize: 14, lineHeight: 1.75, color: "#cbd5e1", margin: 0 }}>{qDesc}</p>
              </div>
            )}

            {qFunc && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: "#10b981", marginBottom: 8 }}>
                  Function Signature
                  {qLang && <span style={{ marginLeft: 8, background: "#1e293b", border: "1px solid #334155", borderRadius: 4, padding: "1px 7px", fontSize: 10, color: "#94a3b8", fontWeight: 500, textTransform: "none" as any }}>{qLang}</span>}
                </div>
                <pre style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 6, padding: "10px 14px", fontFamily: "monospace", fontSize: 13, color: "#10b981", margin: 0, overflowX: "auto" }}>{qFunc}</pre>
              </div>
            )}

            {qConstraints.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: "#f59e0b", marginBottom: 8 }}>Constraints</div>
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {qConstraints.map((c: string, i: number) => (
                    <li key={i} style={{ fontSize: 13, color: "#cbd5e1", padding: "3px 0 3px 16px", position: "relative" }}>
                      <span style={{ position: "absolute", left: 0, color: "#f59e0b" }}>•</span>{c}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {qExamples.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: "#8b5cf6", marginBottom: 8 }}>Examples</div>
                {qExamples.map((ex: any, i: number) => (
                  <div key={i} style={{ background: "#1e293b", borderLeft: "3px solid #8b5cf6", padding: 12, borderRadius: 4, marginBottom: 8 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#8b5cf6", textTransform: "uppercase", marginBottom: 6 }}>Example {i + 1}</div>
                    <div style={{ fontFamily: "monospace", fontSize: 13 }}>
                      <div><span style={{ color: "#94a3b8", fontWeight: 600 }}>Input: </span><span style={{ color: "#10b981" }}>{ex.input}</span></div>
                      <div><span style={{ color: "#94a3b8", fontWeight: 600 }}>Output: </span><span style={{ color: "#10b981" }}>{ex.output}</span></div>
                      {ex.explanation && <div style={{ marginTop: 4, color: "#94a3b8", fontSize: 12 }}>{ex.explanation}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {violations.length > 0 && (
              <div style={{ padding: "8px 12px", background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.3)", borderRadius: 6, fontSize: 12, color: "#ef4444" }}>
                ⚠ {violations.length} violation{violations.length > 1 ? "s" : ""} flagged
              </div>
            )}
          </div>

          {/* Resize handle */}
          <div
            onMouseDown={() => setIsDragging(true)}
            onMouseEnter={e => (e.currentTarget.style.background = "#3b82f6")}
            onMouseLeave={e => { if (!isDragging) e.currentTarget.style.background = "transparent"; }}
            style={{ width: 4, cursor: "col-resize", background: isDragging ? "#3b82f6" : "transparent", transition: "background .15s", flexShrink: 0 }}
          />

          {/* Right — Editor + Terminal */}
          <div style={{ width: `${100 - splitPos}%`, display: "flex", flexDirection: "column", background: "#1e293b" }}>

            {/* Monaco — explicit pixel height calculated from window size */}
            <MonacoEditor
              height={editorHeight}
              language={MONACO_LANG[language] || language}
              value={code}
              onChange={val => onCodeChange(val || "")}
              onValidate={() => { /* Monaco validation disabled */ }}
              theme="vs-dark"
              path={`r3-q${qNo}-${language}`}
              options={{
                fontSize: 14,
                fontFamily: '"SF Mono", Monaco, "Courier New", monospace',
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                readOnly: evaluating || timerStopped,
                wordWrap: "on",
                lineNumbers: "on",
                automaticLayout: true,
                tabSize: 4,
                padding: { top: 16, bottom: 16 },
                bracketPairColorization: { enabled: true },
              }}
            />

            {/* Terminal */}
            <div style={{ height: TERMINAL_H, background: "#0f172a", borderTop: "1px solid #334155", display: "flex", flexDirection: "column", flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 38, padding: "0 14px", background: "#1e293b", borderBottom: "1px solid #334155", flexShrink: 0 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}>Output</span>
                <span style={{ fontSize: 12, fontFamily: "monospace" }}>
                  {evaluating && <span style={{ color: "#3b82f6" }}>Evaluating… ({evalSteps.length}/4)</span>}
                  {codeError && !evaluating && (
                    <span style={{ color: "#ef4444" }}>
                      ✗ {codeError.match(/(Syntax Error|Indentation Error|Name Error|Type Error|Compilation Error|Reference Error|Timeout)/)?.[0] || "Error"}
                    </span>
                  )}
                  {(codeOutput || testResults.length > 0) && !codeError && !evaluating && <span style={{ color: "#10b981" }}>Success</span>}
                </span>
              </div>
              <div style={{ flex: 1, overflowY: "auto", padding: "10px 14px", fontFamily: "monospace", fontSize: 13, lineHeight: 1.5 }}>
                {evaluating && evalSteps.map((s, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "3px 0", color: i < evalSteps.length - 1 ? "#10b981" : "#94a3b8" }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: i < evalSteps.length - 1 ? "#10b981" : "#3b82f6", flexShrink: 0 }} />
                    {s}
                  </div>
                ))}
                {/* Test case results table */}
                {testResults.length > 0 && !evaluating && (
                  <div style={{ marginBottom: 8 }}>
                    {testResults.map((tc: any, i: number) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0", borderBottom: "1px solid #1e293b", fontSize: 12 }}>
                        <span style={{ color: tc.pass || tc.passed ? "#10b981" : "#ef4444", fontWeight: 700, minWidth: 16 }}>
                          {tc.pass || tc.passed ? "✓" : "✗"}
                        </span>
                        <span style={{ color: "#94a3b8", minWidth: 60 }}>TC{tc.id ?? i + 1}</span>
                        <span style={{ color: "#64748b" }}>in: </span>
                        <span style={{ color: "#cbd5e1", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tc.input}</span>
                        <span style={{ color: "#64748b" }}>exp: </span>
                        <span style={{ color: "#10b981" }}>{tc.expected}</span>
                        {!(tc.pass || tc.passed) && <><span style={{ color: "#64748b" }}>got: </span><span style={{ color: "#ef4444" }}>{tc.actual}</span></>}
                      </div>
                    ))}
                  </div>
                )}
                {codeOutput && !codeError && !evaluating && (
                  <>
                    <div style={{ color: "#94a3b8", fontSize: 11, marginBottom: 4 }}>Output</div>
                    <pre style={{ color: "#10b981", whiteSpace: "pre-wrap", wordBreak: "break-word", margin: 0 }}>{codeOutput}</pre>
                  </>
                )}
                {codeError && !evaluating && (
                  <>
                    <div style={{ color: "#f87171", fontSize: 11, fontWeight: 700, marginBottom: 4 }}>
                      {codeError.match(/(Syntax Error|Indentation Error|Name Error|Type Error|Index Error|Compilation Error|Reference Error|Timeout)/)?.[0] || "Error"}
                    </div>
                    <pre style={{ color: "#ef4444", whiteSpace: "pre-wrap", wordBreak: "break-word", margin: 0, lineHeight: 1.6 }}>{codeError}</pre>
                  </>
                )}
                {!codeOutput && !codeError && testResults.length === 0 && !evaluating && (
                  <div style={{ color: "#475569" }}>
                    Click <span style={{ color: "#10b981" }}>Run</span> to test · <span style={{ color: "#3b82f6" }}>Submit</span> to evaluate
                    <br /><span style={{ fontSize: 11 }}>Ctrl+Enter = Run · Ctrl+Shift+Enter = Submit</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.6}}`}</style>
      </div>
    );
  }
