'use client';

import { Music, Clock, Sparkles, Loader2 } from 'lucide-react';
import { AudioPlayer } from './audio-player';

interface SongCardProps {
  // Tool input (song spec)
  input?: {
    title?: string;
    mood?: string;
    genre?: string;
    lengthMs?: number;
    forceInstrumental?: boolean;
    chorusLine?: string;
  };
  // Tool output (generated song)
  output?: {
    success?: boolean;
    audioUrl?: string;
    title?: string;
    mood?: string;
    genre?: string;
    durationMs?: number;
    message?: string;
    error?: string;
  };
  // State
  state: 'streaming' | 'pending' | 'ready';
  // Approval handler
  onApprove?: () => void;
  // Quick action handlers
  onRegenerate?: () => void;
  onRemix?: (modifier: string) => void;
}

export function SongCard({
  input,
  output,
  state,
  onApprove,
  onRegenerate,
  onRemix,
}: SongCardProps) {
  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Streaming state - show loading (with song details if available)
  if (state === 'streaming') {
    // If we have input (song spec), show it while generating
    if (input && (input.title || input.mood || input.genre)) {
      return (
        <div className="song-card">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Loader2 className="w-7 h-7 text-amber-500 animate-spin" />
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg text-white truncate">
                {input.title || 'Your Song'}
              </h3>
              
              <div className="flex flex-wrap gap-2 mt-2">
                {input.mood && (
                  <span className="tag">{input.mood}</span>
                )}
                {input.genre && (
                  <span className="tag">{input.genre}</span>
                )}
                {input.lengthMs && (
                  <span className="tag flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDuration(input.lengthMs)}
                  </span>
                )}
                {input.forceInstrumental && (
                  <span className="tag">instrumental</span>
                )}
              </div>

              {input.chorusLine && (
                <p className="text-sm text-zinc-400 mt-3 italic">
                  &ldquo;{input.chorusLine}&rdquo;
                </p>
              )}
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-zinc-700/50">
            <p className="text-sm text-zinc-400">🎵 Composing your song...</p>
            <p className="text-xs text-zinc-500 mt-1">This may take up to a minute. Please wait while we create your personalized track.</p>
          </div>
        </div>
      );
    }
    
    // Fallback loading state (no input yet)
    return (
      <div className="song-card animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-zinc-700 rounded-xl flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
          </div>
          <div className="flex-1">
            <div className="h-4 bg-zinc-700 rounded w-32 mb-2" />
            <div className="h-3 bg-zinc-700 rounded w-48" />
          </div>
        </div>
        <p className="text-sm text-zinc-400 mt-3">🎵 Composing your song...</p>
        <p className="text-xs text-zinc-500 mt-1">This may take up to a minute. Please wait while we create your personalized track.</p>
      </div>
    );
  }

  // Pending state - show spec and generate button
  if (state === 'pending' && input) {
    return (
      <div className="song-card">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <Music className="w-7 h-7 text-amber-500" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg text-white truncate">
              {input.title || 'Your Song'}
            </h3>
            
            <div className="flex flex-wrap gap-2 mt-2">
              {input.mood && (
                <span className="tag">{input.mood}</span>
              )}
              {input.genre && (
                <span className="tag">{input.genre}</span>
              )}
              {input.lengthMs && (
                <span className="tag flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDuration(input.lengthMs)}
                </span>
              )}
              {input.forceInstrumental && (
                <span className="tag">instrumental</span>
              )}
            </div>

            {input.chorusLine && (
              <p className="text-sm text-zinc-400 mt-3 italic">
                &ldquo;{input.chorusLine}&rdquo;
              </p>
            )}
          </div>
        </div>

        <button
          onClick={onApprove}
          className="generate-button mt-4"
        >
          <Sparkles className="w-4 h-4" />
          Generate Song
        </button>
        <p className="text-xs text-zinc-500 mt-2 text-center">Generation may take up to a minute</p>
      </div>
    );
  }

  // Ready state - show player and quick actions
  if (state === 'ready' && output) {
    // Only show error state if success is explicitly false (not just undefined)
    // Also check if we have an audioUrl - if we do, it's a success even if success flag is missing
    const hasAudio = !!output.audioUrl;
    const isExplicitFailure = output.success === false;
    
    if (isExplicitFailure && !hasAudio) {
      return (
        <div className="song-card border-red-500/30">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
              <Music className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Generation Failed</h3>
              <p className="text-sm text-red-400">{output.error || output.message}</p>
            </div>
          </div>
          
          {onRegenerate && (
            <button
              onClick={onRegenerate}
              className="mt-4 px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg text-sm transition-colors"
            >
              Try Again
            </button>
          )}
        </div>
      );
    }

    return (
      <div className="song-card">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-amber-500/20">
            <Music className="w-7 h-7 text-white" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg text-white truncate">
              {output.title}
            </h3>
            
            <div className="flex flex-wrap gap-2 mt-2">
              {output.mood && (
                <span className="tag">{output.mood}</span>
              )}
              {output.genre && (
                <span className="tag">{output.genre}</span>
              )}
              {output.durationMs && (
                <span className="tag flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDuration(output.durationMs)}
                </span>
              )}
            </div>
          </div>
        </div>

        {output.audioUrl && (
          <AudioPlayer src={output.audioUrl} title={output.title || 'Song'} />
        )}

        {output.message && (
          <p className="text-sm text-zinc-400 mt-3">{output.message}</p>
        )}

        {/* Quick Actions */}
        {(onRegenerate || onRemix) && (
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-zinc-700">
            {onRegenerate && (
              <button
                onClick={onRegenerate}
                className="quick-action"
              >
                Regenerate
              </button>
            )}
            {onRemix && (
              <>
                <button
                  onClick={() => onRemix('more upbeat and energetic')}
                  className="quick-action"
                >
                  More Upbeat
                </button>
                <button
                  onClick={() => onRemix('more chill and relaxed')}
                  className="quick-action"
                >
                  More Chill
                </button>
                <button
                  onClick={() => onRemix('shorter, around 30 seconds')}
                  className="quick-action"
                >
                  Shorter
                </button>
              </>
            )}
          </div>
        )}
      </div>
    );
  }

  return null;
}

