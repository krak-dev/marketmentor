import Anthropic from '@anthropic-ai/sdk';

const anth = new Anthropic();

/**
 * Get an explanation for a financial concept or question
 * @param {string} topic - The topic or question to explain
 * @returns {Promise<Object>} - { heading, explanation, keyTakeaway, relatedTopics }
 */
export async function explainTopic(topic) {
  try {
    const msg = await anth.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: `You are MarketMentor, a financial literacy tutor for absolute beginners.
Your job is to explain financial concepts in plain, simple English that anyone can understand.
Use analogies, avoid jargon, and be encouraging.
Structure your response with clear paragraphs.
End with a "KEY TAKEAWAY" sentence that summarizes the core idea.
Also provide 3 related topics the user might want to explore next (just the topic names).
Return ONLY valid JSON with this exact structure:
{
  "heading": "Topic Title",
  "explanation": "Full explanation with paragraphs...",
  "keyTakeaway": "One sentence summary",
  "relatedTopics": ["Topic 1", "Topic 2", "Topic 3"]
}`,
      messages: [
        {
          role: 'user',
          content: `Explain this in simple terms for a complete beginner: "${topic}"`
        }
      ]
    });

    const text = msg.content[0].text;
    const jsonMatch = text.match(/\{.*\}/s);
    if (!jsonMatch) {
      throw new Error('Invalid JSON response from Claude');
    }
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Claude explain error:', error);
    throw new Error('Failed to generate explanation');
  }
}

/**
 * Get market summary for today's market conditions
 * @param {Object} marketData - Data about major indices and movers
 * @returns {Promise<Object>} - { summary, keyTakeaway }
 */
export async function getMarketSummary(marketData) {
  try {
    const msg = await anth.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: `You are MarketMentor, a financial literacy tutor for beginners.
Based on the current market data provided, write a 2-3 paragraph summary
explaining what's happening in today's market in plain English.
Focus on what the numbers mean for someone new to investing.
Be educational, not alarmist. End with a KEY TAKEAWAY sentence.
Return ONLY valid JSON with this exact structure:
{
  "summary": "2-3 paragraphs...",
  "keyTakeaway": "One sentence"
}`,
      messages: [
        {
          role: 'user',
          content: `Here's today's market data:\n\n${JSON.stringify(marketData, null, 2)}\n\nExplain this to a beginner.`
        }
      ]
    });

    const text = msg.content[0].text;
    const jsonMatch = text.match(/\{.*\}/s);
    if (!jsonMatch) {
      throw new Error('Invalid JSON response from Claude');
    }
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Claude market summary error:', error);
    throw new Error('Failed to generate market summary');
  }
}

/**
 * Synthesize stock research data into a beginner-friendly investment brief
 * @param {Object} stockData - Collected stock data from yahoo-finance2
 * @returns {Promise<Object>} - { report, keyTakeaway, riskLevel }
 */
export async function synthesizeAgentResearch(stockData) {
  try {
    const msg = await anth.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: `You are MarketMentor, a financial literacy tutor for beginners.
You have just researched a stock using real market data. Your job is to
explain what this data means in plain English for someone who has never
invested before.

Write a 3-paragraph educational brief:
- Para 1: What this company does and what the current price tells us
- Para 2: What the data signals (is it expensive? trending? volatile?)
- Para 3: What a beginner should think about before investing

End with one KEY TAKEAWAY sentence.
Be educational, encouraging, and honest. Never say 'buy' or 'sell'.
Always remind them this is for learning, not advice.

Return ONLY valid JSON with this exact structure:
{
  "report": "three paragraphs with \\n\\n between them",
  "keyTakeaway": "one sentence",
  "riskLevel": "Low | Medium | High"
}`,
      messages: [
        {
          role: 'user',
          content: `Stock data for analysis:\n\n${JSON.stringify(stockData, null, 2)}`
        }
      ]
    });

    const text = msg.content[0].text;
    const jsonMatch = text.match(/\{.*\}/s);
    if (!jsonMatch) {
      throw new Error('Invalid JSON response from Claude');
    }
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Claude synthesis error:', error);
    throw new Error('Failed to synthesize research');
  }
}

/**
 * Analyze a portfolio and provide educational feedback
 * @param {Object} portfolio - { cash, totalReturn, holdings: [{ticker, shares, avgCost, currentPrice, value, return}] }
 * @returns {Promise<string>} - Portfolio analysis
 */
export async function analyzePortfolio(portfolio) {
  try {
    const msg = await anth.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: `You are MarketMentor, a financial literacy tutor for beginners.
Analyze the provided portfolio data and write 2 paragraphs of educational feedback.
Focus on what the portfolio composition and performance teach us about investing principles.
Provide one actionable tip the user can apply to their learning journey.
Be constructive and educational, not judgmental.`,
      messages: [
        {
          role: 'user',
          content: `Here's my paper trading portfolio:\n\n${JSON.stringify(portfolio, null, 2)}`
        }
      ]
    });

    return msg.content[0].text;
  } catch (error) {
    console.error('Claude portfolio analysis error:', error);
    throw new Error('Failed to analyze portfolio');
  }
}

/**
 * Generate a quiz based on topic and difficulty
 * @param {string} topic - Quiz topic
 * @param {string} difficulty - Beginner, Intermediate, Advanced
 * @returns {Promise<Object>} - { questions: [], nextTopics: [] }
 */
export async function generateQuiz(topic, difficulty) {
  try {
    const msg = await anth.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      system: `You are MarketMentor, a financial literacy quiz generator.
Create 5 multiple-choice questions for the specified topic and difficulty level.

Difficulty guidelines:
- Beginner: Basic concepts, simple terminology
- Intermediate: More nuanced, some calculations
- Advanced: Complex scenarios, deeper understanding

Also suggest 2 topics the user should study next based on this quiz's content.

Return ONLY valid JSON with this exact structure:
{
  "questions": [
    {
      "id": 1,
      "question": "Question text?",
      "options": ["A. Option 1", "B. Option 2", "C. Option 3", "D. Option 4"],
      "correctIndex": 0,
      "explanation": "2-sentence explanation of why this is correct"
    }
  ],
  "nextTopics": ["Topic 1", "Topic 2"]
}`,
      messages: [
        {
          role: 'user',
          content: `Generate 5 ${difficulty.toLowerCase()} level questions about ${topic}.`
        }
      ]
    });

    const text = msg.content[0].text;
    const jsonMatch = text.match(/\{.*\}/s);
    if (!jsonMatch) {
      throw new Error('Invalid JSON response from Claude');
    }
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Claude quiz generation error:', error);
    throw new Error('Failed to generate quiz');
  }
}
