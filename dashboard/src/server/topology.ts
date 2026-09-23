import type { TopologyEdge, TopologyGraph, TopologyNode } from '@/lib/types';
import { listPlugins } from './registry';
import { env } from './env';
import { audit } from './audit';

export const CORE_ID = 'agy-dashboard';

type State = {
  revision: number;
  userNodes: TopologyNode[]; // nodes added by mutation/patches (proposed infra)
  userEdges: TopologyEdge[]; // edges added by mutation/patches
};

const g = globalThis as unknown as { __agyTopology?: State };
const state: State = (g.__agyTopology ??= { revision: 1, userNodes: [], userEdges: [] });

function serviceNodes(): TopologyNode[] {
  return [
    {
      id: 'service:vllm',
      label: 'vLLM (external project)',
      kind: 'service',
      status: env.vllmApiUrl ? 'live' : 'unregistered',
    },
    {
      id: 'service:inference',
      label: 'Inference router (LiteLLM)',
      kind: 'service',
      status: env.inferenceApiUrl ? 'live' : 'unregistered',
    },
    {
      id: 'service:chat',
      label: 'Chat brain pod',
      kind: 'service',
      status: env.chatApiUrl ? 'live' : 'unregistered',
    },
  ];
}

export function getGraph(): TopologyGraph {
  const plugins = listPlugins();

  const pluginNodes: TopologyNode[] = plugins.map((p) => ({
    id: `plugin:${p.id}`,
    label: p.topology?.label || p.name,
    kind: 'plugin',
    status: 'live',
  }));

  const nodes: TopologyNode[] = [
    { id: CORE_ID, label: 'AGY Dashboard', kind: 'core', status: 'live' },
    ...pluginNodes,
    ...serviceNodes(),
    ...state.userNodes,
  ];
  const nodeIds = new Set(nodes.map((n) => n.id));

  const edges: TopologyEdge[] = [];
  for (const p of plugins) {
    edges.push({
      id: `e:core->plugin:${p.id}`,
      source: CORE_ID,
      target: `plugin:${p.id}`,
      label: p.kind,
    });
  }
  if (env.inferenceApiUrl) {
    edges.push({ id: 'e:core->service:inference', source: CORE_ID, target: 'service:inference', label: 'llm router' });
  }
  if (env.vllmApiUrl) {
    edges.push({ id: 'e:core->service:vllm', source: CORE_ID, target: 'service:vllm', label: 'llm api' });
  }
  if (env.chatApiUrl) {
    edges.push({ id: 'e:core->service:chat', source: CORE_ID, target: 'service:chat', label: 'chat sse' });
  }
  for (const e of state.userEdges) {
    if (nodeIds.has(e.source) && nodeIds.has(e.target)) edges.push(e);
  }

  return { revision: state.revision, nodes, edges };
}

export function getRevision(): number {
  return state.revision;
}

function bump(): void {
  state.revision += 1;
}

function requireNodes(graph: TopologyGraph, ids: string[]): void {
  const existing = new Set(graph.nodes.map((n) => n.id));
  for (const id of ids) {
    if (!existing.has(id) && !state.userNodes.some((n) => n.id === id)) {
      throw new Error(`Unknown topology node: ${id}`);
    }
  }
}

export function addEdge(source: string, target: string, label?: string): TopologyGraph {
  const graph = getGraph();
  requireNodes(graph, [source, target]);
  const id = `e:${source}->${target}:${Date.now()}`;
  state.userEdges.push({ id, source, target, label });
  bump();
  audit('topology', 'add-edge', `${source} -> ${target}`);
  return getGraph();
}

export function removeEdge(source: string, target: string): TopologyGraph {
  const before = state.userEdges.length;
  state.userEdges = state.userEdges.filter((e) => !(e.source === source && e.target === target));
  if (state.userEdges.length === before) throw new Error('No such user edge');
  bump();
  audit('topology', 'remove-edge', `${source} -> ${target}`);
  return getGraph();
}

export function addNode(id: string, label: string, kind: TopologyNode['kind']): TopologyGraph {
  const graph = getGraph();
  if (graph.nodes.some((n) => n.id === id) || state.userNodes.some((n) => n.id === id)) {
    throw new Error(`Node already exists: ${id}`);
  }
  if (kind === 'core') throw new Error('Cannot add another core node');
  state.userNodes.push({ id, label, kind, status: 'proposed' });
  bump();
  audit('topology', 'add-node', `${id} (${kind})`);
  return getGraph();
}

// HITL: patches proposed by the chat brain are applied ONLY via this call,
// which the UI invokes when the human clicks "Apply".
export function applyPatch(patch: {
  summary: string;
  nodes: { id: string; label: string; kind: TopologyNode['kind'] }[];
  edges: { source: string; target: string; label?: string }[];
}): TopologyGraph {
  audit('topology', 'apply-patch', patch.summary.slice(0, 120));
  for (const n of patch.nodes) {
    if (getGraph().nodes.some((x) => x.id === n.id)) continue;
    if (n.kind === 'core') continue;
    state.userNodes.push({ id: n.id, label: n.label, kind: n.kind, status: 'proposed' });
  }
  const ids = new Set(getGraph().nodes.map((n) => n.id));
  for (const e of patch.edges) {
    if (!ids.has(e.source) || !ids.has(e.target)) continue;
    state.userEdges.push({
      id: `e:patch:${e.source}->${e.target}:${Date.now()}`,
      source: e.source,
      target: e.target,
      label: e.label,
    });
  }
  bump();
  return getGraph();
}

export function __resetTopologyForTests(): void {
  state.revision = 1;
  state.userNodes = [];
  state.userEdges = [];
}
