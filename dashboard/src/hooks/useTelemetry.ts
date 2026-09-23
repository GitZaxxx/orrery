'use client';

import { useEffect, useRef, useState } from 'react';
import type { TelemetryTick } from '@/lib/types';

export type StreamTick = TelemetryTick & { type: 'tick' };

export function useTelemetry(max = 120): StreamTick[] {
  const [ticks, setTicks] = useState<StreamTick[]>([]);
  const buf = useRef<StreamTick[]>([]);

  useEffect(() => {
    const es = new EventSource('/api/telemetry/stream');
    es.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data) as StreamTick;
        if (data.type !== 'tick') return;
        buf.current.push(data);
        if (buf.current.length > max) buf.current.shift();
        setTicks([...buf.current]);
      } catch {
        // malformed frame — ignore
      }
    };
    return () => es.close();
  }, [max]);

  return ticks;
}
