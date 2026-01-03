import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import { SongSpec, SongResult } from '../types';
import { saveAudioFile } from '../utils/storage';

// Maximum credits allowed per song generation
const MAX_CREDITS_PER_SONG = 800;
// Approximate credits per second of music (conservative estimate)
const CREDITS_PER_SECOND = 10;
// Max duration in ms based on credit limit
const MAX_DURATION_MS = (MAX_CREDITS_PER_SONG / CREDITS_PER_SECOND) * 1000; // 80 seconds

/**
 * Check if song duration would exceed credit limit
 */
function checkSongCost(durationMs: number): { allowed: boolean; estimatedCost: number; maxDurationMs: number } {
  const estimatedCost = Math.ceil((durationMs / 1000) * CREDITS_PER_SECOND);
  return {
    allowed: estimatedCost <= MAX_CREDITS_PER_SONG,
    estimatedCost,
    maxDurationMs: MAX_DURATION_MS,
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
  
  const elevenlabs = new ElevenLabsClient({
    apiKey,
  });
  
  // Check if song duration would exceed credit limit
  const { allowed, estimatedCost, maxDurationMs } = checkSongCost(spec.lengthMs);
  if (!allowed) {
    const maxSeconds = Math.floor(maxDurationMs / 1000);
    throw new Error(`Song too long! Estimated cost: ${estimatedCost} credits (max: ${MAX_CREDITS_PER_SONG}). Please request a shorter song (max ${maxSeconds} seconds).`);
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
