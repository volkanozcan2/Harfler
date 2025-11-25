import { GoogleGenAI } from "@google/genai";
import { SelectedContext } from "../types";

export const generateLetterImage = async (context: SelectedContext): Promise<string> => {
  // Initialize inside the function to avoid top-level process access issues in browser environments
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const isSoftG = context.letter === 'Ğ';
    
    // Customized prompt logic to handle the tricky 'Ğ' or standard letters
    let prompt = "";
    if (isSoftG) {
      prompt = `A cute, colorful, cartoon-style illustration for a children's alphabet book. Show a ${context.englishTranslation} (${context.word}) with a large, friendly letter 'Ğ' integrated into the scene or resting on it. The style should be vibrant, simple, and rounded, suitable for toddlers. White background.`;
    } else {
      prompt = `A cute, colorful, cartoon-style illustration for a children's alphabet book. The capital letter '${context.letter}' is artfully formed by the shape of a '${context.word}' (${context.englishTranslation}). For example, the ${context.englishTranslation} is contorted, arranged, or stylized to look exactly like the letter ${context.letter}. The style should be vibrant, simple, soft 3D render style, suitable for toddlers. White background.`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { text: prompt }
        ]
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1",
        }
      }
    });

    // Extract image from response
    if (response.candidates && response.candidates[0].content && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const base64EncodeString: string = part.inlineData.data;
          return `data:image/png;base64,${base64EncodeString}`;
        }
      }
    }
    
    throw new Error("No image data found in response");
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};