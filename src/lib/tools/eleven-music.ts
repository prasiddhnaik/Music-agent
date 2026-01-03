import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import { SongSpec, SongResult } from '../types';
import { saveAudioFile } from '../utils/storage';

const MIN_CREDITS_REQUIRED = 800;

/**
 * Check if user has enough credits for music generation
 */
async function checkCredits(client: ElevenLabsClient): Promise<{ hasEnough: boolean; remaining: number }> {
  try {
    const subscription = await client.user.subscription.get();
    const remaining = subscription.characterLimit - subscription.characterCount;
    return {
      hasEnough: remaining >= MIN_CREDITS_REQUIRED,
      remaining,
    };
  } catch (error) {
    console.error('Failed to check credits:', error);
    // If we can't check, allow the request (ElevenLabs will reject if insufficient)
    return { hasEnough: true, remaining: -1 };
  }
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
  
  const elevenlabs = new ElevenLabsClient({
    apiKey,
  });
  
  // Check if user has enough credits
  const { hasEnough, remaining } = await checkCredits(elevenlabs);
  if (!hasEnough) {
    throw new Error(`Insufficient credits. You have ${remaining} credits remaining, but ${MIN_CREDITS_REQUIRED} are required for music generation.`);
  }
  
  const prompt = buildPrompt(spec);
  
  try {
    // Use the SDK's music.compose method
    const response = await elevenlabs.music.compose({
      prompt,
      musicLengthMs: spec.lengthMs,
      forceInstrumental: spec.forceInstrumental,
    });
    
    // Convert the response stream to a buffer
    const chunks: Uint8Array[] = [];
    const reader = response.getReader();
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) chunks.push(value);
    }
    
    const audioBuffer = Buffer.concat(chunks);
    
    // Save audio file and get URL
    const audioUrl = await saveAudioFile(
      audioBuffer,
      `${spec.title.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.mp3`
    );
    
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
    console.error('ElevenLabs music generation error:', error);
    throw error;
  }
}
