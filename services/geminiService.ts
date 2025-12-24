
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { SYSTEM_PROMPT } from "../constants";
import { AlertPreferences } from "../types";

export const getGeminiClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
};

export async function getClimateRiskAssessment(location: { lat: number, lng: number }, query: string) {
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
}

export async function getRealTimeWeatherAlerts(location: { lat: number, lng: number }, preferences: AlertPreferences) {
  const ai = getGeminiClient();
  
  // Create a list of active focus areas based on preferences
  const focusAreas = Object.entries(preferences)
    .filter(([_, active]) => active)
    .map(([key, _]) => key)
    .join(", ");

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Search for active weather alerts specifically focusing on these categories: [${focusAreas}]. 
    The target location is [${location.lat}, ${location.lng}]. 
    If there are no critical active warnings for these specific categories, state "Clear". 
    Otherwise, provide a concise summary of the risks found.`,
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
}

export async function analyzeEnvironmentalImage(base64Image: string, prompt: string) {
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
}

export const CLIMATE_INSIGHT_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    temperature: { type: Type.NUMBER },
    humidity: { type: Type.NUMBER },
    aqi: { type: Type.NUMBER },
    riskLevel: { type: Type.STRING, enum: ['Low', 'Moderate', 'High', 'Extreme'] },
    recommendations: {
      type: Type.ARRAY,
      items: { type: Type.STRING }
    }
  },
  required: ['temperature', 'riskLevel', 'recommendations']
};
