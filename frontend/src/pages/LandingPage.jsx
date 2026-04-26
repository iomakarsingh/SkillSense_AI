/* LandingPage.jsx — Premium landing with stats, features, flow, and CTA */
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';

const FEATURES = [
  {
    icon: '🧠',
    title: 'AI Skill Extraction',
    desc: 'Parses your resume and job description using LLM to map exact skill alignment with proficiency levels.',
  },
  {
    icon: '📊',
    title: 'Smart Gap Analysis',
    desc: 'Weighted match score with fuzzy matching and skill taxonomy — Docker gives partial Kubernetes credit.',
  },
  {
    icon: '🎯',
    title: 'Adaptive Assessment',
    desc: '10 questions across 5 skills. Difficulty adjusts up or down based on your previous answers.',
  },
  {
    icon: '📈',
    title: 'Scored Evaluation',
    desc: 'Each answer rated on Relevance, Accuracy & Depth. Score computed server-side — never by AI.',
  },
  {
    icon: '🗺️',
    title: 'Personalized Roadmap',
    desc: 'A week-by-week learning plan tailored to your specific gaps, with real resources and tasks.',
  },
  {
    icon: '⚡',
    title: 'Production Architecture',
    desc: 'Retry logic, JSON schema validation, in-memory sessions, and clean service separation throughout.',
  },
];

const STATS = [
  { value: '10',  suffix: ' Q',    label: 'Adaptive questions' },
  { value: '< 3', suffix: ' min',  label: 'Analysis time' },
  { value: '5',   suffix: ' skills', label: 'Skills assessed' },
  { value: '100', suffix: '%',     label: 'Free to use' },
];

const FLOW = [
  { n: '1', title: 'Paste or Upload',      desc: 'Add your resume and the job description — type, paste, or upload a PDF/DOCX.' },
  { n: '2', title: 'AI Analyzes Skills',   desc: 'Skills extracted with proficiency levels. Gap analysis runs in milliseconds.' },
  { n: '3', title: 'Answer 10 Questions',  desc: 'Adaptive technical questions across your top skill gaps. Difficulty adjusts live.' },
  { n: '4', title: 'Get Your Roadmap',     desc: 'Scored results plus a personalized weekly learning plan built around your gaps.' },
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="landing">
      {/* ── Background ── */}
      <div className="landing-bg" aria-hidden="true">
        <div className="bg-grid" />
        <div className="bg-orb bg-orb-1" />
        <div className="bg-orb bg-orb-2" />
        <div className="bg-orb bg-orb-3" />
      </div>

      {/* ── Nav ── */}
      <nav className="landing-nav" role="navigation" aria-label="Main navigation">
        <div className="container nav-inner">
          <a href="/" className="nav-logo">
            <div className="nav-logo-badge">⚡</div>
            <span className="gradient-text">SkillSense AI</span>
          </a>

          <div className="nav-right">
            <ul className="nav-links">
              <li><a href="#features">Features</a></li>
              <li><a href="#how-it-works">How it works</a></li>
            </ul>
            <button
              id="nav-cta-btn"
              className="btn btn-primary btn-sm"
              onClick={() => navigate('/upload')}
            >
              Get Started →
            </button>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="hero" aria-label="Hero">
        <div className="container">
          <div className="hero-eyebrow animate-fade-in">
            <span className="section-label">✦ AI-Powered · Adaptive · Free</span>
          </div>

          <h1 className="hero-title animate-slide-up delay-1">
            Know Exactly Where
            <br />
            <span className="gradient-text">You Stand for the Role</span>
          </h1>

          <p className="hero-sub animate-slide-up delay-2">
            Paste your resume and the job description. Our AI extracts skills,
            identifies your gaps, tests your knowledge, and builds a personalized
            learning plan — in under 3 minutes.
          </p>

          <div className="hero-actions animate-slide-up delay-3">
            <button
              id="hero-cta-btn"
              className="btn btn-primary btn-lg"
              onClick={() => navigate('/upload')}
            >
              Start Free Assessment
            </button>
            <button
              className="btn btn-outline btn-lg"
              onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
            >
              See How It Works ↓
            </button>
          </div>

          {/* ── Hero Preview Card ── */}
          <div className="hero-preview animate-float animate-slide-up delay-4">
            <div className="preview-card card-glass">
              <div className="preview-toolbar">
                <div className="preview-dots">
                  <span /><span /><span />
                </div>
                <span className="preview-toolbar-title">skillsense.ai · assessment in progress</span>
                <span className="badge badge-accent" style={{ fontSize: '0.68rem' }}>LIVE</span>
              </div>

              <div className="preview-body">
                <div className="preview-match-ring">
                  <svg viewBox="0 0 100 100" className="ring-svg">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="var(--border)" strokeWidth="7"/>
                    <circle cx="50" cy="50" r="42" fill="none" stroke="url(#heroGrad)" strokeWidth="7"
                      strokeLinecap="round" strokeDasharray="263.9" strokeDashoffset="101"
                      transform="rotate(-90 50 50)"/>
                    <defs>
                      <linearGradient id="heroGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%"   stopColor="hsl(258,88%,64%)"/>
                        <stop offset="100%" stopColor="hsl(187,88%,53%)"/>
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="ring-label">
                    <span className="ring-pct">62%</span>
                    <span className="ring-sub">Match</span>
                  </div>
                </div>

                <div className="preview-right">
                  <div>
                    <div className="preview-label">Skill Assessment</div>
                    <div className="preview-skills">
                      {[['Python','strong'],['Docker','weak'],['Kubernetes','missing'],['React','strong'],['GraphQL','missing'],['Redis','medium']].map(([s,t]) => (
                        <span key={s} className={`badge badge-${t}`}>{s}</span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="preview-label">Current Question</div>
                    <div className="preview-question">
                      What is the difference between a Kubernetes Deployment and a StatefulSet?
                    </div>
                  </div>

                  <div>
                    <div className="preview-label">Score Breakdown</div>
                    <div className="preview-score-row">
                      {[['8.4','Relevance','var(--color-success)'],['7.2','Accuracy','var(--color-warning)'],['9.0','Depth','var(--color-success)']].map(([v,l,c]) => (
                        <div key={l} className="preview-score-item">
                          <span className="preview-score-val" style={{ color: c }}>{v}</span>
                          <span className="preview-score-lbl">{l}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats Bar ── */}
      <div className="stats-bar">
        <div className="container">
          <div className="stats-inner">
            {STATS.map((s) => (
              <div key={s.label} className="stat-item">
                <div className="stat-number">
                  <span className="gradient-text">{s.value}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '1.6rem' }}>{s.suffix}</span>
                </div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Features ── */}
      <section id="features" className="features" aria-labelledby="features-heading">
        <div className="container">
          <div className="section-header">
            <span className="section-label">Features</span>
            <h2 id="features-heading">Built Like a Real System</h2>
            <p className="section-desc">Every component is designed for production — not a toy demo.</p>
          </div>
          <div className="features-grid">
            {FEATURES.map((f, i) => (
              <div
                key={f.title}
                className="feature-card animate-slide-up"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="feature-icon-wrap">{f.icon}</div>
                <h4 className="feature-title">{f.title}</h4>
                <p className="feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Flow ── */}
      <section id="how-it-works" className="flow" aria-labelledby="flow-heading">
        <div className="container">
          <div className="section-header">
            <span className="section-label">How it works</span>
            <h2 id="flow-heading">Four Steps to Clarity</h2>
            <p className="section-desc">From resume to roadmap in under 3 minutes.</p>
          </div>
          <div className="flow-steps">
            {FLOW.map((step, i) => (
              <div
                key={step.n}
                className="flow-step animate-slide-up"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="flow-num-wrap">
                  <span className="flow-step-num">{step.n}</span>
                </div>
                <h4>{step.title}</h4>
                <p>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="cta-section" aria-label="Call to action">
        <div className="container">
          <div className="cta-card">
            <span className="section-label">Ready?</span>
            <h2>Find Your Skill Gaps Today</h2>
            <p>No account. No credit card. Just your resume and a job description.</p>
            <div className="cta-actions">
              <button
                id="bottom-cta-btn"
                className="btn btn-primary btn-lg"
                onClick={() => navigate('/upload')}
              >
                Start Free Assessment →
              </button>
            </div>
            <div className="cta-hint">
              <span>⏱ Under 3 minutes</span>
              <span>🔒 No signup required</span>
              <span>🎯 10 adaptive questions</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="landing-footer" role="contentinfo">
        <div className="container footer-inner">
          <div className="footer-logo">
            <span>⚡</span>
            <span>SkillSense AI</span>
          </div>
          <div className="footer-links">
            <a href="#features">Features</a>
            <a href="#how-it-works">How it works</a>
            <a href="/upload">Get Started</a>
          </div>
          <p className="footer-copy">AI-Powered Skill Assessment · Built with Groq &amp; React</p>
        </div>
      </footer>
    </div>
  );
}
