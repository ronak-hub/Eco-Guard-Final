
import React, { useRef, useState, useEffect } from 'react';
import { analyzeEnvironmentalImage, analyzeVideoContent } from '../services/geminiService';

const EnvironmentalScanner: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [mode, setMode] = useState<'image' | 'video'>('image');
  const [isRecording, setIsRecording] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' },
        audio: mode === 'video'
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

  const captureImage = async () => {
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
      const result = await analyzeEnvironmentalImage(base64Image, "Environmental health check focus.");
      setAnalysisResult(result);
    } catch (err) {
      setError("Analysis failed.");
    } finally {
      setAnalyzing(false);
    }
  };

  const startVideoRecording = () => {
    const stream = videoRef.current?.srcObject as MediaStream;
    const recorder = new MediaRecorder(stream);
    mediaRecorderRef.current = recorder;
    const chunks: Blob[] = [];

    recorder.ondataavailable = (e) => chunks.push(e.data);
    recorder.onstop = async () => {
      const videoBlob = new Blob(chunks, { type: 'video/webm' });
      setAnalyzing(true);
      const reader = new FileReader();
      reader.readAsDataURL(videoBlob);
      reader.onloadend = async () => {
        const base64 = (reader.result as string).split(',')[1];
        try {
          const result = await analyzeVideoContent(base64, 'video/webm');
          setAnalysisResult(result);
        } catch (e) {
          setError("Video analysis failed.");
        } finally {
          setAnalyzing(false);
        }
      };
    };

    recorder.start();
    setIsRecording(true);
    setTimeout(() => stopVideoRecording(), 5000); // 5s clips
  };

  const stopVideoRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  useEffect(() => {
    return () => stopCamera();
  }, []);

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex justify-center mb-4">
        <div className="bg-gray-200 p-1 rounded-xl flex gap-1">
          <button 
            onClick={() => setMode('image')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${mode === 'image' ? 'bg-white shadow-sm text-emerald-600' : 'text-gray-500'}`}
          >
            SNAPSHOT
          </button>
          <button 
            onClick={() => setMode('video')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${mode === 'video' ? 'bg-white shadow-sm text-emerald-600' : 'text-gray-500'}`}
          >
            VIDEO SENTINEL
          </button>
        </div>
      </div>

      <div className="relative aspect-[4/3] bg-black rounded-3xl overflow-hidden shadow-2xl border-4 border-white">
        {!isCameraActive ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-white">
            <i className={`fa-solid ${mode === 'image' ? 'fa-camera' : 'fa-video'} text-5xl mb-4 text-gray-700`}></i>
            <button onClick={startCamera} className="px-6 py-2 bg-emerald-600 rounded-full font-bold">Activate Sensor</button>
          </div>
        ) : (
          <>
            <video ref={videoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover" />
            <canvas ref={canvasRef} className="hidden" />
            
            <div className="absolute bottom-6 inset-x-0 flex justify-center">
              <button 
                onClick={mode === 'image' ? captureImage : (isRecording ? stopVideoRecording : startVideoRecording)}
                disabled={analyzing}
                className={`w-16 h-16 bg-white rounded-full border-4 border-emerald-600 shadow-lg flex items-center justify-center transition ${isRecording ? 'scale-110' : ''}`}
              >
                <div className={`w-10 h-10 rounded-full ${mode === 'image' ? 'bg-emerald-600' : (isRecording ? 'bg-rose-500 animate-pulse rounded-sm' : 'bg-rose-500')}`}></div>
              </button>
            </div>
            {isRecording && <div className="absolute top-4 right-4 bg-rose-600 text-white px-3 py-1 rounded-full text-xs font-bold animate-pulse">REC 5s</div>}
          </>
        )}
      </div>

      {analyzing && (
        <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-center space-x-3">
          <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-emerald-800 font-medium text-sm">Gemini {mode === 'video' ? 'Pro' : 'Flash'} is analyzing footage...</span>
        </div>
      )}

      {analysisResult && (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            <i className="fa-solid fa-brain text-emerald-500"></i>
            Sentinel Findings
          </h3>
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{analysisResult}</p>
          <button onClick={() => setAnalysisResult(null)} className="mt-4 text-xs font-bold text-emerald-600 uppercase tracking-widest">Clear Analysis</button>
        </div>
      )}
    </div>
  );
};

export default EnvironmentalScanner;
