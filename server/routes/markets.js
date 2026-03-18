import express from 'express';
import yf from 'yahoo-finance2';
import * as claude from '../lib/claude.js';

const router = express.Router();

const DEFAULT_TICKERS = ['AAPL', 'MSFT', 'NVDA', 'GOOGL', 'AMZN', 'TSLA', 'META', 'JPM'];

/**
 * GET /api/markets/overview
 * Returns data for major indices (S&P 500, NASDAQ, DOW, VIX)
 */
router.get('/overview', async (req, res) => {
  const indices = [
    { symbol: '^GSPC', name: 'S&P 500' },
    { symbol: '^IXIC', name: 'NASDAQ' },
    { symbol: '^DJI', name: 'DOW' },
    { symbol: '^VIX', name: 'VIX' }
  ];

  try {
    const data = await Promise.all(
      indices.map(async (idx) => {
        try {
          const quote = await yf.quote(idx.symbol);
          return {
            symbol: idx.symbol.replace('^', ''),
            price: quote.regularMarketPrice,
            change: quote.regularMarketChange || 0,
            changePercent: quote.regularMarketChangePercent || 0
          };
        } catch (error) {
          console.error(`Error fetching ${idx.symbol}:`, error);
          return {
            symbol: idx.symbol.replace('^', ''),
            price: 0,
            change: 0,
            changePercent: 0
          };
        }
      })
    );

    res.json(data);
  } catch (error) {
    console.error('Overview error:', error);
    res.status(500).json({ error: 'Failed to fetch market overview' });
  }
});

/**
 * GET /api/markets/stocks
 * Returns data for default stock list (or search query)
 */
router.get('/stocks', async (req, res) => {
  const { search } = req.query;
  const tickers = search ? [search.toUpperCase()] : DEFAULT_TICKERS;

  try {
    const data = await Promise.all(
      tickers.map(async (ticker) => {
        try {
          const quote = await yf.quote(ticker);
          const summary = await yf.quoteSummary(ticker, {
            modules: ['summaryDetail']
          }).catch(() => ({}));

          return {
            symbol: ticker,
            shortName: quote.shortName || ticker,
            price: quote.regularMarketPrice,
            change: quote.regularMarketChange || 0,
            changePercent: quote.regularMarketChangePercent || 0,
            fiftyTwoWeekLow: summary.summaryDetail?.fiftyTwoWeekLow?.raw || 0,
            fiftyTwoWeekHigh: summary.summaryDetail?.fiftyTwoWeekHigh?.raw || 0
          };
        } catch (error) {
          console.error(`Error fetching ${ticker}:`, error);
          return null;
        }
      })
    );

    res.json(data.filter(d => d !== null));
  } catch (error) {
    console.error('Stocks error:', error);
    res.status(500).json({ error: 'Failed to fetch stock data' });
  }
});

/**
 * POST /api/markets/summary
 * Generates a plain-English market summary using Claude
 */
router.post('/summary', async (req, res) => {
  try {
    // Fetch indices overview (passed indexData not used, we fetch fresh)
    const indices = ['^GSPC', '^IXIC', '^DJI'];
    const indexData = await Promise.all(
      indices.map(async (symbol) => {
        try {
          const quote = await yf.quote(symbol);
          return {
            symbol: symbol.replace('^', ''),
            price: quote.regularMarketPrice,
            changePercent: quote.regularMarketChangePercent || 0
          };
        } catch (error) {
          return null;
        }
      })
    );

    // Fetch top gainers and losers from default tickers
    const stocks = await Promise.all(
      DEFAULT_TICKERS.map(async (ticker) => {
        try {
          const quote = await yf.quote(ticker);
          return {
            ticker,
            name: quote.shortName || ticker,
            changePercent: quote.regularMarketChangePercent || 0
          };
        } catch (error) {
          return null;
        }
      })
    );

    const gainers = stocks.filter(s => s && s.changePercent > 0).sort((a, b) => b.changePercent - a.changePercent).slice(0, 3);
    const losers = stocks.filter(s => s && s.changePercent < 0).sort((a, b) => a.changePercent - b.changePercent).slice(0, 3);

    const marketData = {
      indices: indexData.filter(i => i !== null),
      topGainers: gainers,
      topLosers: losers
    };

    const result = await claude.getMarketSummary(marketData);
    res.json(result);
  } catch (error) {
    console.error('Summary error:', error);
    res.status(500).json({ error: 'Failed to generate market summary' });
  }
});

export default router;
