import { z } from 'zod';
import type { PluginManifest, PluginRecord } from '@/lib/types';
import { audit } from './audit';

export const manifestSchema = z.object({
  id: z.string().regex(/^[a-z0-9][a-z0-9-]{1,40}$/, 'id: lowercase slug, 2-40 chars'),
  name: z.string().min(1).max(80),
  version: z.string().regex(/^\d+\.\d+\.\d+(-[\w.]+)?$/, 'version: semver'),
  kind: z.enum(['mcp', 'prompts', 'inference', 'rag', 'chat', 'telemetry', 'security', 'custom']),
  description: z.string().max(400).optional(),
  baseUrl: z.string().url().optional(),
  statusUrl: z.string().url().optional(),
  capabilities: z.array(z.string().max(60)).max(30).optional(),
  endpoints: z
    .array(
      z.object({
        method: z.string().max(10),
        path: z.string().max(200),
        description: z.string().max(200).optional(),
      }),
    )
    .max(50)
    .optional(),
  topology: z
    .object({
      label: z.string().max(60).optional(),
      position: z.object({ x: z.number(), y: z.number() }).optional(),
    })
    .optional(),
  isolation: z
    .object({
      network: z.enum(['internal', 'bridged']),
      capabilities: z.array(z.string().max(60)).max(20).optional(),
    })
    .optional(),
});

export type ManifestInput = z.infer<typeof manifestSchema>;

type State = { plugins: Map<string, PluginRecord> };

const g = globalThis as unknown as { __agyRegistry?: State };
const state: State = (g.__agyRegistry ??= { plugins: new Map() });

export function registerPlugin(input: unknown): PluginRecord {
  const manifest = manifestSchema.parse(input) as PluginManifest;
  const record: PluginRecord = {
    manifest,
    registeredAt: new Date().toISOString(),
  };
  state.plugins.set(manifest.id, record); // upsert: re-register replaces
  audit('plugin', 'register', `${manifest.id}@${manifest.version} (${manifest.kind})`);
  return record;
}

export function removePlugin(id: string): boolean {
  const existed = state.plugins.delete(id);
  if (existed) audit('plugin', 'unregister', id);
  return existed;
}

export function listPlugins(): PluginManifest[] {
  return [...state.plugins.values()].map((r) => r.manifest);
}

export function listPluginRecords(): PluginRecord[] {
  return [...state.plugins.values()];
}

export function countPlugins(): number {
  return state.plugins.size;
}

export function __resetRegistryForTests(): void {
  state.plugins.clear();
}
