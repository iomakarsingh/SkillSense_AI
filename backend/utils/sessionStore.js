/**
 * sessionStore.js
 * In-memory session management using a Map.
 * Each session tracks the full assessment lifecycle:
 *   skills to test, current index, question history, per-skill scores.
 * Swap Map for a Redis/MongoDB adapter without changing the interface.
 */

/** @type {Map<string, SessionObject>} */
const sessions = new Map();

/**
 * @typedef {Object} SkillAssessment
 * @property {string}   skill         - Skill being tested
 * @property {string}   level         - 'weak' | 'missing'
 * @property {string[]} questions     - Questions asked so far
 * @property {string[]} answers       - Answers given
 * @property {Object[]} evaluations   - {relevance, accuracy, depth, feedback}
 * @property {number[]} scores        - Computed final scores per question
 * @property {string}   difficulty    - Current difficulty: 'easy'|'medium'|'hard'
 */

/**
 * @typedef {Object} SessionObject
 * @property {string}           id
 * @property {string}           status          - 'analysis'|'assessment'|'complete'
 * @property {Object}           analysisResult  - Gap analysis output
 * @property {string[]}         skillQueue      - Ordered list of skills to assess
 * @property {number}           currentSkillIdx
 * @property {number}           currentQuestionIdx
 * @property {SkillAssessment[]} assessments
 * @property {number}           createdAt
 */

/**
 * Create a new session with analysis data.
 * @param {string} id
 * @param {Object} analysisResult
 * @returns {SessionObject}
 */
const QUESTIONS_PER_SKILL = 2; // 5 skills × 2 = 10 questions total
const MAX_SKILLS          = 5;

function createSession(id, analysisResult) {
  const skillQueue = [
    ...analysisResult.missingSkills.slice(0, 3),
    ...analysisResult.weakSkills.slice(0, 2),
  ].filter(Boolean).slice(0, MAX_SKILLS);

  const session = {
    id,
    status: 'assessment',
    analysisResult,
    skillQueue,
    currentSkillIdx: 0,
    currentQuestionIdx: 0,
    assessments: skillQueue.map((skill) => ({
      skill,
      level: analysisResult.missingSkills.includes(skill) ? 'missing' : 'weak',
      questions: [],
      answers: [],
      evaluations: [],
      scores: [],
      difficulty: 'easy',
    })),
    createdAt: Date.now(),
  };

  sessions.set(id, session);
  return session;
}

/**
 * Retrieve a session by ID. Throws if not found.
 * @param {string} id
 * @returns {SessionObject}
 */
function getSession(id) {
  const session = sessions.get(id);
  if (!session) {
    const err = new Error(`Session not found: ${id}`);
    err.statusCode = 404;
    throw err;
  }
  return session;
}

/**
 * Update a session in place.
 * @param {string} id
 * @param {Partial<SessionObject>} updates
 * @returns {SessionObject}
 */
function updateSession(id, updates) {
  const session = getSession(id);
  Object.assign(session, updates);
  sessions.set(id, session);
  return session;
}

/**
 * Get the current SkillAssessment being conducted.
 * @param {string} id
 * @returns {SkillAssessment|null}
 */
function getCurrentAssessment(id) {
  const session = getSession(id);
  return session.assessments[session.currentSkillIdx] || null;
}

/**
 * Record question + answer + evaluation for the current skill.
 * Advances question/skill pointers automatically.
 * @param {string} id
 * @param {string} question
 * @param {string} answer
 * @param {Object} evaluation  - {relevance, accuracy, depth, feedback}
 * @param {number} finalScore
 * @returns {{ done: boolean, nextSkill: string|null, nextDifficulty: string }}
 */
function recordAnswer(id, question, answer, evaluation, finalScore) {
  const session = getSession(id);
  const assessment = session.assessments[session.currentSkillIdx];

  assessment.questions.push(question);
  assessment.answers.push(answer);
  assessment.evaluations.push(evaluation);
  assessment.scores.push(finalScore);

  // Adaptive difficulty
  let nextDifficulty = assessment.difficulty;
  if (finalScore >= 7) {
    nextDifficulty = assessment.difficulty === 'easy' ? 'medium'
      : assessment.difficulty === 'medium' ? 'hard' : 'hard';
  } else if (finalScore < 4) {
    nextDifficulty = assessment.difficulty === 'hard' ? 'medium'
      : assessment.difficulty === 'medium' ? 'easy' : 'easy';
  }
  assessment.difficulty = nextDifficulty;

  // Max QUESTIONS_PER_SKILL questions per skill, then move to next
  session.currentQuestionIdx += 1;
  let done = false;
  let nextSkill = null;

  if (session.currentQuestionIdx >= QUESTIONS_PER_SKILL) {
    session.currentSkillIdx += 1;
    session.currentQuestionIdx = 0;

    if (session.currentSkillIdx >= session.skillQueue.length) {
      session.status = 'complete';
      done = true;
    } else {
      nextSkill = session.skillQueue[session.currentSkillIdx];
      // Reset difficulty for new skill
      session.assessments[session.currentSkillIdx].difficulty = 'easy';
    }
  }

  sessions.set(id, session);
  return { done, nextSkill, nextDifficulty, questionsPerSkill: QUESTIONS_PER_SKILL };
}

/** Expose constant so controllers can compute totalQuestions */
const getQuestionsPerSkill = () => QUESTIONS_PER_SKILL;

/**
 * Delete a session (cleanup).
 * @param {string} id
 */
function deleteSession(id) {
  sessions.delete(id);
}

module.exports = {
  createSession,
  getSession,
  updateSession,
  getCurrentAssessment,
  recordAnswer,
  deleteSession,
  getQuestionsPerSkill,
};
