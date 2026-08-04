// ============================================================
// server.ts (نسخه‌ی به‌روز با تمام مسیرهای API)
// ============================================================

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// وارد کردن مسیرهای API
import { authRouter } from './api/auth';
import { eventsRouter } from './api/events';
import { reflectionRouter } from './api/reflection';
import { replayRouter } from './api/replay';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// مسیرهای اصلی
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Cryptra Backend is running' });
});

// اتصال مسیرهای API
app.use('/api/auth', authRouter);
app.use('/api/events', eventsRouter);
app.use('/api/reflection', reflectionRouter);
app.use('/api/replay', replayRouter);

app.listen(PORT, () => {
  console.log(`🚀 Cryptra Backend running on http://localhost:${PORT}`);
});
