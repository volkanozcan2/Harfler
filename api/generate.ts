import { GoogleGenAI } from "@google/genai";
import { kv } from "@vercel/kv";

// Initialize AI on the server side where process.env is secure
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // --- Rate Limiting Logic ---
    // Only run if Vercel KV is configured in the project settings
    if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
      const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const key = `daily_limit_${date}`;
      
      // Increment the counter for today
      const currentUsage = await kv.incr(key);
      
      // If this is the first request of the day, set it to expire in 24 hours
      if (currentUsage === 1) {
        await kv.expire(key, 86400); 
      }

      // Check against limit (100)
      if (currentUsage > 100) {
        return res.status(429).json({ error: 'DAILY_LIMIT_EXCEEDED' });
      }
    }
    // ---------------------------

    const { letter, word, englishTranslation, type } = req.body;

    if (!letter || !word || !englishTranslation) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const isSoftG = letter === 'Ğ';
    let prompt = "";
    
    // Logic moved from frontend to backend
    if (type === 'coloring') {
      if (isSoftG) {
        prompt = `A black and white coloring page outline for kids. A simple line-art illustration of a ${englishTranslation} (${word}) with the letter 'Ğ'. Thick clean lines, no shading, no gray, pure white background.`;
      } else {
        prompt = `A black and white coloring page outline for kids. The capital letter '${letter}' made of a '${word}' (${englishTranslation}). Thick clean lines, simple shapes, no shading, no gray, pure white background.`;
      }
    } else {
      // Standard colorful image
      if (isSoftG) {
        prompt = `A cute, colorful, cartoon-style illustration for a children's alphabet book. Show a ${englishTranslation} (${word}) with a large, friendly letter 'Ğ' integrated into the scene or resting on it. The style should be vibrant, simple, and rounded, suitable for toddlers. Pure white background, isolated on white.`;
      } else {
        prompt = `A cute, colorful, cartoon-style illustration for a children's alphabet book. The capital letter '${letter}' is artfully formed by the shape of a '${word}' (${englishTranslation}). For example, the ${englishTranslation} is contorted, arranged, or stylized to look exactly like the letter ${letter}. The style should be vibrant, simple, soft 3D render style, suitable for toddlers. Pure white background, isolated on white.`;
      }
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: prompt }] },
      config: {
        imageConfig: { aspectRatio: "1:1" }
      }
    });

    // Extract image data
    let imageUrl = "";
    if (response.candidates && response.candidates[0].content && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          imageUrl = `data:image/png;base64,${part.inlineData.data}`;
          break;
        }
      }
    }

    if (!imageUrl) {
      throw new Error("No image generated");
    }

    return res.status(200).json({ imageUrl });

  } catch (error: any) {
    console.error("Server API Error:", error);
    
    if (error.message?.includes('429') || error.message?.includes('quota') || error.status === 429) {
      return res.status(429).json({ error: 'QUOTA_EXCEEDED' });
    }

    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}