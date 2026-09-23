import { getGraph } from '@/server/topology';

export const dynamic = 'force-dynamic';

export function GET(): Response {
  return Response.json(getGraph());
}
