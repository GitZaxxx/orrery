'use client';

import type { AdapterStatus, PluginRecord, VllmStatus } from '@/lib/types';
import { usePanelData } from '@/hooks/usePanelData';

function StatusPill({ status }: { status: string }) {
  const tone =
    status === 'connected'
      ? 'border-quantum-green/40 bg-quantum-green/10 text-quantum-green'
      : status === 'error'
        ? 'border-red-500/40 bg-red-950/30 text-red-400'
        : 'border-alert-amber/40 bg-amber-950/20 text-alert-amber';
  return (
    <span className={`rounded border px-1.5 py-0.5 text-[9px] tracking-wider ${tone}`}>
      {status === 'unregistered' ? 'UNREGISTERED' : status.toUpperCase()}
    </span>
  );
}

function UnregisteredHint({ envVar }: { envVar: string }) {
  return (
    <div className="mt-2 rounded border border-dashed border-alert-amber/40 px-2 py-1.5 text-[10px] text-amber-200/70">
      Plug in: set <span className="text-amber-200">{envVar}</span> to this pod and restart.
    </div>
  );
}

function Card({
  title,
  status,
  children,
}: {
  title: string;
  status: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded border border-cyan-500/20 bg-panel p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-widest text-cyan-400/70">{title}</span>
        <StatusPill status={status} />
      </div>
      {children}
    </div>
  );
}

function VllmCard() {
  const { data } = usePanelData<VllmStatus>('/api/vllm/status', 5000);
  const status = data?.status ?? 'unregistered';
  return (
    <Card title="Inference / vLLM" status={status}>
      {data?.status === 'connected' ? (
        <div className="space-y-1">
          <div className="text-[10px] text-cyan-400/60">
            {data.models?.length ?? 0} model(s) loaded
          </div>
          <div className="max-h-20 space-y-0.5 overflow-y-auto scrollbar-thin">
            {data.models?.slice(0, 6).map((m) => (
              <div key={m.id} className="flex items-center gap-1 text-[10px] text-cyan-200/90">
                <span className="text-quantum-green">▪</span> {m.id}
              </div>
            ))}
          </div>
          <div className="truncate text-[9px] text-cyan-400/40">{data.source}</div>
        </div>
      ) : data?.status === 'error' ? (
        <div className="text-[10px] text-red-300">{data.detail}</div>
      ) : (
        <UnregisteredHint envVar="VLLM_API_URL" />
      )}
    </Card>
  );
}

function AdapterCard({
  title,
  path,
  envVar,
}: {
  title: string;
  path: string;
  envVar: string;
}) {
  const { data } = usePanelData<AdapterStatus>(path, 5000);
  const status = data?.status ?? 'unregistered';
  const keys = data?.data ? Object.keys(data.data).slice(0, 4) : [];
  return (
    <Card title={title} status={status}>
      {data?.status === 'connected' ? (
        <div className="space-y-0.5">
          {keys.map((k) => (
            <div key={k} className="truncate text-[10px] text-cyan-200/80">
              {k}: {String(data.data?.[k]).slice(0, 40)}
            </div>
          ))}
          {keys.length === 0 ? <div className="text-[10px] text-cyan-400/50">connected</div> : null}
        </div>
      ) : data?.status === 'error' ? (
        <div className="text-[10px] text-red-300">{data.detail}</div>
      ) : (
        <UnregisteredHint envVar={envVar} />
      )}
    </Card>
  );
}

export default function ArsenalPanel() {
  const { data: plugins } = usePanelData<{ plugins: PluginRecord[] }>('/api/plugins', 6000);

  return (
    <div className="flex flex-col gap-2 p-3">
      <div className="text-[10px] uppercase tracking-[0.3em] text-cyan-400/50">The Arsenal</div>
      <VllmCard />
      <AdapterCard title="MCP" path="/api/mcp/status" envVar="MCP_API_URL" />
      <AdapterCard title="Prompts" path="/api/prompts" envVar="PROMPTS_API_URL" />
      <AdapterCard title="RAG / Vectors" path="/api/rag/vectors" envVar="RAG_API_URL" />

      <div className="mt-1 text-[10px] uppercase tracking-[0.3em] text-cyan-400/50">
        Registered plug-ins
      </div>
      {plugins && plugins.plugins.length > 0 ? (
        <div className="space-y-1.5">
          {plugins.plugins.map((p) => (
            <div
              key={p.manifest.id}
              className="rounded border border-quantum-green/30 bg-panel px-2 py-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-cyan-100">{p.manifest.name}</span>
                <span className="rounded border border-quantum-green/40 px-1 text-[9px] text-quantum-green">
                  {p.manifest.kind}
                </span>
              </div>
              <div className="text-[9px] text-cyan-400/50">
                {p.manifest.id}@{p.manifest.version}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded border border-dashed border-cyan-500/25 px-2 py-2 text-[10px] text-cyan-400/50">
          No plug-ins registered yet. Pods POST their manifest to{' '}
          <span className="text-electric-cyan">/api/plugins</span> on boot.
        </div>
      )}
    </div>
  );
}
