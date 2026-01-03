'use client';

import { SongCard } from '../song-card';

interface ToolPart {
  type: string;
  toolCallId: string;
  toolName: string;
  state: string;
  args?: Record<string, unknown>;
  result?: Record<string, unknown>;
}

interface ToolRendererProps {
  toolPart: ToolPart;
  onApprove?: (toolCallId: string) => void;
  onSendMessage?: (message: string) => void;
}

export function ToolRenderer({ toolPart, onApprove, onSendMessage }: ToolRendererProps) {
  if (toolPart.toolName !== 'generate_song') {
    return null;
  }

  const handleApprove = () => {
    if (onApprove) {
      onApprove(toolPart.toolCallId);
    }
  };

  const handleRegenerate = () => {
    if (onSendMessage) {
      onSendMessage('Please regenerate the song with the same style');
    }
  };

  const handleRemix = (modifier: string) => {
    if (onSendMessage) {
      onSendMessage(`Please create a new version that's ${modifier}`);
    }
  };

  // Map AI SDK states to our card states
  // AI SDK states: 'partial-call' (streaming args), 'call' (args ready/executing), 'result' (complete)
  // NOTE: The tool has server-side execute, so it runs automatically - no user approval needed
  let cardState: 'streaming' | 'pending' | 'ready' = 'streaming';
  
  const state = toolPart.state;
  const result = toolPart.result;
  
  // Check if we have a valid result (with actual song data, not just { approved: true })
  const hasValidResult = result && 
    typeof result === 'object' && 
    ('audioUrl' in result || 'success' in result) &&
    !('approved' in result); // Ignore corrupted { approved: true } results
  
  if (state === 'partial-call' || state === 'input-streaming') {
    // Arguments are still being streamed
    cardState = 'streaming';
  } else if (state === 'call' || state === 'input-available') {
    // Tool is being called - server is executing automatically
    // Show streaming/generating state (NOT pending - no user approval needed)
    cardState = 'streaming';
  } else if (state === 'result' || state === 'output-available') {
    // Tool execution complete
    if (hasValidResult) {
      cardState = 'ready';
    } else {
      // Result is empty, corrupted, or still pending - keep showing generating state
      cardState = 'streaming';
    }
  }

  return (
    <div className="my-4">
      <SongCard
        input={toolPart.args as SongCardInput}
        output={toolPart.result as SongCardOutput}
        state={cardState}
        onApprove={handleApprove}
        onRegenerate={handleRegenerate}
        onRemix={handleRemix}
      />
    </div>
  );
}

// Type helpers for SongCard props
type SongCardInput = {
  title?: string;
  mood?: string;
  genre?: string;
  lengthMs?: number;
  forceInstrumental?: boolean;
  chorusLine?: string;
};

type SongCardOutput = {
  success?: boolean;
  audioUrl?: string;
  title?: string;
  mood?: string;
  genre?: string;
  durationMs?: number;
  message?: string;
  error?: string;
};
