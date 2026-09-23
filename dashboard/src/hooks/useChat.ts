'use client';

import { useCallback, useState } from 'react';
import type { ChatEvent } from '@/lib/types';

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  events: ChatEvent[];
};

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [busy, setBusy] = useState(false);

  const send = useCallback(
    async (command: string) => {
      if (!command.trim() || busy) return;
      setBusy(true);
      const asstId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      setMessages((ms) => [
        ...ms,
        { id: `u-${asstId}`, role: 'user', text: command, events: [] },
        { id: asstId, role: 'assistant', text: '', events: [] },
      ]);

      const update = (fn: (m: ChatMessage) => ChatMessage) =>
        setMessages((ms) => ms.map((m) => (m.id === asstId ? fn(m) : m)));

      try {
        const res = await fetch('/api/chat/execute', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ command }),
        });
        if (!res.ok || !res.body) {
          const detail = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
          update((m) => ({ ...m, text: `[error] ${(detail as { error?: string }).error ?? 'request failed'}` }));
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          let idx: number;
          while ((idx = buffer.indexOf('\n\n')) >= 0) {
            const frame = buffer.slice(0, idx);
            buffer = buffer.slice(idx + 2);
            const line = frame.split('\n').find((l) => l.startsWith('data: '));
            if (!line) continue;
            let ev: ChatEvent;
            try {
              ev = JSON.parse(line.slice(6)) as ChatEvent;
            } catch {
              continue;
            }
            if (ev.type === 'text-delta') {
              update((m) => ({ ...m, text: m.text + ev.text }));
            } else if (ev.type === 'error') {
              update((m) => ({ ...m, text: `${m.text}${m.text ? '\n' : ''}[error] ${ev.message}` }));
            } else if (ev.type !== 'done') {
              update((m) => ({ ...m, events: [...m.events, ev] }));
            }
          }
        }
      } catch (e) {
        update((m) => ({ ...m, text: `${m.text}\n[error] ${(e as Error).message}` }));
      } finally {
        setBusy(false);
      }
    },
    [busy],
  );

  return { messages, send, busy };
}
