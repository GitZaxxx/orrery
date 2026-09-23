import { snapshot } from '@/server/telemetry';
import { countPlugins } from '@/server/registry';
import { getRevision } from '@/server/topology';

export const dynamic = 'force-dynamic';

// Prometheus exposition format
export function GET(): Response {
  const t = snapshot();
  const lines = [
    '# HELP agy_uptime_seconds Dashboard uptime in seconds.',
    '# TYPE agy_uptime_seconds gauge',
    `agy_uptime_seconds ${t.uptimeSec}`,
    '# HELP agy_cpu_percent Host CPU utilization percent.',
    '# TYPE agy_cpu_percent gauge',
    `agy_cpu_percent ${t.cpuPct}`,
    '# HELP agy_memory_used_bytes Memory in use (bytes).',
    '# TYPE agy_memory_used_bytes gauge',
    `agy_memory_used_bytes ${t.memUsedBytes}`,
    `agy_memory_total_bytes ${t.memTotalBytes}`,
    '# HELP agy_network_bytes_per_sec Container network throughput.',
    '# TYPE agy_network_bytes_per_sec gauge',
    `agy_network_in_bytes_per_sec ${t.netInBps}`,
    `agy_network_out_bytes_per_sec ${t.netOutBps}`,
    '# HELP agy_plugins_registered Number of plugged-in components.',
    '# TYPE agy_plugins_registered gauge',
    `agy_plugins_registered ${countPlugins()}`,
    '# HELP agy_topology_revision Topology graph revision counter.',
    '# TYPE agy_topology_revision gauge',
    `agy_topology_revision ${getRevision()}`,
    '',
  ];
  return new Response(lines.join('\n'), {
    headers: { 'content-type': 'text/plain; version=0.0.4; charset=utf-8' },
  });
}
