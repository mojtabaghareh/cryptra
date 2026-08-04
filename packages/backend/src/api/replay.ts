// ============================================================
// replay.ts
// ارائه‌ی گزارش هفتگی (Replay) به فرانت‌اند
// ============================================================

import { Request, Response, Router } from 'express';
import { EventRepository } from '../../../core/src/event-graph/repository/EventRepository';
import { ReflectionEngine } from '../../../core/src/reflection-engine/ReflectionEngine';
import { ReplayGenerator } from '../../../core/src/replay-generator/ReplayGenerator';
import { validateSession } from './auth';

export const replayRouter = Router();

// **در محیط واقعی، وابستگی‌ها تزریق می‌شوند**
const repository = new EventRepository(null as any);
const engine = new ReflectionEngine(repository);
const generator = new ReplayGenerator();

/**
 * دریافت گزارش هفتگی برای یک کاربر خاص
 */
replayRouter.get('/:userId', async (req: Request, res: Response): Promise<void> => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token || !validateSession(token)) {
    res.status(401).json({ error: 'احراز هویت نامعتبر' });
    return;
  }

  const { userId } = req.params;
  const weekNumber = req.query.week ? parseInt(req.query.week as string) : getCurrentWeekNumber();
  
  try {
    // ۱. دریافت تحلیل‌های رفتاری از موتور Reflection
    const patterns = await engine.analyzeUser(userId);
    
    // ۲. تولید گزارش هفتگی
    const replay = generator.generateReplay(userId, patterns, weekNumber);
    
    res.status(200).json({
      success: true,
      replay,
    });
  } catch (error: any) {
    console.error('خطا در تولید گزارش هفتگی:', error);
    res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

/**
 * محاسبه شماره هفته جاری (بر اساس روزهای گذشته از یک تاریخ ثابت)
 */
function getCurrentWeekNumber(): number {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const days = Math.floor((now.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
  return Math.ceil((days + startOfYear.getDay() + 1) / 7);
}
