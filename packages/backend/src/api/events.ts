// ============================================================
// events.ts
// دریافت رویدادهای مالی از کاربر و ذخیره‌سازی در Core
// ============================================================

import { Request, Response, Router } from 'express';
import crypto from 'crypto';
import { EventType, FinancialEvent } from '../../../core/src/event-graph/models/EventTypes';
import { EventRepository } from '../../../core/src/event-graph/repository/EventRepository';
import { validateSession } from './auth';

// **در محیط واقعی، اینجا درایور Neo4j تزریق می‌شود**
// فعلاً برای جلوگیری از خطا، یک نمونه‌ی خالی ایجاد می‌کنیم
const repository = new EventRepository(null as any);

export const eventsRouter = Router();

/**
 * ثبت یک رویداد مالی جدید
 */
eventsRouter.post('/', async (req: Request, res: Response): Promise<void> => {
  // ۱. بررسی اعتبار کاربر (با استفاده از توکن)
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token || !validateSession(token)) {
    res.status(401).json({ error: 'احراز هویت نامعتبر' });
    return;
  }

  // ۲. دریافت داده‌های رویداد از بدن درخواست
  const { type, chain, walletAddress, amount, tokenSymbol, price, txHash, metadata } = req.body;

  // ۳. اعتبارسنجی ساده
  if (!type || !chain || !walletAddress) {
    res.status(400).json({ error: 'نوع رویداد، شبکه و آدرس کیف پول الزامی هستند' });
    return;
  }

  // ۴. ساخت رویداد جدید
  const newEvent: FinancialEvent = {
    id: crypto.randomUUID(),
    userId: req.body.userId || 'temp-user', // در نسخه‌ی واقعی از کاربر فعال گرفته می‌شود
    type: type as EventType,
    timestamp: Date.now(),
    chain,
    walletAddress,
    txHash: txHash || undefined,
    amount: amount || undefined,
    tokenSymbol: tokenSymbol || undefined,
    price: price || undefined,
    valueUsd: price && amount ? price * amount : undefined,
  };

  // ۵. ذخیره‌سازی در دیتابیس (از طریق Core)
  try {
    await repository.saveEvent(newEvent);
    res.status(201).json({ success: true, eventId: newEvent.id });
  } catch (error: any) {
    console.error('خطا در ذخیره رویداد:', error);
    res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

/**
 * دریافت رویدادهای یک کاربر خاص
 */
eventsRouter.get('/:userId', async (req: Request, res: Response): Promise<void> => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token || !validateSession(token)) {
    res.status(401).json({ error: 'احراز هویت نامعتبر' });
    return;
  }

  const { userId } = req.params;
  try {
    const events = await repository.getEventsByUserId(userId);
    res.status(200).json({ success: true, events });
  } catch (error: any) {
    console.error('خطا در دریافت رویدادها:', error);
    res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});
