import { listPluginRecords, registerPlugin, manifestSchema } from '@/server/registry';

export const dynamic = 'force-dynamic';

export function GET(): Response {
  return Response.json({ plugins: listPluginRecords() });
}

export async function POST(req: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const parsed = manifestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: 'Invalid plugin manifest', issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const record = registerPlugin(parsed.data);
  return Response.json({ registered: record }, { status: 201 });
}
