import { SelectedContext } from "../types";

// Note: We no longer import GoogleGenAI here. 
// The browser calls our own server (/api/generate), and the server calls Google.

export const generateLetterImage = async (context: SelectedContext): Promise<string> => {
  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...context,
        type: 'image'
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      if (response.status === 429 || errorData.error === 'QUOTA_EXCEEDED') {
        throw new Error("QUOTA_EXCEEDED");
      }
      throw new Error(errorData.error || 'Failed to generate image');
    }

    const data = await response.json();
    return data.imageUrl;

  } catch (error: any) {
    console.error("API Call Error:", error);
    throw error;
  }
};

export const generateColoringPage = async (context: SelectedContext): Promise<string> => {
  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...context,
        type: 'coloring'
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      if (response.status === 429 || errorData.error === 'QUOTA_EXCEEDED') {
        throw new Error("QUOTA_EXCEEDED");
      }
      throw new Error(errorData.error || 'Failed to generate coloring page');
    }

    const data = await response.json();
    return data.imageUrl;

  } catch (error: any) {
    console.error("API Call Error:", error);
    throw error;
  }
};