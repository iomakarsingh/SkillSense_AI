/**
 * analyzeController.js
 * Handles POST /analyze
 * Thin orchestration layer: validates → calls services → returns response.
 */

const { v4: uuidv4 } = require('uuid');
const { validateAnalyzeInput } = require('../utils/validator');
const { analyzeGap } = require('../services/parsingService');
const { extractSkills } = require('../services/aiService');
const { createSession } = require('../utils/sessionStore');

/**
 * POST /analyze
 * Body: { resume: string, jd: string }
 */
async function analyze(req, res) {
  try {
    // 1. Validate input
    validateAnalyzeInput(req.body);
    const { resume, jd } = req.body;

    // 2. AI: extract raw skill lists with proficiency (JSON-validated inside aiService)
    console.log('[analyzeController] Extracting skills via AI...');
    const { resumeSkills: rawResume, jdSkills: rawJD } = await extractSkills(resume, jd);

    // 3. Run gap analysis — pure JS (fuzzy match + taxonomy + weighted score)
    const gap = analyzeGap(rawResume, rawJD);

    // 4. Create session for assessment phase
    const sessionId = uuidv4();
    createSession(sessionId, gap);

    console.log(`[analyzeController] Session ${sessionId} created. Match: ${gap.matchPercentage}%`);

    return res.status(200).json({
      success: true,
      sessionId,
      matchPercentage: gap.matchPercentage,
      strongSkills:    gap.strongSkills,
      mediumSkills:    gap.mediumSkills,
      weakSkills:      gap.weakSkills,
      missingSkills:   gap.missingSkills,
      skillMatrix:     gap.skillMatrix,
      resumeSkillCount: gap.resumeSkillCount,
      jdSkillCount:    gap.jdSkillCount,
    });
  } catch (err) {
    console.error('[analyzeController] Error:', err.message);
    return res.status(err.statusCode || 500).json({
      success: false,
      error: err.message || 'Analysis failed. Please try again.',
      ...(err.errors && { errors: err.errors }),
    });
  }
}

module.exports = { analyze };
