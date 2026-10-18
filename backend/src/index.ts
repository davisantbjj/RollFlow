import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

import authRoutes from './routes/auth';
import academyRoutes from './routes/academy';
import userRoutes from './routes/user';
import classRoutes from './routes/class';
import attendanceRoutes from './routes/attendance';
import planRoutes from './routes/plan';
import paymentRoutes from './routes/payment';
import progressionRoutes from './routes/progression';
import evaluationRoutes from './routes/evaluation';
import postRoutes from './routes/post';
import dashboardRoutes from './routes/dashboard';
import masterRoutes from './routes/master';
import { startOverdueJob } from './jobs/overdueJob';
import { errorHandler } from './middlewares/errorHandler';

dotenv.config();

const app = express();

// ===== Database =====
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
export const prisma = new PrismaClient({ adapter });

const PORT = process.env.PORT || 3333;

// ===== Security Middleware =====

// Helmet: sets various HTTP headers for security
app.use(helmet());

// CORS: restrict origins
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:8081')
  .split(',')
  .map((o) => o.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Academy-Id'],
  })
);

// Body parser
app.use(express.json({ limit: '10mb' }));

// Rate limiting for auth routes (bruteforce protection)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 attempts per window
  message: { error: 'Muitas tentativas. Tente novamente em 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// General rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(generalLimiter);

// ===== Routes =====
app.use('/auth', authLimiter, authRoutes);
app.use('/academies', academyRoutes);
app.use('/users', userRoutes);
app.use('/classes', classRoutes);
app.use('/attendance', attendanceRoutes);
app.use('/plans', planRoutes);
app.use('/payments', paymentRoutes);
app.use('/progression', progressionRoutes);
app.use('/evaluation', evaluationRoutes);
app.use('/posts', postRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/master', masterRoutes);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date(), environment: process.env.NODE_ENV || 'development' });
});

// ===== Global Error Handler =====
app.use(errorHandler);

// ===== Start Server =====
app.listen(PORT, () => {
  console.log(`🚀 RollFlow API running on http://localhost:${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  startOverdueJob();
});
