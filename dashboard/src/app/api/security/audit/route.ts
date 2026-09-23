import { recentAudit } from '@/server/audit';

export const dynamic = 'force-dynamic';

export function GET(): Response {
  return Response.json({ entries: recentAudit(30) });
}
