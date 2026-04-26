/**
 * app.js — Express application entry point
 * Sets up middleware, mounts routes, and starts the server.
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');

const analyzeRoutes = require('./routes/analyze');
const assessmentRoutes = require('./routes/assessment');
const resultsRoutes = require('./routes/results');

const app = express();
const PORT = process.env.PORT || 5000;

// ─── MIDDLEWARE ────────────────────────────────────────────────────────────────

app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL
    : (origin, callback) => {
        // Allow any localhost/127.0.0.1 origin in development
        if (!origin || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
}));

app.use(express.json({ limit: '50kb' }));
app.use(express.urlencoded({ extended: true }));

// Request logger (development only)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });
}

// ─── ROUTES ───────────────────────────────────────────────────────────────────

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

app.use('/analyze', analyzeRoutes);
app.use('/assessment', assessmentRoutes);
app.use('/results', resultsRoutes);

// ─── ERROR HANDLER ─────────────────────────────────────────────────────────────

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Route not found.' });
});

// Global error handler
app.use((err, _req, res, _next) => {
  console.error('[GlobalErrorHandler]', err);
  res.status(err.statusCode || 500).json({
    success: false,
    error: err.message || 'Internal server error.',
  });
});

// ─── START ────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`\n🚀 AI Skill Assessment API running on http://localhost:${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/health`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}\n`);

  if (!process.env.GROQ_API_KEY) {
    console.warn('⚠️  WARNING: GROQ_API_KEY is not set in .env — AI features will fail!\n');
  }
});

module.exports = app;
