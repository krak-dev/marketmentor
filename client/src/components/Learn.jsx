import React, { useState, useEffect, useRef } from 'react';
import { explainTopic, runAgent } from '../lib/api';
import { useToast } from '../lib/ToastContext';

const QUICK_TOPICS = [
  'What is a stock?',
  'How do markets work?',
  'What is a P/E ratio?',
  'What moves stock prices?',
  'What is diversification?',
  'Bull vs bear market?',
  'What is compound interest?',
  'What is an ETF?'
];

export default function Learn({ agentQuestion = '' }) {
  const { showToast } = useToast();
  const [customQuestion, setCustomQuestion] = useState('');
  const [agentQuestionInput, setAgentQuestionInput] = useState(agentQuestion);
  const [isLoading, setIsLoading] = useState(false);
  const [explainError, setExplainError] = useState('');
  const [agentError, setAgentError] = useState('');
  const [outputMode, setOutputMode] = useState('placeholder'); // 'placeholder' | 'explain' | 'agent'
  const [explanation, setExplanation] = useState(null);
  const [agentLog, setAgentLog] = useState([]);
  const [agentReport, setAgentReport] = useState(null);
  const logEndRef = useRef(null);

  // Auto-scroll log
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [agentLog]);

  // Sync prop to local state
  useEffect(() => {
    setAgentQuestionInput(agentQuestion);
    if (agentQuestion) {
      // Auto-run agent if prefill question is provided
      handleRunAgent();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentQuestion]);

  // Handle quick topic click
  const handleQuickTopic = async (topic) => {
    try {
      setExplainError('');
      setIsLoading(true);
      setOutputMode('explain');
      setExplanation(null);
      setAgentReport(null);
      setAgentLog([]);

      const result = await explainTopic(topic);
      setExplanation({
        heading: result.heading || topic,
        explanation: result.explanation,
        keyTakeaway: result.keyTakeaway,
        relatedTopics: result.relatedTopics || ['What is a stock?', 'How do markets work?']
      });
    } catch (error) {
      console.error(error);
      setExplainError(error.message || 'Failed to load explanation');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle custom explain
  const handleCustomExplain = async () => {
    if (!customQuestion.trim()) return;
    try {
      setExplainError('');
      setIsLoading(true);
      setOutputMode('explain');
      setExplanation(null);
      setAgentReport(null);
      setAgentLog([]);

      const result = await explainTopic(customQuestion);
      setExplanation({
        heading: 'Explanation',
        explanation: result.explanation,
        keyTakeaway: result.keyTakeaway,
        relatedTopics: result.relatedTopics || []
      });
    } catch (error) {
      console.error(error);
      setExplainError(error.message || 'Failed to load explanation');
    } finally {
      setIsLoading(false);
    }
  };

  // Run agent
  const handleRunAgent = () => {
    if (!agentQuestionInput.trim()) return;

    setAgentError('');
    setIsLoading(true);
    setAgentLog([]);
    setAgentReport(null);
    setOutputMode('agent');

    const eventSource = runAgent(
      agentQuestionInput,
      (message, type) => {
        setAgentLog(prev => [...prev, { message, type }]);
      },
      (report) => {
        setAgentReport(report);
        setIsLoading(false);
        showToast('Research complete');
      },
      (errorMsg) => {
        setAgentError(errorMsg);
        setIsLoading(false);
      }
    );

    // Cleanup on unmount or if component unmounts
    return () => eventSource?.close();
  };

  // Save to notes
  const handleSaveToNotes = () => {
    const data = outputMode === 'explain' ? explanation : agentReport;
    if (!data) return;

    const note = {
      mode: outputMode,
      title: outputMode === 'explain' ? explanation.heading : 'Agent Report',
      content: outputMode === 'explain' ? explanation.explanation : agentReport.report,
      keyTakeaway: outputMode === 'explain' ? explanation.keyTakeaway : agentReport.keyTakeaway,
      riskLevel: outputMode === 'agent' ? agentReport.riskLevel : null,
      timestamp: new Date().toISOString()
    };

    const existing = JSON.parse(localStorage.getItem('mm_notes') || '[]');
    existing.push(note);
    localStorage.setItem('mm_notes', JSON.stringify(existing));
    showToast('Saved to Notes');
  };

  return (
    <div className="grid-two-col">
      {/* LEFT PANEL */}
      <div className="surface-card">
        <div className="section-label">QUICK TOPICS</div>
        <div className="grid-two-equal">
          {QUICK_TOPICS.map((topic, idx) => (
            <button
              key={idx}
              className="btn-secondary"
              onClick={() => handleQuickTopic(topic)}
              disabled={isLoading}
            >
              {topic}
            </button>
          ))}
        </div>

        <div className="divider"></div>

        <div className="section-label">ASK ANYTHING</div>
        <div className="field-group">
          <input
            type="text"
            value={customQuestion}
            onChange={(e) => setCustomQuestion(e.target.value)}
            placeholder="e.g. Why do interest rates affect stocks?"
          />
        </div>
        <button
          className="btn-primary"
          onClick={handleCustomExplain}
          disabled={isLoading}
        >
          Explain to me ›
        </button>
        {explainError && (
          <div style={{
            background: '#FEF2F2',
            border: '1px solid #FECACA',
            color: '#DC2626',
            borderRadius: '8px',
            padding: '10px 14px',
            fontSize: '13px',
            marginTop: '8px'
          }}>
            {explainError}
          </div>
        )}

        <div className="divider"></div>

        <div className="section-label">MARKET RESEARCH AGENT</div>
        <p style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '10px' }}>
          Fetches real data and explains it step by step
        </p>
        <div className="field-group">
          <input
            type="text"
            value={agentQuestionInput}
            onChange={(e) => setAgentQuestionInput(e.target.value)}
            placeholder="e.g. Should a beginner invest in NVIDIA?"
          />
        </div>
        <button
          className="btn-primary"
          onClick={handleRunAgent}
          disabled={isLoading}
        >
          {isLoading && outputMode === 'agent' ? 'Running Agent...' : 'Run Agent ›'}
        </button>
        {agentError && (
          <div style={{
            background: '#FEF2F2',
            border: '1px solid #FECACA',
            color: '#DC2626',
            borderRadius: '8px',
            padding: '10px 14px',
            fontSize: '13px',
            marginTop: '8px'
          }}>
            {agentError}
          </div>
        )}
      </div>

      {/* RIGHT PANEL */}
      <div className="card output-panel" style={{ minHeight: outputMode === 'agent' ? '520px' : '420px', overflowY: 'auto' }}>
        {outputMode === 'placeholder' && (
          <div style={{ paddingTop: '80px', textAlign: 'center', color: '#bbb', fontSize: '14px' }}>
            Select a topic or ask a question to get started.
          </div>
        )}

        {isLoading && outputMode !== 'agent' && (
          <div>
            <div className="skeleton-line" style={{ height: '14px', width: '100%' }}></div>
            <div className="skeleton-line" style={{ height: '14px', width: '82%' }}></div>
            <div className="skeleton-line" style={{ height: '14px', width: '58%' }}></div>
          </div>
        )}

        {outputMode === 'explain' && explanation && !isLoading && (
          <div>
            <div className="card-heading">{explanation.heading}</div>
            <div className="body-text" style={{ fontSize: '14px', marginBottom: '12px' }}>
              {explanation.explanation}
            </div>
            <div className="key-takeaway-box">
              <div className="label">KEY TAKEAWAY</div>
              <div className="takeaway-text">{explanation.keyTakeaway}</div>
            </div>
            <div className="related-pills">
              {explanation.relatedTopics.map((topic, idx) => (
                <button key={idx} className="related-pill">
                  {topic}
                </button>
              ))}
            </div>
          </div>
        )}

        {outputMode === 'agent' && (
          <div>
            {/* Agent Log */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: '600' }}>Agent Log</span>
              {(agentLog.length > 0 || isLoading) && (
                <span className={`pulse-dot ${!isLoading ? 'solid' : ''}`}></span>
              )}
            </div>
            <div className="agent-log">
              {agentLog.map((line, idx) => (
                <div
                  key={idx}
                  style={{
                    color: line.type === 'step' ? 'var(--text)' : line.type === 'data' ? 'var(--muted)' : line.type === 'success' ? 'var(--up)' : 'var(--down)',
                    fontWeight: line.type === 'step' || line.type === 'success' ? '600' : 'normal'
                  }}
                >
                  {line.message}
                </div>
              ))}
              <div ref={logEndRef} />
            </div>

            {/* Report */}
            {agentReport && (
              <div style={{ opacity: 1, marginTop: '16px' }}>
                <div className="section-label">BEGINNER'S INVESTMENT BRIEF</div>
                <div className="body-text" style={{ fontSize: '13px', marginBottom: '12px' }}>
                  {agentReport.report}
                </div>
                <div className="key-takeaway-box">
                  <div className="label">KEY TAKEAWAY</div>
                  <div className="takeaway-text">{agentReport.keyTakeaway}</div>
                </div>
                <div style={{ marginTop: '12px' }}>
                  <span className={`badge ${
                    agentReport.riskLevel === 'High' ? 'badge-negative' :
                    agentReport.riskLevel === 'Medium' ? 'badge-neutral' : 'badge-positive'
                  }`}>
                    {agentReport.riskLevel} Risk for Beginners
                  </span>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--muted)', fontStyle: 'italic', marginTop: '8px' }}>
                  Educational content only — not financial advice.
                </p>
                <button
                  className="related-pill"
                  style={{ marginTop: '12px' }}
                  onClick={handleSaveToNotes}
                >
                  Save to Notes
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
