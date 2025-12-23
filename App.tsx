
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import ClimateChat from './components/ClimateChat';
import EnvironmentalScanner from './components/EnvironmentalScanner';
import LiveSentinel from './components/LiveSentinel';
import Preferences from './components/Preferences';
import { AlertPreferences } from './types';

const defaultPrefs: AlertPreferences = {
  wildfires: true,
  floods: true,
  heatwaves: true,
  storms: true,
  airQuality: true
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [preferences, setPreferences] = useState<AlertPreferences>(defaultPrefs);
  const [hasApiKey, setHasApiKey] = useState<boolean>(true);

  useEffect(() => {
    const checkApiKey = async () => {
      // Accessing aistudio via type assertion to avoid conflict with pre-existing global types.
      const aistudio = (window as any).aistudio;
      if (aistudio) {
        const selected = await aistudio.hasSelectedApiKey();
        setHasApiKey(selected);
      }
    };
    checkApiKey();
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('ecoGuardPrefs');
    if (saved) {
      try {
        setPreferences(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load prefs", e);
      }
    }
  }, []);

  const handleOpenKeySelector = async () => {
    const aistudio = (window as any).aistudio;
    if (aistudio) {
      await aistudio.openSelectKey();
      setHasApiKey(true); // Proceed assuming selection or availability as per race condition guidelines.
    }
  };

  const renderContent = () => {
    if (!hasApiKey) {
      return (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center px-6">
          <div className="w-20 h-20 bg-emerald-100 rounded-3xl flex items-center justify-center text-emerald-600 mb-6 shadow-sm">
            <i className="fa-solid fa-key text-3xl"></i>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Sentinel Key Required</h2>
          <p className="text-gray-600 max-w-md mb-8">
            To access advanced environmental monitoring and Gemini 3 Pro intelligence, you need to select an API key from a paid GCP project.
          </p>
          <button 
            onClick={handleOpenKeySelector}
            className="bg-emerald-600 text-white px-8 py-3 rounded-full font-bold shadow-lg hover:bg-emerald-700 transition transform active:scale-95"
          >
            Select API Key
          </button>
          <a 
            href="https://ai.google.dev/gemini-api/docs/billing" 
            target="_blank" 
            rel="noreferrer"
            className="mt-4 text-sm text-emerald-600 hover:underline flex items-center gap-1"
          >
            <i className="fa-solid fa-circle-info"></i> Billing Documentation
          </a>
        </div>
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return <Dashboard preferences={preferences} />;
      case 'chat':
        return <ClimateChat />;
      case 'scanner':
        return <EnvironmentalScanner />;
      case 'live':
        return <LiveSentinel />;
      case 'settings':
        return <Preferences preferences={preferences} setPreferences={setPreferences} />;
      default:
        return <Dashboard preferences={preferences} />;
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      <div className="animate-in fade-in duration-500">
        {renderContent()}
      </div>
    </Layout>
  );
};

export default App;
