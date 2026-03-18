import express from 'express';
import yf from 'yahoo-finance2';
import * as claude from '../lib/claude.js';

const router = express.Router();

/**
 * GET /api/trade/price?ticker=...
 * Returns current price for a ticker
 */
router.get('/price', async (req, res) => {
  const { ticker } = req.query;

  if (!ticker) {
    return res.status(400).json({ error: 'Ticker is required' });
  }

  try {
    const quote = await yf.quote(ticker.toUpperCase());
    res.json({
      symbol: ticker.toUpperCase(),
      price: quote.regularMarketPrice,
      companyName: quote.shortName || ticker.toUpperCase()
    });
  } catch (error) {
    console.error('Price fetch error:', error);
    res.status(404).json({ error: 'Ticker not found or data unavailable' });
  }
});

/**
 * POST /api/trade/advice
 * Analyzes portfolio and provides educational feedback
 */
router.post('/advice', async (req, res) => {
  const { holdings } = req.body;

  if (!holdings || !Array.isArray(holdings)) {
    return res.status(400).json({ error: 'Holdings array is required' });
  }

  try {
    // Reformat holdings for Claude (calculate value and return for each)
    const enrichedHoldings = holdings.map(h => ({
      ticker: h.ticker,
      shares: h.shares,
      avgCost: h.avgCost,
      currentPrice: h.currentPrice || 0,
      value: h.shares * (h.currentPrice || 0),
      return: h.currentPrice ? ((h.currentPrice - h.avgCost) / h.avgCost * 100).toFixed(2) : 0
    }));

    const analysis = await claude.analyzePortfolio({ holdings: enrichedHoldings });
    res.json({ analysis });
  } catch (error) {
    console.error('Advisor error:', error);
    res.status(500).json({ error: 'Failed to generate portfolio analysis' });
  }
});

export default router;
