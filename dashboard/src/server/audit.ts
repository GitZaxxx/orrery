import type { AuditEntry } from '@/lib/types';

type State = { entries: AuditEntry[] };

const g = globalThis as unknown as { __agyAudit?: State };
const state: State = (g.__agyAudit ??= { entries: [] });

export function audit(actor: string, action: string, detail?: string): void {
  state.entries.unshift({ ts: Date.now(), actor, action, detail });
  if (state.entries.length > 200) state.entries.length = 200;
}

export function recentAudit(limit = 30): AuditEntry[] {
  return state.entries.slice(0, limit);
}
