/* ScoreCard.jsx — Shows relevance/accuracy/depth breakdown for a skill */
import './ScoreCard.css';

function ScoreBar({ label, value, color }) {
  return (
    <div className="score-bar-row">
      <span className="score-bar-label">{label}</span>
      <div className="score-bar-track">
        <div
          className="score-bar-fill"
          style={{ width: `${(value / 10) * 100}%`, background: color }}
        />
      </div>
      <span className="score-bar-value">{value.toFixed(1)}</span>
    </div>
  );
}

function getProficiencyColor(proficiency) {
  const map = {
    Expert: 'var(--color-success)',
    Proficient: 'var(--color-accent)',
    Developing: 'var(--color-warning)',
    Beginner: 'var(--color-danger)',
    'Not Assessed': 'var(--text-muted)',
  };
  return map[proficiency] || 'var(--text-muted)';
}

export default function ScoreCard({ skillData }) {
  const { skill, score, proficiency, evaluations = [], questionCount } = skillData;
  const color = getProficiencyColor(proficiency);

  // Average evaluations across questions
  const avgEval = evaluations.length > 0
    ? evaluations.reduce(
        (acc, e) => ({
          relevance: acc.relevance + e.relevance / evaluations.length,
          accuracy: acc.accuracy + e.accuracy / evaluations.length,
          depth: acc.depth + e.depth / evaluations.length,
        }),
        { relevance: 0, accuracy: 0, depth: 0 }
      )
    : null;

  return (
    <div className="score-card card">
      <div className="score-card-header">
        <div>
          <h4 className="score-card-skill">{skill}</h4>
          <span className="score-card-count text-muted">{questionCount} question{questionCount !== 1 ? 's' : ''}</span>
        </div>
        <div className="score-card-overall" style={{ color }}>
          <span className="score-card-number">{score.toFixed(1)}</span>
          <span className="score-card-proficiency">{proficiency}</span>
        </div>
      </div>

      {avgEval && (
        <div className="score-card-bars">
          <ScoreBar label="Relevance" value={avgEval.relevance} color="var(--color-primary-light)" />
          <ScoreBar label="Accuracy"  value={avgEval.accuracy}  color="var(--color-accent)" />
          <ScoreBar label="Depth"     value={avgEval.depth}     color="var(--color-warning)" />
        </div>
      )}

      {evaluations.length > 0 && (
        <div className="score-card-feedback">
          <p className="score-card-feedback-label text-muted">Latest feedback</p>
          <p className="score-card-feedback-text">{evaluations[evaluations.length - 1]?.feedback}</p>
        </div>
      )}
    </div>
  );
}
