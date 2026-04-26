/* UploadPage.jsx — Resume + JD: prominent file upload + textarea fallback */
import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../context/SessionContext';
import { analyzeResume } from '../services/api';
import { extractTextFromFile, formatFileSize, ACCEPT_STRING } from '../services/fileParser';
import './UploadPage.css';

const RESUME_PLACEHOLDER = `John Doe | Full Stack Engineer
john@example.com | github.com/johndoe

EXPERIENCE
Senior Software Engineer — Acme Corp (2021–Present)
• Built microservices with Node.js and Express
• Led migration of legacy PHP app to React
• Deployed services on AWS EC2 and S3

SKILLS
JavaScript, React, Node.js, Python, SQL, Git, Docker

EDUCATION
B.Tech Computer Science — State University (2019)`;

const JD_PLACEHOLDER = `Senior Full Stack Engineer — TechCorp

We are looking for a skilled engineer with:
• 4+ years of experience with React and TypeScript
• Strong Node.js / Express backend skills
• Experience with Docker, Kubernetes, and CI/CD
• Familiarity with AWS or GCP cloud services
• GraphQL API design experience
• PostgreSQL and Redis knowledge
• Agile/Scrum methodology`;

/* ─────────────────────────────────────────────────────────────
   UploadZone — the big, prominent drag-and-drop hero
───────────────────────────────────────────────────────────── */
function UploadZone({ onText, onClear, hasText, disabled }) {
  const [dragging, setDragging] = useState(false);
  const [parsing,  setParsing]  = useState(false);
  const [fileInfo, setFileInfo] = useState(null);
  const [fileErr,  setFileErr]  = useState(null);
  const inputRef = useRef(null);

  const processFile = useCallback(async (file) => {
    if (!file) return;
    setParsing(true);
    setFileErr(null);
    setFileInfo(null);
    try {
      const text = await extractTextFromFile(file);
      setFileInfo({ name: file.name, size: formatFileSize(file.size), chars: text.length });
      onText(text);
    } catch (err) {
      setFileErr(err.message);
    } finally {
      setParsing(false);
    }
  }, [onText]);

  function handleDrop(e) {
    e.preventDefault();
    setDragging(false);
    if (disabled || parsing) return;
    processFile(e.dataTransfer.files?.[0]);
  }

  function handleInput(e) {
    processFile(e.target.files?.[0]);
    e.target.value = '';
  }

  function handleClear(e) {
    e.stopPropagation();
    setFileInfo(null);
    setFileErr(null);
    onClear();
  }

  const isSuccess = !!fileInfo;
  const isError   = !!fileErr;

  return (
    <div
      className={`upload-zone
        ${dragging  ? 'uz-dragging'  : ''}
        ${parsing   ? 'uz-parsing'   : ''}
        ${isSuccess ? 'uz-success'   : ''}
        ${isError   ? 'uz-error'     : ''}
        ${disabled  ? 'uz-disabled'  : ''}
      `}
      onDragOver={(e) => { e.preventDefault(); if (!disabled && !parsing) setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => !disabled && !parsing && !isSuccess && inputRef.current?.click()}
      role="button"
      tabIndex={disabled ? -1 : 0}
      onKeyDown={(e) => e.key === 'Enter' && !disabled && !isSuccess && inputRef.current?.click()}
      aria-label="Upload file"
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_STRING}
        onChange={handleInput}
        style={{ display: 'none' }}
        disabled={disabled || parsing}
      />

      {/* Animated background blobs */}
      {!isSuccess && !isError && (
        <div className="uz-bg" aria-hidden="true">
          <div className="uz-blob uz-blob-1" />
          <div className="uz-blob uz-blob-2" />
        </div>
      )}

      {parsing ? (
        <div className="uz-inner">
          <div className="uz-spinner" />
          <p className="uz-title">Extracting text…</p>
          <p className="uz-sub">Reading your file</p>
        </div>

      ) : isSuccess ? (
        <div className="uz-inner uz-inner-success">
          <div className="uz-check">✓</div>
          <div className="uz-file-details">
            <p className="uz-filename">{fileInfo.name}</p>
            <p className="uz-filemeta">{fileInfo.size} · {fileInfo.chars.toLocaleString()} characters extracted</p>
          </div>
          <button className="uz-clear-btn" onClick={handleClear} title="Remove file">
            Change file ↺
          </button>
        </div>

      ) : isError ? (
        <div className="uz-inner">
          <div className="uz-icon">⚠️</div>
          <p className="uz-title uz-error-text">{fileErr}</p>
          <button
            className="uz-retry-btn"
            onClick={(e) => { e.stopPropagation(); setFileErr(null); inputRef.current?.click(); }}
          >
            Try another file
          </button>
        </div>

      ) : (
        <div className="uz-inner">
          <div className="uz-icon-wrap">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
          </div>
          <p className="uz-title">
            {dragging ? 'Drop it here!' : 'Drop your file here'}
          </p>
          <p className="uz-sub">or <span className="uz-browse-link">click to browse</span></p>
          <div className="uz-formats">
            <span className="uz-fmt">PDF</span>
            <span className="uz-fmt">DOCX</span>
            <span className="uz-fmt">TXT</span>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   InputField — upload zone on top, textarea below
───────────────────────────────────────────────────────────── */
function InputField({ id, icon, label, value, onChange, placeholder, error, disabled }) {
  function handleFileText(text) { onChange(text); }
  function handleClear()        { onChange(''); }

  return (
    <div className="upload-field">
      <div className="field-label-row">
        <label htmlFor={id} className="upload-label">
          {icon} {label}
        </label>
        {value && (
          <span className="char-pill">{value.trim().length.toLocaleString()} chars ✓</span>
        )}
      </div>

      {/* Primary: upload zone */}
      <UploadZone
        onText={handleFileText}
        onClear={handleClear}
        hasText={!!value}
        disabled={disabled}
      />

      {/* Divider */}
      <div className="or-divider">
        <span className="or-line" />
        <span className="or-label">or type / paste below</span>
        <span className="or-line" />
      </div>

      {/* Secondary: textarea */}
      <textarea
        id={id}
        className={`textarea upload-textarea ${error ? 'error' : ''}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={10}
        disabled={disabled}
      />

      {error && <span className="field-error">{error}</span>}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   UploadPage
───────────────────────────────────────────────────────────── */
export default function UploadPage() {
  const navigate = useNavigate();
  const { dispatch } = useSession();

  const [resume, setResume]         = useState('');
  const [jd, setJd]                 = useState('');
  const [errors, setErrors]         = useState({});
  const [apiError, setApiError]     = useState(null);
  const [submitting, setSubmitting] = useState(false);

  function validate() {
    const errs = {};
    if (!resume.trim() || resume.trim().length < 50)
      errs.resume = 'Resume needs at least 50 characters. Upload a file or paste your resume.';
    if (!jd.trim() || jd.trim().length < 30)
      errs.jd = 'Job description needs at least 30 characters.';
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setErrors({});
    setApiError(null);
    setSubmitting(true);
    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      navigate('/processing');
      const result = await analyzeResume(resume.trim(), jd.trim());
      // Don't navigate here — ProcessingPage plays the reveal animation then navigates
      dispatch({ type: 'ANALYSIS_COMPLETE', payload: result });
    } catch (err) {
      navigate('/upload');
      dispatch({ type: 'SET_LOADING', payload: false });
      setApiError(err.message || 'Analysis failed. Make sure the backend is running.');
      setSubmitting(false);
    }
  }

  function useExample() {
    setResume(RESUME_PLACEHOLDER);
    setJd(JD_PLACEHOLDER);
    setErrors({});
    setApiError(null);
  }

  return (
    <div className="upload-page">
      <div className="upload-bg" aria-hidden="true">
        <div className="bg-orb bg-orb-1" />
        <div className="bg-orb bg-orb-2" />
      </div>

      <div className="container" style={{ position: 'relative', zIndex: 1 }}>

        {/* Header */}
        <div className="upload-header animate-fade-in">
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/')}>← Back</button>
          <div className="upload-title-block text-center">
            <div className="badge badge-primary" style={{ marginBottom: 'var(--space-md)', display: 'inline-flex' }}>
              Step 1 of 3
            </div>
            <h1>Resume & Job Description</h1>
            <p>Upload a file <strong style={{ color: 'var(--text-primary)' }}>or</strong> paste your text — we handle the rest.</p>
          </div>
          <button id="use-example-btn" className="btn btn-outline btn-sm" onClick={useExample}>
            Use Example
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="upload-form animate-slide-up" noValidate>
          <div className="upload-grid">
            <InputField
              id="resume-input"
              icon="📄"
              label="Your Resume"
              value={resume}
              onChange={(t) => { setResume(t); setErrors((p) => ({ ...p, resume: null })); }}
              placeholder="Paste your full resume here…"
              error={errors.resume}
              disabled={submitting}
            />
            <InputField
              id="jd-input"
              icon="💼"
              label="Job Description"
              value={jd}
              onChange={(t) => { setJd(t); setErrors((p) => ({ ...p, jd: null })); }}
              placeholder="Paste the job description here…"
              error={errors.jd}
              disabled={submitting}
            />
          </div>

          {apiError && (
            <div className="api-error-banner">
              <span>⚠️</span>
              <span>{apiError}</span>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setApiError(null)}>✕</button>
            </div>
          )}

          <div className="upload-actions">
            <div className="upload-hint text-muted">
              <span>⚡</span> AI extracts skills and computes your match score automatically.
            </div>
            <button
              id="analyze-btn"
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={submitting}
            >
              {submitting
                ? <><span className="spinner" /> Analyzing…</>
                : 'Analyze Skills →'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
