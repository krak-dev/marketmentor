import React from 'react';

const TABS = [
  { id: 'learn', label: 'Learn' },
  { id: 'markets', label: 'Markets' },
  { id: 'trade', label: 'Paper Trade' },
  { id: 'quiz', label: 'Quiz' }
];

export default function Layout({ activeTab, onTabChange, children }) {
  return (
    <>
      <nav className="nav">
        <div className="nav-content">
          <div className="nav-logo">MarketMentor</div>
          <div className="nav-tabs">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <main className="main-container">
        {children}
      </main>
    </>
  );
}
