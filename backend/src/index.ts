import express from 'express';
import cors from 'cors';
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

dotenv.config();

const app = express();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
export const prisma = new PrismaClient({ adapter });

const PORT = process.env.PORT || 3333;

app.use(cors());
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/academies', academyRoutes);
app.use('/users', userRoutes);
app.use('/classes', classRoutes);
app.use('/attendance', attendanceRoutes);
app.use('/plans', planRoutes);
app.use('/payments', paymentRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
