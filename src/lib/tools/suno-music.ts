import { SongSpec, SongResult } from '../types';

// Suno API base URL
const SUNO_API_BASE = 'https://api.sunoapi.org/api/v1';

/**
 * Build a music generation prompt from a SongSpec
 */
function buildPrompt(spec: SongSpec): string {
  const parts: string[] = [];

  // Base description from user's day
  parts.push(spec.dayDescription);

  // Add mood and genre
  parts.push(`The song should feel ${spec.mood} with a ${spec.genre} style.`);

  // Add chorus line if provided
  if (spec.chorusLine) {
    parts.push(`Include this line in the chorus: "${spec.chorusLine}"`);
  }

  return parts.join(' ');
}

/**
 * Extract audio URL from a track object, checking multiple possible fields
 */
function extractAudioUrl(track: Record<string, unknown>): string | null {
  // Try various URL fields in order of preference
  const urlFields = ['audioUrl', 'audio_url', 'sourceAudioUrl', 'streamAudioUrl'];
  
  for (const field of urlFields) {
    const url = track[field];
    if (typeof url === 'string' && url.length > 0 && url.startsWith('http')) {
      return url;
    }
  }
  return null;
}

/**
 * Poll for task completion
 */
async function pollForCompletion(taskId: string, apiKey: string, maxAttempts = 60): Promise<string> {
  const pollUrl = `${SUNO_API_BASE}/generate/record-info?taskId=${taskId}`;
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    console.log(`Polling attempt ${attempt + 1}/${maxAttempts}`);
    
    const response = await fetch(pollUrl, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Poll error:', response.status);
      await new Promise(resolve => setTimeout(resolve, 5000));
      continue;
    }

    const result = await response.json();
    const data = result.data || result;
    
    console.log(`Poll status: ${data.status}`);

    // Check if complete - extract audio from nested sunoData structure
    if (data.status === 'complete' || data.status === 'SUCCESS') {
      // Check for sunoData array in response (primary structure)
      const sunoData = data.response?.sunoData;
      if (Array.isArray(sunoData) && sunoData.length > 0) {
        // Try each track until we find one with a valid audio URL
        for (const track of sunoData) {
          const audioUrl = extractAudioUrl(track as Record<string, unknown>);
          if (audioUrl) {
            console.log(`Found audio URL: ${audioUrl}`);
            return audioUrl;
          }
        }
        console.log('sunoData found but no valid audio URL yet, continuing to poll...');
      }
      
      // Fallback to direct audio URL on data object
      const directUrl = extractAudioUrl(data as Record<string, unknown>);
      if (directUrl) {
        console.log(`Found direct audio URL: ${directUrl}`);
        return directUrl;
      }
    }

    // Check for array response at top level
    if (Array.isArray(data) && data.length > 0) {
      for (const track of data) {
        const audioUrl = extractAudioUrl(track as Record<string, unknown>);
        if (audioUrl) {
          console.log(`Found audio URL from array: ${audioUrl}`);
          return audioUrl;
        }
      }
    }

    // Check if failed
    if (data.status === 'failed' || data.status === 'FAILED' || data.status === 'error') {
      throw new Error(`Generation failed: ${data.error || data.message || data.errorMessage || 'Unknown error'}`);
    }

    // Wait 5 seconds before next poll
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  throw new Error('Music generation timed out');
}

/**
 * Generate music using Suno API
 */
export async function generateMusic(spec: SongSpec): Promise<SongResult> {
  const apiKey = process.env.SUNO_API_KEY;

  if (!apiKey) {
    throw new Error('SUNO_API_KEY is not configured');
  }

  const prompt = buildPrompt(spec);

  try {
    // Step 1: Initiate generation
    console.log('Starting Suno music generation...');
    const response = await fetch(`${SUNO_API_BASE}/generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        style: spec.genre,
        title: spec.title,
        customMode: true,
        instrumental: spec.forceInstrumental,
        model: 'V4_5ALL',
        callBackUrl: 'https://localhost:3000/api/callback', // Required but we'll poll instead
      }),
    });

    const responseText = await response.text();
    console.log('Raw response:', responseText);

    if (!response.ok) {
      console.error('Suno API error:', response.status, responseText);
      throw new Error(`Suno API error: ${response.status} - ${responseText}`);
    }

    let initResult;
    try {
      initResult = JSON.parse(responseText);
    } catch {
      throw new Error(`Invalid JSON response: ${responseText}`);
    }
    
    console.log('Init response:', JSON.stringify(initResult, null, 2));

    // Check for API error
    if (initResult.code && initResult.code !== 0 && initResult.code !== 200) {
      throw new Error(`Suno API error: ${initResult.msg || initResult.message || 'Unknown error'}`);
    }

    // Get task ID or audio URL
    const data = initResult.data || initResult;
    const taskId = data.taskId || data.task_id || data.id || initResult.taskId;
    
    // Check if audio URL is immediately available
    const immediateUrl = data.audio_url || data.audioUrl || 
                         (Array.isArray(data) && data[0]?.audio_url);
    
    if (immediateUrl) {
      return {
        audioUrl: immediateUrl,
        title: spec.title,
        promptUsed: prompt,
        durationMs: spec.lengthMs,
        mood: spec.mood,
        genre: spec.genre,
        wasPromptModified: false,
      };
    }

    if (!taskId) {
      console.error('Full response:', initResult);
      throw new Error('No task ID or audio URL in response. Please check your API key.');
    }

    // Step 2: Poll for completion
    console.log(`Got task ID: ${taskId}, polling...`);
    const audioUrl = await pollForCompletion(taskId, apiKey);

    return {
      audioUrl,
      title: spec.title,
      promptUsed: prompt,
      durationMs: spec.lengthMs,
      mood: spec.mood,
      genre: spec.genre,
      wasPromptModified: false,
    };

  } catch (error) {
    console.error('Suno music generation error:', error);
    throw error;
  }
}
