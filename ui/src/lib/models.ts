export type ReasoningStyle =
  | { type: "none" }
  | { type: "levels"; levels: string[] }
  | { type: "budget"; min: number; max: number }
  | { type: "always" };

export interface ModelDef {
  id: string;
  name: string;
  reasoning: ReasoningStyle;
  /** Price per million tokens: [input, output] in USD */
  pricing?: [number, number];
}

// Maps UI reasoning levels to Anthropic budget_tokens values.
// Used when the UI shows discrete levels but the API expects a token budget.
export const ANTHROPIC_BUDGET_MAP: Record<string, number> = {
  low: 2048,
  medium: 8192,
  high: 32768,
  max: 100000,
};

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
    // API uses budget_tokens (integer), UI maps levels via ANTHROPIC_BUDGET_MAP
    // Latest generation (1M context)
    { id: "claude-opus-4-6", name: "Claude Opus 4.6", pricing: [5, 25], reasoning: { type: "levels", levels: ["low", "medium", "high", "max"] } },
    { id: "claude-sonnet-4-6", name: "Claude Sonnet 4.6", pricing: [3, 15], reasoning: { type: "levels", levels: ["low", "medium", "high", "max"] } },
    { id: "claude-haiku-4-5", name: "Claude Haiku 4.5", pricing: [1, 5], reasoning: { type: "levels", levels: ["low", "medium", "high", "max"] } },
    // Previous generation (200K context)
    { id: "claude-sonnet-4-5", name: "Claude Sonnet 4.5", pricing: [3, 15], reasoning: { type: "levels", levels: ["low", "medium", "high", "max"] } },
    { id: "claude-opus-4-0", name: "Claude Opus 4", pricing: [15, 75], reasoning: { type: "levels", levels: ["low", "medium", "high", "max"] } },
    { id: "claude-sonnet-4-0", name: "Claude Sonnet 4", pricing: [3, 15], reasoning: { type: "levels", levels: ["low", "medium", "high", "max"] } },
    { id: "claude-3-7-sonnet-latest", name: "Claude 3.7 Sonnet", pricing: [3, 15], reasoning: { type: "levels", levels: ["low", "medium", "high", "max"] } },
    // Older (no extended thinking)
    { id: "claude-3-5-sonnet-latest", name: "Claude 3.5 Sonnet", pricing: [3, 15], reasoning: { type: "none" } },
    { id: "claude-3-5-haiku-latest", name: "Claude 3.5 Haiku", pricing: [0.80, 4], reasoning: { type: "none" } },
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
    // GPT-5.4: reasoning_effort none/low/medium/high/xhigh (default: none)
    { id: "gpt-5.4", name: "GPT-5.4", pricing: [2.50, 15], reasoning: { type: "levels", levels: ["none", "low", "medium", "high", "xhigh"] } },
    { id: "gpt-5.4-mini", name: "GPT-5.4 Mini", pricing: [0.75, 4.50], reasoning: { type: "levels", levels: ["none", "low", "medium", "high", "xhigh"] } },
    { id: "gpt-5.4-nano", name: "GPT-5.4 Nano", pricing: [0.20, 1.25], reasoning: { type: "levels", levels: ["none", "low", "medium", "high", "xhigh"] } },
    { id: "o3", name: "o3", pricing: [2, 8], reasoning: { type: "levels", levels: ["low", "medium", "high"] } },
    { id: "o4-mini", name: "o4-mini", pricing: [1.10, 4.40], reasoning: { type: "levels", levels: ["low", "medium", "high"] } },
    { id: "o3-mini", name: "o3-mini", pricing: [1.10, 4.40], reasoning: { type: "levels", levels: ["low", "medium", "high"] } },
    { id: "gpt-4.1", name: "GPT-4.1", pricing: [2, 8], reasoning: { type: "none" } },
    { id: "gpt-4.1-mini", name: "GPT-4.1 Mini", pricing: [0.40, 1.60], reasoning: { type: "none" } },
    { id: "gpt-4.1-nano", name: "GPT-4.1 Nano", pricing: [0.05, 0.20], reasoning: { type: "none" } },
    { id: "gpt-4o", name: "GPT-4o", pricing: [2.50, 10], reasoning: { type: "none" } },
    { id: "gpt-4o-mini", name: "GPT-4o Mini", pricing: [0.15, 0.60], reasoning: { type: "none" } },
  ],
};

// ── Google ───────────────────────────────────────────────────────────────────
const google: ProviderDef = {
  id: "google",
  name: "Google",
  description: "Gemini 3.1 Pro, 3 Flash, 2.5",
  placeholder: "AIza...",
  color: "#4285F4",
  models: [
    // Latest generation (1M context, 65K output) — use thinkingLevel
    { id: "gemini-3.1-pro-preview", name: "Gemini 3.1 Pro", pricing: [2.50, 15], reasoning: { type: "levels", levels: ["minimal", "low", "medium", "high"] } },
    { id: "gemini-3-flash-preview", name: "Gemini 3 Flash", pricing: [0.15, 0.60], reasoning: { type: "levels", levels: ["minimal", "low", "medium", "high"] } },
    { id: "gemini-3.1-flash-lite-preview", name: "Gemini 3.1 Flash-Lite", pricing: [0.04, 0.15], reasoning: { type: "levels", levels: ["minimal", "low", "medium", "high"] } },
    // Previous generation (1M context, 65K output) — use thinkingBudget
    { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro", pricing: [1.25, 10], reasoning: { type: "budget", min: 128, max: 32768 } },
    { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", pricing: [0.15, 0.60], reasoning: { type: "budget", min: 0, max: 24576 } },
    { id: "gemini-2.5-flash-lite", name: "Gemini 2.5 Flash-Lite", pricing: [0.04, 0.15], reasoning: { type: "budget", min: 512, max: 24576 } },
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
    // Grok 4.20 (2M context)
    { id: "grok-4.20-0309-reasoning", name: "Grok 4.20 (Reasoning)", pricing: [2, 6], reasoning: { type: "always" } },
    { id: "grok-4.20-0309-non-reasoning", name: "Grok 4.20", pricing: [2, 6], reasoning: { type: "none" } },
    // Grok 4.1 Fast (2M context, budget-friendly)
    { id: "grok-4-1-fast-reasoning", name: "Grok 4.1 Fast (Reasoning)", pricing: [0.20, 0.50], reasoning: { type: "always" } },
    { id: "grok-4-1-fast-non-reasoning", name: "Grok 4.1 Fast", pricing: [0.20, 0.50], reasoning: { type: "none" } },
    // Older (131K context)
    { id: "grok-3-mini", name: "Grok 3 Mini", pricing: [0.30, 0.50], reasoning: { type: "levels", levels: ["low", "high"] } },
    { id: "grok-3-mini-fast", name: "Grok 3 Mini Fast", pricing: [0.60, 4], reasoning: { type: "levels", levels: ["low", "high"] } },
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
    { id: "anthropic/claude-opus-4-6", name: "Claude Opus 4.6", reasoning: { type: "levels", levels: ["low", "medium", "high", "max"] } },
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
