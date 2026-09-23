import { z } from 'zod';
import { runChat } from '@/server/chat';
import { env } from '@/server/env';

export const dynamic = 'force-dynamic';

const bodySchema = z.object({
  command: z.string().min(1).max(2000),
  sessionId: z.string().max(64).optional(),
});

function sseHeaders(): Record<string, string> {
  return {
    'content-type': 'text/event-stream; charset=utf-8',
    'cache-control': 'no-cache, no-transform',
    connection: 'keep-alive',
    'x-accel-buffering': 'no',
  };
}

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
  const { command } = parsed.data;

  // If a dedicated chat/orchestrator pod is plugged in, proxy to it.
  if (env.chatApiUrl) {
    try {
      const upstream = await fetch(`${env.chatApiUrl}/chat/execute`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ command }),
      });
      if (upstream.ok && upstream.body) {
        return new Response(upstream.body, { headers: sseHeaders() });
      }
    } catch {
      // fall through to the local brain
    }
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const event of runChat(command)) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        }
      } catch (e) {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'error', message: (e as Error).message })}\n\n`),
          );
        } catch {
          // stream already closed
        }
      } finally {
        try {
          controller.close();
        } catch {
          // already closed
        }
      }
    },
  });

  return new Response(stream, { headers: sseHeaders() });
}
