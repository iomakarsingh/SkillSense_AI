/* SkillBadge.jsx — Colored chip for skill strength classification */
import './SkillBadge.css';

const STRENGTH_MAP = {
  Strong:  { className: 'badge-strong',  dot: '●', label: 'Strong' },
  Medium:  { className: 'badge-medium',  dot: '●', label: 'Medium' },
  Weak:    { className: 'badge-weak',    dot: '●', label: 'Weak' },
  Missing: { className: 'badge-missing', dot: '○', label: 'Missing' },
};

export default function SkillBadge({ skill, strength, showStrength = false }) {
  const config = STRENGTH_MAP[strength] || STRENGTH_MAP.Missing;

  return (
    <span className={`skill-badge badge ${config.className}`}>
      <span className="skill-dot">{config.dot}</span>
      {skill}
      {showStrength && <span className="skill-strength-label">· {config.label}</span>}
    </span>
  );
}
