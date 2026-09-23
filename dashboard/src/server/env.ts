function clean(v: string | undefined): string | undefined {
  const t = (v ?? '').trim();
  if (t.length === 0) return undefined;
  return t.replace(/\/+$/, '');
}

export const env = {
  port: process.env.PORT ?? '3000',
  vllmApiUrl: clean(process.env.VLLM_API_URL),
  vllmModel: process.env.VLLM_MODEL || 'local-model',
  inferenceApiUrl: clean(process.env.INFERENCE_API_URL),
  inferenceModel: clean(process.env.INFERENCE_MODEL),
  chatApiUrl: clean(process.env.CHAT_API_URL),
  mcpApiUrl: clean(process.env.MCP_API_URL),
  promptsApiUrl: clean(process.env.PROMPTS_API_URL),
  ragApiUrl: clean(process.env.RAG_API_URL),
  telemetrySourceUrl: clean(process.env.TELEMETRY_SOURCE_URL),
  podmanApiUrl: clean(process.env.PODMAN_API_URL),
  podIsolation: process.env.POD_NETWORK_ISOLATION === 'bridged' ? ('bridged' as const) : ('internal' as const),
};

export function llmBase(): { url: string; model: string } | null {
  if (env.inferenceApiUrl) {
    return { url: env.inferenceApiUrl, model: env.inferenceModel || env.vllmModel };
  }
  if (env.vllmApiUrl) {
    return { url: env.vllmApiUrl, model: env.vllmModel };
  }
  return null;
}
