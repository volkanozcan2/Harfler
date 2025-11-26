import { GoogleGenAI } from "@google/genai";
import { SelectedContext } from "../types";

// Helper to initialize AI safely
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateLetterImage = async (context: SelectedContext): Promise<string> => {
  const ai = getAI();

  try {
    const isSoftG = context.letter === 'Ğ';
    
    let prompt = "";
    if (isSoftG) {
      prompt = `A cute, colorful, cartoon-style illustration for a children's alphabet book. Show a ${context.englishTranslation} (${context.word}) with a large, friendly letter 'Ğ' integrated into the scene or resting on it. The style should be vibrant, simple, and rounded, suitable for toddlers. White background.`;
    } else {
      prompt = `A cute, colorful, cartoon-style illustration for a children's alphabet book. The capital letter '${context.letter}' is artfully formed by the shape of a '${context.word}' (${context.englishTranslation}). For example, the ${context.englishTranslation} is contorted, arranged, or stylized to look exactly like the letter ${context.letter}. The style should be vibrant, simple, soft 3D render style, suitable for toddlers. White background.`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: prompt }] },
      config: {
        imageConfig: { aspectRatio: "1:1" }
      }
    });

    return extractImageFromResponse(response);
  } catch (error: any) {
    handleError(error);
    throw error;
  }
};

export const generateColoringPage = async (context: SelectedContext): Promise<string> => {
  const ai = getAI();

  try {
    const isSoftG = context.letter === 'Ğ';
    let prompt = "";
    
    // Prompt specifically for black and white line art
    if (isSoftG) {
      prompt = `A black and white coloring page outline for kids. A simple line-art illustration of a ${context.englishTranslation} (${context.word}) with the letter 'Ğ'. Thick clean lines, no shading, no gray, pure white background.`;
    } else {
      prompt = `A black and white coloring page outline for kids. The capital letter '${context.letter}' made of a '${context.word}' (${context.englishTranslation}). Thick clean lines, simple shapes, no shading, no gray, pure white background.`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: prompt }] },
      config: {
        imageConfig: { aspectRatio: "1:1" }
      }
    });

    return extractImageFromResponse(response);
  } catch (error: any) {
    handleError(error);
    throw error;
  }
};

// Helper functions to clean up code
const extractImageFromResponse = (response: any): string => {
  if (response.candidates && response.candidates[0].content && response.candidates[0].content.parts) {
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        const base64EncodeString: string = part.inlineData.data;
        return `data:image/png;base64,${base64EncodeString}`;
      }
    }
  }
  throw new Error("No image data found in response");
};

const handleError = (error: any) => {
  console.error("Gemini API Error:", error);
  if (error.message?.includes('429') || error.message?.includes('quota') || error.status === 429) {
      throw new Error("QUOTA_EXCEEDED");
  }
};