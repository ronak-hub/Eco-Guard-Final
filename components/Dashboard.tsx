
import React, { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getClimateRiskAssessment, getRealTimeWeatherAlerts } from '../services/geminiService';
import { GroundingSource, AlertPreferences } from '../types';

interface DashboardProps {
  preferences: AlertPreferences;
}

const mockChartData = [
  { time: '00:00', temp: 18 },
  { time: '04:00', temp: 17 },
  { time: '08:00', temp: 21 },
  { time: '12:00', temp: 26 },
  { time: '16:00', temp: 28 },
  { time: '20:00', temp: 23 },
  { time: '23:59', temp: 19 },
];

const Dashboard: React.FC<DashboardProps> = ({ preferences }) => {
  const [loading, setLoading] = useState(true);
  const [insight, setInsight] = useState<string>('');
  const [sources, setSources] = useState<GroundingSource[]>([]);
  const [alertsInfo, setAlertsInfo] = useState<{ text: string, sources: GroundingSource[], hasAlerts: boolean } | null>(null);

  useEffect(() => {
    const loadSentinelData = async () => {
      try {
        if ("geolocation" in navigator) {
          navigator.geolocation.getCurrentPosition(async (pos) => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;

            // Run requests in parallel using current preferences
            const [insightData, alertsData] = await Promise.all([
              getClimateRiskAssessment({ lat, lng }, "What are the primary climate concerns for this exact region right now?"),
              getRealTimeWeatherAlerts({ lat, lng }, preferences)
            ]);

            setInsight(insightData.text);
            setSources(insightData.sources);
            setAlertsInfo(alertsData);
            setLoading(false);
          }, (err) => {
            console.error("Geo error:", err);
            setLoading(false);
          });
        } else {
          setLoading(false);
        }
      } catch (e) {
        console.error(e);
        setLoading(false);
      }
    };
    loadSentinelData();
  }, [preferences]); // Reload when preferences change

  const activeFocus = Object.entries(preferences)
    .filter(([_, v]) => v)
    .map(([k, _]) => k.replace(/([A-Z])/g, ' $1').toLowerCase())
    .join(", ");

  return (
    <div className="space-y-6">
      {/* Real-time Alerts Banner */}
      {!loading && alertsInfo && (
        <div className={`p-5 rounded-3xl border animate-in fade-in slide-in-from-top-4 duration-700 ${
          alertsInfo.hasAlerts 
            ? 'bg-rose-50 border-rose-200 shadow-sm' 
            : 'bg-emerald-50 border-emerald-100'
        }`}>
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
              alertsInfo.hasAlerts ? 'bg-rose-600 text-white animate-pulse' : 'bg-emerald-600 text-white'
            }`}>
              <i className={`fa-solid ${alertsInfo.hasAlerts ? 'fa-triangle-exclamation' : 'fa-circle-check'} text-xl`}></i>
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-center mb-1">
                <h3 className={`font-bold text-sm uppercase tracking-wider ${alertsInfo.hasAlerts ? 'text-rose-800' : 'text-emerald-800'}`}>
                  {alertsInfo.hasAlerts ? 'Critical Sentinel Warning' : 'Environmental Status: Stable'}
                </h3>
                {alertsInfo.hasAlerts && (
                  <span className="bg-rose-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold animate-pulse">ACTIVE THREAT</span>
                )}
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">
                {alertsInfo.hasAlerts ? alertsInfo.text : "No active critical warnings detected for your active focus areas."}
              </p>
              
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase">Monitoring:</span>
                <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium italic">{activeFocus}</span>
                {alertsInfo.sources.length > 0 && alertsInfo.sources.slice(0, 2).map((s, i) => (
                  <a key={i} href={s.uri} target="_blank" rel="noreferrer" className="text-[10px] text-emerald-600 hover:underline font-bold truncate max-w-[150px]">
                    <i className="fa-solid fa-link mr-1"></i> {s.title}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Status Cards */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 text-xl">
            <i className="fa-solid fa-droplet"></i>
          </div>
          <div>
            <p className="text-gray-500 text-sm">Humidity</p>
            <p className="text-2xl font-bold">64%</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600 text-xl">
            <i className="fa-solid fa-sun"></i>
          </div>
          <div>
            <p className="text-gray-500 text-sm">UV Index</p>
            <p className="text-2xl font-bold">7.2 (High)</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 text-xl">
            <i className="fa-solid fa-wind"></i>
          </div>
          <div>
            <p className="text-gray-500 text-sm">Air Quality</p>
            <p className="text-2xl font-bold">42 (Good)</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart Card */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
            <i className="fa-solid fa-temperature-three-quarters text-emerald-500"></i>
            Temperature Trend
          </h2>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockChartData}>
                <defs>
                  <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9ca3af'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9ca3af'}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                />
                <Area type="monotone" dataKey="temp" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorTemp)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Insight Card */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col h-full">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <i className="fa-solid fa-brain text-emerald-500"></i>
            AI Climate Assessment
          </h2>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
            ) : (
              <div className="prose prose-emerald max-w-none text-sm leading-relaxed text-gray-700">
                <p className="whitespace-pre-wrap">{insight}</p>
                {sources.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Analysis Sources</p>
                    <div className="flex flex-wrap gap-2">
                      {sources.map((s, idx) => (
                        <a 
                          key={idx} 
                          href={s.uri} 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-xs bg-emerald-50 text-emerald-700 px-2 py-1 rounded-md hover:bg-emerald-100 transition"
                        >
                          <i className="fa-solid fa-link mr-1"></i> {s.title}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
