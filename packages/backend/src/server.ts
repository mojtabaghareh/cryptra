// ============================================================
// server.ts - Updated Server with Intelligence Routes
// ============================================================

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import { authRouter } from './api/auth';
import { eventsRouter } from './api/events';
import { reflectionRouter } from './api/reflection';
import { replayRouter } from './api/replay';
import { swapRouter } from './api/swap';
import { intelligenceRouter } from './api/intelligence'; // جدید

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Cryptra Backend is running' });
});

app.use('/api/auth', authRouter);
app.use('/api/events', eventsRouter);
app.use('/api/reflection', reflectionRouter);
app.use('/api/replay', replayRouter);
app.use('/api/swap', swapRouter);
app.use('/api/intelligence', intelligenceRouter); // مسیر جدید

app.listen(PORT, () => {
  console.log(`🚀 Cryptra Backend running on http://localhost:${PORT}`);
});
