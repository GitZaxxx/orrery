import { z } from 'zod';
import { getGraph, addEdge, removeEdge, addNode, applyPatch } from '@/server/topology';

export const dynamic = 'force-dynamic';

export function GET(): Response {
  return Response.json(getGraph());
}

const mutateSchema = z.object({
  action: z.enum(['add-edge', 'remove-edge', 'add-node', 'apply-patch']),
  edge: z
    .object({ source: z.string().max(60), target: z.string().max(60), label: z.string().max(60).optional() })
    .optional(),
  node: z
    .object({ id: z.string().max(60), label: z.string().max(60), kind: z.enum(['core', 'plugin', 'service']) })
    .optional(),
  patch: z
    .object({
      summary: z.string().max(400),
      nodes: z
        .array(
          z.object({
            id: z.string().max(60),
            label: z.string().max(60),
            kind: z.enum(['core', 'plugin', 'service']),
          }),
        )
        .max(50)
        .optional(),
      edges: z
        .array(
          z.object({
            source: z.string().max(60),
            target: z.string().max(60),
            label: z.string().max(60).optional(),
          }),
        )
        .max(100)
        .optional(),
    })
    .optional(),
});

export async function POST(req: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const parsed = mutateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: 'Invalid mutation', issues: parsed.error.issues }, { status: 400 });
  }
  const m = parsed.data;

  try {
    switch (m.action) {
      case 'add-edge':
        if (!m.edge) break;
        return Response.json({ graph: addEdge(m.edge.source, m.edge.target, m.edge.label) });
      case 'remove-edge':
        if (!m.edge) break;
        return Response.json({ graph: removeEdge(m.edge.source, m.edge.target) });
      case 'add-node':
        if (!m.node) break;
        return Response.json({ graph: addNode(m.node.id, m.node.label, m.node.kind) });
      case 'apply-patch':
        if (!m.patch) break;
        return Response.json({
          graph: applyPatch({
            summary: m.patch.summary,
            nodes: m.patch.nodes ?? [],
            edges: m.patch.edges ?? [],
          }),
        });
    }
    return Response.json({ error: `Missing payload for action "${m.action}"` }, { status: 400 });
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 409 });
  }
}
