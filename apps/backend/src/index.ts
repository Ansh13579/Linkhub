import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { tenantScopeMiddleware } from './middleware/tenantScope';

// Routes
import authRoutes from './routes/auth';
import linksRoutes from './routes/links';
import analyticsRoutes from './routes/analytics';
import tenantsRoutes from './routes/tenants';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// ── Security middleware ────────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'http://localhost:3000',
    'http://localhost:3001',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Tenant scope (for every request) ─────────────────────────────────────────
app.use(tenantScopeMiddleware);

// ── Request logging (dev) ──────────────────────────────────────────────────────
if (process.env.NODE_ENV === 'development') {
  app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });
}

// ── Routes ─────────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/links', linksRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/tenants', tenantsRoutes);

// ── Health check ───────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'linkhub-api' });
});

// ── 404 handler ────────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ── Error handler ──────────────────────────────────────────────────────────────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ── Start server ───────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════╗
  ║   🔗 LinkHub API Server              ║
  ║   Port:     ${PORT}                     ║
  ║   Env:      ${process.env.NODE_ENV}        ║
  ║   Docs:     /health                  ║
  ╚══════════════════════════════════════╝
  `);
});

export default app;
