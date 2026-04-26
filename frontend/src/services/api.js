/**
 * api.js — Axios API wrapper
 * All backend communication goes through here.
 * Centralizes base URL, error handling, and request formatting.
 */

import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 60000, // 60s for AI calls
  headers: { 'Content-Type': 'application/json' },
});

// Response interceptor: unwrap data or throw normalized error
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      'An unexpected error occurred.';

    const normalized = new Error(message);
    normalized.statusCode = error.response?.status;
    normalized.errors = error.response?.data?.errors;
    return Promise.reject(normalized);
  }
);

/** POST /analyze — Extract skills and compute gap analysis */
export const analyzeResume = (resume, jd) =>
  api.post('/analyze', { resume, jd });

/** POST /assessment/start — Begin adaptive assessment */
export const startAssessment = (sessionId) =>
  api.post('/assessment/start', { sessionId });

/** POST /assessment/answer — Submit answer, receive next question */
export const submitAnswer = (sessionId, answer) =>
  api.post('/assessment/answer', { sessionId, answer });

/** GET /results/:sessionId — Retrieve final results + learning plan */
export const getResults = (sessionId) =>
  api.get(`/results/${sessionId}`);

/** GET /health — Backend health check */
export const healthCheck = () =>
  api.get('/health');

export default api;
