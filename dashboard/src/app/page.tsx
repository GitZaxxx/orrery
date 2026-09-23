'use client';

import { SWRConfig } from 'swr';
import DashboardShell from '@/components/DashboardShell';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function Page() {
  return (
    <SWRConfig value={{ fetcher }}>
      <DashboardShell />
    </SWRConfig>
  );
}
