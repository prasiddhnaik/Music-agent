import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { streamText, convertToModelMessages, UIMessage } from 'ai';
import { generateSongTool } from '@/lib/tools/generate-song';
import { SYSTEM_PROMPT } from '@/lib/utils/prompts';

// Create Groq provider
const groq = createOpenAICompatible({
  name: 'groq',
  apiKey: process.env.GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1',
});

// Allow streaming responses up to 5 minutes for music generation
export const maxDuration = 300;

export async function POST(req: Request) {
  try {
    const { messages }: { messages: UIMessage[] } = await req.json();
    const modelMessages = await convertToModelMessages(messages);

    const result = streamText({
      model: groq('llama-3.3-70b-versatile'),
      system: SYSTEM_PROMPT,
      messages: modelMessages,
      tools: {
        generate_song: generateSongTool,
      },
      toolChoice: 'auto',
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error('Chat API error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const isQuotaError = errorMessage.includes('quota') || errorMessage.includes('429');
    
    return new Response(
      JSON.stringify({
        error: isQuotaError 
          ? 'API quota exceeded. Please wait a moment or check your billing settings.'
          : 'Failed to process your request. Please try again.',
      }),
      { 
        status: isQuotaError ? 429 : 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
