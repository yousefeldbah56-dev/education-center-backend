import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import { apiRateLimiter } from './middleware/rateLimiter.middleware.js';
import authRoutes from './routes/auth.routes.js';
import studentRoutes from './routes/student.routes.js';
import teacherRoutes from './routes/teacher.routes.js';
import groupRoutes from './routes/group.routes.js';
import sessionRoutes from './routes/session.routes.js';
import financeRoutes from './routes/finance.routes.js';
import mediaRoutes from './routes/media.routes.js';
import { startCronJobs } from './jobs/cron.js';
import swaggerUi from 'swagger-ui-express';
import { swaggerDocument } from './config/swagger.js';

const app = express();

// ─── Security Middleware ───────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false })); // Security headers (CSP false for Swagger UI)
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  })
);

// ─── Body Parsing ──────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ─── Logging ───────────────────────────────────────────────────
if (env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// ─── Rate Limiting ─────────────────────────────────────────────
app.use('/api', apiRateLimiter);

// ─── Health Check ──────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// ─── Interactive API Documentation (Swagger UI) ────────────────
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// ─── API Routes ────────────────────────────────────────────────
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/students', studentRoutes);
app.use('/api/v1/teachers', teacherRoutes);
app.use('/api/v1/groups', groupRoutes);
app.use('/api/v1/sessions', sessionRoutes);
app.use('/api/v1/finance', financeRoutes);
app.use('/api/v1/media', mediaRoutes);

// ─── 404 Handler ───────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// ─── Global Error Handler ──────────────────────────────────────
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error('❌ Unhandled Error:', err);
    res.status(500).json({
      message: env.NODE_ENV === 'production'
        ? 'Internal Server Error'
        : err.message, // 🛡️ Never expose stack traces in production
    });
  }
);

// ─── Start Server ──────────────────────────────────────────────
const PORT = parseInt(env.PORT, 10);

async function startServer() {
  await connectDB();
  startCronJobs();

  app.listen(PORT, () => {
    console.log(`
  ┌───────────────────────────────────────────┐
  │  🎓 Education Center API                  │
  │  🚀 Running on: http://localhost:${PORT}      │
  │  📚 Swagger UI:  http://localhost:${PORT}/api-docs│
  │  📦 Environment: ${env.NODE_ENV.padEnd(18)}│
  └───────────────────────────────────────────┘
    `);
  });
}

startServer().catch((error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});

export default app;
