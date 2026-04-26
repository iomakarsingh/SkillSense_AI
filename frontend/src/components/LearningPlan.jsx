/* LearningPlan.jsx — Renders the weekly roadmap cards */
import './LearningPlan.css';

const PHASE_COLORS = {
  Foundation: 'var(--color-info)',
  Practice:   'var(--color-accent)',
  Advanced:   'var(--color-primary-light)',
  Project:    'var(--color-success)',
};

const RESOURCE_ICONS = {
  course:        '🎓',
  book:          '📖',
  documentation: '📄',
  project:       '🛠️',
};

function WeekCard({ week: weekData, index }) {
  const { week, focus, phase, topics = [], resources = [], practiceTask, goal } = weekData;
  const phaseColor = PHASE_COLORS[phase] || 'var(--color-primary-light)';

  return (
    <div
      className="week-card card animate-slide-up"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="week-card-header">
        <div className="week-number">
          <span className="week-label">WEEK</span>
          <span className="week-num">{week}</span>
        </div>
        <div className="week-meta">
          <h4 className="week-focus">{focus}</h4>
          <span className="week-phase badge" style={{ color: phaseColor, background: `${phaseColor}18` }}>
            {phase}
          </span>
        </div>
      </div>

      <div className="week-goal">
        <span className="week-section-label">🎯 Goal</span>
        <p>{goal}</p>
      </div>

      <div className="week-topics">
        <span className="week-section-label">📚 Topics</span>
        <ul>
          {topics.map((t, i) => <li key={i}>{t}</li>)}
        </ul>
      </div>

      {resources.length > 0 && (
        <div className="week-resources">
          <span className="week-section-label">🔗 Resources</span>
          <div className="resource-list">
            {resources.map((r, i) => (
              <span key={i} className="resource-chip">
                {RESOURCE_ICONS[r.type] || '🔗'} {r.title}
              </span>
            ))}
          </div>
        </div>
      )}

      {practiceTask && (
        <div className="week-task">
          <span className="week-section-label">⚡ Practice Task</span>
          <p className="week-task-text">{practiceTask}</p>
        </div>
      )}
    </div>
  );
}

export default function LearningPlan({ plan }) {
  if (!plan || !Array.isArray(plan.weeks)) return null;

  return (
    <div className="learning-plan">
      <div className="learning-plan-summary">
        <div className="plan-stat">
          <span className="plan-stat-value">{plan.totalWeeks}</span>
          <span className="plan-stat-label">Weeks</span>
        </div>
        <div className="plan-stat">
          <span className="plan-stat-value">{plan.estimatedHoursPerWeek || 8}h</span>
          <span className="plan-stat-label">Per Week</span>
        </div>
        <div className="plan-stat">
          <span className="plan-stat-value">{plan.weeks.length}</span>
          <span className="plan-stat-label">Milestones</span>
        </div>
      </div>

      {plan.priorityOrder?.length > 0 && (
        <div className="priority-order">
          <span className="week-section-label">Priority Order:</span>
          <div className="priority-pills">
            {plan.priorityOrder.map((s, i) => (
              <span key={i} className="priority-pill">
                <span className="priority-index">{i + 1}</span> {s}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="week-cards">
        {plan.weeks.map((week, i) => (
          <WeekCard key={week.week} week={week} index={i} />
        ))}
      </div>
    </div>
  );
}
