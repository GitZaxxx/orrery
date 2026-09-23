'use client';

import type { AuditResponse, IsolationResponse, PortsResponse } from '@/lib/types';
import { usePanelData } from '@/hooks/usePanelData';
import { fmtTime } from '@/lib/format';

function IsolationBadge({ mode }: { mode: 'internal' | 'bridged' }) {
  return mode === 'internal' ? (
    <span className="rounded border border-quantum-green/40 bg-quantum-green/10 px-1.5 py-0.5 text-[9px] tracking-wider text-quantum-green">
      INTERNAL-ONLY
    </span>
  ) : (
    <span className="rounded border border-alert-amber/50 bg-amber-950/20 px-1.5 py-0.5 text-[9px] tracking-wider text-alert-amber">
      OUTBOUND ACCESS
    </span>
  );
}

export default function SecurityPanel() {
  const { data: iso } = usePanelData<IsolationResponse>('/api/security/isolation', 6000);
  const { data: ports } = usePanelData<PortsResponse>('/api/security/ports', 5000);
  const { data: audit } = usePanelData<AuditResponse>('/api/security/audit', 4000);

  return (
    <div className="flex flex-col gap-2 p-3">
      <div className="text-[10px] uppercase tracking-[0.3em] text-cyan-400/50">
        Zero-Trust Security
      </div>

      {/* Network isolation */}
      <div className="rounded border border-cyan-500/20 bg-panel p-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-widest text-cyan-400/70">
            Network isolation
          </span>
          {iso ? <IsolationBadge mode={iso.networkMode} /> : null}
        </div>
        <div className="space-y-1 text-[10px] text-cyan-200/80">
          <div>
            <span className="text-cyan-400/60">self:</span> {iso?.self.name ?? '…'} —{' '}
            {iso?.self.capabilities.join(', ')}
          </div>
          {iso?.plugins.map((p) => (
            <div key={p.id} className="flex items-center justify-between">
              <span>{p.name}</span>
              <IsolationBadge mode={p.isolation} />
            </div>
          ))}
          <div className="text-[9px] text-cyan-400/40">
            podman-agent: {iso ? (iso.podmanAgent ? 'connected' : 'not plugged in (PODMAN_API_URL)') : '…'}
          </div>
        </div>
      </div>

      {/* Exposed ports (live from /proc/net/tcp) */}
      <div className="rounded border border-cyan-500/20 bg-panel p-3">
        <div className="mb-2 text-[10px] uppercase tracking-widest text-cyan-400/70">
          Listening ports (netns)
        </div>
        <div className="max-h-28 space-y-0.5 overflow-y-auto scrollbar-thin">
          {ports && ports.ports.length > 0 ? (
            ports.ports.map((p, i) => (
              <div key={`${p.proto}-${p.port}-${i}`} className="flex justify-between text-[10px]">
                <span className="text-cyan-200/80">{p.proto}</span>
                <span className="text-electric-cyan">:{p.port}</span>
              </div>
            ))
          ) : (
            <div className="text-[10px] text-cyan-400/40">no listening sockets visible</div>
          )}
        </div>
      </div>

      {/* Audit stream */}
      <div className="rounded border border-cyan-500/20 bg-panel p-3">
        <div className="mb-2 text-[10px] uppercase tracking-widest text-cyan-400/70">
          Audit stream
        </div>
        <div className="max-h-56 space-y-1 overflow-y-auto scrollbar-thin">
          {audit && audit.entries.length > 0 ? (
            audit.entries.map((e, i) => (
              <div key={`${e.ts}-${i}`} className="text-[10px] leading-tight">
                <span className="text-cyan-400/50">{fmtTime(e.ts)}</span>{' '}
                <span className="text-electric-cyan">{e.actor}</span>{' '}
                <span className="text-cyan-200/80">{e.action}</span>
                {e.detail ? <span className="text-cyan-400/50"> — {e.detail}</span> : null}
              </div>
            ))
          ) : (
            <div className="text-[10px] text-cyan-400/40">no events yet</div>
          )}
        </div>
      </div>
    </div>
  );
}
