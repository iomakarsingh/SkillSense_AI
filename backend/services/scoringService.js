/**
 * scoringService.js
 * Pure mathematics — no IO, no AI, no external dependencies.
 * All score computation lives here and is fully testable.
 */

const WEIGHTS = {
  relevance: 0.4,
  accuracy: 0.3,
  depth: 0.3,
};

/**
 * Compute the final weighted score for a single answer evaluation.
 *
 * Formula: (relevance × 0.4) + (accuracy × 0.3) + (depth × 0.3)
 *
 * @param {{ relevance: number, accuracy: number, depth: number }} evaluation
 * @returns {number} Score rounded to 2 decimal places (0–10)
 */
function computeFinalScore({ relevance, accuracy, depth }) {
  const score =
    relevance * WEIGHTS.relevance +
    accuracy * WEIGHTS.accuracy +
    depth * WEIGHTS.depth;

  return Math.round(score * 100) / 100; // 2 decimal precision
}

/**
 * Compute a skill-level aggregate score (average across all questions asked).
 * @param {number[]} scores - Array of per-question scores
 * @returns {number}
 */
function computeSkillScore(scores) {
  if (!scores || scores.length === 0) return 0;
  const sum = scores.reduce((acc, s) => acc + s, 0);
  return Math.round((sum / scores.length) * 100) / 100;
}

/**
 * Map a numeric score to a proficiency label.
 * @param {number} score
 * @returns {'Expert' | 'Proficient' | 'Developing' | 'Beginner' | 'Not Assessed'}
 */
function scoreToProficiency(score) {
  if (score >= 8.5) return 'Expert';
  if (score >= 7.0) return 'Proficient';
  if (score >= 5.0) return 'Developing';
  if (score >= 0.1) return 'Beginner';
  return 'Not Assessed';
}

/**
 * Aggregate all skill assessments from a completed session into
 * a final results object.
 *
 * @param {Object} session - Full SessionObject from sessionStore
 * @returns {{
 *   overallScore: number,
 *   skillScores: Array<{skill, score, proficiency, questionCount, evaluations}>,
 *   totalQuestionsAnswered: number,
 *   assessmentSummary: string
 * }}
 */
function aggregateResults(session) {
  const { assessments, analysisResult } = session;

  const skillScores = assessments.map((assessment) => {
    const score = computeSkillScore(assessment.scores);
    return {
      skill: assessment.skill,
      level: assessment.level,
      score,
      proficiency: scoreToProficiency(score),
      questionCount: assessment.questions.length,
      evaluations: assessment.evaluations,
      questions: assessment.questions,
      answers: assessment.answers,
    };
  });

  const totalQuestionsAnswered = assessments.reduce(
    (sum, a) => sum + a.answers.length,
    0
  );

  // Overall score: weighted average (missing skills penalized more)
  let weightedSum = 0;
  let weightTotal = 0;

  for (const s of skillScores) {
    const weight = s.level === 'missing' ? 1.5 : 1.0;
    weightedSum += s.score * weight;
    weightTotal += weight;
  }

  const overallScore = weightTotal > 0
    ? Math.round((weightedSum / weightTotal) * 100) / 100
    : 0;

  const assessmentSummary = generateAssessmentSummary(overallScore, analysisResult.matchPercentage);

  return {
    overallScore,
    skillScores,
    totalQuestionsAnswered,
    assessmentSummary,
  };
}

/**
 * Generate a plain-text summary of the assessment outcome.
 * @param {number} overallScore
 * @param {number} matchPercentage
 * @returns {string}
 */
function generateAssessmentSummary(overallScore, matchPercentage) {
  const combined = (overallScore * 10 + matchPercentage) / 2;

  if (combined >= 75) {
    return 'Strong candidate. You demonstrate solid alignment with the role requirements and performed well in the technical assessment.';
  } else if (combined >= 55) {
    return 'Good foundation. You have several key skills but there are specific areas to develop to be fully job-ready.';
  } else if (combined >= 35) {
    return 'Developing profile. Significant skill gaps exist, but with a structured learning plan you can bridge them in a few months.';
  }
  return 'Early stage. This role has substantial requirements beyond your current profile. The learning plan below provides a clear path forward.';
}

module.exports = {
  computeFinalScore,
  computeSkillScore,
  scoreToProficiency,
  aggregateResults,
  generateAssessmentSummary,
  WEIGHTS,
};
