import { SelectedContext } from "../types";

// Note: We no longer import GoogleGenAI here. 
// The browser calls our own server (/api/generate), and the server calls Google.

export const generateLetterImage = async (context: SelectedContext): Promise<string> => {
  try {
    // Add a timeout controller to the fetch request (default 15s to catch slow networks before browser does)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...context,
        type: 'image'
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("API_NOT_FOUND");
      }
      
      const errorData = await response.json().catch(() => ({}));
      
      if (errorData.error === 'DAILY_LIMIT_EXCEEDED') {
        throw new Error("DAILY_LIMIT_EXCEEDED");
      }

      if (response.status === 429 || errorData.error === 'QUOTA_EXCEEDED') {
        throw new Error("QUOTA_EXCEEDED");
      }
      if (response.status === 504) {
        throw new Error("TIMEOUT");
      }
      throw new Error(errorData.error || 'Failed to generate image');
    }

    const data = await response.json();
    return data.imageUrl;

  } catch (error: any) {
    console.error("API Call Error:", error);
    if (error.name === 'AbortError' || error.message === 'TIMEOUT') {
       throw new Error("Resim oluşturma çok uzun sürdü. Lütfen tekrar deneyin.");
    }
    if (error.message === 'API_NOT_FOUND') {
       throw new Error("API bağlantısı kurulamadı. Lütfen sayfayı yenileyin.");
    }
    throw error;
  }
};

export const generateColoringPage = async (context: SelectedContext): Promise<string> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...context,
        type: 'coloring'
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("API_NOT_FOUND");
      }

      const errorData = await response.json().catch(() => ({}));
      
      if (errorData.error === 'DAILY_LIMIT_EXCEEDED') {
        throw new Error("DAILY_LIMIT_EXCEEDED");
      }
      
      if (response.status === 429 || errorData.error === 'QUOTA_EXCEEDED') {
        throw new Error("QUOTA_EXCEEDED");
      }
      throw new Error(errorData.error || 'Failed to generate coloring page');
    }

    const data = await response.json();
    return data.imageUrl;

  } catch (error: any) {
    console.error("API Call Error:", error);
    if (error.name === 'AbortError') {
      throw new Error("İşlem zaman aşımına uğradı.");
    }
    throw error;
  }
};