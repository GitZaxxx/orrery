'use client';

import { useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { UiSchema, UiWidget, UiPatch } from '@/lib/types';

const SERIES_COLORS = ['#00F5FF', '#FF00FF', '#00FF88', '#FFB300', '#BF00FF', '#A5F3FC'];

const tooltipStyle = {
  backgroundColor: '#0E1424',
  border: '1px solid rgba(0,245,255,0.3)',
  borderRadius: '4px',
  fontSize: '11px',
  color: '#A5F3FC',
};

function StatusCard({ w }: { w: Extract<UiWidget, { type: 'status-card' }> }) {
  const color =
    w.status === 'ok'
      ? 'text-quantum-green'
      : w.status === 'warn'
        ? 'text-alert-amber'
        : w.status === 'error'
          ? 'text-red-400'
          : 'text-cyan-200';
  return (
    <div className="rounded border border-cyan-500/20 bg-panel px-3 py-2">
      <div className="text-[10px] uppercase tracking-wider text-cyan-400/60">{w.title}</div>
      <div className={`mt-1 text-lg font-semibold ${color}`}>
        {w.value}
        {w.unit ? <span className="ml-1 text-xs text-cyan-400/70">{w.unit}</span> : null}
        {w.trend ? (
          <span className="ml-2 text-xs text-cyan-400/60">
            {w.trend === 'up' ? '▲' : w.trend === 'down' ? '▼' : '■'}
          </span>
        ) : null}
      </div>
    </div>
  );
}

function TableWidget({ w }: { w: Extract<UiWidget, { type: 'table' }> }) {
  return (
    <div className="rounded border border-cyan-500/20 bg-panel p-3">
      <div className="mb-2 text-[10px] uppercase tracking-wider text-cyan-400/60">{w.title}</div>
      <div className="max-h-56 overflow-auto scrollbar-thin">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-cyan-500/20 text-cyan-400/70">
              {w.columns.map((c) => (
                <th key={c.key} className="px-2 py-1 font-semibold">
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {w.rows.map((row, i) => (
              <tr key={i} className="border-b border-cyan-500/10 text-cyan-100/90">
                {w.columns.map((c) => (
                  <td key={c.key} className="px-2 py-1">
                    {String(row[c.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ChartWidget({ w }: { w: Extract<UiWidget, { type: 'chart' }> }) {
  const data = useMemo(() => {
    const len = Math.max(...w.series.map((s) => s.points.length));
    return Array.from({ length: len }, (_, i) => {
      const row: Record<string, number | string> = {
        x: w.series[0]?.points[i]?.x ?? i,
      };
      for (const s of w.series) row[s.name] = s.points[i]?.y ?? 0;
      return row;
    });
  }, [w.series]);

  const seriesEls = w.series.map((s, i) => {
    const color = SERIES_COLORS[i % SERIES_COLORS.length];
    if (w.chartType === 'area') return <Area key={s.name} type="monotone" dataKey={s.name} stroke={color} fill={color} fillOpacity={0.12} strokeWidth={1.5} dot={false} />;
    if (w.chartType === 'bar') return <Bar key={s.name} dataKey={s.name} fill={color} fillOpacity={0.7} radius={[2, 2, 0, 0]} />;
    return <Line key={s.name} type="monotone" dataKey={s.name} stroke={color} strokeWidth={1.5} dot={false} />;
  });

  const Chart = w.chartType === 'bar' ? BarChart : w.chartType === 'area' ? AreaChart : LineChart;

  return (
    <div className="rounded border border-cyan-500/20 bg-panel p-3">
      <div className="mb-2 text-[10px] uppercase tracking-wider text-cyan-400/60">{w.title}</div>
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <Chart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
            <CartesianGrid stroke="rgba(0,245,255,0.08)" />
            <XAxis dataKey="x" tick={{ fontSize: 9, fill: 'rgba(165,243,252,0.5)' }} stroke="rgba(0,245,255,0.2)" />
            <YAxis tick={{ fontSize: 9, fill: 'rgba(165,243,252,0.5)' }} stroke="rgba(0,245,255,0.2)" />
            <Tooltip contentStyle={tooltipStyle} />
            {w.series.length > 1 ? <Legend wrapperStyle={{ fontSize: 10, color: '#A5F3FC' }} /> : null}
            {seriesEls}
          </Chart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function AlertWidget({ w }: { w: Extract<UiWidget, { type: 'alert' }> }) {
  const tone =
    w.severity === 'critical'
      ? 'border-red-500/40 bg-red-950/30 text-red-300'
      : w.severity === 'warn'
        ? 'border-amber-500/40 bg-amber-950/20 text-amber-200'
        : 'border-cyan-500/30 bg-cyan-950/20 text-cyan-200';
  return (
    <div className={`rounded border px-3 py-2 text-xs ${tone}`}>
      <span className="font-semibold">{w.title}</span>
      <span className="mx-1 text-cyan-400/40">::</span>
      {w.message}
    </div>
  );
}

function FormWidget({ w }: { w: Extract<UiWidget, { type: 'form' }> }) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [result, setResult] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!w.submitEndpoint || busy) return;
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch(w.submitEndpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(values),
      });
      setResult(res.ok ? 'submitted' : `rejected (HTTP ${res.status})`);
    } catch (e) {
      setResult(`error: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded border border-cyan-500/20 bg-panel p-3">
      <div className="mb-2 text-[10px] uppercase tracking-wider text-cyan-400/60">{w.title}</div>
      <div className="space-y-2">
        {w.fields.map((f) => (
          <label key={f.name} className="block">
            <span className="mb-1 block text-[10px] text-cyan-400/70">{f.label}</span>
            {f.inputType === 'select' && f.options ? (
              <select
                className="w-full rounded border border-cyan-500/30 bg-obsidian px-2 py-1 text-xs text-cyan-200"
                value={values[f.name] ?? ''}
                onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
              >
                <option value="">—</option>
                {f.options.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            ) : f.inputType === 'textarea' ? (
              <textarea
                rows={2}
                placeholder={f.placeholder}
                className="w-full rounded border border-cyan-500/30 bg-obsidian px-2 py-1 text-xs text-cyan-200"
                value={values[f.name] ?? ''}
                onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
              />
            ) : (
              <input
                type={f.inputType === 'number' ? 'number' : 'text'}
                placeholder={f.placeholder}
                className="w-full rounded border border-cyan-500/30 bg-obsidian px-2 py-1 text-xs text-cyan-200"
                value={values[f.name] ?? ''}
                onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
              />
            )}
          </label>
        ))}
        <button
          type="button"
          onClick={submit}
          disabled={!w.submitEndpoint || busy}
          className={`rounded px-3 py-1 text-xs ${
            w.submitEndpoint
              ? 'bg-cyan-600/30 text-cyan-200 hover:bg-cyan-600/50'
              : 'cursor-not-allowed bg-cyan-900/20 text-cyan-500/40'
          }`}
        >
          {busy ? 'submitting…' : (w.submitLabel ?? 'submit')}
        </button>
        {w.submitEndpoint ? null : (
          <span className="ml-2 text-[10px] text-cyan-400/40">no endpoint — display-only</span>
        )}
        {result ? <span className="ml-2 text-[10px] text-quantum-green">{result}</span> : null}
      </div>
    </div>
  );
}

export function PatchCard({
  patch,
  onApply,
}: {
  patch: UiPatch;
  onApply?: (patch: UiPatch) => Promise<void>;
}) {
  const [state, setState] = useState<'idle' | 'applying' | 'applied' | 'error'>('idle');
  return (
    <div className="rounded border border-neon-magenta/40 bg-[#1a0a1e] p-3">
      <div className="flex items-center justify-between">
        <div className="text-[10px] uppercase tracking-wider text-neon-magenta">
          Proposed topology patch (HITL)
        </div>
        {state === 'idle' ? (
          <button
            type="button"
            onClick={async () => {
              if (!onApply) return;
              setState('applying');
              try {
                await onApply(patch);
                setState('applied');
              } catch {
                setState('error');
              }
            }}
            className="rounded bg-neon-magenta/20 px-2 py-0.5 text-[10px] text-neon-magenta hover:bg-neon-magenta/40"
          >
            Apply
          </button>
        ) : (
          <span
            className={`text-[10px] ${state === 'applied' ? 'text-quantum-green' : state === 'error' ? 'text-red-400' : 'text-cyan-400/60'}`}
          >
            {state === 'applying' ? 'applying…' : state === 'applied' ? 'applied ✓' : 'failed'}
          </span>
        )}
      </div>
      <p className="mt-1 text-xs text-cyan-200/90">{patch.summary}</p>
      <div className="mt-2 space-y-1 text-[10px] text-cyan-400/70">
        {patch.nodes.map((n) => (
          <div key={n.id}>
            + node <span className="text-quantum-green">{n.id}</span> ({n.kind}) “{n.label}”
          </div>
        ))}
        {patch.edges.map((e, i) => (
          <div key={`e-${i}`}>
            + edge <span className="text-electric-cyan">{e.source}</span> →{' '}
            <span className="text-electric-cyan">{e.target}</span>
            {e.label ? ` (${e.label})` : ''}
          </div>
        ))}
      </div>
    </div>
  );
}

function CodeBlockWidget({ w }: { w: Extract<UiWidget, { type: 'code-block' }> }) {
  return (
    <div className="rounded border border-cyan-500/20 bg-panel p-3">
      <div className="mb-2 text-[10px] uppercase tracking-wider text-cyan-400/60">
        {w.language ?? 'code'}
      </div>
      <pre className="max-h-48 overflow-auto text-[10px] leading-relaxed text-cyan-200/90 scrollbar-thin">
        {w.code}
      </pre>
    </div>
  );
}

export function Widget({
  w,
  onApplyPatch,
}: {
  w: UiWidget;
  onApplyPatch?: (patch: UiPatch) => Promise<void>;
}) {
  switch (w.type) {
    case 'status-card':
      return <StatusCard w={w} />;
    case 'table':
      return <TableWidget w={w} />;
    case 'chart':
      return <ChartWidget w={w} />;
    case 'alert':
      return <AlertWidget w={w} />;
    case 'form':
      return <FormWidget w={w} />;
    case 'topology-patch':
      return (
        <PatchCard
          patch={{ summary: w.summary, nodes: w.nodes, edges: w.edges }}
          onApply={onApplyPatch}
        />
      );
    case 'code-block':
      return <CodeBlockWidget w={w} />;
    default:
      return null;
  }
}

export function WidgetRenderer({
  schema,
  onApplyPatch,
}: {
  schema: UiSchema;
  onApplyPatch?: (patch: UiPatch) => Promise<void>;
}) {
  return (
    <div className="space-y-2">
      {schema.title ? (
        <div className="text-[10px] uppercase tracking-widest text-electric-cyan/70">{schema.title}</div>
      ) : null}
      {schema.widgets.map((w, i) => (
        <Widget key={i} w={w} onApplyPatch={onApplyPatch} />
      ))}
    </div>
  );
}
