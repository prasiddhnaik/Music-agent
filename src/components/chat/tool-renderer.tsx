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

  // Map AI SDK v6 states to our card states
  let cardState: 'streaming' | 'pending' | 'ready' = 'streaming';
  
  if (toolPart.state === 'input-streaming') {
    cardState = 'streaming';
  } else if (toolPart.state === 'input-available' || toolPart.state === 'approval-requested') {
    cardState = 'pending';
  } else if (toolPart.state === 'output-available' || toolPart.state === 'result') {
    cardState = 'ready';
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
