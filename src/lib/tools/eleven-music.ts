import { SongSpec, SongResult } from '../types';
import { saveAudioFile } from '../utils/storage';

interface ElevenLabsError {
  detail?: {
    status?: string;
    data?: {
      prompt_suggestion?: string;
    };
  };
}

/**
 * Build a music generation prompt from a SongSpec
 */
function buildPrompt(spec: SongSpec): string {
  const parts: string[] = [];
  
  // Base description from user's day
  parts.push(spec.dayDescription);
  
  // Add mood and genre
  parts.push(`The song should feel ${spec.mood} with a ${spec.genre} style.`);
  
  // Add BPM guidance
  parts.push(`Tempo around ${spec.bpmRange.min}-${spec.bpmRange.max} BPM.`);
  
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
 * Generate music using ElevenLabs Music API
 */
export async function generateMusic(spec: SongSpec): Promise<SongResult> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  
  if (!apiKey) {
    throw new Error('ELEVENLABS_API_KEY is not configured');
  }
  
  let prompt = buildPrompt(spec);
  let wasPromptModified = false;
  let attempts = 0;
  const maxAttempts = 2;
  
  while (attempts < maxAttempts) {
    attempts++;
    
    try {
      const response = await fetch('https://api.elevenlabs.io/v1/music', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': apiKey,
        },
        body: JSON.stringify({
          prompt,
          music_length_ms: spec.lengthMs,
          model_id: 'music_v1',
          force_instrumental: spec.forceInstrumental,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json() as ElevenLabsError;
        
        // Handle bad_prompt error (copyrighted content)
        if (errorData.detail?.status === 'bad_prompt') {
          const suggestion = errorData.detail.data?.prompt_suggestion;
          
          if (suggestion && attempts < maxAttempts) {
            console.log('Prompt contained copyrighted content, using suggestion:', suggestion);
            prompt = suggestion;
            wasPromptModified = true;
            continue;
          }
        }
        
        throw new Error(`ElevenLabs API error: ${JSON.stringify(errorData)}`);
      }
      
      // Get audio bytes from response
      const audioBuffer = await response.arrayBuffer();
      
      // Save audio file and get URL
      const audioUrl = await saveAudioFile(
        Buffer.from(audioBuffer),
        `${spec.title.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.mp3`
      );
      
      return {
        audioUrl,
        title: spec.title,
        promptUsed: prompt,
        durationMs: spec.lengthMs,
        mood: spec.mood,
        genre: spec.genre,
        wasPromptModified,
      };
      
    } catch (error) {
      // If it's our last attempt, throw the error
      if (attempts >= maxAttempts) {
        throw error;
      }
      
      // Check if it's a bad_prompt error we can retry
      const elevenLabsError = error as { body?: ElevenLabsError };
      if (elevenLabsError.body?.detail?.status === 'bad_prompt') {
        const suggestion = elevenLabsError.body.detail.data?.prompt_suggestion;
        if (suggestion) {
          prompt = suggestion;
          wasPromptModified = true;
          continue;
        }
      }
      
      throw error;
    }
  }
  
  throw new Error('Failed to generate music after max attempts');
}

