// Shared contract types — mirrored by server-side zod schemas.
// Client components import ONLY types from here to stay lightweight.

export type HealthState = {
  status: 'ok' | 'degraded';
  uptimeSec: number;
  topologyRevision: number;
  pluginsRegistered: number;
  genui: { configured: boolean; source: string | null };
};

export type PluginKind =
  | 'mcp'
  | 'prompts'
  | 'inference'
  | 'rag'
  | 'chat'
  | 'telemetry'
  | 'security'
  | 'custom';

export type PluginManifest = {
  id: string;
  name: string;
  version: string;
  kind: PluginKind;
  description?: string;
  baseUrl?: string;
  statusUrl?: string;
  capabilities?: string[];
  endpoints?: { method: string; path: string; description?: string }[];
  topology?: { label?: string; position?: { x: number; y: number } };
  isolation?: { network: 'internal' | 'bridged'; capabilities?: string[] };
};

export type PluginRecord = {
  manifest: PluginManifest;
  registeredAt: string;
};

export type TopologyNodeKind = 'core' | 'plugin' | 'service';

export type TopologyNode = {
  id: string;
  label: string;
  kind: TopologyNodeKind;
  status: 'live' | 'unregistered' | 'proposed';
};

export type TopologyEdge = {
  id: string;
  source: string;
  target: string;
  label?: string;
};

export type TopologyGraph = {
  revision: number;
  nodes: TopologyNode[];
  edges: TopologyEdge[];
};

export type TelemetryTick = {
  ts: number;
  cpuPct: number;
  memUsedBytes: number;
  memTotalBytes: number;
  netInBps: number;
  netOutBps: number;
  procRssBytes: number;
  uptimeSec: number;
  pluginsRegistered: number;
  topologyRevision: number;
};

export type VllmStatus = {
  status: 'unregistered' | 'connected' | 'error';
  source?: string;
  models?: { id: string; ownedBy?: string }[];
  detail?: string;
};

export type AdapterStatus = {
  status: 'unregistered' | 'connected' | 'error';
  source?: string;
  detail?: string;
  data?: Record<string, unknown>;
};

export type IsolationResponse = {
  networkMode: 'internal' | 'bridged';
  self: { name: string; isolation: 'internal' | 'bridged'; capabilities: string[] };
  plugins: { id: string; name: string; isolation: 'internal' | 'bridged'; capabilities?: string[] }[];
  podmanAgent: boolean;
};

export type PortsResponse = {
  ports: { proto: 'tcp' | 'tcp6'; port: number }[];
};

export type AuditEntry = {
  ts: number;
  actor: string;
  action: string;
  detail?: string;
};

export type AuditResponse = {
  entries: AuditEntry[];
};

// ── GenUI ─────────────────────────────────────────────────────────

export type UiWidget =
  | {
      type: 'status-card';
      title: string;
      value: string;
      unit?: string;
      trend?: 'up' | 'down' | 'flat';
      status?: 'ok' | 'warn' | 'error' | 'unknown';
    }
  | {
      type: 'table';
      title: string;
      columns: { key: string; label: string }[];
      rows: Record<string, string | number>[];
    }
  | {
      type: 'chart';
      title: string;
      chartType: 'line' | 'area' | 'bar';
      series: { name: string; points: { x: number | string; y: number }[] }[];
    }
  | { type: 'alert'; severity: 'info' | 'warn' | 'critical'; title: string; message: string }
  | {
      type: 'form';
      title: string;
      submitEndpoint?: string;
      submitLabel?: string;
      fields: {
        name: string;
        label: string;
        inputType: 'text' | 'number' | 'select' | 'textarea';
        placeholder?: string;
        options?: string[];
      }[];
    }
  | {
      type: 'topology-patch';
      summary: string;
      requiresConfirmation: true;
      nodes: { id: string; label: string; kind: TopologyNodeKind }[];
      edges: { source: string; target: string; label?: string }[];
    }
  | { type: 'code-block'; language?: string; code: string };

export type UiSchema = {
  version: '1';
  title?: string;
  widgets: UiWidget[];
};

export type UiPatch = {
  summary: string;
  nodes: { id: string; label: string; kind: TopologyNodeKind }[];
  edges: { source: string; target: string; label?: string }[];
};

export type ChatEvent =
  | { type: 'text-delta'; text: string }
  | { type: 'tool_call'; name: string; args?: Record<string, unknown>; status: 'running' | 'done' }
  | { type: 'ui_component'; schema: UiSchema }
  | { type: 'topology_patch'; patch: UiPatch }
  | { type: 'done' }
  | { type: 'error'; message: string };
