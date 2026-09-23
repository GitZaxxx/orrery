import type { ChatEvent, UiPatch } from '@/lib/types';
import { chatComplete, llmConfigured, type ChatMessage } from './llm';
import { generateUi } from './genui';
import { getGraph } from './topology';
import { telemetryWindow } from './telemetry';
import { vllmStatus } from './providers';
import { listPlugins } from './registry';
import { audit } from './audit';

// Portable tool protocol: works with ANY OpenAI-compatible backend
// (vLLM, LiteLLM, Ollama...) — no function-calling support required.
// The model emits one line: TOOL_CALL {"name":"...","args":{...}}
const TOOL_LINE = /TOOL_CALL\s*(\{[\s\S]*?\})\s*(?:\n|$)/;

const SYSTEM_PROMPT = `You are the AGY Command Center orchestration brain — a mission-control operator. The dashboard renders your output.
Available tools (invoke at most ONE per reply, on its own line, exactly as: TOOL_CALL {"name":"<name>","args":{...}}):
- get_topology {} — current topology graph (nodes/edges).
- get_plugins {} — registered plug-ins.
- get_telemetry {} — recent real telemetry ticks.
- get_vllm_status {} — vLLM inference status.
- propose_ui {"intent":"what to visualize","target":"panel id optional"} — generates a custom widget panel from live data; it is rendered immediately.
- propose_topology_patch {"summary":"...","nodes":[{"id":"...","label":"...","kind":"plugin|service"}],"edges":[{"source":"...","target":"...","label":"..."}]} — PROPOSES an infrastructure change; it is NEVER applied automatically; the human must confirm (HITL).
After a tool runs you receive a line starting with TOOL_RESULT — continue from it.
Rules: be concise and technical. For informational questions, answer directly without tools. NEVER fabricate metrics — only use values from tool results or the user's message. When proposing infrastructure changes, always describe the security posture (e.g. internal-only network).`;

type ToolOutcome = { result: string; events: ChatEvent[] };
type Tool = (args: Record<string, unknown>) => Promise<ToolOutcome>;

const tools: Record<string, Tool> = {
  get_topology: async () => ({ result: JSON.stringify(getGraph()), events: [] }),
  get_plugins: async () => ({ result: JSON.stringify(listPlugins()), events: [] }),
  get_telemetry: async () => ({
    result: JSON.stringify(telemetryWindow().slice(-10)),
    events: [],
  }),
  get_vllm_status: async () => ({ result: JSON.stringify(await vllmStatus()), events: [] }),
  propose_ui: async (args) => {
    const intent = String(args.intent ?? 'system overview');
    const context = {
      topology: getGraph(),
      plugins: listPlugins(),
      vllm: await vllmStatus(),
      telemetry: telemetryWindow().slice(-5),
    };
    const schema = await generateUi(intent, context);
    return { result: 'UI component generated and shown to the user.', events: [{ type: 'ui_component', schema }] };
  },
  propose_topology_patch: async (args) => {
    const patch: UiPatch = {
      summary: String(args.summary ?? 'Proposed topology change'),
      nodes: Array.isArray(args.nodes) ? (args.nodes as UiPatch['nodes']) : [],
      edges: Array.isArray(args.edges) ? (args.edges as UiPatch['edges']) : [],
    };
    return {
      result: 'Patch proposed. Awaiting human confirmation (HITL) — it will NOT be applied automatically.',
      events: [{ type: 'topology_patch', patch }],
    };
  },
};

function chunkText(text: string): string[] {
  const words = text.split(/(\s+)/);
  const chunks: string[] = [];
  for (let i = 0; i < words.length; i += 4) {
    chunks.push(words.slice(i, i + 4).join(''));
  }
  return chunks.length > 0 ? chunks : [text];
}

export async function* runChat(command: string): AsyncGenerator<ChatEvent> {
  audit('chat', 'execute', command.slice(0, 120));

  if (!llmConfigured()) {
    yield {
      type: 'error',
      message:
        'No LLM endpoint configured. Set INFERENCE_API_URL or VLLM_API_URL (your vLLM project) in the dashboard environment and restart.',
    };
    yield { type: 'done' };
    return;
  }

  const messages: ChatMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: command },
  ];

  for (let round = 0; round < 6; round++) {
    let reply: string;
    try {
      reply = await chatComplete(messages, { temperature: 0.3, maxTokens: 1200 });
    } catch (e) {
      yield { type: 'error', message: (e as Error).message };
      break;
    }

    const match = reply.match(TOOL_LINE);
    if (!match) {
      const clean = reply.replace(/```\s*$/g, '').trim();
      for (const chunk of chunkText(clean)) yield { type: 'text-delta', text: chunk };
      break;
    }

    let name = 'unknown';
    let args: Record<string, unknown> = {};
    try {
      const parsed = JSON.parse(match[1]) as { name?: string; args?: Record<string, unknown> };
      name = String(parsed.name ?? 'unknown');
      args = parsed.args ?? {};
    } catch {
      yield { type: 'error', message: `Malformed TOOL_CALL: ${match[1].slice(0, 100)}` };
      messages.push({ role: 'assistant', content: reply }, { role: 'user', content: 'TOOL_RESULT error: malformed tool call JSON. Reply following the protocol.' });
      continue;
    }

    yield { type: 'tool_call', name, args, status: 'running' };
    let outcome: ToolOutcome;
    const tool = tools[name];
    if (!tool) {
      outcome = { result: `Unknown tool "${name}"`, events: [] };
    } else {
      try {
        outcome = await tool(args);
      } catch (e) {
        outcome = { result: `Tool error: ${(e as Error).message}`, events: [] };
      }
    }
    for (const ev of outcome.events) yield ev;
    yield { type: 'tool_call', name, status: 'done' };

    messages.push({ role: 'assistant', content: reply });
    messages.push({
      role: 'user',
      content: `TOOL_RESULT ${name}: ${outcome.result}\nContinue. If the task is complete, answer the user directly now (no more tools).`,
    });
  }

  yield { type: 'done' };
}
