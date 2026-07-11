import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';
import contactsRoutes from './routes/contacts.js';
import dealsRoutes from './routes/deals.js';
import activitiesRoutes from './routes/activities.js';
import notesRoutes from './routes/notes.js';
import dashboardRoutes from './routes/dashboard.js';
import tasksRoutes from './routes/tasks.js';
import pipelineStagesRoutes from './routes/pipelineStages.js';
import quotasRoutes from './routes/quotas.js';
import leaderboardRoutes from './routes/leaderboard.js';
import reportsRoutes from './routes/reports.js';
import forecastRoutes from './routes/forecast.js';
import searchRoutes from './routes/search.js';
import tagsRoutes from './routes/tags.js';
import customFieldsRoutes from './routes/customFields.js';
import leadSourcesRoutes from './routes/leadSources.js';
import attachmentsRoutes from './routes/attachments.js';
import auditLogsRoutes from './routes/auditLogs.js';
import teamsRoutes from './routes/teams.js';
import territoriesRoutes from './routes/territories.js';
import onboardingRoutes from './routes/onboarding.js';
import prisma from './utils/prisma.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5174',
  // Extra production origins, comma-separated (only needed if the frontend is
  // ever hosted on a different domain than this API).
  ...(process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map((origin) => origin.trim()).filter(Boolean)
    : []),
];

app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: '10mb' }));

app.get('/api/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', database: 'connected', timestamp: new Date().toISOString() });
  } catch {
    res.status(503).json({
      status: 'degraded',
      database: 'disconnected',
      message: 'Run npm run setup:db from the project root to configure PostgreSQL',
      timestamp: new Date().toISOString(),
    });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/contacts', contactsRoutes);
app.use('/api/deals', dealsRoutes);
app.use('/api/activities', activitiesRoutes);
app.use('/api/contacts', notesRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/pipeline-stages', pipelineStagesRoutes);
app.use('/api/quotas', quotasRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/forecast', forecastRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/tags', tagsRoutes);
app.use('/api/custom-fields', customFieldsRoutes);
app.use('/api/lead-sources', leadSourcesRoutes);
app.use('/api/attachments', attachmentsRoutes);
app.use('/api/audit-logs', auditLogsRoutes);
app.use('/api/teams', teamsRoutes);
app.use('/api/territories', territoriesRoutes);
app.use('/api/onboarding', onboardingRoutes);

// Unknown API routes always return JSON (never the SPA shell).
app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// In production, serve the built frontend from this same service so the app is
// same-origin (no CORS) and the client's relative "/api" calls just work.
const clientDist = path.resolve(__dirname, '../../crm-dashboard-frontend/dist');
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(clientDist));
  // SPA fallback: send index.html for any non-API, non-asset route.
  app.use((_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
} else {
  app.use((_req, res) => {
    res.status(404).json({ error: 'Route not found' });
  });
}

app.use((err, _req, res, _next) => {
  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      error: 'Upload too large. CSV imports must be sent as a file (max 10MB).',
    });
  }
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, async () => {
  console.log(`SalesFlow CRM API running on http://localhost:${PORT}`);
  try {
    await prisma.$connect();
    console.log('✅ Database connected');
  } catch {
    console.error('\n❌ Database connection failed.');
    console.error('   Your .env still has invalid PostgreSQL credentials.');
    console.error('   Fix it by running from the project root:\n');
    console.error('     npm run setup:db\n');
  }
});
