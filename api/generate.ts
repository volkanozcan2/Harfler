import { GoogleGenAI } from "@google/genai";
import { createClient } from "redis";

// Initialize AI on the server side where process.env is secure
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Object to store debug info to send back to browser
  let redisDebug = {
    status: 'disabled',
    message: 'No REDIS_URL found',
    usage: 'N/A'
  };

  try {
    // --- Rate Limiting Logic (Node Redis) ---
    // Only run if REDIS_URL env var is present
    if (process.env.REDIS_URL) {
      console.log("Found REDIS_URL, initializing client...");
      const client = createClient({
        url: process.env.REDIS_URL
      });

      client.on('error', (err) => {
        console.error('Redis Client Error', err);
        redisDebug = { status: 'error', message: err.message, usage: 'unknown' };
      });

      try {
        await client.connect();
        console.log("Redis connected successfully.");

        const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        const key = `daily_limit_${date}`;
        
        // Increment the counter for today
        const currentUsage = await client.incr(key);
        console.log(`Current daily usage: ${currentUsage}/100`);
        
        redisDebug = {
          status: 'connected',
          message: 'Redis working',
          usage: `${currentUsage}/100 requests today`
        };

        // If this is the first request of the day, set it to expire in 24 hours
        if (currentUsage === 1) {
          await client.expire(key, 86400); 
        }

        // Check against limit (100)
        if (currentUsage > 100) {
          console.warn("Daily limit exceeded, blocking request.");
          await client.disconnect();
          return res.status(429).json({ error: 'DAILY_LIMIT_EXCEEDED', redisDebug });
        }
        
        await client.disconnect();
      } catch (redisError: any) {
        console.error("Redis Error:", redisError);
        redisDebug = { status: 'error', message: redisError.message, usage: 'unknown' };
        
        // If redis fails, we don't want to crash the whole app, so we continue
        // But we ensure connection is closed if it was opened
        if (client.isOpen) {
          await client.disconnect();
        }
      }
    } else {
      console.log("No REDIS_URL found in environment variables. Rate limiting skipped.");
    }
    // ---------------------------

    const { letter, word, englishTranslation, type } = req.body;

    if (!letter || !word || !englishTranslation) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const isSoftG = letter === 'Ğ';
    let prompt = "";
    
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

    // Return image AND redis debug info
    return res.status(200).json({ imageUrl, redisDebug });

  } catch (error: any) {
    console.error("Server API Error:", error);
    
    if (error.message?.includes('429') || error.message?.includes('quota') || error.status === 429) {
      return res.status(429).json({ error: 'QUOTA_EXCEEDED', redisDebug });
    }

    return res.status(500).json({ error: error.message || 'Internal Server Error', redisDebug });
  }
}