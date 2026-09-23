import { z } from 'zod';
import { generateUi } from '@/server/genui';
import { llmConfigured } from '@/server/llm';
import { getGraph } from '@/server/topology';
import { telemetryWindow } from '@/server/telemetry';
import { vllmStatus } from '@/server/providers';
import { listPlugins } from '@/server/registry';

export const dynamic = 'force-dynamic';

const bodySchema = z.object({
  intent: z.string().min(1).max(2000),
  target: z.string().max(60).optional(),
});

export async function POST(req: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: 'Invalid request', issues: parsed.error.issues }, { status: 400 });
  }
  if (!llmConfigured()) {
    return Response.json(
      {
        error:
          'Generative engine not configured. Set INFERENCE_API_URL or VLLM_API_URL (your vLLM project) and restart the dashboard.',
      },
      { status: 503 },
    );
  }

  const context = {
    topology: getGraph(),
    plugins: listPlugins(),
    vllm: await vllmStatus(),
    telemetry: telemetryWindow().slice(-10),
    target: parsed.data.target ?? undefined,
  };

  try {
    const schema = await generateUi(parsed.data.intent, context);
    return Response.json({ schema });
  } catch (e) {
    return Response.json({ error: `Generation failed: ${(e as Error).message}` }, { status: 502 });
  }
}
