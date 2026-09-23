'use client';

import useSWR from 'swr';

export function usePanelData<T>(path: string, refreshMs = 5000) {
  return useSWR<T>(path, { refreshInterval: refreshMs, keepPreviousData: true });
}
