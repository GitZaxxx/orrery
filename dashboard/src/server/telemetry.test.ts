import { sampleTick, telemetryWindow } from './telemetry';

describe('telemetry sampler (real os stats)', () => {
  it('produces sane ticks and a bounded window', () => {
    const t1 = sampleTick();
    const t2 = sampleTick();
    expect(t1.cpuPct).toBeGreaterThanOrEqual(0);
    expect(t1.cpuPct).toBeLessThanOrEqual(100);
    expect(t1.memTotalBytes).toBeGreaterThan(0);
    expect(t1.uptimeSec).toBeGreaterThanOrEqual(0);
    expect(t2.ts).toBeGreaterThanOrEqual(t1.ts);
    expect(telemetryWindow().length).toBeGreaterThanOrEqual(2);
  });
});
