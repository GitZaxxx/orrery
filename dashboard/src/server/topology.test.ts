import {
  getGraph,
  addEdge,
  removeEdge,
  addNode,
  applyPatch,
  CORE_ID,
  __resetTopologyForTests,
} from './topology';
import { registerPlugin, __resetRegistryForTests } from './registry';

beforeEach(() => {
  __resetRegistryForTests();
  __resetTopologyForTests();
});

describe('topology graph', () => {
  it('seeds core node and service nodes', () => {
    const g = getGraph();
    const ids = g.nodes.map((n) => n.id);
    expect(ids).toContain(CORE_ID);
    expect(ids).toContain('service:vllm');
    const vllm = g.nodes.find((n) => n.id === 'service:vllm')!;
    expect(vllm.status).toBe('unregistered');
  });

  it('reflects a registered plugin as a live node with an edge', () => {
    registerPlugin({ id: 'mcp-github', name: 'GitHub MCP', version: '1.0.0', kind: 'mcp' });
    const g = getGraph();
    expect(g.nodes).toContainEqual(
      expect.objectContaining({ id: 'plugin:mcp-github', status: 'live', kind: 'plugin' }),
    );
    expect(g.edges).toContainEqual(
      expect.objectContaining({ source: CORE_ID, target: 'plugin:mcp-github' }),
    );
  });

  it('addEdge wires existing nodes and bumps revision', () => {
    const rev0 = getGraph().revision;
    const g = addEdge('service:vllm', CORE_ID, 'upstream');
    expect(g.revision).toBe(rev0 + 1);
    expect(g.edges).toContainEqual(
      expect.objectContaining({ source: 'service:vllm', target: CORE_ID, label: 'upstream' }),
    );
  });

  it('addEdge rejects unknown nodes', () => {
    expect(() => addEdge('service:ghost', CORE_ID)).toThrow(/Unknown topology node/);
  });

  it('removeEdge removes a user edge', () => {
    addEdge('service:vllm', CORE_ID);
    expect(() => removeEdge('service:vllm', CORE_ID)).not.toThrow();
    const g = getGraph();
    expect(g.edges.some((e) => e.source === 'service:vllm' && e.target === CORE_ID)).toBe(false);
  });

  it('addNode adds a proposed node', () => {
    const g = addNode('service:llama3', 'Llama 3 instance', 'service');
    const n = g.nodes.find((x) => x.id === 'service:llama3');
    expect(n).toMatchObject({ status: 'proposed', kind: 'service' });
  });

  it('applyPatch (HITL apply) adds proposed nodes and valid edges only', () => {
    const g = applyPatch({
      summary: 'test patch',
      nodes: [{ id: 'service:llama3', label: 'Llama 3', kind: 'service' }],
      edges: [
        { source: 'service:llama3', target: CORE_ID, label: 'serves' },
        { source: 'service:ghost', target: CORE_ID }, // dangling — must be dropped
      ],
    });
    expect(g.nodes).toContainEqual(
      expect.objectContaining({ id: 'service:llama3', status: 'proposed' }),
    );
    expect(g.edges.some((e) => e.source === 'service:llama3' && e.target === CORE_ID)).toBe(true);
    expect(g.edges.some((e) => e.source === 'service:ghost')).toBe(false);
  });
});
