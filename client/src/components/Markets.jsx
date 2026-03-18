import React, { useState, useEffect } from 'react';
import { getMarketOverview, getStocks, getMarketSummary } from '../lib/api';
import { useToast } from '../lib/ToastContext';

const INDEX_NAMES = {
  '^GSPC': 'S&P 500',
  '^IXIC': 'NASDAQ',
  '^DJI': 'DOW JONES',
  '^VIX': 'VIX'
};

export default function Markets({ onSwitchTab }) {
  const { showToast } = useToast();
  const [overview, setOverview] = useState([]);
  const [stocks, setStocks] = useState([]);
  const [summary, setSummary] = useState('');
  const [keyTakeaway, setKeyTakeaway] = useState('');
  const [showSummary, setShowSummary] = useState(false);
  const [loading, setLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [overviewData, stocksData] = await Promise.all([
        getMarketOverview(),
        getStocks()
      ]);
      setOverview(overviewData);
      setStocks(stocksData);
    } catch (error) {
      console.error('Markets load error:', error);
      showToast('Failed to load market data');
    } finally {
      setLoading(false);
    }
  };

  const handleResearch = (ticker, name) => {
    if (onSwitchTab) {
      onSwitchTab('learn', `Should a beginner invest in ${name}?`);
    }
  };

  const handleGenerateSummary = async () => {
    try {
      setSummaryLoading(true);
      setSummaryError('');
      const result = await getMarketSummary();
      setSummary(result.summary);
      setKeyTakeaway(result.keyTakeaway);
      setShowSummary(true);
    } catch (error) {
      console.error('Summary error:', error);
      setSummaryError('Failed to generate market summary');
    } finally {
      setSummaryLoading(false);
    }
  };

  if (loading) {
    return (
      <div>
        <div className="section-label">MARKET OVERVIEW</div>
        <div className="grid-four-col" style={{ marginBottom: '24px' }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card" style={{ padding: '14px' }}>
              <div className="skeleton-line" style={{ height: '10px', width: '60%', marginBottom: '6px' }}></div>
              <div className="skeleton-line" style={{ height: '22px', width: '80%', marginBottom: '6px' }}></div>
              <div className="skeleton-line" style={{ height: '20px', width: '40%' }}></div>
            </div>
          ))}
        </div>
        <div className="section-label">STOCK EXPLORER</div>
        <div className="grid-four-col">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="stock-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div className="skeleton-line" style={{ height: '13px', width: '60px', marginBottom: '4px' }}></div>
                  <div className="skeleton-line" style={{ height: '11px', width: '100px' }}></div>
                </div>
                <div className="skeleton-line" style={{ height: '20px', width: '40px' }}></div>
              </div>
              <div className="skeleton-line" style={{ height: '18px', width: '80px', margin: '6px 0' }}></div>
              <div className="skeleton-line" style={{ height: '10px', width: '50%' }}></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Market Overview */}
      <div className="section-label">MARKET OVERVIEW</div>
      <div className="grid-four-col" style={{ marginBottom: '24px' }}>
        {overview.map((data, idx) => {
          const name = INDEX_NAMES[data.symbol] || data.symbol.replace('^', '');
          const isPositive = data.change >= 0;
          return (
            <div key={idx} className="card" style={{ padding: '14px' }}>
              <div style={{ fontSize: '10px', fontWeight: '600', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '6px' }}>
                {name}
              </div>
              <div style={{ fontSize: '22px', fontWeight: '700', marginBottom: '6px' }}>
                {data.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <span className={`badge ${isPositive ? 'badge-positive' : 'badge-negative'}`}>
                {isPositive ? '+' : ''}{data.changePercent.toFixed(2)}%
              </span>
            </div>
          );
        })}
      </div>

      {/* Stock Explorer */}
      <div className="section-label">STOCK EXPLORER</div>
      <div className="grid-four-col" style={{ marginBottom: '24px' }}>
        {stocks.map((stock, idx) => {
          const isPositive = stock.change >= 0;
          return (
            <div key={idx} className="stock-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div className="stock-card-ticker">{stock.symbol}</div>
                  <div className="stock-card-name">{stock.shortName}</div>
                </div>
                <span className={`badge ${isPositive ? 'badge-positive' : 'badge-negative'}`}>
                  {isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%
                </span>
              </div>
              <div className="stock-card-price">
                ${stock.price.toFixed(2)}
              </div>
              <div className="stock-card-range">
                52W: ${stock.fiftyTwoWeekLow?.toFixed(2)} – {stock.fiftyTwoWeekHigh?.toFixed(2)}
              </div>
              <button
                className="stock-card-link"
                onClick={() => handleResearch(stock.symbol, stock.shortName)}
              >
                Research this stock ›
              </button>
            </div>
          );
        })}
      </div>

      {/* Market Summary */}
      <div className="section-label">TODAY'S MARKET SUMMARY</div>
      <div style={{ marginBottom: '16px' }}>
        <button
          className="btn-primary"
          style={{ width: 'auto', display: 'inline-block', padding: '10px 20px' }}
          onClick={handleGenerateSummary}
          disabled={summaryLoading}
        >
          {summaryLoading ? 'Generating...' : 'Explain today\'s market to me ›'}
        </button>
        {summaryError && (
          <div style={{
            background: '#FEF2F2',
            border: '1px solid #FECACA',
            color: '#DC2626',
            borderRadius: '8px',
            padding: '10px 14px',
            fontSize: '13px',
            marginTop: '8px'
          }}>
            {summaryError}
          </div>
        )}
      </div>
      {showSummary && (
        <div className="surface-card" style={{ display: 'block' }}>
          <div className="body-text" style={{ fontSize: '13px', marginBottom: summary && keyTakeaway ? '12px' : '0' }}>
            {summary}
          </div>
          {keyTakeaway && (
            <div className="key-takeaway-box">
              <div className="label">KEY TAKEAWAY</div>
              <div className="takeaway-text">{keyTakeaway}</div>
            </div>
          )}
        </div>
      )}
      <div style={{ height: '60px' }}></div>
    </div>
  );
}
