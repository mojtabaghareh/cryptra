// ============================================================
// swap.ts - API Endpoints for Trading
// ============================================================

import { Router } from 'express';
import { QuoteEngine } from '../core/quote-engine';
import { SwapExecutor } from '../execution/swap-executor';
import { SwapRequest } from '../../shared/types/trade';

const router = Router();
const quoteEngine = new QuoteEngine();
const executor = new SwapExecutor();

/**
 * دریافت نرخ (Quote)
 */
router.post('/quote', async (req, res) => {
  try {
    const reqBody = req.body as SwapRequest;
    const quote = await quoteEngine.getBestQuote(reqBody);
    
    if (!quote) {
      return res.status(404).json({ error: 'قیمتی برای این مسیر یافت نشد' });
    }
    
    res.json({ success: true, quote });
  } catch (error) {
    res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

/**
 * اجرای معامله
 */
router.post('/execute', async (req, res) => {
  try {
    const { quote, walletAddress } = req.body;
    const result = await executor.executeSwap(quote, walletAddress);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ error: 'خطای داخلی سرور' });
  }
});

export const swapRouter = router;
