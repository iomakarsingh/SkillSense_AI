/* ResultsDashboard.jsx — Premium results page v2 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../context/SessionContext';
import { getResults } from '../services/api';
import ScoreCard from '../components/ScoreCard';
import GapChart from '../components/GapChart';
import LearningPlan from '../components/LearningPlan';
import SkillBadge from '../components/SkillBadge';
import './ResultsDashboard.css';

/* ── Large animated match ring ── */
const RING_R    = 80;
const RING_CIRC = 2 * Math.PI * RING_R;

function MatchRing({ pct }) {
  const offset = RING_CIRC * (1 - pct / 100);
  const color  = pct >= 70 ? 'hsl(152,60%,50%)' : pct >= 45 ? 'hsl(37,95%,58%)' : 'hsl(354,80%,62%)';
  const label  = pct >= 70 ? 'Strong Match' : pct >= 45 ? 'Partial Match' : 'Needs Work';

  return (
    <div className="rd-ring-wrap">
      <svg viewBox="0 0 200 200" className="rd-ring-svg" role="img" aria-label={`Job match: ${pct}%`}>
        <defs>
          <linearGradient id="rdGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor="hsl(258,88%,68%)"/>
            <stop offset="100%" stopColor="hsl(187,88%,55%)"/>
          </linearGradient>
          <filter id="rdGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="5" result="b"/>
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
        {/* Track */}
        <circle cx="100" cy="100" r={RING_R} fill="none" stroke="var(--bg-elevated)" strokeWidth="12"/>
        {/* Arc */}
        <circle cx="100" cy="100" r={RING_R} fill="none"
          stroke="url(#rdGrad)" strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={RING_CIRC}
          strokeDashoffset={offset}
          transform="rotate(-90 100 100)"
          filter="url(#rdGlow)"
          className="rd-arc"
        />
      </svg>
      <div className="rd-ring-center">
        <span className="rd-ring-pct gradient-text">{pct}</span>
        <span className="rd-ring-sign gradient-text">%</span>
        <span className="rd-ring-label">Job Match</span>
        <span className="rd-ring-quality" style={{ color }}>{label}</span>
      </div>
    </div>
  );
}

/* ── Stat pill ── */
function StatPill({ value, label, accent }) {
  return (
    <div className="rd-stat-pill" style={ accent ? { borderColor: `${accent}44` } : {}}>
      <span className="rd-stat-val gradient-text">{value}</span>
      <span className="rd-stat-label">{label}</span>
    </div>
  );
}

/* ── Tab definitions ── */
const TAB_ICONS = {
  overview: '📊',
  skills:   '🎯',
  gaps:     '🔍',
  roadmap:  '🗺️',
};

export default function ResultsDashboard() {
  const navigate = useNavigate();
  const { state, dispatch, reset } = useSession();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);

  useEffect(() => {
    if (!state.sessionId) { navigate('/upload'); return; }
  }, [state.sessionId, navigate]);

  useEffect(() => {
    if (state.sessionId && state.phase === 'complete' && !state.finalResults) {
      fetchResults();
    }
  }, [state.sessionId, state.phase]);

  async function fetchResults() {
    setLoading(true); setError(null);
    try {
      const results = await getResults(state.sessionId);
      dispatch({ type: 'RESULTS_LOADED', payload: results });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleRestart() { reset(); navigate('/upload'); }

  /* ── Loading state ── */
  if (loading) return (
    <div className="rd-fullscreen-state">
      <div className="rd-loading-card animate-fade-in">
        <div className="rd-loading-icon animate-float">🗺️</div>
        <h2>Generating Your Learning Plan…</h2>
        <p className="text-muted">Our AI is building your personalized roadmap. About 20 seconds.</p>
        <div className="rd-loading-bar">
          <div className="rd-loading-bar-fill" />
        </div>
      </div>
    </div>
  );

  /* ── Error state ── */
  if (error) return (
    <div className="rd-fullscreen-state">
      <div className="rd-loading-card text-center">
        <div className="rd-loading-icon">⚠️</div>
        <h2>Could Not Load Results</h2>
        <p className="text-muted" style={{ marginBottom: 'var(--space-8)' }}>{error}</p>
        <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'center' }}>
          <button className="btn btn-primary" onClick={fetchResults}>Retry</button>
          <button className="btn btn-outline" onClick={handleRestart}>Start Over</button>
        </div>
      </div>
    </div>
  );

  const results = state.finalResults;
  if (!results) return null;

  const {
    matchPercentage, overallScore, skillScores = [],
    strongSkills = [], weakSkills = [], missingSkills = [],
    mediumSkills = [], skillMatrix = [],
    totalQuestionsAnswered, assessmentSummary, learningPlan,
  } = results;

  const TABS = [
    { id: 'overview', label: 'Overview' },
    { id: 'skills',   label: `Skill Scores` },
    { id: 'gaps',     label: 'Gap Analysis' },
    { id: 'roadmap',  label: 'Learning Plan' },
  ];

  return (
    <div className="results-page">

      {/* ── Sticky top bar ── */}
      <nav className="rd-topbar" aria-label="Results navigation">
        <div className="container rd-topbar-inner">
          <div className="rd-topbar-logo">
            <div className="rd-topbar-badge">⚡</div>
            <span className="gradient-text" style={{ fontWeight: 800 }}>SkillSense AI</span>
            <span className="badge badge-accent" style={{ marginLeft: 'var(--space-2)' }}>
              Assessment Complete
            </span>
          </div>
          <button id="restart-btn" className="btn btn-outline btn-sm" onClick={handleRestart}>
            ↩ New Assessment
          </button>
        </div>
      </nav>

      {/* ── HERO BANNER ── */}
      <div className="rd-hero">
        <div className="rd-hero-bg" aria-hidden="true">
          <div className="rd-hero-orb rd-orb-1" />
          <div className="rd-hero-orb rd-orb-2" />
        </div>

        <div className="container rd-hero-inner animate-fade-in">

          {/* Big match ring */}
          <MatchRing pct={matchPercentage} />

          {/* Stats row */}
          <div className="rd-stats-row">
            <StatPill
              value={`${overallScore?.toFixed(1)}/10`}
              label="Assessment Score"
            />
            <StatPill
              value={totalQuestionsAnswered}
              label="Questions Answered"
            />
            <StatPill
              value={strongSkills.length}
              label="Strong Skills"
            />
            <StatPill
              value={missingSkills.length + weakSkills.length}
              label="Skills to Improve"
            />
          </div>

          {/* Assessment summary card */}
          {assessmentSummary && (
            <div className="rd-summary-card card-glass animate-slide-up delay-2">
              <div className="rd-summary-header">
                <span className="rd-summary-icon">💬</span>
                <h3>Assessment Summary</h3>
              </div>
              <p className="rd-summary-text">{assessmentSummary}</p>
              <div className="rd-summary-chips">
                {strongSkills.slice(0, 3).map((s)  => <SkillBadge key={s} skill={s} strength="Strong" />)}
                {weakSkills.slice(0, 2).map((s)    => <SkillBadge key={s} skill={s} strength="Weak"   />)}
                {missingSkills.slice(0, 2).map((s) => <SkillBadge key={s} skill={s} strength="Missing"/>)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── TAB NAVIGATION ── */}
      <div className="rd-tabs-wrap">
        <div className="container">
          <div className="rd-tabs" role="tablist">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                role="tab"
                aria-selected={activeTab === tab.id}
                className={`rd-tab ${activeTab === tab.id ? 'rd-tab-active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span className="rd-tab-icon">{TAB_ICONS[tab.id]}</span>
                <span>{tab.label}</span>
                {tab.id === 'skills' && skillScores.length > 0 && (
                  <span className="rd-tab-count">{skillScores.length}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── TAB CONTENT ── */}
      <div className="container rd-content">

        {/* OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="rd-overview animate-fade-in">
            <div className="rd-overview-grid">
              {/* Strong */}
              <div className="rd-skill-group rd-group-strong">
                <div className="rd-group-header">
                  <span className="rd-group-dot" style={{ background: 'var(--color-success)' }} />
                  <h3>Strong Skills</h3>
                  <span className="rd-group-count">{strongSkills.length}</span>
                </div>
                <div className="rd-chip-list">
                  {strongSkills.length > 0
                    ? strongSkills.map((s) => <SkillBadge key={s} skill={s} strength="Strong" />)
                    : <p className="text-muted rd-empty">None identified</p>}
                </div>
              </div>

              {/* Weak */}
              <div className="rd-skill-group rd-group-weak">
                <div className="rd-group-header">
                  <span className="rd-group-dot" style={{ background: 'var(--color-warning)' }} />
                  <h3>Needs Improvement</h3>
                  <span className="rd-group-count">{weakSkills.length + (mediumSkills?.length || 0)}</span>
                </div>
                <div className="rd-chip-list">
                  {mediumSkills?.map((s) => <SkillBadge key={s} skill={s} strength="medium" />)}
                  {weakSkills.map((s)    => <SkillBadge key={s} skill={s} strength="Weak" />)}
                  {(!weakSkills.length && !mediumSkills?.length) &&
                    <p className="text-muted rd-empty">None identified</p>}
                </div>
              </div>

              {/* Missing */}
              <div className="rd-skill-group rd-group-missing">
                <div className="rd-group-header">
                  <span className="rd-group-dot" style={{ background: 'var(--color-danger)' }} />
                  <h3>Missing Skills</h3>
                  <span className="rd-group-count">{missingSkills.length}</span>
                </div>
                <div className="rd-chip-list">
                  {missingSkills.length > 0
                    ? missingSkills.map((s) => <SkillBadge key={s} skill={s} strength="Missing" />)
                    : <p className="text-muted rd-empty">None — great match! 🎉</p>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SKILL SCORES */}
        {activeTab === 'skills' && (
          <div className="rd-skills animate-fade-in">
            {skillScores.length > 0
              ? <div className="rd-skills-grid">
                  {skillScores.map((s) => <ScoreCard key={s.skill} skillData={s} />)}
                </div>
              : <div className="rd-empty-state">
                  <span>🎯</span>
                  <p>No skills were assessed in this session.</p>
                </div>
            }
          </div>
        )}

        {/* GAP ANALYSIS */}
        {activeTab === 'gaps' && (
          <div className="animate-fade-in">
            <GapChart skillMatrix={skillMatrix} />
          </div>
        )}

        {/* LEARNING PLAN */}
        {activeTab === 'roadmap' && (
          <div className="animate-fade-in">
            {learningPlan
              ? <LearningPlan plan={learningPlan} />
              : <div className="rd-empty-state">
                  <span>🗺️</span>
                  <p>Learning plan not available for this session.</p>
                </div>
            }
          </div>
        )}
      </div>
    </div>
  );
}
