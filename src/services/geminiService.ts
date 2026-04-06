import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function getAreaInfo(areaName: string) {
  try {
    const response = await ai.models.generateContent({
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
