import { SongSpec, SongResult } from '../types';

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

  // Add instrumental note
  if (spec.forceInstrumental) {
    parts.push('This should be an instrumental track without vocals.');
  }

  return parts.join(' ');
}

/**
 * Poll for task completion
 */
async function pollForCompletion(taskId: string, apiKey: string, maxAttempts = 60): Promise<string> {
  const pollUrl = `${SUNO_API_BASE}/generate/record-info?taskId=${taskId}`;
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    console.log(`Polling attempt ${attempt + 1}/${maxAttempts} for task ${taskId}`);
    
    const response = await fetch(pollUrl, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      console.error('Poll error:', response.status);
      await new Promise(resolve => setTimeout(resolve, 5000));
      continue;
    }

    const result = await response.json();
    console.log('Poll result:', JSON.stringify(result, null, 2));

    // Check various possible response structures
    const data = result.data || result;
    
    // Check if complete and has audio URL
    if (data.status === 'complete' || data.status === 'SUCCESS' || data.audio_url) {
      const audioUrl = data.audio_url || data.audioUrl || data.response?.audio_url;
      if (audioUrl) {
        return audioUrl;
      }
    }

    // Check for array response (multiple tracks)
    if (Array.isArray(data) && data.length > 0) {
      const track = data[0];
      if (track.audio_url || track.audioUrl) {
        return track.audio_url || track.audioUrl;
      }
    }

    // Check if failed
    if (data.status === 'failed' || data.status === 'FAILED') {
      throw new Error('Music generation failed');
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
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Suno API error:', response.status, errorText);
      throw new Error(`Suno API error: ${response.status} - ${errorText}`);
    }

    const initResult = await response.json();
    console.log('Init response:', JSON.stringify(initResult, null, 2));

    // Get task ID from response
    const taskId = initResult.data?.taskId || initResult.taskId || initResult.task_id || initResult.id;
    
    // Check if audio URL is already available (sync response)
    const immediateUrl = initResult.data?.audio_url || initResult.audio_url || 
                         initResult.data?.[0]?.audio_url || initResult[0]?.audio_url;
    
    if (immediateUrl) {
      console.log('Got immediate audio URL');
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
      throw new Error('No task ID or audio URL in Suno response');
    }

    // Step 2: Poll for completion
    console.log(`Got task ID: ${taskId}, polling for completion...`);
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
