import { llmBase } from './env';
import { audit } from './audit';

export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

export function llmConfigured(): boolean {
  return llmBase() !== null;
}

export function llmSourceLabel(): string | null {
  const base = llmBase();
  return base ? `${base.url} (model: ${base.model})` : null;
}

// OpenAI-compatible chat completion — works with vLLM (your external
// project), LiteLLM, and any compatible router.
export async function chatComplete(
  messages: ChatMessage[],
  opts: { temperature?: number; maxTokens?: number } = {},
): Promise<string> {
  const base = llmBase();
  if (!base) {
    throw new Error('No LLM endpoint configured. Set INFERENCE_API_URL or VLLM_API_URL.');
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 120_000);
  try {
    const res = await fetch(`${base.url}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        model: base.model,
        messages,
        temperature: opts.temperature ?? 0.4,
        max_tokens: opts.maxTokens ?? 1500,
        stream: false,
      }),
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new Error(`LLM endpoint HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
    }
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const content = data.choices?.[0]?.message?.content ?? '';
    if (!content) throw new Error('LLM returned empty completion');
    audit('llm', 'completion', `${messages.length} msgs -> ${content.length} chars`);
    return content;
  } finally {
    clearTimeout(timer);
  }
}
