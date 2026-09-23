import { z } from 'zod';
import type { UiSchema as UiSchemaType } from '@/lib/types';
import { chatComplete } from './llm';
import { audit } from './audit';

// ── GenUI vocabulary (zod) ──────────────────────────────────────────

export const statusCardSchema = z.object({
  type: z.literal('status-card'),
  title: z.string().max(120),
  value: z.string().max(60),
  unit: z.string().max(20).optional(),
  trend: z.enum(['up', 'down', 'flat']).optional(),
  status: z.enum(['ok', 'warn', 'error', 'unknown']).optional(),
});

export const tableSchema = z.object({
  type: z.literal('table'),
  title: z.string().max(120),
  columns: z.array(z.object({ key: z.string().max(60), label: z.string().max(60) })).min(1).max(12),
  rows: z.array(z.record(z.union([z.string(), z.number()]))).max(200),
});

export const chartSchema = z.object({
  type: z.literal('chart'),
  title: z.string().max(120),
  chartType: z.enum(['line', 'area', 'bar']),
  series: z
    .array(
      z.object({
        name: z.string().max(60),
        points: z.array(z.object({ x: z.union([z.number(), z.string()]), y: z.number() })).max(300),
      }),
    )
    .min(1)
    .max(6),
});

export const alertSchema = z.object({
  type: z.literal('alert'),
  severity: z.enum(['info', 'warn', 'critical']),
  title: z.string().max(120),
  message: z.string().max(1000),
});

export const formSchema = z.object({
  type: z.literal('form'),
  title: z.string().max(120),
  submitEndpoint: z.string().max(300).optional(),
  submitLabel: z.string().max(40).optional(),
  fields: z
    .array(
      z.object({
        name: z.string().max(60),
        label: z.string().max(60),
        inputType: z.enum(['text', 'number', 'select', 'textarea']),
        placeholder: z.string().max(120).optional(),
        options: z.array(z.string().max(60)).max(30).optional(),
      }),
    )
    .min(1)
    .max(16),
});

export const topologyPatchWidgetSchema = z.object({
  type: z.literal('topology-patch'),
  summary: z.string().max(400),
  requiresConfirmation: z.literal(true),
  nodes: z
    .array(
      z.object({
        id: z.string().max(60),
        label: z.string().max(60),
        kind: z.enum(['core', 'plugin', 'service']),
      }),
    )
    .max(50),
  edges: z
    .array(
      z.object({
        source: z.string().max(60),
        target: z.string().max(60),
        label: z.string().max(60).optional(),
      }),
    )
    .max(100),
});

export const codeBlockSchema = z.object({
  type: z.literal('code-block'),
  language: z.string().max(30).optional(),
  code: z.string().max(5000),
});

export const widgetSchema = z.union([
  statusCardSchema,
  tableSchema,
  chartSchema,
  alertSchema,
  formSchema,
  topologyPatchWidgetSchema,
  codeBlockSchema,
]);

export const uiSchema = z.object({
  version: z.literal('1'),
  title: z.string().max(120).optional(),
  widgets: widgetSchema.array().min(1).max(12),
});

// ── Generator ───────────────────────────────────────────────────────

const UI_VOCAB = `Widget types (JSON union, field "type"):
- status-card: {type,title,value,unit?,trend?:up|down|flat,status?:ok|warn|error|unknown}
- table: {type,title,columns:[{key,label}],rows:[{...}]}
- chart: {type,title,chartType:line|area|bar,series:[{name,points:[{x,y}]}]}
- alert: {type,severity:info|warn|critical,title,message}
- form: {type,title,submitEndpoint?,submitLabel?,fields:[{name,label,inputType:text|number|select|textarea,placeholder?,options?}]}
- code-block: {type,language?,code}`;

export async function generateUi(intent: string, context: Record<string, unknown>): Promise<UiSchemaType> {
  const system = `You are the AGY Command Center generative UI engine. You design dashboard widgets from live system data.
Return ONLY a JSON object: {"version":"1","title":optional-string,"widgets":[widget,...]}
${UI_VOCAB}
Rules:
- Use ONLY numbers and facts present in the CONTEXT JSON. NEVER invent metrics.
- Prefer status-card / table / chart. Max 6 widgets.
- No markdown, no explanation — JSON only.`;

  const raw = await chatComplete(
    [
      { role: 'system', content: system },
      {
        role: 'user',
        content: `INTENT: ${intent}\n\nCONTEXT (JSON):\n${JSON.stringify(context).slice(0, 8000)}`,
      },
    ],
    { temperature: 0.2, maxTokens: 1400 },
  );

  const parsed = uiSchema.parse(extractJson(raw));
  audit('genui', 'generate', `${parsed.widgets.length} widget(s) for: ${intent.slice(0, 80)}`);
  return parsed as UiSchemaType;
}

// Robust JSON extraction from LLM prose/fenced output
export function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start === -1 || end <= start) throw new Error('No JSON object found in LLM response');
  return JSON.parse(candidate.slice(start, end + 1));
}
