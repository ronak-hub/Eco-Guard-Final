
import React, { useRef, useState, useEffect } from 'react';
import { analyzeEnvironmentalImage } from '../services/geminiService';

const EnvironmentalScanner: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
        setError(null);
      }
    } catch (err) {
      console.error(err);
      setError("Unable to access camera. Please check permissions.");
    }
  };

  const stopCamera = () => {
    const stream = videoRef.current?.srcObject as MediaStream;
    stream?.getTracks().forEach(track => track.stop());
    setIsCameraActive(false);
  };

  const captureAndAnalyze = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    setAnalyzing(true);
    setAnalysisResult(null);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);

    const base64Image = canvas.toDataURL('image/jpeg').split(',')[1];

    try {
      const result = await analyzeEnvironmentalImage(base64Image, "Perform an environmental health check. Identify flora, assess plant health, check for signs of pollution or erosion, and determine if climate stress is visible.");
      setAnalysisResult(result);
    } catch (err) {
      console.error(err);
      setError("Analysis failed. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  useEffect(() => {
    return () => stopCamera();
  }, []);

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Environmental Sentinel Scanner</h2>
        <p className="text-gray-500 mt-2">Identify plant health, pollution, or soil erosion in real-time.</p>
      </div>

      <div className="relative aspect-[4/3] bg-black rounded-3xl overflow-hidden shadow-2xl border-4 border-white">
        {!isCameraActive ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-white">
            <i className="fa-solid fa-camera text-5xl mb-4 text-gray-700"></i>
            <button 
              onClick={startCamera}
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-full font-bold transition"
            >
              Activate Scanner
            </button>
            {error && <p className="mt-4 text-rose-400 text-sm px-4 text-center">{error}</p>}
          </div>
        ) : (
          <>
            <video ref={videoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover" />
            <canvas ref={canvasRef} className="hidden" />
            
            {/* Viewfinder Overlay */}
            <div className="absolute inset-0 pointer-events-none border-[30px] border-black/30">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-emerald-400/50 rounded-full"></div>
            </div>

            <div className="absolute bottom-6 inset-x-0 flex justify-center">
              <button 
                onClick={captureAndAnalyze}
                disabled={analyzing}
                className="w-16 h-16 bg-white rounded-full border-4 border-emerald-600 shadow-lg flex items-center justify-center active:scale-95 transition"
              >
                <div className={`w-10 h-10 rounded-full ${analyzing ? 'bg-amber-500 animate-pulse' : 'bg-emerald-600'}`}></div>
              </button>
            </div>
          </>
        )}
      </div>

      {analyzing && (
        <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex items-center space-x-3">
          <div className="w-5 h-5 border-2 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-amber-800 font-medium text-sm">EcoGuard is processing environmental data...</span>
        </div>
      )}

      {analysisResult && (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            <i className="fa-solid fa-clipboard-check text-emerald-500"></i>
            Field Observations
          </h3>
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{analysisResult}</p>
          <button 
            onClick={() => setAnalysisResult(null)}
            className="mt-4 text-xs font-bold text-emerald-600 hover:text-emerald-700 uppercase tracking-widest"
          >
            Reset Scanner
          </button>
        </div>
      )}
    </div>
  );
};

export default EnvironmentalScanner;
