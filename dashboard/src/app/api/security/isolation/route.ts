import { isolationStatus } from '@/server/providers';

export const dynamic = 'force-dynamic';

export function GET(): Response {
  return Response.json(isolationStatus());
}
