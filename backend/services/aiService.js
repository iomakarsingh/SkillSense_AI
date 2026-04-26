/**
 * aiService.js
 * Single source of truth for ALL LLM interactions.
 * Uses Groq (llama-3.1-70b-versatile) via the official groq-sdk.
 *
 * STRICT CONTRACT:
 *   - Every method returns a validated JavaScript object (never raw strings).
 *   - JSON parsing + validation is handled here, not in callers.
 *   - All calls are wrapped with retryWrapper for transient failures.
 */

require('dotenv').config();
const Groq = require('groq-sdk');
const { withRetry } = require('../utils/retryWrapper');
const { parseAndValidateJSON } = require('../utils/validator');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const MODEL = 'llama-3.3-70b-versatile';

/**
 * Internal helper: call Groq chat completions with a system + user prompt.
 * @param {string} systemPrompt
 * @param {string} userPrompt
 * @param {number} maxTokens
 * @returns {Promise<string>} Raw completion text
 */
async function callGroq(systemPrompt, userPrompt, maxTokens = 1024) {
  const completion = await groq.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    max_tokens: maxTokens,
    temperature: 0.2, // Low temperature for deterministic JSON output
  });

  return completion.choices[0]?.message?.content?.trim() || '';
}

// ─── PROMPT TEMPLATES ─────────────────────────────────────────────────────────

const PROMPTS = {
  extractSkills: (resume, jd) => ({
    system: `You are a precise skill extraction engine for technical job matching.
Your ONLY output must be a single valid JSON object.
No explanations. No markdown. No code fences. Pure JSON only.`,
    user: `Extract all technical skills from the resume and job description below.

Return EXACTLY this JSON structure:
{
  "resumeSkills": [
    {"name": "JavaScript", "proficiency": "expert"},
    {"name": "Docker",     "proficiency": "beginner"}
  ],
  "jdSkills": ["skill1", "skill2"]
}

Proficiency levels for resumeSkills (pick the most accurate):
  "expert"       — used extensively, multiple years, deep knowledge
  "intermediate" — used regularly, comfortable with most features
  "beginner"     — mentioned but limited, basic exposure only

Rules:
- Include only concrete technical skills (languages, frameworks, tools, platforms, methodologies)
- Exclude soft skills (communication, teamwork, leadership)
- jdSkills: flat string array of required skills from the job description
- Deduplicate within each list
- Use canonical names (e.g. "JavaScript" not "js", "Node.js" not "nodejs")

RESUME:
${resume}

JOB DESCRIPTION:
${jd}`,
  }),

  generateQuestion: (skill, difficulty, history) => ({
    system: `You are an expert technical interviewer generating assessment questions.
Your ONLY output must be a single valid JSON object.
No explanations. No markdown. No code fences. Pure JSON only.`,
    user: `Generate ONE ${difficulty}-level technical interview question for the skill: "${skill}".

${history.length > 0 ? `Previously asked questions (do NOT repeat these):\n${history.map((q, i) => `${i + 1}. ${q}`).join('\n')}` : ''}

Return EXACTLY this JSON structure:
{
  "question": "The interview question text here",
  "expectedTopics": ["topic1", "topic2", "topic3"]
}

Difficulty guidelines:
- easy: definition, basic concept, simple use case
- medium: comparison, practical application, common patterns
- hard: edge cases, internals, optimization, architectural decisions

The question must be specific, answerable in 2-4 sentences, and directly test "${skill}".`,
  }),

  evaluateAnswer: (skill, question, expectedTopics, answer) => ({
    system: `You are a strict, fair technical answer evaluator.
Your ONLY output must be a single valid JSON object.
No explanations. No markdown. No code fences. Pure JSON only.`,
    user: `Evaluate the candidate's answer to this technical question.

Skill being assessed: "${skill}"
Question: "${question}"
Expected topics to cover: ${JSON.stringify(expectedTopics)}
Candidate's answer: "${answer}"

Score each dimension from 0 to 10:
- relevance: Does the answer address what was asked? (0=completely off-topic, 10=precisely on-point)
- accuracy: Are the technical facts correct? (0=entirely wrong, 10=completely accurate)
- depth: How thoroughly did they explain? (0=no explanation, 10=comprehensive with examples)

Return EXACTLY this JSON structure:
{
  "relevance": <integer 0-10>,
  "accuracy": <integer 0-10>,
  "depth": <integer 0-10>,
  "feedback": "<One concise sentence of constructive feedback>"
}

Be strict but fair. A score of 8+ requires demonstrably strong knowledge.`,
  }),

  generateLearningPlan: (gaps, skillScores, matchPercentage) => ({
    system: `You are a senior learning architect creating personalized technical learning roadmaps.
Your ONLY output must be a single valid JSON object.
No explanations. No markdown. No code fences. Pure JSON only.`,
    user: `Create a personalized weekly learning roadmap based on this candidate's assessment results.

Job match percentage: ${matchPercentage}%
Skill gaps (missing skills): ${JSON.stringify(gaps.missingSkills)}
Weak skills: ${JSON.stringify(gaps.weakSkills)}
Assessment scores per skill: ${JSON.stringify(skillScores.map(s => ({ skill: s.skill, score: s.score, proficiency: s.proficiency })))}

Rules:
- Prioritize the most impactful skills first (high-value missing skills)
- Be realistic: 1-2 skills per week maximum
- Include specific, actionable resources (not just "read documentation")
- total weeks should be between 6 and 16 depending on gap severity
- Each week must have clear, measurable goals

Return EXACTLY this JSON structure:
{
  "totalWeeks": <number>,
  "estimatedHoursPerWeek": <number>,
  "priorityOrder": ["skill1", "skill2"],
  "weeks": [
    {
      "week": 1,
      "focus": "skill name",
      "phase": "Foundation | Practice | Advanced | Project",
      "topics": ["specific topic 1", "specific topic 2", "specific topic 3"],
      "resources": [
        {"type": "course|book|documentation|project", "title": "resource name", "url": "url or 'search on YouTube/Udemy'"}
      ],
      "practiceTask": "Specific hands-on task to complete this week",
      "goal": "What you will be able to do by end of this week"
    }
  ]
}`,
  }),
};

// ─── PUBLIC API ────────────────────────────────────────────────────────────────

/**
 * Extract technical skills from resume and JD text.
 * @param {string} resume
 * @param {string} jd
 * @returns {Promise<{ resumeSkills: Array<{name:string,proficiency:string}>, jdSkills: string[] }>}
 */
async function extractSkills(resume, jd) {
  return withRetry(async () => {
    const { system, user } = PROMPTS.extractSkills(resume, jd);
    const raw = await callGroq(system, user, 1024);
    const parsed = parseAndValidateJSON(raw);

    if (!Array.isArray(parsed.resumeSkills) || !Array.isArray(parsed.jdSkills)) {
      throw new Error('AI skill extraction returned unexpected schema');
    }

    // Normalize: resumeSkills may come back as strings (graceful fallback)
    parsed.resumeSkills = parsed.resumeSkills.map((s) =>
      typeof s === 'string' ? { name: s, proficiency: 'intermediate' } : s
    );

    return parsed;
  });
}

/**
 * Generate a single technical question for a skill.
 * @param {string}   skill
 * @param {string}   difficulty   'easy' | 'medium' | 'hard'
 * @param {string[]} history      Previously asked questions
 * @returns {Promise<{ question: string, expectedTopics: string[] }>}
 */
async function generateQuestion(skill, difficulty, history = []) {
  return withRetry(async () => {
    const { system, user } = PROMPTS.generateQuestion(skill, difficulty, history);
    const raw = await callGroq(system, user, 512);
    const parsed = parseAndValidateJSON(raw);

    if (typeof parsed.question !== 'string' || !Array.isArray(parsed.expectedTopics)) {
      throw new Error('AI question generation returned unexpected schema');
    }

    return parsed;
  });
}

/**
 * Evaluate a candidate's answer to a technical question.
 * @param {string}   skill
 * @param {string}   question
 * @param {string[]} expectedTopics
 * @param {string}   answer
 * @returns {Promise<{ relevance: number, accuracy: number, depth: number, feedback: string }>}
 */
async function evaluateAnswer(skill, question, expectedTopics, answer) {
  return withRetry(async () => {
    const { system, user } = PROMPTS.evaluateAnswer(skill, question, expectedTopics, answer);
    const raw = await callGroq(system, user, 512);
    const parsed = parseAndValidateJSON(raw);

    const { relevance, accuracy, depth, feedback } = parsed;

    // Validate all fields are present and numeric
    if (
      typeof relevance !== 'number' ||
      typeof accuracy !== 'number' ||
      typeof depth !== 'number' ||
      typeof feedback !== 'string'
    ) {
      throw new Error('AI evaluation returned unexpected schema');
    }

    // Clamp all scores to 0-10
    return {
      relevance: Math.max(0, Math.min(10, relevance)),
      accuracy: Math.max(0, Math.min(10, accuracy)),
      depth: Math.max(0, Math.min(10, depth)),
      feedback,
    };
  });
}

/**
 * Generate a personalized weekly learning plan.
 * @param {Object}   gaps          - { missingSkills, weakSkills }
 * @param {Object[]} skillScores   - Per-skill score objects
 * @param {number}   matchPercentage
 * @returns {Promise<Object>} Structured learning plan
 */
async function generateLearningPlan(gaps, skillScores, matchPercentage) {
  return withRetry(async () => {
    const { system, user } = PROMPTS.generateLearningPlan(gaps, skillScores, matchPercentage);
    const raw = await callGroq(system, user, 2048);
    const parsed = parseAndValidateJSON(raw);

    if (!Array.isArray(parsed.weeks) || typeof parsed.totalWeeks !== 'number') {
      throw new Error('AI learning plan returned unexpected schema');
    }

    return parsed;
  });
}

module.exports = {
  extractSkills,
  generateQuestion,
  evaluateAnswer,
  generateLearningPlan,
};
