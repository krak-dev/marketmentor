const API_BASE = '/api';

/**
 * Fetch with error handling
 */
async function fetchJson(url, options = {}) {
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }

  return res.json();
}

/* Learn */
export async function explainTopic(topic) {
  return fetchJson(`${API_BASE}/learn/explain`, {
    method: 'POST',
    body: JSON.stringify({ topic })
  });
}

export function runAgent(question, onLog, onReport, onError) {
  const url = `${API_BASE}/learn/agent?q=${encodeURIComponent(question)}`;
  const eventSource = new EventSource(url);

  eventSource.onmessage = (event) => {
    const { line } = JSON.parse(event.data);
    if (line) {
      // Determine type based on prefix
      let type = 'data';
      if (line.startsWith('✦')) type = 'step';
      else if (line.includes('complete') || line.includes('✓')) type = 'success';
      onLog?.(line, type);
      // Check for error indicators in the line
      if (line.includes('✗') || type === 'error') {
        onError?.(line.replace('✗', '').trim());
      }
    }
  };

  eventSource.addEventListener('done', (event) => {
    const report = JSON.parse(event.data);
    if (report.error) {
      onError?.('Agent failed to complete');
    } else {
      onReport?.(report);
    }
    eventSource.close();
  });

  eventSource.onerror = (error) => {
    console.error('SSE error:', error);
    onError?.('Connection error. Please try again.');
    eventSource.close();
  };

  return eventSource;
}

/* Markets */
export async function getMarketOverview() {
  return fetchJson(`${API_BASE}/markets/overview`);
}

export async function getStocks() {
  return fetchJson(`${API_BASE}/markets/stocks`);
}

export async function getMarketSummary() {
  return fetchJson(`${API_BASE}/markets/summary`, { method: 'POST' });
}

/* Trade */
export async function getPrice(ticker) {
  const params = new URLSearchParams({ ticker });
  return fetchJson(`${API_BASE}/trade/price?${params}`);
}

export async function getPortfolioAdvisor(holdings) {
  return fetchJson(`${API_BASE}/trade/advice`, {
    method: 'POST',
    body: JSON.stringify({ holdings })
  });
}

/* Quiz */
export async function generateQuiz(difficulty, topic) {
  return fetchJson(`${API_BASE}/quiz/generate`, {
    method: 'POST',
    body: JSON.stringify({ difficulty, topic })
  });
}
