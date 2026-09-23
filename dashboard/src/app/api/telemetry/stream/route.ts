import { sampleTick } from '@/server/telemetry';
import { env } from '@/server/env';

export const dynamic = 'force-dynamic';

function sseHeaders(): Record<string, string> {
  return {
    'content-type': 'text/event-stream; charset=utf-8',
    'cache-control': 'no-cache, no-transform',
    connection: 'keep-alive',
    'x-accel-buffering': 'no',
  };
}

export async function GET(): Promise<Response> {
  // If a telemetry-agent is plugged in, proxy its SSE feed.
  if (env.telemetrySourceUrl) {
    try {
      const upstream = await fetch(`${env.telemetrySourceUrl}/telemetry/stream`);
      if (upstream.ok && upstream.body) {
        return new Response(upstream.body, { headers: sseHeaders() });
      }
    } catch {
      // fall through to local real stats
    }
  }

  const encoder = new TextEncoder();
  let timer: ReturnType<typeof setInterval> | null = null;
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let closed = false;
      const send = (obj: unknown) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
        } catch {
          closed = true;
        }
      };
      send({ type: 'tick', ...sampleTick() });
      timer = setInterval(() => send({ type: 'tick', ...sampleTick() }), 1000);
    },
    cancel() {
      if (timer) clearInterval(timer);
    },
  });

  return new Response(stream, { headers: sseHeaders() });
}
