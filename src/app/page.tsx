'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useRef, useEffect, useState, useMemo } from 'react';
import { Send, Music2, Loader2 } from 'lucide-react';
import { Message } from '@/components/chat/message';
import { ToolRenderer } from '@/components/chat/tool-renderer';

export default function Home() {
  const transport = useMemo(() => new DefaultChatTransport({
    api: '/api/chat',
  }), []);

  const {
    messages,
    sendMessage,
    status,
    addToolResult,
    error,
  } = useChat({
    transport,
  });

  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const isLoading = status === 'streaming' || status === 'submitted';

  // #region agent log
  useEffect(() => {
    if (messages.length > 0) {
      fetch('http://127.0.0.1:7244/ingest/904c57dc-ec51-4a10-a5dd-603f08e6fd4e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'page.tsx:messagesDebug',message:'Messages state',data:{count:messages.length,msgs:messages.map(m=>({id:m.id,role:m.role,partsCount:m.parts?.length,parts:m.parts?.map(p=>({type:p.type,hasText:'text' in p,text:(p as any).text?.slice(0,50)}))}))}  ,timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1,H2,H3,H4'})}).catch(()=>{});
    }
  }, [messages]);
  // #endregion

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 150)}px`;
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    sendMessage({ text: input });
    setInput('');
    
    // Reset textarea height
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }
  };

  // Handle Enter key (submit on Enter, newline on Shift+Enter)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  // Handle tool approval
  const handleToolApproval = (toolCallId: string) => {
    addToolResult({
      toolCallId,
      tool: 'generate_song',
      output: { approved: true },
    });
  };

  // Handle sending a follow-up message (for remix/regenerate)
  const handleSendMessage = (text: string) => {
    sendMessage({ text });
  };

  // Check if a part is a tool part
  const isToolPart = (part: { type: string }) => {
    return part.type.startsWith('tool-') || part.type === 'dynamic-tool';
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-xl sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-linear-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Music2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-semibold text-white">Day to Song</h1>
            <p className="text-xs text-zinc-400">Turn your day into music</p>
          </div>
        </div>
      </header>

      {/* Chat Messages */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-6">
          {messages.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-20 h-20 rounded-2xl bg-linear-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center mx-auto mb-6">
                <Music2 className="w-10 h-10 text-amber-500" />
              </div>
              <h2 className="text-2xl font-semibold text-white mb-3">
                How was your day?
              </h2>
              <p className="text-zinc-400 max-w-md mx-auto leading-relaxed">
                Tell me about your day, and I&apos;ll help you turn it into a 
                personalized song that captures how you felt.
              </p>
              
              <div className="mt-8 flex flex-wrap gap-2 justify-center">
                {[
                  'Had an amazing morning workout',
                  'Feeling nostalgic today',
                  'Productive day at work',
                  'Spent time with friends',
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => sendMessage({ text: suggestion })}
                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-full text-sm transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((message) => {
                // #region agent log
                const textParts = message.parts?.filter((part) => part.type === 'text' && (part as any).text?.trim());
                const allParts = message.parts || [];
                fetch('http://127.0.0.1:7244/ingest/904c57dc-ec51-4a10-a5dd-603f08e6fd4e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'page.tsx:renderLoop',message:'Rendering message',data:{msgId:message.id,role:message.role,totalParts:allParts.length,textPartsAfterFilter:textParts?.length,partTypes:allParts.map(p=>p.type),firstPartKeys:allParts[0]?Object.keys(allParts[0]):[]},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H2,H3,H5'})}).catch(()=>{});
                // #endregion
                return (
                <div key={message.id}>
                  {/* Render text content */}
                  {message.parts
                    ?.filter((part) => part.type === 'text' && (part as any).text?.trim())
                    .map((part, index) => (
                      <Message
                        key={`${message.id}-text-${index}`}
                        role={message.role as 'user' | 'assistant'}
                        content={part.type === 'text' ? part.text : ''}
                      />
                    ))}
                  
                  {/* Render tool invocations */}
                  {message.parts
                    ?.filter(isToolPart)
                    .map((part) => {
                      // Extract tool info from the part
                      const toolPart = part as {
                        type: string;
                        toolCallId: string;
                        state: string;
                        input?: unknown;
                        output?: unknown;
                      };
                      
                      // Get tool name from type (e.g., 'tool-generate_song' -> 'generate_song')
                      const toolName = toolPart.type.startsWith('tool-') 
                        ? toolPart.type.replace('tool-', '')
                        : 'dynamic-tool';
                      
                      return (
                        <ToolRenderer
                          key={toolPart.toolCallId}
                          toolPart={{
                            type: 'tool-invocation',
                            toolCallId: toolPart.toolCallId,
                            toolName,
                            state: toolPart.state as 'partial-call' | 'call' | 'result',
                            args: toolPart.input as Record<string, unknown>,
                            result: toolPart.output as Record<string, unknown>,
                          }}
                          onApprove={handleToolApproval}
                          onSendMessage={handleSendMessage}
                        />
                      );
                    })}
                </div>
                );
              })}
              
              {/* Error display */}
              {error && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
                    <span className="text-red-500 text-lg">!</span>
                  </div>
                  <div className="bg-red-500/10 border border-red-500/20 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[80%]">
                    <p className="text-sm text-red-400">
                      {error.message.includes('429') || error.message.includes('quota')
                        ? 'API quota exceeded. The free tier limit has been reached. Please wait a few minutes or check your Google AI billing settings.'
                        : `Error: ${error.message}`}
                    </p>
                  </div>
                </div>
              )}

              {isLoading && messages[messages.length - 1]?.role === 'user' && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-linear-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                    <Loader2 className="w-4 h-4 text-white animate-spin" />
                  </div>
                  <div className="bg-zinc-800 rounded-2xl rounded-tl-sm px-4 py-3">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </main>

      {/* Input Area */}
      <footer className="border-t border-zinc-800 bg-zinc-900/50 backdrop-blur-xl sticky bottom-0">
        <form
          onSubmit={handleSubmit}
          className="max-w-3xl mx-auto px-4 py-4"
        >
          <div className="relative flex items-end gap-2">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyDown}
                placeholder="Tell me about your day..."
                rows={1}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 pr-12 text-white placeholder-zinc-500 resize-none focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
                disabled={isLoading}
              />
            </div>
            
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="p-3 bg-linear-to-r from-amber-500 to-orange-500 rounded-xl text-white disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-amber-500/20 transition-all"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
          
          <p className="text-xs text-zinc-500 mt-2 text-center">
            Press Enter to send, Shift+Enter for new line
          </p>
        </form>
      </footer>
    </div>
  );
}
