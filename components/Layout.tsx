
import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'dashboard', icon: 'fa-chart-pie', label: 'Sentinel' },
    { id: 'chat', icon: 'fa-comment-dots', label: 'Consult' },
    { id: 'scanner', icon: 'fa-camera', label: 'Scanner' },
    { id: 'live', icon: 'fa-microphone', label: 'Live Mode' },
    { id: 'settings', icon: 'fa-sliders', label: 'Settings' },
  ];

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
      {/* Header */}
      <header className="bg-emerald-600 text-white p-4 shadow-lg flex justify-between items-center z-10">
        <div className="flex items-center space-x-2">
          <div className="bg-white p-1.5 rounded-lg shadow-inner">
            <i className="fa-solid fa-leaf text-emerald-600 text-xl"></i>
          </div>
          <h1 className="text-xl font-bold tracking-tight">EcoGuard AI</h1>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-xs bg-emerald-500 px-2 py-1 rounded-full animate-pulse flex items-center gap-1">
            <div className="w-1.5 h-1.5 bg-green-200 rounded-full"></div> Live Monitoring
          </span>
        </div>
      </header>

      {/* Main Area */}
      <main className="flex-1 overflow-y-auto pb-24 md:pb-4 relative">
        <div className="max-w-6xl mx-auto p-4 lg:p-6">
          {children}
        </div>
      </main>

      {/* Navigation */}
      <nav className="fixed bottom-0 w-full bg-white border-t border-gray-200 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] flex justify-around p-2 z-20">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center p-2 rounded-xl transition-all duration-200 min-w-[65px] ${
              activeTab === tab.id ? 'text-emerald-600 bg-emerald-50' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <i className={`fa-solid ${tab.icon} text-lg mb-1`}></i>
            <span className="text-[10px] font-medium">{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default Layout;
