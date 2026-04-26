/**
 * validator.js
 * Input validation helpers. All functions throw structured errors
 * with a .statusCode property for consistent HTTP error responses.
 */

const MIN_RESUME_LENGTH = 50;
const MIN_JD_LENGTH = 30;

/**
 * Validate resume + job description inputs.
 * @param {Object} body
 * @param {string} body.resume
 * @param {string} body.jd
 * @throws {Error} Structured validation error
 */
function validateAnalyzeInput({ resume, jd }) {
  const errors = [];

  if (!resume || typeof resume !== 'string' || resume.trim().length === 0) {
    errors.push('Resume is required.');
  } else if (resume.trim().length < MIN_RESUME_LENGTH) {
    errors.push(`Resume must be at least ${MIN_RESUME_LENGTH} characters.`);
  }

  if (!jd || typeof jd !== 'string' || jd.trim().length === 0) {
    errors.push('Job description is required.');
  } else if (jd.trim().length < MIN_JD_LENGTH) {
    errors.push(`Job description must be at least ${MIN_JD_LENGTH} characters.`);
  }

  if (errors.length > 0) {
    const err = new Error(errors.join(' '));
    err.statusCode = 400;
    err.errors = errors;
    throw err;
  }
}

/**
 * Validate that sessionId is present in the request body.
 * @param {Object} body
 * @param {string} body.sessionId
 */
function validateSessionId({ sessionId }) {
  if (!sessionId || typeof sessionId !== 'string' || sessionId.trim().length === 0) {
    const err = new Error('sessionId is required.');
    err.statusCode = 400;
    throw err;
  }
}

/**
 * Validate assessment answer submission.
 * @param {Object} body
 * @param {string} body.sessionId
 * @param {string} body.answer
 */
function validateAnswerInput({ sessionId, answer }) {
  validateSessionId({ sessionId });

  if (!answer || typeof answer !== 'string' || answer.trim().length === 0) {
    const err = new Error('Answer cannot be empty.');
    err.statusCode = 400;
    throw err;
  }
}

/**
 * Validate and parse JSON safely from an AI response string.
 * Strips markdown code fences if present.
 * @param {string} rawText
 * @returns {Object}
 * @throws {Error} If the text cannot be parsed as JSON
 */
function parseAndValidateJSON(rawText) {
  // Strip markdown code fences: ```json ... ``` or ``` ... ```
  const stripped = rawText
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/, '')
    .trim();

  try {
    return JSON.parse(stripped);
  } catch {
    const err = new Error(`AI returned invalid JSON: ${stripped.substring(0, 200)}`);
    err.statusCode = 502;
    throw err;
  }
}

module.exports = {
  validateAnalyzeInput,
  validateSessionId,
  validateAnswerInput,
  parseAndValidateJSON,
};
