/* AssessmentPage.jsx — Chat-style adaptive assessment v3 */
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../context/SessionContext';
import { startAssessment, submitAnswer } from '../services/api';
import { QuestionBubble, AnswerBubble, FeedbackBubble } from '../components/ChatBubble';
import './AssessmentPage.css';

/* Mini SVG ring for the match % card — large, centered */
const MINI_R    = 48;
const MINI_CIRC = 2 * Math.PI * MINI_R;

function MatchRing({ pct }) {
  const offset = MINI_CIRC * (1 - pct / 100);
  return (
    <div className="match-mini-ring">
      <svg viewBox="0 0 120 120">
        <defs>
          <linearGradient id="miniGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor="hsl(258,88%,68%)"/>
            <stop offset="100%" stopColor="hsl(187,88%,55%)"/>
          </linearGradient>
          <filter id="miniGlow" x="-15%" y="-15%" width="130%" height="130%">
            <feGaussianBlur stdDeviation="2.5" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
        {/* Track */}
        <circle cx="60" cy="60" r={MINI_R} fill="none" stroke="var(--bg-elevated)" strokeWidth="8"/>
        {/* Fill arc */}
        <circle cx="60" cy="60" r={MINI_R} fill="none" stroke="url(#miniGrad)" strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={MINI_CIRC}
          strokeDashoffset={offset}
          transform="rotate(-90 60 60)"
          filter="url(#miniGlow)"
          style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)' }}
        />
      </svg>
      <div className="match-mini-center">
        <span className="match-mini-pct">{pct}</span>
        <span className="match-mini-sign">%</span>
        <span className="match-mini-sub">Match</span>
      </div>
    </div>
  );
}

export default function AssessmentPage() {
  const navigate = useNavigate();
  const { state, dispatch } = useSession();

  const [answer, setAnswer]   = useState('');
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const [error, setError]     = useState(null);

  const chatEndRef  = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (!state.sessionId)           { navigate('/upload');  return; }
    if (state.phase === 'complete') { navigate('/results'); return; }
  }, [state.sessionId, state.phase, navigate]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.conversationHistory]);

  useEffect(() => {
    if (state.sessionId && !started && state.phase === 'analyzed') {
      setStarted(true);
      handleStart();
    }
  }, [state.sessionId, started, state.phase]);

  async function handleStart() {
    setLoading(true); setError(null);
    try {
      const result = await startAssessment(state.sessionId);
      dispatch({ type: 'ASSESSMENT_STARTED', payload: result });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e?.preventDefault();
    if (!answer.trim() || loading) return;

    const submitted = answer.trim();
    setAnswer(''); setLoading(true); setError(null);

    dispatch({
      type: 'ANSWER_SUBMITTED',
      payload: { evaluation: null, score: 0, done: false, _optimistic: true, _answer: submitted },
    });

    try {
      const result = await submitAnswer(state.sessionId, submitted);
      dispatch({ type: 'ANSWER_SUBMITTED', payload: result });
      if (result.done) setTimeout(() => navigate('/results'), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      textareaRef.current?.focus();
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
  }

  const pct    = state.totalQuestions > 0
    ? Math.round((state.questionIndex / state.totalQuestions) * 100) : 0;
  const matchPct  = state.analysisResult?.matchPercentage ?? 0;
  const isAssessing = state.phase === 'assessing';

  const matchQuality =
    matchPct >= 70 ? { label: '🚀 Strong Match',   cls: 'match-quality-high'   } :
    matchPct >= 45 ? { label: '📈 Partial Match',   cls: 'match-quality-medium' } :
                     { label: '📚 Needs Work',       cls: 'match-quality-low'    };

  const diffClass =
    state.currentDifficulty === 'hard'   ? 'diff-hard'   :
    state.currentDifficulty === 'medium' ? 'diff-medium' : 'diff-easy';

  const diffIcon =
    state.currentDifficulty === 'hard'   ? '🔥' :
    state.currentDifficulty === 'medium' ? '⚡' : '✨';

  const diffSub =
    state.currentDifficulty === 'hard'   ? 'Advanced concepts & edge cases' :
    state.currentDifficulty === 'medium' ? 'Practical application' : 'Core concepts & definitions';

  // All skills being assessed with their type
  const missingSkills = state.analysisResult?.missingSkills?.slice(0, 3) ?? [];
  const weakSkills    = state.analysisResult?.weakSkills?.slice(0, 2) ?? [];

  return (
    <div className="assessment-page">

      {/* ═══════════════ SIDEBAR ═══════════════ */}
      <aside className="assessment-sidebar" aria-label="Assessment context">

        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-badge">⚡</div>
          <span className="sidebar-logo-text gradient-text">SkillSense AI</span>
        </div>

        {/* ── JOB MATCH ── */}
        <div className="sidebar-section section-match">
          <div className="sidebar-label">
            <span className="sidebar-label-icon">📊</span> Job Match
          </div>
          <div className="match-ring-wrap">
            <MatchRing pct={matchPct} />
            <div className="match-meta">
              <div className="match-meta-label">vs. job requirements</div>
              <span className={`match-quality-badge ${matchQuality.cls}`}>
                {matchQuality.label}
              </span>
            </div>
          </div>
        </div>

        {/* ── PROGRESS ── */}
        <div className="sidebar-section section-progress">
          <div className="sidebar-label">
            <span className="sidebar-label-icon">📈</span> Progress
          </div>
          <div className="progress-numbers-row">
            <span className="progress-q-current">{state.questionIndex || 0}</span>
            <span className="progress-q-sep">/</span>
            <span className="progress-q-total">{state.totalQuestions || 10}</span>
            <span className="progress-q-label">{pct}% done</span>
          </div>
          <div className="sidebar-progress-track">
            <div className="sidebar-progress-fill" style={{ width: `${pct}%` }} />
          </div>
        </div>

        {/* ── CURRENT SKILL ── */}
        <div className="sidebar-section section-current-skill">
          <div className="sidebar-label">
            <span className="sidebar-label-icon">🎯</span> Current Skill
          </div>
          {state.currentSkill ? (
            <div className="current-skill-pill">
              <span className="current-skill-dot" />
              {state.currentSkill}
            </div>
          ) : (
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Starting…</span>
          )}
        </div>

        {/* ── SKILLS BEING TESTED ── */}
        <div className="sidebar-section section-skills">
          <div className="sidebar-label">
            <span className="sidebar-label-icon">📋</span> Skills Being Tested
          </div>
          <div className="sidebar-skill-list">
            {missingSkills.map((s) => (
              <div
                key={s}
                className={`sidebar-skill-item item-missing ${s === state.currentSkill ? 'item-active' : ''}`}
              >
                <span className="skill-item-dot" style={{ background: 'var(--color-danger)' }} />
                {s}
              </div>
            ))}
            {weakSkills.map((s) => (
              <div
                key={s}
                className={`sidebar-skill-item item-weak ${s === state.currentSkill ? 'item-active' : ''}`}
              >
                <span className="skill-item-dot" style={{ background: 'var(--color-warning)' }} />
                {s}
              </div>
            ))}
          </div>
        </div>

        {/* ── DIFFICULTY ── */}
        <div className="sidebar-section section-difficulty">
          <div className="sidebar-label">
            <span className="sidebar-label-icon">⚡</span> Difficulty
          </div>
          <div className={`difficulty-large-badge ${diffClass}`}>
            <span className="difficulty-icon">{diffIcon}</span>
            <div>
              <span>{(state.currentDifficulty || 'easy').toUpperCase()}</span>
              <span className="difficulty-sublabel">{diffSub}</span>
            </div>
          </div>
        </div>

        {/* Tip */}
        <div className="sidebar-tip">
          <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>💡</span>
          <p>Be specific. Use examples. Depth and accuracy are scored separately.</p>
        </div>
      </aside>

      {/* ═══════════════ MAIN CHAT ═══════════════ */}
      <main className="assessment-main" role="main">

        {/* Top bar */}
        <div className="assessment-header">
          <div className="assessment-header-left">
            <h2>Technical Assessment</h2>
            <p>
              Skill {state.skillIndex || 1} of {state.totalSkills || '—'}
              {state.currentDifficulty && ` · ${state.currentDifficulty} difficulty`}
            </p>
          </div>

          <div className="assessment-header-progress">
            <div className="header-progress-bar">
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${pct}%` }} />
              </div>
            </div>
            <span className="header-progress-count">
              {state.questionIndex}/{state.totalQuestions}
            </span>
          </div>

          {state.currentSkill && (
            <span className="badge badge-primary">{state.currentSkill}</span>
          )}
        </div>

        {/* Chat log */}
        <div className="chat-area" id="chat-area" role="log" aria-live="polite">
          {state.conversationHistory.length === 0 && !loading && (
            <div className="chat-welcome">
              <div className="chat-welcome-icon">🎯</div>
              <h3>Assessment Starting…</h3>
              <p>Your first question is being generated. This only takes a moment.</p>
            </div>
          )}

          {state.phase === 'analyzed' && loading && (
            <div className="chat-loading animate-fade-in">
              <div className="typing-indicator"><span /><span /><span /></div>
              <span className="typing-label">Generating your first question…</span>
            </div>
          )}

          {state.conversationHistory.map((item, idx) => {
            if (item.type === 'question')
              return <QuestionBubble key={idx} question={item.content} skill={item.skill} difficulty={item.difficulty} isNewSkill={item.isNewSkill} />;
            if (item.type === 'answer')
              return <AnswerBubble key={idx} answer={item.content} />;
            if (item.type === 'feedback' && item.evaluation)
              return <FeedbackBubble key={idx} score={item.score} evaluation={item.evaluation} />;
            return null;
          })}

          {loading && isAssessing && (
            <div className="chat-loading animate-fade-in">
              <div className="typing-indicator"><span /><span /><span /></div>
              <span className="typing-label">
                {state.questionIndex === state.totalQuestions ? 'Finalizing assessment…' : 'Evaluating your answer…'}
              </span>
            </div>
          )}

          {state.phase === 'complete' && (
            <div className="chat-done-banner">
              <span>🎉</span>
              <span>Assessment complete! Redirecting to your results…</span>
            </div>
          )}

          {error && (
            <div className="chat-error animate-slide-up">
              <span>⚠️ {error}</span>
              <button className="btn btn-outline btn-sm" onClick={() => setError(null)}>Dismiss</button>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <form className="chat-input-area" onSubmit={handleSubmit} noValidate>
          <div className="chat-textarea-wrap">
            <textarea
              ref={textareaRef}
              id="answer-input"
              className="textarea chat-textarea"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isAssessing ? 'Type your answer… (Enter to submit, Shift+Enter for newline)' : 'Waiting for question…'}
              rows={3}
              disabled={loading || !isAssessing}
              aria-label="Your answer"
            />
            {isAssessing && <span className="chat-input-hint">↵ Submit</span>}
          </div>
          <button
            id="submit-answer-btn"
            type="submit"
            className="btn btn-primary chat-submit-btn"
            disabled={!answer.trim() || loading || !isAssessing}
            aria-label="Submit answer"
          >
            {loading ? <span className="spinner" /> : '↑'}
          </button>
        </form>
      </main>
    </div>
  );
}
