/**
 * resultsController.js
 * Handles GET /results/:sessionId
 * Aggregates scores and generates the learning plan.
 */

const { getSession } = require('../utils/sessionStore');
const { aggregateResults } = require('../services/scoringService');
const { generateLearningPlan } = require('../services/aiService');

/**
 * GET /results/:sessionId
 */
async function getResults(req, res) {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({ success: false, error: 'sessionId is required.' });
    }

    const session = getSession(sessionId);

    if (session.status !== 'complete') {
      return res.status(400).json({
        success: false,
        error: 'Assessment is not yet complete.',
        currentStatus: session.status,
      });
    }

    // 1. Aggregate scores (pure JS)
    console.log(`[resultsController] Aggregating results for session: ${sessionId}`);
    const aggregated = aggregateResults(session);

    // 2. Generate learning plan via AI
    console.log(`[resultsController] Generating learning plan...`);
    const learningPlan = await generateLearningPlan(
      {
        missingSkills: session.analysisResult.missingSkills,
        weakSkills: session.analysisResult.weakSkills,
      },
      aggregated.skillScores,
      session.analysisResult.matchPercentage
    );

    return res.status(200).json({
      success: true,
      sessionId,
      matchPercentage: session.analysisResult.matchPercentage,
      strongSkills: session.analysisResult.strongSkills,
      weakSkills: session.analysisResult.weakSkills,
      missingSkills: session.analysisResult.missingSkills,
      skillMatrix: session.analysisResult.skillMatrix,
      ...aggregated,
      learningPlan,
    });
  } catch (err) {
    console.error('[resultsController] Error:', err.message);
    return res.status(err.statusCode || 500).json({
      success: false,
      error: err.message || 'Failed to retrieve results.',
    });
  }
}

module.exports = { getResults };
