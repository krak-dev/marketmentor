import express from 'express';
import * as claude from '../lib/claude.js';

const router = express.Router();

/**
 * POST /api/quiz/generate
 * Generates a quiz based on topic and difficulty
 */
router.post('/generate', async (req, res) => {
  const { topic, difficulty } = req.body;

  if (!topic || !difficulty) {
    return res.status(400).json({ error: 'Topic and difficulty are required' });
  }

  try {
    const quiz = await claude.generateQuiz(topic, difficulty);
    res.json(quiz);
  } catch (error) {
    console.error('Quiz generation error:', error);
    res.status(500).json({ error: 'Failed to generate quiz' });
  }
});

export default router;
