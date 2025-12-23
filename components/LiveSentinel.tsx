
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';
import { SYSTEM_PROMPT, CLIMATE_VOICE_CONFIG } from '../constants';

// Manual implementation of audio encoding/decoding as per requirements.
function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

const LiveSentinel: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState('Idle');
  const [transcription, setTranscription] = useState('');
  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const outAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const stopSession = () => {
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (outAudioContextRef.current) {
      outAudioContextRef.current.close();
      outAudioContextRef.current = null;
    }
    setIsActive(false);
    setStatus('Disconnected');
  };

  const startSession = async () => {
    try {
      setStatus('Connecting...');
      // Initialize right before connecting to use the latest API key.
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const inCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = inCtx;
      outAudioContextRef.current = outCtx;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: CLIMATE_VOICE_CONFIG },
          systemInstruction: SYSTEM_PROMPT + " Respond only using audio. Be brief and alert.",
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        },
        callbacks: {
          onopen: () => {
            setIsActive(true);
            setStatus('Active');
            const source = inCtx.createMediaStreamSource(stream);
            const scriptProcessor = inCtx.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const int16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) {
                int16[i] = inputData[i] * 32768;
              }
              const pcmBlob = {
                data: encode(new Uint8Array(int16.buffer)),
                mimeType: 'audio/pcm;rate=16000',
              };
              // Always use sessionPromise to avoid stale closures.
              sessionPromise.then(session => session.sendRealtimeInput({ media: pcmBlob }));
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inCtx.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.outputTranscription) {
              setTranscription(prev => prev + message.serverContent?.outputTranscription?.text);
            }
            if (message.serverContent?.turnComplete) {
              setTranscription('');
            }

            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio) {
              const audioCtx = outAudioContextRef.current!;
              // Gapless playback scheduling using nextStartTime variable.
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, audioCtx.currentTime);
              const buffer = await decodeAudioData(decode(base64Audio), audioCtx, 24000, 1);
              const source = audioCtx.createBufferSource();
              source.buffer = buffer;
              source.connect(audioCtx.destination);
              source.onended = () => sourcesRef.current.delete(source);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              sourcesRef.current.add(source);
            }

            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => s.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onerror: (e: any) => {
            console.error('Live Error:', e);
            setStatus('Error occurred');
            stopSession();
          },
          onclose: () => {
            setIsActive(false);
            setStatus('Session Closed');
          }
        }
      });

      sessionRef.current = await sessionPromise;
    } catch (err: any) {
      console.error(err);
      const errorMessage = err?.message || String(err);
      if (errorMessage.includes("Requested entity was not found") || errorMessage.includes("404")) {
        const aistudio = (window as any).aistudio;
        if (aistudio?.openSelectKey) {
          await aistudio.openSelectKey();
        }
      }
      setStatus('Failed to connect');
    }
  };

  useEffect(() => {
    return () => stopSession();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center space-y-8 p-6 bg-white rounded-3xl shadow-sm border border-gray-100 min-h-[400px]">
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-900">Live Resilience Audio</h2>
        <p className="text-sm text-gray-500 mt-1">Talk to EcoGuard hands-free for quick climate alerts.</p>
      </div>

      <div className="relative">
        <div className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-500 ${
          isActive ? 'bg-emerald-600 scale-110 shadow-[0_0_30px_rgba(16,185,129,0.4)]' : 'bg-gray-100'
        }`}>
          {isActive ? (
            <div className="flex items-center space-x-1">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className={`w-1 bg-white rounded-full animate-pulse`} style={{ 
                  height: `${20 + Math.random() * 40}px`,
                  animationDelay: `${i * 0.1}s`
                }}></div>
              ))}
            </div>
          ) : (
            <i className="fa-solid fa-microphone text-4xl text-gray-400"></i>
          )}
        </div>
      </div>

      <div className="text-center space-y-2">
        <p className="text-xs font-bold uppercase tracking-widest text-emerald-600">{status}</p>
        {transcription && (
          <p className="text-gray-600 italic text-sm px-6 max-w-md animate-pulse">"{transcription}"</p>
        )}
      </div>

      <button
        onClick={isActive ? stopSession : startSession}
        className={`px-10 py-3 rounded-full font-bold shadow-lg transition transform active:scale-95 ${
          isActive 
            ? 'bg-rose-500 hover:bg-rose-600 text-white' 
            : 'bg-emerald-600 hover:bg-emerald-700 text-white'
        }`}
      >
        {isActive ? 'Stop Monitoring' : 'Start Live Session'}
      </button>

      <div className="grid grid-cols-2 gap-4 w-full max-w-xs mt-4">
        <div className="p-3 bg-emerald-50 rounded-xl flex flex-col items-center">
          <i className="fa-solid fa-volume-high text-emerald-600 text-sm mb-1"></i>
          <span className="text-[10px] text-emerald-700 font-bold uppercase">Kore Voice</span>
        </div>
        <div className="p-3 bg-blue-50 rounded-xl flex flex-col items-center">
          <i className="fa-solid fa-bolt text-blue-600 text-sm mb-1"></i>
          <span className="text-[10px] text-blue-700 font-bold uppercase">Real-time</span>
        </div>
      </div>
    </div>
  );
};

export default LiveSentinel;
