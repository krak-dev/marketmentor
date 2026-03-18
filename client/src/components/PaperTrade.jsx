import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getPrice, getPortfolioAdvisor } from '../lib/api';
import { useToast } from '../lib/ToastContext';

const INITIAL_CASH = 10000;
const STORAGE_KEYS = {
  cash: 'mm_cash',
  holdings: 'mm_holdings',
  trades: 'mm_trades'
};

export default function PaperTrade() {
  const { showToast } = useToast();
  const [cash, setCash] = useState(INITIAL_CASH);
  const [holdings, setHoldings] = useState([]);
  const [trades, setTrades] = useState([]);

  // Trade form
  const [ticker, setTicker] = useState('');
  const [shares, setShares] = useState('');
  const [tradeMode, setTradeMode] = useState('buy');
  const [currentPrice, setCurrentPrice] = useState(null);
  const [loadingPrice, setLoadingPrice] = useState(false);
  const [error, setError] = useState('');

  // Advisor
  const [showAdvisor, setShowAdvisor] = useState(false);
  const [advisorAnalysis, setAdvisorAnalysis] = useState('');
  const [loadingAdvisor, setLoadingAdvisor] = useState(false);

  // Current prices for holdings
  const [holdingPrices, setHoldingPrices] = useState({});

  // Load from localStorage
  useEffect(() => {
    const savedCash = localStorage.getItem(STORAGE_KEYS.cash);
    const savedHoldings = localStorage.getItem(STORAGE_KEYS.holdings);
    const savedTrades = localStorage.getItem(STORAGE_KEYS.trades);
    if (savedCash) setCash(parseFloat(savedCash));
    if (savedHoldings) setHoldings(JSON.parse(savedHoldings));
    if (savedTrades) setTrades(JSON.parse(savedTrades));
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.cash, cash.toFixed(2));
  }, [cash]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.holdings, JSON.stringify(holdings));
  }, [holdings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.trades, JSON.stringify(trades));
  }, [trades]);

  // Fetch price for ticker input (debounced)
  useEffect(() => {
    if (!ticker.trim()) {
      setCurrentPrice(null);
      return;
    }
    const timer = setTimeout(async () => {
      setLoadingPrice(true);
      try {
        const res = await getPrice(ticker.toUpperCase());
        setCurrentPrice(res.price);
        setError('');
      } catch (err) {
        setCurrentPrice(null);
        setError('Ticker not found');
      } finally {
        setLoadingPrice(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [ticker]);

  // Fetch current prices for holdings
  useEffect(() => {
    const fetchPrices = async () => {
      const prices = {};
      await Promise.all(
        holdings.map(async (h) => {
          try {
            const res = await getPrice(h.ticker);
            prices[h.ticker] = res.price;
          } catch (e) {
            prices[h.ticker] = 0;
          }
        })
      );
      setHoldingPrices(prices);
    };
    if (holdings.length > 0) {
      fetchPrices();
    } else {
      setHoldingPrices({});
    }
  }, [holdings]);

  // Portfolio calculations
  const totalHoldingsValue = holdings.reduce((sum, h) => {
    const price = holdingPrices[h.ticker] || 0;
    return sum + h.shares * price;
  }, 0);
  const totalPortfolioValue = cash + totalHoldingsValue;
  const totalReturn = ((totalPortfolioValue - INITIAL_CASH) / INITIAL_CASH) * 100;

  const formatCurrency = (num) => `$${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // Execute trade
  const executeTrade = () => {
    setError('');
    if (!ticker.trim()) {
      setError('Please enter a ticker');
      return;
    }
    const sharesNum = parseFloat(shares);
    if (!sharesNum || sharesNum <= 0) {
      setError('Please enter a valid number of shares');
      return;
    }
    if (!currentPrice) {
      setError('Current price not available');
      return;
    }

    const cost = currentPrice * sharesNum;

    if (tradeMode === 'buy') {
      if (cost > cash) {
        setError('Insufficient cash');
        return;
      }
      // Buy
      setCash((prev) => prev - cost);
      setHoldings((prev) => {
        const existing = prev.find((h) => h.ticker === ticker.toUpperCase());
        if (existing) {
          const newShares = existing.shares + sharesNum;
          const newAvgCost = (existing.avgCost * existing.shares + currentPrice * sharesNum) / newShares;
          return prev.map((h) =>
            h.ticker === ticker.toUpperCase()
              ? { ...h, shares: newShares, avgCost: newAvgCost }
              : h
          );
        } else {
          return [...prev, { ticker: ticker.toUpperCase(), shares: sharesNum, avgCost: currentPrice }];
        }
      });
      setTrades((prev) => [...prev, { ticker: ticker.toUpperCase(), shares: sharesNum, price: currentPrice, type: 'buy', date: new Date().toISOString() }]);
      showToast(`Bought ${sharesNum} shares of ${ticker.toUpperCase()} — ${formatCurrency(cost)} deducted`);
      setTicker('');
      setShares('');
      setCurrentPrice(null);
    } else {
      // Sell
      const holding = holdings.find((h) => h.ticker === ticker.toUpperCase());
      if (!holding) {
        setError('No shares to sell');
        return;
      }
      if (sharesNum > holding.shares) {
        setError('Insufficient shares');
        return;
      }
      setCash((prev) => prev + cost);
      setHoldings((prev) => {
        if (sharesNum === holding.shares) {
          return prev.filter((h) => h.ticker !== ticker.toUpperCase());
        } else {
          return prev.map((h) =>
            h.ticker === ticker.toUpperCase()
              ? { ...h, shares: h.shares - sharesNum }
              : h
          );
        }
      });
      setTrades((prev) => [...prev, { ticker: ticker.toUpperCase(), shares: sharesNum, price: currentPrice, type: 'sell', date: new Date().toISOString() }]);
      showToast(`Sold ${sharesNum} shares of ${ticker.toUpperCase()} — ${formatCurrency(cost)} added`);
      setTicker('');
      setShares('');
      setCurrentPrice(null);
    }
    setShowAdvisor(false);
  };

  // Sell all of a holding
  const sellAll = (ticker) => {
    const holding = holdings.find((h) => h.ticker === ticker);
    if (!holding) return;
    const price = holdingPrices[ticker] || 0;
    if (!price) {
      showToast('Price not available');
      return;
    }
    const proceeds = price * holding.shares;
    setCash((prev) => prev + proceeds);
    setHoldings((prev) => prev.filter((h) => h.ticker !== ticker));
    setTrades((prev) => [...prev, { ticker, shares: holding.shares, price, type: 'sell', date: new Date().toISOString() }]);
    showToast(`Sold all ${holding.shares} shares of ${ticker}`);
    setShowAdvisor(false);
  };

  // AI Advisor
  const fetchAdvisor = async () => {
    setLoadingAdvisor(true);
    setShowAdvisor(true);
    try {
      const payload = holdings.map((h) => ({
        ticker: h.ticker,
        shares: h.shares,
        avgCost: h.avgCost,
        currentPrice: holdingPrices[h.ticker] || 0
      }));
      const result = await getPortfolioAdvisor(payload);
      setAdvisorAnalysis(result.analysis);
    } catch (error) {
      console.error(error);
      setAdvisorAnalysis('Could not generate analysis. Please try again.');
      showToast('Failed to get advice');
    } finally {
      setLoadingAdvisor(false);
    }
  };

  // Compute per-holding return
  const getHoldingReturn = (h) => {
    const price = holdingPrices[h.ticker] || 0;
    if (!price) return { dollars: 0, percent: 0 };
    const dollars = (price - h.avgCost) * h.shares;
    const percent = ((price - h.avgCost) / h.avgCost) * 100;
    return { dollars, percent };
  };

  // Format return cell: "+$170 · +6.6%"
  const formatReturn = (h) => {
    const ret = getHoldingReturn(h);
    const sign = ret.dollars >= 0 ? '+' : '';
    return `${sign}${formatCurrency(ret.dollars)} · ${sign}${ret.percent.toFixed(1)}%`;
  };

  return (
    <div className="grid-two-col">
      {/* LEFT: Trading Card */}
      <div className="card">
        <div className="section-label">PAPER TRADING SIMULATOR</div>
        <p style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '16px' }}>
          Practice with $10,000 virtual money. No risk.
        </p>

        {/* Portfolio summary */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3,1fr)',
            gap: '8px',
            background: 'var(--neutral-bg)',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '16px'
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '10px', fontWeight: '600', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '4px' }}>
              Portfolio Value
            </div>
            <div style={{ fontSize: '16px', fontWeight: '700' }}>
              {formatCurrency(totalPortfolioValue)}
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '10px', fontWeight: '600', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '4px' }}>
              Cash Available
            </div>
            <div style={{ fontSize: '16px', fontWeight: '700' }}>
              {formatCurrency(cash)}
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '10px', fontWeight: '600', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '4px' }}>
              Total Return
            </div>
            <div style={{ fontSize: '16px', fontWeight: '700', color: totalReturn >= 0 ? 'var(--up)' : 'var(--down)' }}>
              {totalReturn >= 0 ? '+' : ''}{totalReturn.toFixed(1)}%
            </div>
          </div>
        </div>

        <div className="divider"></div>

        {/* Trade Form */}
        <div className="field-group">
          <label className="field-label">Ticker Symbol</label>
          <input
            type="text"
            value={ticker}
            onChange={(e) => setTicker(e.target.value.toUpperCase())}
            placeholder="e.g. AAPL"
          />
        </div>
        {currentPrice && (
          <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '12px' }}>
            Current Price: <strong style={{ color: 'var(--text)' }}>{formatCurrency(currentPrice)}</strong>
          </p>
        )}
        {loadingPrice && <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '12px' }}>Loading...</p>}

        <div className="field-group">
          <label className="field-label">Number of Shares</label>
          <input
            type="number"
            value={shares}
            onChange={(e) => setShares(e.target.value)}
            placeholder="e.g. 10"
            min="1"
          />
        </div>
        {currentPrice && shares && parseFloat(shares) > 0 && (
          <p
            style={{
              fontSize: '13px',
              color: 'var(--muted)',
              background: 'var(--neutral-bg)',
              padding: '8px 10px',
              borderRadius: '6px',
              marginBottom: '12px'
            }}
          >
            Estimated Cost: <strong style={{ color: 'var(--text)' }}>{formatCurrency(estimatedCost)}</strong>
          </p>
        )}

        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
          <button
            className="btn-buy"
            style={{ flex: 1 }}
            onClick={() => setTradeMode('buy')}
          >
            Buy
          </button>
          <button
            className="btn-sell"
            style={{ flex: 1 }}
            onClick={() => setTradeMode('sell')}
          >
            Sell
          </button>
        </div>

        {error && (
          <div style={{
            background: '#FEF2F2',
            border: '1px solid #FECACA',
            color: '#DC2626',
            borderRadius: '8px',
            padding: '10px 14px',
            fontSize: '13px',
            marginTop: '8px'
          }}>
            {error}
          </div>
        )}

        <button
          className="btn-primary"
          onClick={executeTrade}
          style={{ marginTop: error ? '8px' : '10px' }}
        >
          Execute Trade ›
        </button>
      </div>

      {/* RIGHT: Holdings & Advisor */}
      <div className="surface-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div className="section-label" style={{ marginBottom: '0' }}>YOUR HOLDINGS</div>
          <button
            className="btn-secondary"
            onClick={fetchAdvisor}
            style={{ fontSize: '12px', padding: '7px 12px' }}
            disabled={loadingAdvisor || holdings.length === 0}
          >
            {loadingAdvisor ? 'Loading...' : 'AI Portfolio Advisor ›'}
          </button>
        </div>

        {holdings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted)', fontSize: '13px' }}>
            No holdings yet. Buy your first stock above.
          </div>
        ) : (
          <>
            <table>
              <thead>
                <tr>
                  <th>Ticker</th>
                  <th>Shares</th>
                  <th>Avg Cost</th>
                  <th>Current</th>
                  <th>Return</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {holdings.map((h) => {
                  const price = holdingPrices[h.ticker] || 0;
                  const ret = getHoldingReturn(h);
                  const isPositive = ret.dollars >= 0;
                  return (
                    <tr key={h.ticker}>
                      <td>
                        <span className="font-mono" style={{ fontWeight: '600' }}>
                          {h.ticker}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>{h.shares}</td>
                      <td style={{ textAlign: 'right', color: 'var(--muted)' }}>
                        {formatCurrency(h.avgCost)}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {price ? formatCurrency(price) : '...'}
                      </td>
                      <td style={{ textAlign: 'right', color: isPositive ? 'var(--up)' : 'var(--down)', fontWeight: '600' }}>
                        {formatReturn(h)}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          style={{ background: 'none', border: 'none', fontSize: '12px', color: 'var(--down)' }}
                          onClick={() => sellAll(h.ticker)}
                        >
                          Sell All
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {showAdvisor && (
              <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                <div className="section-label">AI PORTFOLIO REVIEW</div>
                {loadingAdvisor ? (
                  <div style={{ color: 'var(--muted)', fontStyle: 'italic', fontSize: '13px' }}>Analyzing your portfolio...</div>
                ) : (
                  <div className="body-text" style={{ fontSize: '13px' }}>
                    {advisorAnalysis}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
