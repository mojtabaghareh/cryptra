// ============================================================
// reflection.ts
// ارائه تحلیل‌های رفتاری (Reflection) به فرانت‌اند
// ============================================================

import { Request, Response, Router } from 'express';
import { EventRepository } from '../../../core/src/event-graph/repository/EventRepository';
import { ReflectionEngine } from '../../../core/src/reflection-engine/ReflectionEngine';
import { validateSession } from './auth';

export const reflectionRouter = Router();

// **در محیط واقعی، اینجا وابستگی‌ها تزریق می‌شوند**
const repository = new EventRepository(null as any);
const engine = new ReflectionEngine(repository);

/**
 * دریافت تحلیل‌های رفتاری برای یک کاربر خاص
 */
reflectionRouter.get('/:userId', async (req: Request, res: Response): Promise<void> => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token || !validateSession(token)) {
    res.status(401).json({ error: 'احراز هویت نامعتبر' });
    return;
  }

  const { userId } = req.params;
  
  try {
    // فراخوانی هسته برای تحلیل رفتار
    const patterns = await engine.analyzeUser(userId);
    
    res.status(200).json({
      success: true,
      userId,
      patterns,
    });
  } catch (error: any) {
    console.error('خطا در تحلیل رفتار:', error);
    res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});
