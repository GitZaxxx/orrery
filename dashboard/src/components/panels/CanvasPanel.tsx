'use client';

import { useCallback, useMemo } from 'react';
import {
  Background,
  Connection,
  Controls,
  MiniMap,
  ReactFlow,
  addEdge,
  type Edge,
  type Node,
} from 'reactflow';
import 'reactflow/dist/style.css';
import useSWR from 'swr';
import type { TopologyGraph } from '@/lib/types';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function nodeClass(kind: string, status: string): string {
  const base =
    'rounded-md border bg-panel px-3 py-2 text-[11px] shadow-none max-w-[180px]';
  if (kind === 'core') return `${base} border-electric-cyan font-semibold text-electric-cyan panel-glow`;
  if (kind === 'plugin') return `${base} border-quantum-green text-quantum-green`;
  if (status === 'proposed') return `${base} border-dashed border-neon-magenta text-neon-magenta`;
  if (status === 'unregistered') return `${base} border-dashed border-alert-amber/60 text-amber-200/70`;
  return `${base} border-cyan-500/50 text-cyan-200`;
}

function layout(nodes: TopologyGraph['nodes']): Node[] {
  let pluginCount = 0;
  let serviceCount = 0;
  let proposedCount = 0;
  return nodes.map((n) => {
    let position = { x: 0, y: 0 };
    if (n.kind === 'plugin') {
      position = { x: -320, y: pluginCount++ * 110 - 60 };
    } else if (n.kind === 'service') {
      position = { x: 320, y: serviceCount++ * 110 - 110 };
    } else if (n.status === 'proposed') {
      position = { x: 0, y: 340 + proposedCount++ * 110 };
    }
    return {
      id: n.id,
      position,
      data: { label: n.status === 'unregistered' ? `${n.label} (unregistered)` : n.label },
      className: nodeClass(n.kind, n.status),
      draggable: true,
    };
  });
}

export default function CanvasPanel() {
  const { data, mutate } = useSWR<TopologyGraph>('/api/topology/graph', {
    refreshInterval: 4000,
    keepPreviousData: true,
    fetcher,
  });

  const nodes = useMemo(() => layout(data?.nodes ?? []), [data]);
  const edges = useMemo<Edge[]>(
    () =>
      (data?.edges ?? []).map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        label: e.label,
        animated: true,
        labelStyle: { fontSize: 9, fill: 'rgba(165,243,252,0.6)' },
        labelBgStyle: { fill: '#0E1424' },
        style: { stroke: 'rgba(0,245,255,0.45)', strokeWidth: 1.2 },
      })),
    [data],
  );

  const onConnect = useCallback(
    async (connection: Connection) => {
      const res = await fetch('/api/topology/mutate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: 'add-edge',
          edge: { source: connection.source, target: connection.target },
        }),
      });
      if (res.ok) void mutate();
    },
    [mutate],
  );

  return (
    <div className="relative h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onConnect={onConnect}
        fitView
        minZoom={0.3}
        proOptions={{ hideAttribution: false }}
        className="bg-obsidian"
      >
        <Background color="rgba(0,245,255,0.06)" gap={24} />
        <Controls
          className="!border-cyan-500/30 !bg-panel [&>button]:!border-cyan-500/20 [&>button]:!bg-panel [&>button]:!fill-cyan-300"
        />
        <MiniMap
          pannable
          className="!border !border-cyan-500/30 !bg-deep-space"
          nodeColor={() => 'rgba(0,245,255,0.5)'}
          maskColor="rgba(11,15,25,0.8)"
        />
      </ReactFlow>

      <div className="pointer-events-none absolute left-3 top-3 space-y-1 text-[10px] text-cyan-400/60">
        <div className="text-[11px] uppercase tracking-widest text-electric-cyan/80">
          Topology / Visual Routing
        </div>
        <div>core ▸ cyan · plug-in ▸ green · dashed amber ▸ unregistered</div>
        <div>drag between nodes to rewire · chat can propose patches (HITL)</div>
      </div>
    </div>
  );
}
