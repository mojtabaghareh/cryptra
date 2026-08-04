// ============================================================
// server.ts
// فایل اصلی راه‌اندازی سرور بک‌اند (Backend)
// ============================================================

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// بارگذاری متغیرهای محیطی
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// میان‌افزارها (Middleware)
app.use(cors());
app.use(express.json());

// مسیرهای API (در گام‌های بعدی پر می‌شوند)
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Cryptra Backend is running' });
});

// راه‌اندازی سرور
app.listen(PORT, () => {
  console.log(`🚀 Cryptra Backend running on http://localhost:${PORT}`);
});
