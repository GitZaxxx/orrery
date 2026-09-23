'use client';

import { useState } from 'react';
import type { UiPatch } from '@/lib/types';
import { useChat } from '@/hooks/useChat';
import { WidgetRenderer } from '@/components/genui/Renderer';

const QUICK_PROMPTS = [
  'Show me the current topology and system status',
  'Visualize telemetry trends as a chart',
  'Spin up a Llama 3 instance with RAG access but no web',
];

export default function ChatPanel() {
  const { messages, send, busy } = useChat();
  const [input, setInput] = useState('');

  const applyPatch = async (patch: UiPatch): Promise<void> => {
    const res = await fetch('/api/topology/mutate', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action: 'apply-patch', patch }),
    });
    if (!res.ok) throw new Error(`apply failed (HTTP ${res.status})`);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = input.trim();
    if (!cmd || busy) return;
    setInput('');
    void send(cmd);
  };

  return (
    <div className="flex h-full flex-col border border-neon-magenta/30 bg-[#12081a]">
      <div className="flex shrink-0 items-center justify-between border-b border-neon-magenta/20 px-3 py-2">
        <span className="text-[10px] uppercase tracking-widest text-neon-magenta">
          Generative Brain — chat orchestration
        </span>
        <span
          className={`h-2 w-2 rounded-full ${busy ? 'bg-neon-magenta animate-pulse-slow' : 'bg-quantum-green'}`}
        />
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3 scrollbar-thin">
        {messages.length === 0 ? (
          <div className="space-y-2">
            <p className="text-[10px] leading-relaxed text-cyan-400/60">
              Natural language commands translate into system actions: query live data, generate
              interface widgets, and propose topology changes (HITL-confirmed).
            </p>
            <div className="flex flex-col gap-1.5">
              {QUICK_PROMPTS.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => void send(q)}
                  className="rounded border border-neon-magenta/30 px-2 py-1 text-left text-[10px] text-neon-magenta/90 hover:bg-neon-magenta/10"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {messages.map((m) =>
          m.role === 'user' ? (
            <div key={m.id} className="flex justify-end">
              <div className="max-w-[85%] rounded-lg rounded-br-none border border-electric-cyan/30 bg-cyan-950/30 px-2.5 py-1.5 text-[11px] text-cyan-100">
                {m.text}
              </div>
            </div>
          ) : (
            <div key={m.id} className="space-y-2">
              {m.events
                .filter((e) => e.type === 'tool_call' && e.status === 'running')
                .map((e, i) =>
                  e.type === 'tool_call' ? (
                    <div key={`t-${i}`} className="flex items-center gap-1.5 text-[10px] text-cyan-400/60">
                      <span className="animate-pulse-slow">⚙</span> tool: <span className="text-electric-cyan">{e.name}</span>
                    </div>
                  ) : null,
                )}
              {m.text ? (
                <div className="max-w-[90%] whitespace-pre-wrap rounded-lg rounded-bl-none border border-neon-magenta/20 bg-obsidian/70 px-2.5 py-1.5 text-[11px] leading-relaxed text-cyan-100">
                  {m.text}
                </div>
              ) : null}
              {m.events.map((e, i) => {
                if (e.type === 'ui_component') {
                  return <WidgetRenderer key={`w-${i}`} schema={e.schema} onApplyPatch={applyPatch} />;
                }
                if (e.type === 'topology_patch') {
                  return <WidgetRenderer key={`p-${i}`} schema={{ version: '1', widgets: [{ type: 'topology-patch', summary: e.patch.summary, requiresConfirmation: true, nodes: e.patch.nodes, edges: e.patch.edges }] }} onApplyPatch={applyPatch} />;
                }
                return null;
              })}
            </div>
          ),
        )}
      </div>

      <form onSubmit={submit} className="flex shrink-0 gap-2 border-t border-neon-magenta/20 p-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="command the system…"
          className="min-w-0 flex-1 rounded border border-neon-magenta/30 bg-obsidian px-2 py-1.5 text-[11px] text-cyan-100 placeholder:text-cyan-400/30 focus:border-neon-magenta/60 focus:outline-none"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="rounded border border-neon-magenta/40 bg-neon-magenta/20 px-3 py-1.5 text-[11px] text-neon-magenta hover:bg-neon-magenta/40 disabled:opacity-40"
        >
          {busy ? '…' : 'EXEC'}
        </button>
      </form>
    </div>
  );
}
