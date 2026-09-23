'use client';

import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { TelemetryTick } from '@/lib/types';
import { useTelemetry } from '@/hooks/useTelemetry';
import { fmtBps, fmtBytes, fmtTime, fmtUptime } from '@/lib/format';

const tooltipStyle = {
  backgroundColor: '#0E1424',
  border: '1px solid rgba(0,245,255,0.3)',
  borderRadius: '4px',
  fontSize: '11px',
  color: '#A5F3FC',
};

export default function TelemetryPanel() {
  const ticks = useTelemetry();
  const latest = ticks.length > 0 ? ticks[ticks.length - 1] : null;

  const netData = ticks.slice(-60).map((t: TelemetryTick) => ({
    ts: fmtTime(t.ts),
    in: Math.round(t.netInBps),
    out: Math.round(t.netOutBps),
  }));
  const resData = ticks.slice(-60).map((t: TelemetryTick) => ({
    ts: fmtTime(t.ts),
    cpu: t.cpuPct,
    mem: Math.round((t.memUsedBytes / Math.max(1, t.memTotalBytes)) * 1000) / 10,
  }));

  return (
    <div className="flex h-full min-w-0 flex-col gap-2 p-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-[0.3em] text-cyan-400/50">
          Network state & telemetry (live)
        </span>
        <div className="flex gap-2 text-[10px]">
          <span className="rounded border border-cyan-500/30 px-1.5 py-0.5 text-cyan-200/80">
            CPU <span className="text-electric-cyan">{latest ? `${latest.cpuPct}%` : '…'}</span>
          </span>
          <span className="rounded border border-cyan-500/30 px-1.5 py-0.5 text-cyan-200/80">
            MEM <span className="text-electric-cyan">{latest ? fmtBytes(latest.memUsedBytes) : '…'}</span>
          </span>
          <span className="rounded border border-cyan-500/30 px-1.5 py-0.5 text-cyan-200/80">
            RSS <span className="text-electric-cyan">{latest ? fmtBytes(latest.procRssBytes) : '…'}</span>
          </span>
          <span className="rounded border border-cyan-500/30 px-1.5 py-0.5 text-cyan-200/80">
            UP <span className="text-electric-cyan">{latest ? fmtUptime(latest.uptimeSec) : '…'}</span>
          </span>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-2 gap-2">
        <div className="min-w-0 rounded border border-cyan-500/20 bg-panel p-2">
          <div className="text-[9px] uppercase tracking-wider text-cyan-400/60">
            Network in / out · B/s
          </div>
          <div className="h-[88%]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={netData} margin={{ top: 4, right: 4, bottom: 0, left: -8 }}>
                <defs>
                  <linearGradient id="netIn" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00F5FF" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#00F5FF" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="netOut" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FF00FF" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#FF00FF" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(0,245,255,0.07)" />
                <XAxis dataKey="ts" tick={{ fontSize: 8, fill: 'rgba(165,243,252,0.4)' }} stroke="rgba(0,245,255,0.15)" minTickGap={40} />
                <YAxis tick={{ fontSize: 8, fill: 'rgba(165,243,252,0.4)' }} stroke="rgba(0,245,255,0.15)" width={48} tickFormatter={(v: number) => fmtBps(v)} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="in" stroke="#00F5FF" strokeWidth={1.2} fill="url(#netIn)" dot={false} isAnimationActive={false} />
                <Area type="monotone" dataKey="out" stroke="#FF00FF" strokeWidth={1.2} fill="url(#netOut)" dot={false} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="min-w-0 rounded border border-cyan-500/20 bg-panel p-2">
          <div className="text-[9px] uppercase tracking-wider text-cyan-400/60">CPU % / MEM %</div>
          <div className="h-[88%]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={resData} margin={{ top: 4, right: 4, bottom: 0, left: -8 }}>
                <CartesianGrid stroke="rgba(0,245,255,0.07)" />
                <XAxis dataKey="ts" tick={{ fontSize: 8, fill: 'rgba(165,243,252,0.4)' }} stroke="rgba(0,245,255,0.15)" minTickGap={40} />
                <YAxis tick={{ fontSize: 8, fill: 'rgba(165,243,252,0.4)' }} stroke="rgba(0,245,255,0.15)" width={30} domain={[0, 100]} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="cpu" stroke="#00FF88" strokeWidth={1.2} dot={false} isAnimationActive={false} />
                <Line type="monotone" dataKey="mem" stroke="#FFB300" strokeWidth={1} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
