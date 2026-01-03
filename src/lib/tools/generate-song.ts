import { tool } from 'ai';
import { z } from 'zod';
import { generateMusic } from './eleven-music';
import { SongSpec } from '../types';

/**
 * Zod schema for the generate_song tool input
 */
const songSpecSchema = z.object({
  title: z.string().describe('A creative title for the song based on the user\'s day'),
  mood: z.string().describe('The emotional mood of the song (e.g., energetic, melancholic, hopeful, peaceful)'),
  genre: z.string().describe('The musical genre/style (e.g., indie folk, lo-fi beats, synth pop, acoustic)'),
  bpmMin: z.number().min(60).max(200).describe('Minimum BPM for the song tempo'),
  bpmMax: z.number().min(60).max(200).describe('Maximum BPM for the song tempo'),
  chorusLine: z.string().optional().describe('A line to include in the chorus, capturing the essence of their day'),
  lengthMs: z.number().min(30000).max(180000).default(60000).describe('Duration of the song in milliseconds (30-180 seconds)'),
  forceInstrumental: z.boolean().default(false).describe('Whether the song should be instrumental without vocals'),
  dayDescription: z.string().describe('A vivid description of the user\'s day to inspire the song'),
});

export type GenerateSongInput = z.infer<typeof songSpecSchema>;

/**
 * generate_song tool definition
 */
export const generateSongTool = tool({
  description: `Generate a personalized song based on the user's day. Call this tool when you have gathered enough information about their mood, preferred genre, and key moments. The user will see a preview card and must approve before generation begins.`,
  inputSchema: songSpecSchema,
  execute: async (input: GenerateSongInput) => {
    const spec: SongSpec = {
      title: input.title,
      mood: input.mood,
      genre: input.genre,
      bpmRange: {
        min: input.bpmMin,
        max: input.bpmMax,
      },
      chorusLine: input.chorusLine,
      lengthMs: input.lengthMs,
      forceInstrumental: input.forceInstrumental,
      dayDescription: input.dayDescription,
    };

    try {
      const result = await generateMusic(spec);
      
      return {
        success: true,
        ...result,
        message: result.wasPromptModified 
          ? 'Your song is ready! (Note: Some style references were generalized to ensure originality)'
          : 'Your song is ready!',
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        error: errorMessage,
        message: 'Failed to generate your song. Please try again.',
      };
    }
  },
});
