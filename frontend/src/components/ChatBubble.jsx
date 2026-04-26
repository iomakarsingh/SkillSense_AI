/* ChatBubble.jsx — Question / Answer / Feedback bubbles for assessment */
import './ChatBubble.css';
import SkillBadge from './SkillBadge';

const DIFFICULTY_COLORS = {
  easy:   'var(--color-success)',
  medium: 'var(--color-warning)',
  hard:   'var(--color-danger)',
};

function DifficultyPip({ difficulty }) {
  return (
    <span className="difficulty-pip" style={{ color: DIFFICULTY_COLORS[difficulty] || 'var(--text-muted)' }}>
      ● {difficulty?.toUpperCase()}
    </span>
  );
}

function gradeLabel(score) {
  if (score >= 7.5) return { text: 'Great',   cls: 'grade-great' };
  if (score >= 5)   return { text: 'OK',       cls: 'grade-ok'    };
  return               { text: 'Needs Work', cls: 'grade-weak'  };
}

function scoreColor(score) {
  if (score >= 7.5) return 'var(--color-success-light)';
  if (score >= 5)   return 'var(--color-warning)';
  return 'var(--color-danger)';
}

/* ── Question Bubble ─────────────────────────────── */
export function QuestionBubble({ question, skill, difficulty, isNewSkill }) {
  return (
    <div className="bubble-wrapper bubble-question">
      <div className="bubble-avatar bubble-avatar-ai">⚡</div>
      <div className="bubble-content">
        {(skill || isNewSkill) && (
          <div className="bubble-meta">
            {skill && <SkillBadge skill={skill} strength="Missing" />}
            {difficulty && <DifficultyPip difficulty={difficulty} />}
            {isNewSkill && <span className="new-skill-label">↑ New skill</span>}
          </div>
        )}
        <div className="bubble-text bubble-text-ai">
          <p>{question}</p>
        </div>
      </div>
    </div>
  );
}

/* ── Answer Bubble ───────────────────────────────── */
export function AnswerBubble({ answer }) {
  return (
    <div className="bubble-wrapper bubble-answer">
      <div className="bubble-content bubble-content-right">
        <div className="bubble-text bubble-text-user">
          <p>{answer}</p>
        </div>
      </div>
      <div className="bubble-avatar bubble-avatar-user">You</div>
    </div>
  );
}

/* ── Feedback Bubble ─────────────────────────────── */
export function FeedbackBubble({ score, evaluation }) {
  const grade = gradeLabel(score);
  const color = scoreColor(score);

  return (
    <div className="bubble-wrapper bubble-feedback">
      <div className="bubble-avatar bubble-avatar-ai">⚡</div>
      <div className="bubble-content">
        <div className="feedback-bubble">

          {/* Header: big score + grade chip */}
          <div className="feedback-bubble-header">
            <div className="feedback-score-badge">
              <span className="feedback-score-num" style={{ color }}>
                {score.toFixed(1)}
              </span>
              <span className="feedback-score-denom">/10</span>
            </div>
            <span className={`feedback-grade-label ${grade.cls}`}>{grade.text}</span>
          </div>

          {/* Body: feedback text + dimension scores */}
          <div className="feedback-bubble-body">
            {evaluation?.feedback && (
              <div className="feedback-text">
                <p>{evaluation.feedback}</p>
              </div>
            )}
            <div className="feedback-dims">
              {[
                { key: 'relevance', label: 'Relevance' },
                { key: 'accuracy',  label: 'Accuracy'  },
                { key: 'depth',     label: 'Depth'     },
              ].map(({ key, label }) => (
                <div key={key} className="feedback-dim">
                  <span className="feedback-dim-val">{evaluation?.[key]?.toFixed(0) ?? '—'}</span>
                  <span className="feedback-dim-label">{label}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
