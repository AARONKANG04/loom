export type ReasoningStyle =
  | { type: "none" }
  | { type: "levels"; levels: string[] }
  | { type: "budget"; min: number; max: number }
  | { type: "always" };

export interface ModelDef {
  id: string;
  name: string;
  reasoning: ReasoningStyle;
}

export interface ProviderDef {
  id: string;
  name: string;
  description: string;
  placeholder: string;
  color: string;
  models: ModelDef[];
}

// ── Anthropic ────────────────────────────────────────────────────────────────
const anthropic: ProviderDef = {
  id: "anthropic",
  name: "Anthropic",
  description: "Claude Opus, Sonnet, Haiku",
  placeholder: "sk-ant-...",
  color: "#D97757",
  models: [
    { id: "claude-opus-4-6", name: "Claude Opus 4.6", reasoning: { type: "levels", levels: ["low", "medium", "high", "max"] } },
    { id: "claude-sonnet-4-6", name: "Claude Sonnet 4.6", reasoning: { type: "levels", levels: ["low", "medium", "high", "max"] } },
    { id: "claude-haiku-4-5", name: "Claude Haiku 4.5", reasoning: { type: "levels", levels: ["low", "medium", "high", "max"] } },
    { id: "claude-sonnet-4-5", name: "Claude Sonnet 4.5", reasoning: { type: "levels", levels: ["low", "medium", "high", "max"] } },
    { id: "claude-sonnet-4-0", name: "Claude Sonnet 4", reasoning: { type: "levels", levels: ["low", "medium", "high", "max"] } },
    { id: "claude-opus-4-0", name: "Claude Opus 4", reasoning: { type: "levels", levels: ["low", "medium", "high", "max"] } },
  ],
};

// ── OpenAI ───────────────────────────────────────────────────────────────────
const openai: ProviderDef = {
  id: "openai",
  name: "OpenAI",
  description: "GPT-5.4, o3, o4-mini",
  placeholder: "sk-...",
  color: "#10A37F",
  models: [
    { id: "gpt-5.4", name: "GPT-5.4", reasoning: { type: "levels", levels: ["none", "low", "medium", "high"] } },
    { id: "gpt-5.4-mini", name: "GPT-5.4 Mini", reasoning: { type: "levels", levels: ["none", "low", "medium", "high"] } },
    { id: "gpt-5.4-nano", name: "GPT-5.4 Nano", reasoning: { type: "levels", levels: ["none", "low", "medium", "high"] } },
    { id: "o3", name: "o3", reasoning: { type: "levels", levels: ["low", "medium", "high"] } },
    { id: "o4-mini", name: "o4-mini", reasoning: { type: "levels", levels: ["low", "medium", "high"] } },
    { id: "o3-mini", name: "o3-mini", reasoning: { type: "levels", levels: ["low", "medium", "high"] } },
    { id: "gpt-4.1", name: "GPT-4.1", reasoning: { type: "none" } },
    { id: "gpt-4.1-mini", name: "GPT-4.1 Mini", reasoning: { type: "none" } },
    { id: "gpt-4.1-nano", name: "GPT-4.1 Nano", reasoning: { type: "none" } },
    { id: "gpt-4o", name: "GPT-4o", reasoning: { type: "none" } },
    { id: "gpt-4o-mini", name: "GPT-4o Mini", reasoning: { type: "none" } },
  ],
};

// ── Google ───────────────────────────────────────────────────────────────────
const google: ProviderDef = {
  id: "google",
  name: "Google",
  description: "Gemini 3, 2.5 Pro, Flash",
  placeholder: "AIza...",
  color: "#4285F4",
  models: [
    { id: "gemini-3.1-pro-preview", name: "Gemini 3.1 Pro", reasoning: { type: "levels", levels: ["low", "medium", "high"] } },
    { id: "gemini-3-flash-preview", name: "Gemini 3 Flash", reasoning: { type: "levels", levels: ["minimal", "low", "medium", "high"] } },
    { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro", reasoning: { type: "budget", min: 128, max: 32768 } },
    { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", reasoning: { type: "budget", min: 0, max: 24576 } },
    { id: "gemini-2.5-flash-lite", name: "Gemini 2.5 Flash-Lite", reasoning: { type: "budget", min: 0, max: 24576 } },
  ],
};

// ── xAI ──────────────────────────────────────────────────────────────────────
const xai: ProviderDef = {
  id: "xai",
  name: "xAI",
  description: "Grok 4, Grok 3",
  placeholder: "xai-...",
  color: "#1D1D1F",
  models: [
    { id: "grok-4.20-0309-reasoning", name: "Grok 4.20 (Reasoning)", reasoning: { type: "always" } },
    { id: "grok-4.20-0309-non-reasoning", name: "Grok 4.20", reasoning: { type: "none" } },
    { id: "grok-4-1-fast-reasoning", name: "Grok 4.1 Fast (Reasoning)", reasoning: { type: "always" } },
    { id: "grok-4-1-fast-non-reasoning", name: "Grok 4.1 Fast", reasoning: { type: "none" } },
    { id: "grok-3-mini", name: "Grok 3 Mini", reasoning: { type: "levels", levels: ["low", "high"] } },
    { id: "grok-3-mini-fast", name: "Grok 3 Mini Fast", reasoning: { type: "levels", levels: ["low", "high"] } },
  ],
};

// ── OpenRouter ───────────────────────────────────────────────────────────────
const openrouter: ProviderDef = {
  id: "openrouter",
  name: "OpenRouter",
  description: "Hundreds of models, one key",
  placeholder: "sk-or-...",
  color: "#6366F1",
  models: [
    { id: "anthropic/claude-sonnet-4-6", name: "Claude Sonnet 4.6", reasoning: { type: "levels", levels: ["low", "medium", "high", "max"] } },
    { id: "anthropic/claude-haiku-4-5", name: "Claude Haiku 4.5", reasoning: { type: "levels", levels: ["low", "medium", "high", "max"] } },
    { id: "openai/gpt-5.4", name: "GPT-5.4", reasoning: { type: "levels", levels: ["none", "low", "medium", "high"] } },
    { id: "openai/o3", name: "o3", reasoning: { type: "levels", levels: ["low", "medium", "high"] } },
    { id: "openai/o4-mini", name: "o4-mini", reasoning: { type: "levels", levels: ["low", "medium", "high"] } },
    { id: "google/gemini-2.5-flash", name: "Gemini 2.5 Flash", reasoning: { type: "budget", min: 0, max: 24576 } },
    { id: "deepseek/deepseek-r1", name: "DeepSeek R1", reasoning: { type: "always" } },
    { id: "deepseek/deepseek-v3.2", name: "DeepSeek V3.2", reasoning: { type: "none" } },
    { id: "qwen/qwen3.6-plus", name: "Qwen 3.6 Plus", reasoning: { type: "none" } },
    { id: "meta-llama/llama-3.3-70b", name: "Llama 3.3 70B", reasoning: { type: "none" } },
  ],
};

// ── Exports ──────────────────────────────────────────────────────────────────
export const PROVIDERS: ProviderDef[] = [anthropic, openai, google, xai, openrouter];

export const PROVIDER_MODELS: Record<string, ModelDef[]> = Object.fromEntries(
  PROVIDERS.map((p) => [p.id, p.models]),
);

export function getModelDef(providerId: string, modelId: string): ModelDef | undefined {
  return PROVIDER_MODELS[providerId]?.find((m) => m.id === modelId);
}

export function getModelDefByName(name: string): ModelDef | undefined {
  for (const provider of PROVIDERS) {
    const m = provider.models.find((m) => m.name === name);
    if (m) return m;
  }
  return undefined;
}
