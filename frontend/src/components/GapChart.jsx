/* GapChart.jsx — Visual bar chart of skill alignment */
import './GapChart.css';

const STATUS_CONFIG = {
  Strong:  { color: 'var(--color-success)',  bar: 100, label: 'Strong Match' },
  Medium:  { color: 'var(--color-warning)',  bar: 65,  label: 'Partial Match' },
  Weak:    { color: 'var(--color-danger)',   bar: 35,  label: 'Weak Match' },
  Missing: { color: 'var(--text-muted)',     bar: 0,   label: 'Missing' },
};

function GapRow({ skill, status, strength, index }) {
  const config = STATUS_CONFIG[strength] || STATUS_CONFIG.Missing;

  return (
    <div
      className="gap-row"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="gap-row-meta">
        <span className="gap-row-skill">{skill}</span>
        <span className="gap-row-label" style={{ color: config.color }}>
          {config.label}
        </span>
      </div>
      <div className="gap-bar-track">
        <div
          className="gap-bar-fill"
          style={{
            width: `${config.bar}%`,
            background: config.color,
          }}
        />
      </div>
    </div>
  );
}

export default function GapChart({ skillMatrix = [] }) {
  if (!skillMatrix.length) return null;

  const sorted = [...skillMatrix].sort((a, b) => {
    const order = { Strong: 0, Medium: 1, Weak: 2, Missing: 3 };
    return (order[a.strength] ?? 4) - (order[b.strength] ?? 4);
  });

  return (
    <div className="gap-chart card">
      <div className="gap-chart-header">
        <h3>Skill Alignment</h3>
        <div className="gap-legend">
          {Object.entries(STATUS_CONFIG).map(([key, val]) => (
            <span key={key} className="gap-legend-item">
              <span className="gap-legend-dot" style={{ background: val.color }} />
              {key}
            </span>
          ))}
        </div>
      </div>
      <div className="gap-rows">
        {sorted.map((item, i) => (
          <GapRow key={item.skill} {...item} index={i} />
        ))}
      </div>
    </div>
  );
}
