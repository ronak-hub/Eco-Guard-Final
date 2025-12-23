
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
  }, [preferences]);

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
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">
                {alertsInfo.text}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 text-xl"><i className="fa-solid fa-droplet"></i></div>
          <div>
            <p className="text-gray-500 text-sm">Humidity</p>
            <p className="text-2xl font-bold">64%</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600 text-xl"><i className="fa-solid fa-sun"></i></div>
          <div>
            <p className="text-gray-500 text-sm">UV Index</p>
            <p className="text-2xl font-bold">7.2</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 text-xl"><i className="fa-solid fa-wind"></i></div>
          <div>
            <p className="text-gray-500 text-sm">Air Quality</p>
            <p className="text-2xl font-bold">42</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <i className="fa-solid fa-bolt text-amber-400"></i>
            Fast Environmental Insights
          </h2>
          <div className="flex items-center gap-2">
             <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded font-bold">GEMINI FLASH LITE</span>
          </div>
        </div>
        {loading ? (
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
          </div>
        ) : (
          <div className="prose prose-emerald max-w-none text-sm leading-relaxed text-gray-700">
            <p className="whitespace-pre-wrap">{insight}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
