'use client';

import { motion } from 'framer-motion';
import type { HealthState } from '@/lib/types';
import { usePanelData } from '@/hooks/usePanelData';
import { fmtUptime } from '@/lib/format';
import ArsenalPanel from '@/components/panels/ArsenalPanel';
import CanvasPanel from '@/components/panels/CanvasPanel';
import SecurityPanel from '@/components/panels/SecurityPanel';
import TelemetryPanel from '@/components/panels/TelemetryPanel';
import ChatPanel from '@/components/panels/ChatPanel';

function Header() {
  const { data: health } = usePanelData<HealthState>('/api/health', 10000);

  const chips: { label: string; value: string; tone: string }[] = [
    {
      label: 'SYS',
      value: health ? `UP ${fmtUptime(health.uptimeSec)}` : '…',
      tone: 'text-quantum-green border-quantum-green/40',
    },
    {
      label: 'PLUGINS',
      value: health ? String(health.pluginsRegistered) : '…',
      tone: 'text-electric-cyan border-electric-cyan/40',
    },
    {
      label: 'TOPO REV',
      value: health ? String(health.topologyRevision) : '…',
      tone: 'text-electric-cyan border-electric-cyan/40',
    },
    {
      label: 'GENUI',
      value: health ? (health.genui.configured ? 'ONLINE' : 'NO LLM') : '…',
      tone: health?.genui.configured
        ? 'text-quantum-green border-quantum-green/40'
        : 'text-alert-amber border-alert-amber/40',
    },
  ];

  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex h-12 shrink-0 items-center justify-between border-b border-cyan-500/20 bg-deep-space px-4"
    >
      <div className="flex items-center gap-3">
        <span className="text-sm font-bold tracking-[0.25em] text-electric-cyan text-glow-cyan">
          AGY
        </span>
        <span className="text-[10px] uppercase tracking-widest text-cyan-400/60">
          Command Center — generative system dashboard
        </span>
      </div>
      <div className="flex items-center gap-2">
        {chips.map((c) => (
          <span
            key={c.label}
            className={`rounded-full border px-2 py-0.5 text-[10px] tracking-wider ${c.tone}`}
          >
            {c.label} <span className="font-semibold">{c.value}</span>
          </span>
        ))}
      </div>
    </motion.header>
  );
}

export default function DashboardShell() {
  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-obsidian">
      <Header />
      <div className="flex min-h-0 flex-1">
        {/* Left: The Arsenal */}
        <aside className="w-72 shrink-0 overflow-y-auto border-r border-cyan-500/15 bg-deep-space/40 scrollbar-thin">
          <ArsenalPanel />
        </aside>

        {/* Center: Canvas + bottom telemetry/chat */}
        <main className="flex min-w-0 flex-1 flex-col">
          <div className="min-h-0 flex-1">
            <CanvasPanel />
          </div>
          <div className="flex h-72 shrink-0 border-t border-cyan-500/15">
            <div className="min-w-0 flex-1 overflow-hidden">
              <TelemetryPanel />
            </div>
            <div className="w-[440px] shrink-0 border-l border-cyan-500/15">
              <ChatPanel />
            </div>
          </div>
        </main>

        {/* Right: Zero-Trust Security */}
        <aside className="w-80 shrink-0 overflow-y-auto border-l border-cyan-500/15 bg-deep-space/40 scrollbar-thin">
          <SecurityPanel />
        </aside>
      </div>
    </div>
  );
}
