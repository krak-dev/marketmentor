import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import learnRoutes from './routes/learn.js';
import marketsRoutes from './routes/markets.js';
import tradeRoutes from './routes/trade.js';
import quizRoutes from './routes/quiz.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// API routes
app.use('/api/learn', learnRoutes);
app.use('/api/markets', marketsRoutes);
app.use('/api/trade', tradeRoutes);
app.use('/api/quiz', quizRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 MarketMentor server running on http://localhost:${PORT}`);
});
