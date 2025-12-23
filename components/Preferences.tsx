
import React from 'react';
import { AlertPreferences } from '../types';

interface PreferencesProps {
  preferences: AlertPreferences;
  setPreferences: (prefs: AlertPreferences) => void;
}

const Preferences: React.FC<PreferencesProps> = ({ preferences, setPreferences }) => {
  const togglePreference = (key: keyof AlertPreferences) => {
    const newPrefs = { ...preferences, [key]: !preferences[key] };
    setPreferences(newPrefs);
    localStorage.setItem('ecoGuardPrefs', JSON.stringify(newPrefs));
  };

  const options: { id: keyof AlertPreferences; label: string; icon: string; color: string; desc: string }[] = [
    { id: 'wildfires', label: 'Wildfires', icon: 'fa-fire', color: 'text-orange-600', desc: 'Active fire boundaries and air smoke levels.' },
    { id: 'floods', label: 'Floods', icon: 'fa-house-flood-water', color: 'text-blue-600', desc: 'River levels and flash flood warnings.' },
    { id: 'heatwaves', label: 'Heatwaves', icon: 'fa-temperature-arrow-up', color: 'text-red-600', desc: 'Excessive heat advisories and cooling center data.' },
    { id: 'storms', label: 'Storms', icon: 'fa-cloud-bolt', color: 'text-indigo-600', desc: 'Severe thunderstorms, tornadoes, and high winds.' },
    { id: 'airQuality', label: 'Air Quality', icon: 'fa-wind', color: 'text-emerald-600', desc: 'AQI index changes and particulate matter alerts.' },
  ];

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-10">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Sentinel Preferences</h2>
        <p className="text-gray-500 mt-2">Customize which environmental risks EcoGuard AI prioritizes for your region.</p>
      </div>

      <div className="space-y-4">
        {options.map((opt) => (
          <div 
            key={opt.id}
            onClick={() => togglePreference(opt.id)}
            className={`flex items-center justify-between p-5 rounded-3xl border-2 transition-all cursor-pointer group ${
              preferences[opt.id] 
                ? 'bg-emerald-50 border-emerald-500/30 shadow-sm' 
                : 'bg-white border-gray-100 hover:border-gray-200'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-110 ${
                preferences[opt.id] ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-400'
              }`}>
                <i className={`fa-solid ${opt.icon} text-xl`}></i>
              </div>
              <div>
                <h3 className={`font-bold text-lg ${preferences[opt.id] ? 'text-emerald-900' : 'text-gray-900'}`}>
                  {opt.label}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>
              </div>
            </div>

            <div className={`w-12 h-6 rounded-full relative transition-colors duration-300 ${
              preferences[opt.id] ? 'bg-emerald-600' : 'bg-gray-300'
            }`}>
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${
                preferences[opt.id] ? 'left-7' : 'left-1'
              }`}></div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100 mt-8">
        <div className="flex gap-4">
          <i className="fa-solid fa-circle-info text-blue-500 text-xl mt-1"></i>
          <div>
            <h4 className="font-bold text-blue-900">AI Context Injection</h4>
            <p className="text-sm text-blue-800/80 leading-relaxed mt-1">
              These settings are directly injected into the Gemini Sentinel's search context. Disabling a category reduces background noise and improves focus on the risks that matter most to you.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Preferences;
