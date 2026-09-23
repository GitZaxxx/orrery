import { getGraph } from '@/server/topology';
import { countPlugins } from '@/server/registry';
import { llmConfigured, llmSourceLabel } from '@/server/llm';
import type { HealthState } from '@/lib/types';

export const dynamic = 'force-dynamic';

export function GET(): Response {
  const body: HealthState = {
    status: 'ok',
    uptimeSec: Math.round(process.uptime()),
    topologyRevision: getGraph().revision,
    pluginsRegistered: countPlugins(),
    genui: { configured: llmConfigured(), source: llmSourceLabel() },
  };
  return Response.json(body);
}
