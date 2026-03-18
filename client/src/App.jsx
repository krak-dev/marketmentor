import React, { useState } from 'react';
import { ToastProvider } from './lib/ToastContext';
import Layout from './components/Layout';
import Learn from './components/Learn';
import Markets from './components/Markets';
import PaperTrade from './components/PaperTrade';
import Quiz from './components/Quiz';
import Cursor from './components/Cursor';

export default function App() {
  const [activeTab, setActiveTab] = useState('learn');
  const [prefillQuestion, setPrefillQuestion] = useState('');

  const handleSwitchTab = (tab, question = null) => {
    setActiveTab(tab);
    if (question) {
      setPrefillQuestion(question);
    } else {
      setPrefillQuestion('');
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'learn':
        return <Learn agentQuestion={prefillQuestion} />;
      case 'markets':
        return <Markets onSwitchTab={handleSwitchTab} />;
      case 'trade':
        return <PaperTrade />;
      case 'quiz':
        return <Quiz />;
      default:
        return null;
    }
  };

  return (
    <>
      <Cursor />
      <ToastProvider>
        <Layout activeTab={activeTab} onTabChange={handleSwitchTab}>
          {renderContent()}
        </Layout>
      </ToastProvider>
    </>
  );
}
