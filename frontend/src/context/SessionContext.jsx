/**
 * SessionContext.jsx
 * Global state management for the assessment session lifecycle.
 * Tracks: sessionId, analysis results, assessment progress, final results.
 */

import { createContext, useContext, useReducer, useCallback } from 'react';

const SessionContext = createContext(null);

const initialState = {
  sessionId: null,
  phase: 'idle',          // 'idle' | 'analyzing' | 'analyzed' | 'assessing' | 'complete'
  analysisResult: null,
  currentQuestion: null,
  currentSkill: null,
  currentDifficulty: 'easy',
  questionIndex: 0,
  totalQuestions: 0,
  skillIndex: 0,
  totalSkills: 0,
  conversationHistory: [], // [{type: 'question'|'answer'|'feedback', content, meta}]
  finalResults: null,
  error: null,
  loading: false,
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload, error: null };

    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };

    case 'ANALYSIS_COMPLETE':
      return {
        ...state,
        sessionId: action.payload.sessionId,
        analysisResult: action.payload,
        phase: 'analyzed',
        loading: false,
        error: null,
      };

    case 'ASSESSMENT_STARTED':
      return {
        ...state,
        phase: 'assessing',
        currentQuestion: action.payload.question,
        currentSkill: action.payload.skill,
        currentDifficulty: action.payload.difficulty,
        questionIndex: action.payload.questionIndex,
        totalQuestions: action.payload.totalQuestions,
        skillIndex: action.payload.skillIndex,
        totalSkills: action.payload.totalSkills,
        conversationHistory: [
          {
            type: 'question',
            content: action.payload.question,
            skill: action.payload.skill,
            difficulty: action.payload.difficulty,
          },
        ],
        loading: false,
        error: null,
      };

    case 'ANSWER_SUBMITTED': {
      const { evaluation, score, nextQuestion, skill, difficulty,
              questionIndex, totalQuestions, skillIndex, totalSkills,
              done, skillChanged } = action.payload;

      const newHistory = [
        ...state.conversationHistory,
        {
          type: 'feedback',
          score,
          evaluation,
        },
      ];

      if (!done && nextQuestion) {
        newHistory.push({
          type: 'question',
          content: nextQuestion,
          skill,
          difficulty,
          isNewSkill: skillChanged,
        });
      }

      return {
        ...state,
        phase: done ? 'complete' : 'assessing',
        currentQuestion: done ? null : nextQuestion,
        currentSkill: done ? null : skill,
        currentDifficulty: done ? null : difficulty,
        questionIndex: done ? state.totalQuestions : questionIndex,
        totalQuestions: done ? state.totalQuestions : totalQuestions,
        skillIndex: done ? state.totalSkills : skillIndex,
        totalSkills: done ? state.totalSkills : totalSkills,
        conversationHistory: newHistory,
        loading: false,
        error: null,
      };
    }

    case 'RESULTS_LOADED':
      return {
        ...state,
        finalResults: action.payload,
        phase: 'complete',
        loading: false,
        error: null,
      };

    case 'RESET':
      return { ...initialState };

    default:
      return state;
  }
}

export function SessionProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const setLoading = useCallback((loading) =>
    dispatch({ type: 'SET_LOADING', payload: loading }), []);

  const setError = useCallback((error) =>
    dispatch({ type: 'SET_ERROR', payload: error }), []);

  const reset = useCallback(() => dispatch({ type: 'RESET' }), []);

  return (
    <SessionContext.Provider value={{ state, dispatch, setLoading, setError, reset }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within SessionProvider');
  return ctx;
}
