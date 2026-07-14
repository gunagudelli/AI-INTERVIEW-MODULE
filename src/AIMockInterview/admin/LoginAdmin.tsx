import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import BASE_URL from "../../Config";

const VALID_EMAIL = "interviewAI@askoxy.ai";
const VALID_PASSWORD = "Test@123";
const ADMIN_PHONE = "0000000000";  // fixed phone for admin account

const BG_IMAGE =
  "https://img.freepik.com/premium-photo/robot-meeting-with-human-office-desk_215372-7909.jpg";

export default function LoginAdmin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    if (email !== VALID_EMAIL || password !== VALID_PASSWORD) {
      setError("Invalid email or password. Please try again.");
      setIsLoading(false);
      return;
    }
    try {
      const { data } = await axios.post(`${BASE_URL}/api/auth/login`, {
        phone: ADMIN_PHONE, name: "Super Admin", role: "admin",
      });
      const token = data.token;
      localStorage.setItem("admin_token", token);
      sessionStorage.setItem("isAdminAuthenticated", "true");
      sessionStorage.setItem("adminEmail", email);
      navigate("/admin/interviewdashboard");
    } catch {
      setError("Backend unreachable. Please ensure the server is running.");
    }
    setIsLoading(false);
  };

  return (
    <>
      <style>{`
  @keyframes lp-spin { to { transform: rotate(360deg); } }
  .lp-spinner {
    width: 16px; height: 16px;
    border: 2px solid rgba(255,255,255,0.25);
    border-top-color: #fff;
    border-radius: 50%;
    animation: lp-spin 0.7s linear infinite;
    flex-shrink: 0;
  }

  /* === NEURAL NETWORK CANVAS === */
  .lp-canvas {
    position: absolute; inset: 0; width: 100%; height: 100%;
    pointer-events: none; z-index: 0;
  }

  /* === FLOATING DATA CHIPS === */
  @keyframes chip-float {
    0%   { transform: translateY(0px);   opacity: 0; }
    10%  { opacity: 0.7; }
    90%  { opacity: 0.7; }
    100% { transform: translateY(-480px); opacity: 0; }
  }
  .lp-chip {
    position: absolute; bottom: -30px;
    font-family: monospace; font-size: 9px; color: rgba(0,210,255,0.75);
    letter-spacing: 1px; white-space: nowrap;
    animation: chip-float linear infinite;
    pointer-events: none; z-index: 1;
  }

  /* === PULSING DOTS === */
  @keyframes dot-pulse {
    0%, 100% { transform: scale(1);   opacity: 0.5; }
    50%       { transform: scale(1.8); opacity: 1; }
  }
  .lp-dot {
    position: absolute; border-radius: 50%;
    background: rgba(0,210,255,0.8);
    pointer-events: none; z-index: 2;
    animation: dot-pulse ease-in-out infinite;
  }

  /* === HORIZONTAL DATA LINES === */
  @keyframes hline-slide {
    0%   { transform: translateX(-100%); opacity: 0; }
    10%  { opacity: 1; }
    90%  { opacity: 1; }
    100% { transform: translateX(200%); opacity: 0; }
  }
  .lp-hline {
    position: absolute; left: 0; height: 1px; width: 60%;
    background: linear-gradient(90deg, transparent, rgba(0,210,255,0.4), transparent);
    animation: hline-slide linear infinite;
    pointer-events: none; z-index: 1;
  }


  @keyframes glitch-flicker {
    0%, 97%, 100% { opacity: 1; }
    98%            { opacity: 0.92; }
    99%            { opacity: 1; }
  }
  .lp-form-panel {
    animation: glitch-flicker 6s ease-in-out infinite;
  }
  .lp-form-panel::before { display: none; }
`}</style>

      {/* Outer page — white background */}
      <div className="min-h-screen w-full flex items-center justify-center bg-white px-4 py-6 font-sans">
        {/* Card */}
        <div
          className="w-full max-w-6xl flex rounded-2xl overflow-hidden shadow-2xl"
          style={{ minHeight: "580px" }}
        >
          {/* LEFT — Form panel */}
          <div
            className="lp-form-panel w-5/12 flex-shrink-0 flex flex-col justify-center px-10 py-12 relative overflow-hidden"
            style={{
              background:
                "linear-gradient(160deg, #0d2d3f 0%, #071828 50%, #040e1c 100%)",
            }}
          >
            {/* Neural network + radar canvas */}
            <canvas className="lp-canvas" id="lp-neural" />

            {/* Floating binary / hex data chips */}
            <div
              className="lp-chip"
              style={{
                left: "8%",
                animationDuration: "9s",
                animationDelay: "0s",
              }}
            >
              01101001
            </div>
            <div
              className="lp-chip"
              style={{
                left: "22%",
                animationDuration: "13s",
                animationDelay: "2s",
              }}
            >
              0xFF3C
            </div>
            <div
              className="lp-chip"
              style={{
                left: "38%",
                animationDuration: "10s",
                animationDelay: "5s",
              }}
            >
              10110011
            </div>
            <div
              className="lp-chip"
              style={{
                left: "54%",
                animationDuration: "14s",
                animationDelay: "1s",
              }}
            >
              0xA4
            </div>
            <div
              className="lp-chip"
              style={{
                left: "68%",
                animationDuration: "11s",
                animationDelay: "3.5s",
              }}
            >
              11001010
            </div>
            <div
              className="lp-chip"
              style={{
                left: "82%",
                animationDuration: "8s",
                animationDelay: "6s",
              }}
            >
              0x2F
            </div>
            <div
              className="lp-chip"
              style={{
                left: "15%",
                animationDuration: "12s",
                animationDelay: "7s",
              }}
            >
              AI::init
            </div>
            <div
              className="lp-chip"
              style={{
                left: "72%",
                animationDuration: "9s",
                animationDelay: "4s",
              }}
            >
              NLP::run
            </div>

            {/* Pulsing node dots */}
            <div
              className="lp-dot"
              style={{
                width: 6,
                height: 6,
                top: "18%",
                left: "12%",
                animationDuration: "2.1s",
                animationDelay: "0s",
              }}
            />
            <div
              className="lp-dot"
              style={{
                width: 4,
                height: 4,
                top: "35%",
                left: "78%",
                animationDuration: "3.4s",
                animationDelay: "0.8s",
              }}
            />
            <div
              className="lp-dot"
              style={{
                width: 5,
                height: 5,
                top: "62%",
                left: "20%",
                animationDuration: "2.7s",
                animationDelay: "1.5s",
              }}
            />
            <div
              className="lp-dot"
              style={{
                width: 3,
                height: 3,
                top: "75%",
                left: "65%",
                animationDuration: "4.0s",
                animationDelay: "0.3s",
              }}
            />
            <div
              className="lp-dot"
              style={{
                width: 5,
                height: 5,
                top: "50%",
                left: "88%",
                animationDuration: "2.3s",
                animationDelay: "2.1s",
              }}
            />
            <div
              className="lp-dot"
              style={{
                width: 4,
                height: 4,
                top: "88%",
                left: "40%",
                animationDuration: "3.1s",
                animationDelay: "1.0s",
              }}
            />

            {/* Sliding horizontal data lines */}
            <div
              className="lp-hline"
              style={{
                top: "22%",
                animationDuration: "6s",
                animationDelay: "0s",
              }}
            />
            <div
              className="lp-hline"
              style={{
                top: "45%",
                animationDuration: "9s",
                animationDelay: "2s",
                width: "40%",
              }}
            />
            <div
              className="lp-hline"
              style={{
                top: "68%",
                animationDuration: "7s",
                animationDelay: "4s",
              }}
            />
            <div
              className="lp-hline"
              style={{
                top: "82%",
                animationDuration: "11s",
                animationDelay: "1.5s",
                width: "50%",
              }}
            />

            {/* Canvas JS — neural network + radar sweep + ripple rings */}
            <script
              dangerouslySetInnerHTML={{
                __html: `
    (function() {
      const canvas = document.getElementById('lp-neural');
      if (!canvas) return;
      const ctx = canvas.getContext('2d');

      function resize() {
        canvas.width  = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
      }
      resize();
      window.addEventListener('resize', resize);

      /* ── NODES ── */
      const NODE_COUNT = 28;
      const nodes = Array.from({ length: NODE_COUNT }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        r: 1.5 + Math.random() * 2,
        pulse: Math.random() * Math.PI * 2,
      }));
      const CONNECT_DIST = 110;

      /* ── RADAR ── */
      const radar = {
        x: canvas.width * 0.72,
        y: canvas.height * 0.22,
        radius: 70,
        angle: 0,
        speed: 0.018,
      };

      /* ── RIPPLE RINGS ── */
      const ripples = [];
      function spawnRipple() {
        ripples.push({ x: radar.x, y: radar.y, r: 0, maxR: radar.radius, alpha: 0.6, speed: 0.6 });
      }
      setInterval(spawnRipple, 1800);

      /* ── ORBIT RING (decorative circles around radar) ── */
      let orbitAngle = 0;

      /* ── WAVE ARCS (replace scan line) ── */
      const waveArcs = [
        { cx: -30, cy: canvas.height * 0.3, r: 120, startAngle: -0.4, endAngle: 0.4, speed: 0.006, phase: 0     },
        { cx: -30, cy: canvas.height * 0.7, r: 160, startAngle: -0.35, endAngle: 0.35, speed: 0.005, phase: 1.5  },
        { cx: canvas.width + 30, cy: canvas.height * 0.5, r: 140, startAngle: Math.PI - 0.4, endAngle: Math.PI + 0.4, speed: 0.007, phase: 0.8 },
      ];

      function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        /* ── WAVE ARCS ── */
        waveArcs.forEach(a => {
          a.phase += a.speed;
          const pulse = 0.3 + 0.25 * Math.sin(a.phase);
          ctx.beginPath();
          ctx.arc(a.cx, a.cy, a.r, a.startAngle, a.endAngle);
          ctx.strokeStyle = \`rgba(0,210,255,\${pulse})\`;
          ctx.lineWidth = 1.2;
          ctx.stroke();

          // second larger arc
          ctx.beginPath();
          ctx.arc(a.cx, a.cy, a.r + 22, a.startAngle * 0.7, a.endAngle * 0.7);
          ctx.strokeStyle = \`rgba(0,210,255,\${pulse * 0.4})\`;
          ctx.lineWidth = 0.7;
          ctx.stroke();
        });

        /* ── RIPPLE RINGS ── */
        for (let i = ripples.length - 1; i >= 0; i--) {
          const rp = ripples[i];
          rp.r += rp.speed;
          rp.alpha -= 0.005;
          if (rp.alpha <= 0) { ripples.splice(i, 1); continue; }
          ctx.beginPath();
          ctx.arc(rp.x, rp.y, rp.r, 0, Math.PI * 2);
          ctx.strokeStyle = \`rgba(0,210,255,\${rp.alpha})\`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        /* ── RADAR BASE CIRCLES ── */
        [1, 0.66, 0.33].forEach((scale, i) => {
          ctx.beginPath();
          ctx.arc(radar.x, radar.y, radar.radius * scale, 0, Math.PI * 2);
          ctx.strokeStyle = \`rgba(0,210,255,\${0.12 - i * 0.02})\`;
          ctx.lineWidth = 0.8;
          ctx.stroke();
        });

        /* ── RADAR SWEEP (conic gradient via arc fill) ── */
        radar.angle += radar.speed;
        const sweepGrad = ctx.createConicalGradient
          ? ctx.createConicalGradient(radar.x, radar.y, radar.angle)
          : null;

        // Fallback: filled arc slice for sweep
        ctx.save();
        ctx.translate(radar.x, radar.y);
        ctx.rotate(radar.angle);
        const sweepArc = ctx.createLinearGradient(0, 0, radar.radius, 0);
        sweepArc.addColorStop(0, 'rgba(0,210,255,0.0)');
        sweepArc.addColorStop(1, 'rgba(0,210,255,0.35)');
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, radar.radius, -0.55, 0);
        ctx.closePath();
        ctx.fillStyle = sweepArc;
        ctx.fill();

        // Sweep leading edge line
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(radar.radius, 0);
        ctx.strokeStyle = 'rgba(0,210,255,0.9)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();

        /* ── ORBIT DOT around radar ── */
        orbitAngle += 0.02;
        const ox = radar.x + (radar.radius + 10) * Math.cos(orbitAngle);
        const oy = radar.y + (radar.radius + 10) * Math.sin(orbitAngle);
        ctx.beginPath();
        ctx.arc(ox, oy, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,210,255,0.9)';
        ctx.fill();

        /* ── NEURAL NODES ── */
        nodes.forEach(n => {
          n.x += n.vx; n.y += n.vy; n.pulse += 0.03;
          if (n.x < 0 || n.x > canvas.width)  n.vx *= -1;
          if (n.y < 0 || n.y > canvas.height)  n.vy *= -1;
        });

        for (let i = 0; i < nodes.length; i++) {
          for (let j = i + 1; j < nodes.length; j++) {
            const dx = nodes[i].x - nodes[j].x;
            const dy = nodes[i].y - nodes[j].y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            if (dist < CONNECT_DIST) {
              ctx.beginPath();
              ctx.moveTo(nodes[i].x, nodes[i].y);
              ctx.lineTo(nodes[j].x, nodes[j].y);
              ctx.strokeStyle = \`rgba(0,210,255,\${(1 - dist / CONNECT_DIST) * 0.25})\`;
              ctx.lineWidth = 0.7;
              ctx.stroke();
            }
          }
        }

        nodes.forEach(n => {
          const glow = 0.5 + 0.5 * Math.sin(n.pulse);
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.r * (1 + 0.3 * glow), 0, Math.PI * 2);
          ctx.fillStyle = \`rgba(0,210,255,\${0.4 + 0.5 * glow})\`;
          ctx.fill();
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.r * 2.5, 0, Math.PI * 2);
          ctx.strokeStyle = \`rgba(0,210,255,\${0.1 + 0.08 * glow})\`;
          ctx.lineWidth = 0.6;
          ctx.stroke();
        });

        requestAnimationFrame(draw);
      }

      draw();
    })();
  `,
              }}
            />

            {/* Form content — a subtle backdrop panel sits behind the heading/fields so
                the floating background chips are masked as they drift past instead of
                appearing to collide with "Sign in" / field labels. */}
            <div
              className="relative z-10 rounded-2xl -mx-4 -my-6 px-4 py-6"
              style={{
                background: "rgba(4,14,28,0.42)",
                backdropFilter: "blur(3px)",
              }}
            >
            <h1 className="text-5xl font-bold text-white tracking-tight mb-7 relative z-10">
              Sign in
              <span
                className="block w-10 h-0.5 mt-2.5 rounded"
                style={{
                  background: "linear-gradient(90deg, #2563EB, #1D4ED8)",
                }}
              />
            </h1>

            <form
              className="flex flex-col gap-5 relative z-10"
              onSubmit={handleSubmit}
              noValidate
            >
              {/* Email */}
              <div>
                <label
                  htmlFor="lp-email"
                  className="block text-xs font-semibold text-sky-300 uppercase tracking-wide mb-1.5"
                >
                  Email
                </label>
                <input
                  id="lp-email"
                  type="email"
                  placeholder="example@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  spellCheck={false}
                  className="w-full px-4 py-3 rounded-lg text-sm text-slate-800 bg-white placeholder-slate-400 outline-none border border-transparent focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition"
                />
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="lp-password"
                  className="block text-xs font-semibold text-sky-300 uppercase tracking-wide mb-1.5"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="lp-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="w-full px-4 py-3 pr-12 rounded-lg text-sm text-slate-800 bg-white placeholder-slate-400 outline-none border border-transparent focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition p-1"
                  >
                    {showPassword ? (
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2.5 text-sm text-red-300">
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-1 py-3 rounded-lg font-semibold text-white text-sm tracking-wide flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-75 disabled:cursor-not-allowed hover:-translate-y-0.5"
                style={{
                  background:
                    "linear-gradient(90deg, #1D4ED8 0%, #2563EB 100%)",
                  boxShadow: "0 4px 20px rgba(59,130,246,0.45)",
                }}
              >
                {isLoading ? (
                  <>
                    <div className="lp-spinner" /> Signing in...
                  </>
                ) : (
                  "Sign in"
                )}
              </button>
            </form>
            </div>
          </div>

          {/* RIGHT — Image panel */}
          <div className="flex-1 relative" style={{ minHeight: "580px" }}>
            <img
              src={BG_IMAGE}
              alt="AI Interview"
              className="absolute inset-0 w-full h-full object-cover object-top"
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(to right, rgba(4,14,28,0.72) 0%, rgba(4,14,28,0.2) 40%, rgba(4,14,28,0.08) 100%)",
              }}
            />
            <div className="absolute bottom-7 left-0 right-0 flex flex-col items-center gap-1.5 z-10">
              <div
                className="w-10 h-0.5 rounded"
                style={{
                  background: "linear-gradient(90deg, #2563EB, #1D4ED8)",
                }}
              />
              <p className="text-xs font-semibold text-slate-900 tracking-widest uppercase font-mono">
                AI Interview Portal
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
