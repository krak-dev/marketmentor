# MarketMentor

**AI-Powered Stock Market Education for Beginners**

> "Learn why markets move. Research stocks with AI. Practice risk-free."

## Features

- **Learn**: AI explains any financial concept in plain English
- **Market Research Agent**: Autonomous AI researcher that fetches real stock data and produces beginner-friendly investment briefs
- **Markets**: Live dashboard with real-time market data
- **Paper Trade**: Simulate investing with $10,000 virtual money
- **Quiz**: AI-generated adaptive financial literacy quizzes

## Tech Stack

- **Frontend**: React + Vite + CSS (no framework — styles copied exactly from demo.html)
- **Backend**: Node.js + Express
- **AI**: Anthropic Claude API (claude-sonnet-4-20250514)
- **Data**: Yahoo Finance (yahoo-finance2)
- **Storage**: localStorage for paper trading portfolio

## Project Structure

```
marketmentor/
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout.jsx
│   │   │   ├── Learn.jsx
│   │   │   ├── Markets.jsx
│   │   │   ├── PaperTrade.jsx
│   │   │   └── Quiz.jsx
│   │   ├── lib/
│   │   │   ├── api.js
│   │   │   └── ToastContext.jsx
│   │   ├── index.css
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
├── server/
│   ├── routes/
│   │   ├── learn.js
│   │   ├── markets.js
│   │   ├── trade.js
│   │   └── quiz.js
│   ├── lib/
│   │   └── claude.js
│   └── index.js
├── .env.example
├── .gitignore
├── README.md
└── LICENSE
```

## Setup Instructions

### 1. Install Dependencies

```bash
# Install root dependencies
npm install

# Install client dependencies
cd client && npm install && cd ..

# Install server dependencies
cd server && npm install && cd ..
```

### 2. Configure Environment

```bash
cd server
cp .env.example .env
```

Edit `.env` and add your Anthropic API key:

```
ANTHROPIC_API_KEY=your_api_key_here
PORT=3001
```

### 3. Run the Application

```bash
# From the root, run both servers
npm run dev
```

Or manually in two terminals:

```bash
# Terminal 1 - Backend
cd server && npm start

# Terminal 2 - Frontend
cd client && npm run dev
```

Open http://localhost:5173 in your browser.

## API Endpoints

### Learn
- `POST /api/learn/explain` — Get AI explanation for a topic
- `GET /api/learn/agent?q=...` — SSE stream of agent research (plain text log lines)

### Markets
- `GET /api/markets/overview` — Major indices data
- `GET /api/markets/stocks` — Stock data for 8 popular tickers
- `POST /api/markets/summary` — AI-generated market summary

### Paper Trade
- `GET /api/trade/price?ticker=...` — Current stock price
- `POST /api/trade/advice` — Portfolio analysis

### Quiz
- `POST /api/quiz/generate` — Generate quiz (returns questions + nextTopics)

## Visual Fidelity

This React implementation is **pixel-identical** to `demo.html`. All CSS variables, class names, spacing, fonts, and component structures are copied exactly from the demo. No Tailwind or CSS frameworks are used — just plain CSS matching the original design.

Key design tokens from `index.css`:

```css
--bg: #FFFFFF; --surface: #F9F9F9; --border: #E8E8E8;
--text: #111111; --body: #333333; --muted: #888888;
--up: #16A34A; --up-bg: #F0FDF4; --up-border: #BBF7D0;
--down: #DC2626; --down-bg: #FEF2F2; --down-border: #FECACA;
```

## The Market Research Agent

The flagship feature — an autonomous agent that:

1. Parses user questions to extract stock tickers
2. Fetches real-time market data from Yahoo Finance
3. Analyzes price history and computes volatility metrics
4. Streams step-by-step logs to the client via SSE
5. Synthesizes everything into a plain-English beginner investment brief

Example log output:

```
✦ Parsing query...
  → Detected ticker: NVDA
✦ Fetching current market data...
  → Price: $879.44  |  Change: -1.38%
  → P/E Ratio: 68.4  |  Market Cap: $2.17T
✦ Analyzing price history...
  → 52W Range: $402.16 – $974.00
  → Currently 9.7% below 52W high
✦ Assessing volatility for beginners...
  → Recent volatility: HIGH
  → Risk level for beginners: HIGH
✦ Running AI synthesis...
  → Analyzing all data points...
  → Generating beginner investment brief...
✦ Research complete. ✓
```

---

Built for **Hackonomics 2026**
