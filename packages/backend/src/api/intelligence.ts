// ============================================================
// intelligence.ts - API Endpoints for Intelligence Layer
// ============================================================

import { Router } from 'express';
import { DecisionEngine } from '../../core/src/intelligence/DecisionEngine';
import { PersonaBuilder } from '../../core/src/intelligence/PersonaBuilder';

const router = Router();
const engine = new DecisionEngine();
const builder = new PersonaBuilder();

/**
 * دریافت تحلیل‌های رفتاری کاربر
 */
router.get('/behavior/:userId', (req, res) => {
  const { userId } = req.params;
  const patterns = engine.analyzeBehavior(userId);
  res.json({ success: true, patterns });
});

/**
 * دریافت امتیاز تصمیم‌گیری
 */
router.get('/score/:userId', (req, res) => {
  const { userId } = req.params;
  const score = engine.calculateDecisionScore(userId);
  res.json({ success: true, score });
});

/**
 * دریافت شخصیت مالی کاربر
 */
router.get('/persona/:userId', (req, res) => {
  const { userId } = req.params;
  const persona = builder.buildPersona(userId);
  res.json({ success: true, persona });
});

export const intelligenceRouter = router;
