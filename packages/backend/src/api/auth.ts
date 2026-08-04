// ============================================================
// auth.ts
// مدیریت احراز هویت کاربران، جلسات (Sessions) و تأیید هویت
// ============================================================

import { Request, Response, Router } from 'express';
import crypto from 'crypto';

// اینترفیس کاربر
export interface User {
  id: string;
  telegramId?: string;
  walletAddresses: string[];
  createdAt: number;
  lastSeen: number;
}

// **دیتابیس موقت (در محیط واقعی به PostgreSQL متصل می‌شود)**
const users: Map<string, User> = new Map();

// **ذخیره‌سازی جلسات (برای مدیریت نشست کاربران)**
const sessions: Map<string, string> = new Map(); // token -> userId

export const authRouter = Router();

/**
 * ایجاد یک جلسه (Session) جدید برای کاربر
 * (در نسخه‌ی واقعی، این درخواست از طریق تأیید تلگرام یا Signature Wallet انجام می‌شود)
 */
authRouter.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { telegramId, walletAddress } = req.body;

  if (!telegramId && !walletAddress) {
    res.status(400).json({ error: 'شناسه تلگرام یا آدرس کیف پول الزامی است' });
    return;
  }

  let user = users.get(telegramId);
  if (!user) {
    // اگر کاربر جدید است، ثبت‌نام انجام می‌شود
    user = {
      id: crypto.randomUUID(),
      telegramId: telegramId || undefined,
      walletAddresses: walletAddress ? [walletAddress] : [],
      createdAt: Date.now(),
      lastSeen: Date.now(),
    };
    users.set(telegramId, user);
  } else {
    // به‌روزرسانی زمان آخرین بازدید
    user.lastSeen = Date.now();
    users.set(telegramId, user);
  }

  // تولید توکن جلسه
  const sessionToken = crypto.randomBytes(32).toString('hex');
  sessions.set(sessionToken, telegramId);

  res.status(200).json({
    success: true,
    token: sessionToken,
    userId: user.id,
  });
});

/**
 * بررسی اعتبار توکن جلسه
 */
export function validateSession(token: string): string | null {
  return sessions.get(token) || null;
}

/**
 * خروج از حساب کاربری
 */
authRouter.post('/logout', async (req: Request, res: Response): Promise<void> => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token) {
    sessions.delete(token);
  }
  res.status(200).json({ success: true });
});
