// ============================================================
// growth.ts - API Endpoints for Growth System
// ============================================================

import { Router } from 'express';
import { XPEngine, Level } from '../../core/src/growth/XPEngine';
import { ReferralEngine } from '../../core/src/growth/ReferralEngine';

const router = Router();
const xpEngine = new XPEngine();
const referralEngine = new ReferralEngine();

// داده‌های موقت (در نسخه واقعی از دیتابیس خوانده می‌شوند)
const userProgress = new Map<string, any>();

/**
 * دریافت وضعیت پیشرفت کاربر (XP، سطح، تخفیف)
 */
router.get('/progress/:userId', (req, res) => {
  const { userId } = req.params;
  let progress = userProgress.get(userId);
  if (!progress) {
    progress = {
      userId,
      xp: 0,
      level: Level.BRONZE,
      badges: [],
      achievements: [],
      unlockableThemes: ['Default Dark'],
      feeDiscount: 0.00,
    };
    userProgress.set(userId, progress);
  }
  res.json({ success: true, progress });
});

/**
 * افزودن XP به کاربر
 */
router.post('/xp/add', (req, res) => {
  const { userId, amount } = req.body;
  let progress = userProgress.get(userId);
  if (!progress) {
    return res.status(404).json({ error: 'کاربر یافت نشد' });
  }
  const updated = xpEngine.addXP(progress, amount);
  userProgress.set(userId, updated);
  res.json({ success: true, progress: updated });
});

/**
 * ثبت یک رفرال جدید
 */
router.post('/referral/add', (req, res) => {
  const { referrerId, refereeId } = req.body;
  const success = referralEngine.addReferral(referrerId, refereeId);
  if (success) {
    // پاداش XP به معرف
    let progress = userProgress.get(referrerId);
    if (progress) {
      progress = xpEngine.addXP(progress, 100);
      userProgress.set(referrerId, progress);
    }
  }
  res.json({ success });
});

/**
 * دریافت لیدربورد (رتبه‌بندی)
 */
router.get('/leaderboard', (req, res) => {
  // در نسخه واقعی از دیتابیس خوانده می‌شود
  const mockLeaderboard = [
    { userId: 'user1', xp: 4500, level: Level.PLATINUM },
    { userId: 'user2', xp: 3200, level: Level.GOLD },
    { userId: 'user3', xp: 2800, level: Level.GOLD },
    { userId: 'user4', xp: 1100, level: Level.SILVER },
  ].sort((a, b) => b.xp - a.xp);
  res.json({ success: true, leaderboard: mockLeaderboard });
});

export const growthRouter = router;
