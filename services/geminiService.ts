
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { SYSTEM_PROMPT } from "../constants";
import { AlertPreferences } from "../types";

// Helper to handle the "Requested entity was not found" error which indicates a need for key selection.
const handleGeminiError = async (err: any) => {
  const errorMessage = err?.message || String(err);
  if (errorMessage.includes("Requested entity was not found") || errorMessage.includes("404")) {
    console.warn("Model not found or key selection required. Triggering key selection dialog.");
    const aistudio = (window as any).aistudio;
    if (aistudio?.openSelectKey) {
      await aistudio.openSelectKey();
    }
  }
  throw err;
};

// Always create a new client instance using the environment's current API key.
export const getGeminiClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

// Use gemini-3-flash-preview for general search grounding tasks as recommended.
export async function getClimateRiskAssessment(location: { lat: number, lng: number }, query: string) {
  try {
    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze local climate risks for location [${location.lat}, ${location.lng}]. Query: ${query}`,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        tools: [{ googleSearch: {} }],
      },
    });

    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
      title: chunk.web?.title || 'Source',
      uri: chunk.web?.uri || '',
    })) || [];

    return {
      text: response.text,
      sources,
    };
  } catch (err) {
    return handleGeminiError(err);
  }
}

// Pro-Thinking for complex environmental queries.
export async function chatWithProThinking(message: string, useThinking: boolean = false) {
  try {
    const ai = getGeminiClient();
    const config: any = {
      systemInstruction: SYSTEM_PROMPT,
    };

    if (useThinking) {
      config.thinkingConfig = { thinkingBudget: 32768 };
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: message,
      config,
    });

    return response.text;
  } catch (err) {
    return handleGeminiError(err);
  }
}

// Simple text transcription task using Flash model.
export async function transcribeAudio(base64Audio: string) {
  try {
    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { data: base64Audio, mimeType: 'audio/wav' } },
          { text: "Transcribe this audio exactly as it is spoken. Provide only the transcription." }
        ]
      }
    });
    return response.text;
  } catch (err) {
    return handleGeminiError(err);
  }
}

// Environmental footage analysis using high-quality multimodal Pro model.
export async function analyzeVideoContent(base64Video: string, mimeType: string) {
  try {
    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          { inlineData: { data: base64Video, mimeType } },
          { text: "Analyze this environmental footage. Describe any climate-related events, environmental changes, or risks visible over time." }
        ]
      },
      config: {
        systemInstruction: SYSTEM_PROMPT
      }
    });
    return response.text;
  } catch (err) {
    return handleGeminiError(err);
  }
}

// Grounding weather alerts using Google Search.
export async function getRealTimeWeatherAlerts(location: { lat: number, lng: number }, preferences: AlertPreferences) {
  try {
    const ai = getGeminiClient();
    
    const focusAreas = Object.entries(preferences)
      .filter(([_, active]) => active)
      .map(([key, _]) => key)
      .join(", ");

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Search for active weather alerts specifically focusing on these categories: [${focusAreas}]. 
      The target location is [${location.lat}, ${location.lng}]. 
      If there are no critical active warnings for these specific categories, state "Clear".`,
      config: {
        systemInstruction: "You are a weather alert dispatcher. Prioritize official meteorological office data.",
        tools: [{ googleSearch: {} }],
      },
    });

    const rawChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = rawChunks.map((chunk: any) => ({
      title: chunk.web?.title || 'Weather Source',
      uri: chunk.web?.uri || '',
    }));

    return {
      text: response.text,
      sources,
      hasAlerts: !response.text.toLowerCase().includes("clear") && response.text.length > 15
    };
  } catch (err) {
    return handleGeminiError(err);
  }
}

// Environmental image assessment using 2.5 Flash Image.
export async function analyzeEnvironmentalImage(base64Image: string, prompt: string) {
  try {
    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { inlineData: { data: base64Image, mimeType: 'image/jpeg' } },
          { text: prompt || "Analyze this image for environmental health or climate-related concerns." }
        ]
      },
      config: {
        systemInstruction: SYSTEM_PROMPT,
      }
    });

    return response.text;
  } catch (err) {
    return handleGeminiError(err);
  }
}
