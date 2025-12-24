
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

  const renderContent = () => {
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
