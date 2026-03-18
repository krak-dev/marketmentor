import React, { useState } from 'react';
import { generateQuiz } from '../lib/api';
import { useToast } from '../lib/ToastContext';

const TOPICS = ['Stocks', 'Markets', 'Investing', 'Economics', 'Mixed'];
const DIFFICULTIES = ['Beginner', 'Intermediate', 'Advanced'];

export default function Quiz({ onSwitchTab }) {
  const { showToast } = useToast();
  const [difficulty, setDifficulty] = useState('Beginner');
  const [topic, setTopic] = useState('Stocks');
  const [quizState, setQuizState] = useState('setup'); // 'setup' | 'quiz' | 'score'
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [recommendations, setRecommendations] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [quizError, setQuizError] = useState('');

  const handleGenerateQuiz = async () => {
    setQuizError('');
    setGenerating(true);
    try {
      const result = await generateQuiz(difficulty, topic);
      setQuestions(result.questions);
      setRecommendations(result.nextTopics || []);
      setCurrentIndex(0);
      setSelectedOption(null);
      setShowExplanation(false);
      setScore(0);
      setQuizState('quiz');
    } catch (error) {
      console.error('Quiz error:', error);
      setQuizError('Failed to generate quiz');
    } finally {
      setGenerating(false);
    }
  };

  const handleAnswer = (index) => {
    if (selectedOption !== null) return;
    const question = questions[currentIndex];
    const isCorrect = index === question.correctIndex;
    setSelectedOption(index);
    if (isCorrect) {
      setScore((prev) => prev + 1);
    }
    setShowExplanation(true);
  };

  const handleNextQuestion = () => {
    if (currentIndex < 4) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setShowExplanation(false);
    } else {
      setQuizState('score');
    }
  };

  const handleRetake = () => {
    setQuizState('setup');
    setQuestions([]);
    setRecommendations([]);
  };

  // Determine badge
  const getBadge = () => {
    if (score === 5) return { label: 'Expert', className: 'badge-positive' };
    if (score >= 3) return { label: 'On Track', className: 'badge-neutral' };
    return { label: 'Keep Learning', className: 'badge-negative' };
  };

  // Score color
  const getScoreColor = () => {
    if (score >= 4) return 'var(--up)';
    if (score >= 2) return 'var(--neutral-text)'; // amber not available, use neutral
    return 'var(--down)';
  };

  // Setup state
  if (quizState === 'setup') {
    return (
      <div style={{ maxWidth: '640px', margin: '0 auto' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', letterSpacing: '-0.5px', marginBottom: '6px' }}>Test Your Knowledge</h1>
          <p style={{ fontSize: '14px', color: 'var(--muted)', marginBottom: '24px' }}>AI-generated questions based on real market concepts.</p>
        </div>
        <div className="card">
          <div className="section-label">DIFFICULTY</div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
            {DIFFICULTIES.map((d) => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className={`quiz-pill ${difficulty === d ? 'selected' : ''}`}
              >
                {d}
              </button>
            ))}
          </div>
          <div className="section-label">TOPIC</div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
            {TOPICS.map((t) => (
              <button
                key={t}
                onClick={() => setTopic(t)}
                className={`quiz-pill ${topic === t ? 'selected' : ''}`}
              >
                {t}
              </button>
            ))}
          </div>
          <button
            className="btn-primary"
            style={{ fontSize: '14px', padding: '12px 18px' }}
            onClick={handleGenerateQuiz}
            disabled={generating}
          >
            {generating ? 'Generating...' : 'Generate Quiz ›'}
          </button>
          {quizError && (
            <div style={{
              background: '#FEF2F2',
              border: '1px solid #FECACA',
              color: '#DC2626',
              borderRadius: '8px',
              padding: '10px 14px',
              fontSize: '13px',
              marginTop: '8px'
            }}>
              {quizError}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Score state
  if (quizState === 'score') {
    const badge = getBadge();
    return (
      <div style={{ maxWidth: '640px', margin: '0 auto' }}>
        <div className="card" style={{ textAlign: 'center', padding: '32px 20px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '4px' }}>Quiz Complete!</h2>
          <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '24px' }}>{topic} • {difficulty}</p>
          <div style={{ fontSize: '52px', fontWeight: '700', color: getScoreColor(), marginBottom: '16px' }}>
            {score}/5
          </div>
          <span className={badge.className} style={{ fontSize: '13px', padding: '5px 14px', marginBottom: '24px', display: 'inline-block' }}>
            {badge.label}
          </span>
          {recommendations.length > 0 && (
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px', marginTop: '8px' }}>
              <div className="section-label" style={{ textAlign: 'center' }}>What to study next:</div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                {recommendations.map((rec, idx) => (
                  <span key={idx} className="badge badge-neutral" style={{ fontFamily: 'inherit', fontSize: '12px' }}>
                    {rec}
                  </span>
                ))}
              </div>
            </div>
          )}
          <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
            <button
              className="btn-secondary"
              style={{ flex: 1, padding: '10px' }}
              onClick={handleRetake}
            >
              Retake Quiz
            </button>
            <button
              className="btn-primary"
              style={{ flex: 1, marginTop: 0, padding: '10px' }}
              onClick={() => onSwitchTab && onSwitchTab('learn')}
            >
              Learn These Topics ›
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Question state
  const question = questions[currentIndex];
  return (
    <div style={{ maxWidth: '640px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div>
          <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '2px' }}>Question {currentIndex + 1} of 5</div>
          <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{topic} • {difficulty}</div>
        </div>
        <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
          Score: {score}/{currentIndex}
        </div>
      </div>
      <div className="card">
        <p style={{ fontSize: '15px', fontWeight: '500', color: 'var(--text)', lineHeight: '1.5', marginBottom: '20px' }}>
          {question.question}
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {question.options.map((option, idx) => {
            let btnClass = 'btn-secondary';
            // Button style from demo: padding 12px 16px, text-align left, font-size 13px
            let style = { padding: '12px 16px', textAlign: 'left', fontSize: '13px' };
            if (selectedOption !== null) {
              if (idx === question.correctIndex) {
                style = { ...style, background: 'var(--up-bg)', border: '1px solid var(--up-border)', color: 'var(--up)' };
              } else if (idx === selectedOption) {
                style = { ...style, opacity: 0.38 };
              }
            }
            return (
              <button
                key={idx}
                onClick={() => handleAnswer(idx)}
                disabled={selectedOption !== null}
                className={btnClass}
                style={style}
              >
                {option}
              </button>
            );
          })}
        </div>
        {showExplanation && (
          <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
            <div style={{ fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', color: 'var(--up)', marginBottom: '8px' }}>
              WHY THIS IS CORRECT
            </div>
            <p style={{ fontSize: '13px', color: 'var(--body)', lineHeight: '1.6' }}>
              {question.explanation}
            </p>
          </div>
        )}
        {selectedOption !== null && (
          <button
            className="btn-primary"
            style={{ marginTop: '16px' }}
            onClick={handleNextQuestion}
          >
            {currentIndex === 4 ? 'See Results' : 'Next Question ›'}
          </button>
        )}
      </div>
    </div>
  );
}
