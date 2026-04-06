import { GoogleGenAI } from '@google/genai';

let ai: GoogleGenAI | null = null;

function getAI() {
  if (!ai) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('GEMINI_API_KEY is not set. Gemini features will not work.');
    }
    // Initialize even if undefined, it will just fail when calling the API, not on load
    ai = new GoogleGenAI({ apiKey: apiKey || 'dummy-key' });
  }
  return ai;
}

export async function getAreaInfo(areaName: string) {
  try {
    const aiInstance = getAI();
    const response = await aiInstance.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `What are some popular landmarks, restaurants, and the general vibe of ${areaName}, Bangalore? Keep it brief (under 100 words).`,
      config: {
        tools: [{ googleMaps: {} }],
      },
    });

    return {
      text: response.text,
      grounding: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
    };
  } catch (error) {
    console.error('Error fetching area info:', error);
    return null;
  }
}
