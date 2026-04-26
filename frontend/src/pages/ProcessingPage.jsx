/* ProcessingPage.jsx — 3-phase reveal animation after analysis */
import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../context/SessionContext';
import './ProcessingPage.css';

/* ─────────────────────────────────────────────────────────────
   Confetti engine (canvas-based, no deps)
───────────────────────────────────────────────────────────── */
const CONFETTI_COLORS = [
  '#a855f7', '#22d3ee', '#facc15', '#4ade80',
  '#f472b6', '#818cf8', '#fb923c', '#ffffff',
];

function launchConfetti(canvasRef) {
  const canvas = canvasRef.current;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;

  const cx = canvas.width  / 2;
  const cy = canvas.height / 2;

  const particles = Array.from({ length: 110 }, () => ({
    x:             cx + (Math.random() - 0.5) * 80,
    y:             cy + (Math.random() - 0.5) * 80,
    vx:            (Math.random() - 0.5) * 18,
    vy:            -(Math.random() * 16 + 6),
    rotation:      Math.random() * 360,
    rotationSpeed: (Math.random() - 0.5) * 12,
    width:         Math.random() * 8 + 5,
    height:        Math.random() * 5 + 3,
    color:         CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    opacity:       1,
    gravity:       0.45 + Math.random() * 0.3,
    drag:          0.97,
  }));

  let rafId;
  let startTime = null;
  const DURATION = 3200; // ms

  function draw(ts) {
    if (!startTime) startTime = ts;
    const elapsed = ts - startTime;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const p of particles) {
      p.vy += p.gravity;
      p.vx *= p.drag;
      p.x  += p.vx;
      p.y  += p.vy;
      p.rotation += p.rotationSpeed;
      p.opacity   = Math.max(0, 1 - elapsed / DURATION);

      ctx.save();
      ctx.globalAlpha = p.opacity;
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.width / 2, -p.height / 2, p.width, p.height);
      ctx.restore();
    }

    if (elapsed < DURATION) {
      rafId = requestAnimationFrame(draw);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  rafId = requestAnimationFrame(draw);
  return () => cancelAnimationFrame(rafId);
}

/* ─────────────────────────────────────────────────────────────
   Animated number counter hook
───────────────────────────────────────────────────────────── */
function useCounter(target, duration = 1400, active = false) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!active || target === 0) return;
    let startTime = null;
    let rafId;

    function step(ts) {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      // ease-out-cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) rafId = requestAnimationFrame(step);
    }

    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [active, target, duration]);

  return value;
}

/* ─────────────────────────────────────────────────────────────
   Circular arc constants
───────────────────────────────────────────────────────────── */
const R          = 72;          // SVG circle radius
const CIRC       = 2 * Math.PI * R; // ≈ 452.4

/* ─────────────────────────────────────────────────────────────
   Processing step labels
───────────────────────────────────────────────────────────── */
const STEPS = [
  { icon: '🔍', label: 'Parsing resume text' },
  { icon: '📋', label: 'Extracting JD requirements' },
  { icon: '🧠', label: 'Running AI skill extraction' },
  { icon: '📊', label: 'Computing gap analysis' },
  { icon: '✅', label: 'Preparing assessment' },
];

/* ─────────────────────────────────────────────────────────────
   Main Component
───────────────────────────────────────────────────────────── */
export default function ProcessingPage() {
  const navigate  = useNavigate();
  const { state } = useSession();

  // 'loading' | 'revealing' | 'done'
  const [uiPhase, setUiPhase]     = useState('loading');
  const [arcFill, setArcFill]     = useState(false);  // trigger arc CSS transition
  const canvasRef                 = useRef(null);
  const cleanupConfetti           = useRef(null);

  const matchPct = state.analysisResult?.matchPercentage ?? 0;
  const displayNum = useCounter(matchPct, 1400, arcFill);

  // Guard: nothing to show
  useEffect(() => {
    if (state.phase === 'idle' && !state.loading && !state.sessionId) {
      navigate('/upload');
    }
  }, [state.phase, state.loading, state.sessionId, navigate]);

  // Trigger reveal when analysis finishes
  useEffect(() => {
    if (state.phase !== 'analyzed') return;

    // Step 1 — switch to reveal phase after small delay
    const t1 = setTimeout(() => {
      setUiPhase('revealing');

      // Step 2 — start arc + counter (wait one frame so CSS class is applied)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setArcFill(true));
      });

      // Step 3 — launch confetti slightly after arc starts
      const t2 = setTimeout(() => {
        cleanupConfetti.current = launchConfetti(canvasRef);
      }, 300);

      // Step 4 — navigate after celebration
      const t3 = setTimeout(() => {
        setUiPhase('done');
        setTimeout(() => navigate('/assessment'), 500);
      }, 3800);

      return () => { clearTimeout(t2); clearTimeout(t3); };
    }, 200);

    return () => clearTimeout(t1);
  }, [state.phase, navigate]);

  // Cleanup confetti on unmount
  useEffect(() => () => cleanupConfetti.current?.(), []);

  /* ── Derived ── */
  const dashOffset = arcFill ? CIRC * (1 - matchPct / 100) : CIRC;

  const matchColor =
    matchPct >= 70 ? 'var(--color-success-light)' :
    matchPct >= 45 ? 'var(--color-warning)'        :
                     'var(--color-danger)';

  const matchLabel =
    matchPct >= 70 ? '🚀 Strong Match' :
    matchPct >= 45 ? '📈 Partial Match' :
                     '📚 Needs Work';

  /* ── Render ── */
  return (
    <div className={`processing-page pp-phase-${uiPhase}`}>

      {/* Confetti canvas */}
      <canvas
        ref={canvasRef}
        className="confetti-canvas"
        aria-hidden="true"
      />

      {/* Background orbs */}
      <div className="pp-bg" aria-hidden="true">
        <div className="pp-orb pp-orb-1" />
        <div className="pp-orb pp-orb-2" />
      </div>

      {/* ── LOADING PHASE ── */}
      <div className={`pp-panel pp-loading-panel ${uiPhase !== 'loading' ? 'pp-exit' : ''}`}>
        <div className="pp-logo animate-fade-in">
          <span className="pp-logo-badge">⚡</span>
          <span className="gradient-text" style={{ fontWeight: 800 }}>SkillSense AI</span>
        </div>

        <div className="pp-spinner-wrap animate-pulse">
          <div className="pp-ring-spinner">
            <div className="pp-ring-spinner-inner" />
          </div>
        </div>

        <h2 className="pp-loading-title animate-slide-up">Analyzing Your Profile…</h2>
        <p className="pp-loading-sub animate-slide-up delay-1">
          Our AI is extracting skills and computing your match score
        </p>

        <div className="pp-steps">
          {STEPS.map((s, i) => (
            <div
              key={s.label}
              className="pp-step animate-slide-up"
              style={{ animationDelay: `${200 + i * 250}ms` }}
            >
              <span className="pp-step-icon">{s.icon}</span>
              <span className="pp-step-label">{s.label}</span>
              <span className="pp-step-loader">
                <span /><span /><span />
              </span>
            </div>
          ))}
        </div>

        <div className="pp-progress-bar animate-fade-in delay-2">
          <div className="pp-progress-fill" />
        </div>
      </div>

      {/* ── REVEAL PHASE ── */}
      <div className={`pp-panel pp-reveal-panel ${uiPhase === 'revealing' || uiPhase === 'done' ? 'pp-enter' : ''} ${uiPhase === 'done' ? 'pp-exit-down' : ''}`}>

        {/* Circular match ring — starts from center, hero of the screen */}
        <div className="pp-ring-hero">
          <svg
            viewBox="0 0 200 200"
            className="pp-ring-svg"
            aria-label={`Match score: ${matchPct}%`}
          >
            <defs>
              <linearGradient id="arcGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%"   stopColor="hsl(258,88%,68%)" />
                <stop offset="100%" stopColor="hsl(187,88%,55%)" />
              </linearGradient>
              {/* Glow filter */}
              <filter id="arcGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Track */}
            <circle
              cx="100" cy="100" r={R}
              fill="none"
              stroke="var(--bg-elevated)"
              strokeWidth="10"
            />

            {/* Animated fill arc */}
            <circle
              cx="100" cy="100" r={R}
              fill="none"
              stroke="url(#arcGrad)"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={CIRC}
              strokeDashoffset={dashOffset}
              transform="rotate(-90 100 100)"
              filter="url(#arcGlow)"
              className="pp-arc"
            />
          </svg>

          {/* Center content — the percentage number */}
          <div className="pp-ring-center">
            <span className="pp-ring-num gradient-text">{displayNum}</span>
            <span className="pp-ring-pct-sign">%</span>
            <span className="pp-ring-label">Job Match</span>
          </div>
        </div>

        {/* Match quality label */}
        <div
          className={`pp-match-label animate-slide-up ${arcFill ? 'pp-label-visible' : ''}`}
          style={{ color: matchColor }}
        >
          {matchLabel}
        </div>

        {/* Skill summary chips */}
        <div className={`pp-chips animate-slide-up delay-2 ${arcFill ? 'pp-chips-visible' : ''}`}>
          {state.analysisResult?.strongSkills?.slice(0, 3).map((s) => (
            <span key={s} className="badge badge-strong pp-chip">{s}</span>
          ))}
          {state.analysisResult?.weakSkills?.slice(0, 2).map((s) => (
            <span key={s} className="badge badge-weak pp-chip">{s}</span>
          ))}
          {state.analysisResult?.missingSkills?.slice(0, 2).map((s) => (
            <span key={s} className="badge badge-missing pp-chip">{s}</span>
          ))}
        </div>

        <p className={`pp-reveal-sub ${arcFill ? 'pp-reveal-sub-visible' : ''}`}>
          Starting your adaptive assessment in a moment…
        </p>
      </div>
    </div>
  );
}
