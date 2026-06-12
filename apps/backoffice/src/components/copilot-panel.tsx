'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, User, ExternalLink, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: { title: string; source: string }[];
  toolCalls?: { name: string; status: 'running' | 'success' | 'error'; result?: string }[];
  actionProposal?: { description: string; confirmed?: boolean };
}

interface CopilotPanelProps {
  open: boolean;
  onClose: () => void;
}

export function CopilotPanel({ open, onClose }: CopilotPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content:
        'Hello! I\'m your CarrierBackOffice copilot. I can help you find documents, check compliance status, answer questions about loads, and more. What can I help you with?',
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function handleSend() {
    if (!input.trim()) return;
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Simulate assistant response
    setTimeout(() => {
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content:
          'I found the relevant information. Based on the current data, here is what I can tell you.',
        citations: [
          { title: 'Load #1024 Documents', source: 'Document Management' },
        ],
        toolCalls: [
          { name: 'search_documents', status: 'success', result: '3 documents found' },
        ],
      };
      setMessages((prev) => [...prev, assistantMsg]);
      setIsTyping(false);
    }, 1500);
  }

  function handleConfirmAction(messageId: string, confirmed: boolean) {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId && m.actionProposal
          ? { ...m, actionProposal: { ...m.actionProposal, confirmed } }
          : m,
      ),
    );
  }

  if (!open) return null;

  return (
    <div className="fixed right-0 top-0 h-screen w-[400px] bg-white border-l border-slate-200 shadow-xl z-40 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-blue-600" />
          <span className="font-semibold text-slate-900 text-sm">Copilot</span>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={cn('flex gap-2.5', msg.role === 'user' && 'flex-row-reverse')}>
            <div
              className={cn(
                'w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs',
                msg.role === 'assistant'
                  ? 'bg-blue-100 text-blue-600'
                  : 'bg-slate-200 text-slate-600',
              )}
            >
              {msg.role === 'assistant' ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
            </div>
            <div className={cn('max-w-[85%] space-y-2', msg.role === 'user' && 'text-right')}>
              <div
                className={cn(
                  'rounded-lg px-3 py-2 text-sm leading-relaxed',
                  msg.role === 'assistant'
                    ? 'bg-slate-100 text-slate-800'
                    : 'bg-blue-600 text-white',
                )}
              >
                {msg.content}
              </div>

              {/* Tool calls */}
              {msg.toolCalls?.map((tool, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 text-xs px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-md"
                >
                  {tool.status === 'running' ? (
                    <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin" />
                  ) : tool.status === 'success' ? (
                    <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                  ) : (
                    <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                  )}
                  <span className="font-mono text-slate-600">{tool.name}</span>
                  {tool.result && (
                    <span className="text-slate-400 ml-auto">{tool.result}</span>
                  )}
                </div>
              ))}

              {/* Citations */}
              {msg.citations && msg.citations.length > 0 && (
                <div className="space-y-1">
                  {msg.citations.map((cite, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 cursor-pointer"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>{cite.title}</span>
                      <span className="text-slate-400">- {cite.source}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Action confirmation */}
              {msg.actionProposal && msg.actionProposal.confirmed === undefined && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm">
                  <p className="font-medium text-amber-800 mb-2">
                    Proposed Action
                  </p>
                  <p className="text-amber-700 text-xs mb-3">
                    {msg.actionProposal.description}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleConfirmAction(msg.id, true)}
                      className="px-3 py-1 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => handleConfirmAction(msg.id, false)}
                      className="px-3 py-1 bg-white text-slate-600 text-xs rounded-md border border-slate-300 hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {msg.actionProposal && msg.actionProposal.confirmed !== undefined && (
                <div
                  className={cn(
                    'px-3 py-1.5 rounded-md text-xs',
                    msg.actionProposal.confirmed
                      ? 'bg-green-50 text-green-700'
                      : 'bg-slate-50 text-slate-500',
                  )}
                >
                  {msg.actionProposal.confirmed ? 'Action confirmed' : 'Action cancelled'}
                </div>
              )}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex gap-2.5">
            <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-blue-600" />
            </div>
            <div className="bg-slate-100 rounded-lg px-3 py-2 text-sm">
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce [animation-delay:0.2s]" />
                <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-slate-200">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask the copilot..."
            className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-slate-400"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
