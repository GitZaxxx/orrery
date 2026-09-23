import fs from 'node:fs';
import type { AdapterStatus, IsolationResponse, PortsResponse, VllmStatus } from '@/lib/types';
import { env } from './env';
import { listPlugins } from './registry';

async function fetchJson(url: string, timeoutMs = 3000): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { accept: 'application/json' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

// ── Arsenal panel adapters ─────────────────────────────────────────
// Each adapter is honest: if the plug-in URL is not configured, it
// returns "unregistered" — the panel then shows how to plug it in.
// No data is ever fabricated.

export async function vllmStatus(): Promise<VllmStatus> {
  if (!env.vllmApiUrl) return { status: 'unregistered' };
  try {
    const data = (await fetchJson(`${env.vllmApiUrl}/v1/models`)) as {
      data?: { id?: string; owned_by?: string }[];
    };
    const models = (data.data ?? []).map((m) => ({
      id: m.id ?? 'unknown',
      ownedBy: m.owned_by,
    }));
    return { status: 'connected', source: env.vllmApiUrl, models };
  } catch (e) {
    return { status: 'error', source: env.vllmApiUrl, detail: (e as Error).message };
  }
}

export async function mcpStatus(): Promise<AdapterStatus> {
  if (!env.mcpApiUrl) return { status: 'unregistered' };
  try {
    const data = (await fetchJson(`${env.mcpApiUrl}/mcp/status`)) as Record<string, unknown>;
    return { status: 'connected', source: env.mcpApiUrl, data };
  } catch (e) {
    return { status: 'error', source: env.mcpApiUrl, detail: (e as Error).message };
  }
}

export async function promptsStatus(): Promise<AdapterStatus> {
  if (!env.promptsApiUrl) return { status: 'unregistered' };
  try {
    const data = (await fetchJson(`${env.promptsApiUrl}/prompts`)) as Record<string, unknown>;
    return { status: 'connected', source: env.promptsApiUrl, data };
  } catch (e) {
    return { status: 'error', source: env.promptsApiUrl, detail: (e as Error).message };
  }
}

export async function ragStatus(): Promise<AdapterStatus> {
  if (!env.ragApiUrl) return { status: 'unregistered' };
  try {
    const data = (await fetchJson(`${env.ragApiUrl}/rag/vectors`)) as Record<string, unknown>;
    return { status: 'connected', source: env.ragApiUrl, data };
  } catch (e) {
    return { status: 'error', source: env.ragApiUrl, detail: (e as Error).message };
  }
}

// ── Zero-trust security panel ───────────────────────────────────────

export function isolationStatus(): IsolationResponse {
  const plugins = listPlugins()
    .filter((p) => p.isolation)
    .map((p) => ({
      id: p.id,
      name: p.name,
      isolation: p.isolation!.network,
      capabilities: p.isolation!.capabilities,
    }));
  return {
    networkMode: env.podIsolation,
    self: {
      name: 'agy-dashboard',
      isolation: env.podIsolation,
      capabilities: ['non-root', 'standalone-nextjs', 'no-podman-socket'],
    },
    plugins,
    podmanAgent: !!env.podmanApiUrl,
  };
}

// Real listening sockets of this network namespace, parsed from /proc.
export function listListeningPorts(): PortsResponse['ports'] {
  const ports: PortsResponse['ports'] = [];
  const seen = new Set<string>();
  for (const [file, proto] of [
    ['/proc/net/tcp', 'tcp'],
    ['/proc/net/tcp6', 'tcp6'],
  ] as const) {
    try {
      const data = fs.readFileSync(file, 'utf8');
      for (const line of data.split('\n').slice(1)) {
        const cols = line.trim().split(/\s+/);
        if (cols.length < 4 || cols[3] !== '0A') continue; // 0A = LISTEN
        const local = cols[1] ?? '';
        const hexPort = local.split(':')[1];
        if (!hexPort) continue;
        const port = parseInt(hexPort, 16);
        if (port <= 0) continue;
        const key = `${proto}:${port}`;
        if (seen.has(key)) continue;
        seen.add(key);
        ports.push({ proto, port });
      }
    } catch {
      // /proc unavailable (non-Linux dev host) — report empty, never fake
    }
  }
  ports.sort((a, b) => a.port - b.port);
  return ports;
}
