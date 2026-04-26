/**
 * assessmentController.js
 * Handles:
 *   POST /assessment/start  — Initialize and return the first question
 *   POST /assessment/answer — Evaluate answer, update session, return next question
 */

const { validateSessionId, validateAnswerInput } = require('../utils/validator');
const { getSession, getCurrentAssessment, recordAnswer, getQuestionsPerSkill } = require('../utils/sessionStore');
const { generateQuestion, evaluateAnswer } = require('../services/aiService');
const { computeFinalScore } = require('../services/scoringService');

/**
 * POST /assessment/start
 * Body: { sessionId: string }
 */
async function startAssessment(req, res) {
  try {
    validateSessionId(req.body);
    const { sessionId } = req.body;

    const session = getSession(sessionId);

    if (session.skillQueue.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No skills to assess. The candidate may already meet all requirements.',
      });
    }

    if (session.status === 'complete') {
      return res.status(400).json({
        success: false,
        error: 'Assessment already completed. Use GET /results/:sessionId.',
      });
    }

    const currentAssessment = getCurrentAssessment(sessionId);
    const { skill, difficulty, questions } = currentAssessment;

    // Generate first question
    console.log(`[assessmentController] Generating first question for skill: ${skill}`);
    const { question, expectedTopics } = await generateQuestion(skill, difficulty, questions);

    // Store the expected topics in the current assessment for evaluation
    currentAssessment.pendingQuestion = question;
    currentAssessment.pendingTopics = expectedTopics;

    const questionsPerSkill = getQuestionsPerSkill();
    const totalQuestions = session.skillQueue.length * questionsPerSkill;

    return res.status(200).json({
      success: true,
      skill,
      difficulty,
      question,
      questionIndex: 1,
      totalQuestions,
      skillIndex: 1,
      totalSkills: session.skillQueue.length,
    });
  } catch (err) {
    console.error('[assessmentController] startAssessment error:', err.message);
    return res.status(err.statusCode || 500).json({
      success: false,
      error: err.message || 'Failed to start assessment.',
    });
  }
}

/**
 * POST /assessment/answer
 * Body: { sessionId: string, answer: string }
 */
async function submitAnswer(req, res) {
  try {
    validateAnswerInput(req.body);
    const { sessionId, answer } = req.body;

    const session = getSession(sessionId);

    if (session.status === 'complete') {
      return res.status(400).json({
        success: false,
        error: 'Assessment already completed.',
      });
    }

    const currentAssessment = getCurrentAssessment(sessionId);
    const { skill, pendingQuestion, pendingTopics } = currentAssessment;

    if (!pendingQuestion) {
      return res.status(400).json({
        success: false,
        error: 'No active question. Call POST /assessment/start first.',
      });
    }

    // 1. AI: evaluate the answer
    console.log(`[assessmentController] Evaluating answer for skill: ${skill}`);
    const evaluation = await evaluateAnswer(skill, pendingQuestion, pendingTopics || [], answer);

    // 2. Compute final score (backend math — no AI)
    const finalScore = computeFinalScore(evaluation);

    // 3. Record in session + get next state
    const { done, nextSkill, nextDifficulty } = recordAnswer(
      sessionId,
      pendingQuestion,
      answer,
      evaluation,
      finalScore
    );

    const responseBase = {
      success: true,
      evaluation,
      score: finalScore,
      done,
    };

    if (done) {
      return res.status(200).json({
        ...responseBase,
        message: 'Assessment complete. Retrieve results via GET /results/:sessionId.',
      });
    }

    // Generate next question
    const updatedSession = getSession(sessionId);
    const nextAssessment = updatedSession.assessments[updatedSession.currentSkillIdx];
    const targetSkill = nextSkill || nextAssessment.skill;
    const targetDifficulty = nextSkill ? 'easy' : nextDifficulty;

    console.log(`[assessmentController] Generating next question for skill: ${targetSkill}, difficulty: ${targetDifficulty}`);
    const { question: nextQuestion, expectedTopics: nextTopics } =
      await generateQuestion(targetSkill, targetDifficulty, nextAssessment.questions);

    // Store pending question on the (potentially updated) assessment
    nextAssessment.pendingQuestion = nextQuestion;
    nextAssessment.pendingTopics = nextTopics;

    const questionsPerSkill = getQuestionsPerSkill();
    const totalQuestions = updatedSession.skillQueue.length * questionsPerSkill;
    const answeredSoFar = updatedSession.assessments.reduce((sum, a) => sum + a.answers.length, 0);

    return res.status(200).json({
      ...responseBase,
      nextQuestion,
      skill: targetSkill,
      difficulty: targetDifficulty,
      questionIndex: answeredSoFar + 1,
      totalQuestions,
      skillIndex: updatedSession.currentSkillIdx + 1,
      totalSkills: updatedSession.skillQueue.length,
      skillChanged: !!nextSkill,
    });
  } catch (err) {
    console.error('[assessmentController] submitAnswer error:', err.message);
    return res.status(err.statusCode || 500).json({
      success: false,
      error: err.message || 'Failed to process answer.',
    });
  }
}

module.exports = { startAssessment, submitAnswer };
