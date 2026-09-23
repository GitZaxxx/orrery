import os from 'node:os';
import fs from 'node:fs';
import type { TelemetryTick } from '@/lib/types';
import { countPlugins } from './registry';
import { getRevision } from './topology';

type State = {
  lastCpu: [number, number] | null; // [idle, total]
  lastNet: { rx: number; tx: number } | null;
  lastTs: number;
  window: TelemetryTick[];
  startedAt: number;
};

const g = globalThis as unknown as { __agyTelemetry?: State };
const state: State = (g.__agyTelemetry ??= {
  lastCpu: null,
  lastNet: null,
  lastTs: Date.now(),
  window: [],
  startedAt: Date.now(),
});

// Real container network counters from /proc/net/dev (Linux netns)
function readNet(): { rx: number; tx: number } | null {
  try {
    const data = fs.readFileSync('/proc/net/dev', 'utf8');
    let rx = 0;
    let tx = 0;
    for (const line of data.split('\n').slice(2)) {
      const sep = line.indexOf(':');
      if (sep === -1) continue;
      const iface = line.slice(0, sep).trim();
      if (!iface || iface === 'lo') continue;
      const cols = line.slice(sep + 1).trim().split(/\s+/);
      rx += Number(cols[0]) || 0;
      tx += Number(cols[8]) || 0;
    }
    return { rx, tx };
  } catch {
    return null;
  }
}

export function sampleTick(): TelemetryTick {
  const cpus = os.cpus();
  const idle = cpus.reduce((a, c) => a + c.times.idle, 0);
  const total = cpus.reduce((a, c) => a + Object.values(c.times).reduce((x, y) => x + y, 0), 0);
  const now = Date.now();
  const net = readNet();

  let cpuPct = 0;
  if (state.lastCpu) {
    const idleDelta = idle - state.lastCpu[0];
    const totalDelta = total - state.lastCpu[1];
    if (totalDelta > 0) {
      cpuPct = Math.max(0, Math.min(100, (1 - idleDelta / totalDelta) * 100));
    }
  }

  let netInBps = 0;
  let netOutBps = 0;
  if (state.lastNet && net && now > state.lastTs) {
    const dt = (now - state.lastTs) / 1000;
    netInBps = Math.max(0, (net.rx - state.lastNet.rx) / dt);
    netOutBps = Math.max(0, (net.tx - state.lastNet.tx) / dt);
  }

  state.lastCpu = [idle, total];
  if (net) state.lastNet = net;
  state.lastTs = now;

  const memTotal = os.totalmem();
  const tick: TelemetryTick = {
    ts: now,
    cpuPct: Math.round(cpuPct * 10) / 10,
    memUsedBytes: memTotal - os.freemem(),
    memTotalBytes: memTotal,
    netInBps: Math.round(netInBps),
    netOutBps: Math.round(netOutBps),
    procRssBytes: process.memoryUsage().rss,
    uptimeSec: Math.round((now - state.startedAt) / 1000),
    pluginsRegistered: countPlugins(),
    topologyRevision: getRevision(),
  };

  state.window.push(tick);
  if (state.window.length > 120) state.window.shift();
  return tick;
}

export function telemetryWindow(): TelemetryTick[] {
  return [...state.window];
}

export function snapshot(): TelemetryTick {
  return state.window[state.window.length - 1] ?? sampleTick();
}
