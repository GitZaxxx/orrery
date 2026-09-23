import { vllmStatus } from '@/server/providers';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<Response> {
  return Response.json(await vllmStatus());
}
