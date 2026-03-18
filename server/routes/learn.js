import express from 'express';
import yf from 'yahoo-finance2';
import * as claude from '../lib/claude.js';

const router = express.Router();

/**
 * POST /api/learn/explain
 * Returns AI explanation for a financial concept
 */
router.post('/explain', async (req, res) => {
  const { topic } = req.body;

  if (!topic) {
    return res.status(400).json({ error: 'Topic is required' });
  }

  try {
    const result = await claude.explainTopic(topic);
    res.json(result);
  } catch (error) {
    console.error('Explain error:', error);
    res.status(500).json({ error: 'Failed to generate explanation' });
  }
});

/**
 * GET /api/learn/agent (SSE)
 * Streams log lines as agent researches a ticker
 */
router.get('/agent', async (req, res) => {
  const { q } = req.query;

  if (!q) {
    return res.status(400).json({ error: 'Question is required' });
  }

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  const sendLog = (line) => {
    res.write(`data: ${JSON.stringify({ line })}\n\n`);
  };

  try {
    // Extract ticker (simple heuristic)
    const tickerMatch = q.toUpperCase().match(/\b[A-Z]{1,5}\b/);
    const ticker = tickerMatch ? tickerMatch[0] : null;

    if (!ticker) {
      sendLog('✗ Could not detect a stock ticker in your question.');
      res.end();
      return;
    }

    sendLog('✦ Market Research Agent initialized');
    sendLog(`✦ Parsing query...`);
    sendLog(`  → Detected ticker: ${ticker}`);

    // Fetch quote
    sendLog('✦ Fetching current market data...');
    let quote;
    try {
      quote = await yf.quote(ticker);
    } catch (error) {
      sendLog(`  ✗ Could not fetch data for ticker "${ticker}"`);
      res.end();
      return;
    }

    const price = quote.regularMarketPrice?.toFixed(2) || 'N/A';
    const change = quote.regularMarketChangePercent?.toFixed(2) || 'N/A';
    const pe = quote.trailingPE?.toFixed(2) || 'N/A';
    const marketCap = formatMarketCap(quote.marketCap);

    sendLog(`  → Price: $${price}  |  Change: ${change}%`);
    sendLog(`  → P/E Ratio: ${pe}  |  Market Cap: ${marketCap}`);

    // Fetch history/summary
    sendLog('✦ Analyzing price history...');
    let summary;
    try {
      summary = await yf.quoteSummary(ticker, {
        modules: ['summaryDetail', 'defaultKeyStatistics']
      });
    } catch (error) {
      sendLog(`  ✗ Could not fetch detailed data for ${ticker}`);
      res.end();
      return;
    }

    const low = summary.summaryDetail?.fiftyTwoWeekLow?.raw || 0;
    const high = summary.summaryDetail?.fiftyTwoWeekHigh?.raw || 0;
    const fifty = summary.defaultKeyStatistics?.fiftyDayAverage?.raw || 0;
    const twohundred = summary.defaultKeyStatistics?.twoHundredDayAverage?.raw || 0;
    const current = quote.regularMarketPrice || 0;
    const position = ((current - high) / high * 100).toFixed(1);

    sendLog(`  → 52W Range: $${low?.toFixed(2)} – $${high?.toFixed(2)}`);
    sendLog(`  → 50-Day Avg: $${fifty?.toFixed(2)}  |  200-Day Avg: $${twohundred?.toFixed(2)}`);
    sendLog(`  → Currently ${position}% below 52W high`);

    // Assess volatility
    sendLog('✦ Assessing volatility for beginners...');
    const volatilityResult = calculateVolatility(quote, summary);
    sendLog(`  → Recent volatility: ${volatilityResult.signal.toUpperCase()}`);
    sendLog(`  → Risk level for beginners: ${volatilityResult.riskLevel}`);

    // Call Claude
    sendLog('✦ Running AI synthesis...');
    sendLog('  → Analyzing all data points...');
    sendLog('  → Generating beginner investment brief...');

    const stockData = {
      ticker,
      price: current,
      changePercent: quote.regularMarketChangePercent || 0,
      peRatio: quote.trailingPE || null,
      marketCap: formatMarketCap(quote.marketCap),
      fiftyTwoWeekLow: low,
      fiftyTwoWeekHigh: high,
      fiftyDayAverage: fifty,
      twoHundredDayAverage: twohundred,
      volatilitySignal: volatilityResult.signal,
      riskLevel: volatilityResult.riskLevel
    };

    const analysis = await claude.synthesizeAgentResearch(stockData);

    sendLog('✦ Research complete. ✓');

    // Send final report in "done" event
    res.write(`event: done\ndata: ${JSON.stringify({
      report: analysis.report,
      keyTakeaway: analysis.keyTakeaway,
      riskLevel: analysis.riskLevel || volatilityResult.riskLevel,
      ticker,
      companyName: quote.shortName || ticker
    })}\n\n`);

    res.end();
  } catch (error) {
    console.error('Agent error:', error);
    sendLog(`  ✗ Error: ${error.message}`);
    res.end();
  }
});

function formatMarketCap(cap) {
  if (!cap) return 'N/A';
  if (cap >= 1e12) return `$${(cap / 1e12).toFixed(2)}T`;
  if (cap >= 1e9) return `$${(cap / 1e9).toFixed(2)}B`;
  if (cap >= 1e6) return `$${(cap / 1e6).toFixed(2)}M`;
  return `$${cap.toFixed(2)}`;
}

function calculateVolatility(quote, summary) {
  const price = quote.regularMarketPrice || 0;
  const dayRange = quote.regularMarketDayRange || '';
  const [low, high] = dayRange.split(' - ').map(Number);

  if (!low || !high || price === 0) {
    return { signal: 'N/A', score: 0, riskLevel: 'Low' };
  }

  const dayRangePct = (high - low) / price;

  let signal = 'LOW';
  let score = 0;
  let riskLevel = 'Low';

  if (dayRangePct > 0.05) {
    signal = 'HIGH';
    score = 0.5;
    riskLevel = 'High';
  } else if (dayRangePct > 0.02) {
    signal = 'MEDIUM';
    score = 0.2;
    riskLevel = 'Medium';
  }

  return { signal, score, riskLevel };
}

export default router;
