import { handleApiError } from '@/utils/errorHandler';

export async function generateImage(itemName, brandVoice, styleWanted, tone) {
  if (!itemName) {
    throw new Error('Item name is required');
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

    const response = await fetch('/api/ai/generateImage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        itemName,
        brandVoice: brandVoice || 'professional',
        styleWanted: styleWanted || 'modern',
        tone: tone || 'friendly'
      }),
      signal: controller.signal,
      credentials: 'include' // Important for auth
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.imageUrl) {
      throw new Error('No image URL received from server');
    }

    // For DALL-E URLs, we skip the validation check since they're temporary
    if (!data.imageUrl.includes('oaidalleapiprodscus.blob.core.windows.net')) {
      const urlTest = await fetch(data.imageUrl, { method: 'HEAD' })
        .catch(() => ({ ok: false }));
        
      if (!urlTest.ok) {
        throw new Error('Generated image URL is not accessible');
      }
    }

    return data.imageUrl;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Request timed out - please try again');
    }
    throw error;
  }
} 