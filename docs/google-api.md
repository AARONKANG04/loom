# Google Gemini API Reference

## Endpoint & Authentication

```
POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={API_KEY}
POST https://generativelanguage.googleapis.com/v1beta/models/{model}:streamGenerateContent?alt=sse&key={API_KEY}
```

**Authentication:** API key passed as query parameter `?key={GEMINI_API_KEY}`

**Content-Type:** `application/json`

### Vertex AI (alternative)

```
POST https://{REGION}-aiplatform.googleapis.com/v1/projects/{PROJECT_ID}/locations/{REGION}/publishers/google/models/{MODEL}:generateContent
```

Uses OAuth 2.0 bearer token: `Authorization: Bearer {TOKEN}`

---

## Models

### Latest Generation (Gemini 3.x) -- Preview

| Model               | API ID                          | Context | Max Output | Thinking      |
|---------------------|---------------------------------|---------|------------|---------------|
| Gemini 3.1 Pro      | `gemini-3.1-pro-preview`        | 1M      | 65,536     | Levels        |
| Gemini 3 Flash      | `gemini-3-flash-preview`        | 1M      | 65,536     | Levels        |
| Gemini 3.1 Flash-Lite | `gemini-3.1-flash-lite-preview` | 1M    | 65,536     | Levels        |

### Previous Generation (Gemini 2.5) -- GA, deprecating June 17, 2026

| Model               | API ID                    | Context | Max Output | Thinking      |
|---------------------|---------------------------|---------|------------|---------------|
| Gemini 2.5 Pro      | `gemini-2.5-pro`          | 1M      | 65,535     | Budget        |
| Gemini 2.5 Flash    | `gemini-2.5-flash`        | 1M      | 65,535     | Budget        |
| Gemini 2.5 Flash-Lite | `gemini-2.5-flash-lite` | 1M      | 65,535     | Budget        |

Use `gemini-3.1-pro-preview` for best quality, `gemini-3-flash-preview` for speed.

---

## Request Format

```json
{
  "contents": [
    {
      "role": "user",
      "parts": [{ "text": "Hello" }]
    }
  ],
  "systemInstruction": {
    "parts": { "text": "You are a helpful assistant." }
  },
  "generationConfig": {
    "maxOutputTokens": 8192,
    "temperature": 1.0,
    "topP": 0.95,
    "topK": 64,
    "stopSequences": ["END"],
    "responseMimeType": "application/json",
    "thinkingConfig": {
      "thinkingBudget": 1024
    }
  },
  "tools": [],
  "toolConfig": {},
  "safetySettings": []
}
```

### Parameters

| Parameter           | Type           | Required | Description |
|---------------------|----------------|----------|-------------|
| `contents`          | array          | Yes      | Conversation messages |
| `systemInstruction` | object         | No       | System prompt (parts format) |
| `generationConfig`  | object         | No       | Generation parameters |
| `tools`             | array          | No       | Tool/function definitions |
| `toolConfig`        | object         | No       | Function calling mode |
| `safetySettings`    | array          | No       | Safety filter thresholds |

### generationConfig

| Field              | Type       | Description |
|--------------------|------------|-------------|
| `maxOutputTokens`  | integer    | Max output tokens |
| `temperature`      | float 0-2  | Sampling temperature |
| `topP`             | float      | Nucleus sampling |
| `topK`             | integer    | Top-K sampling |
| `stopSequences`    | string[]   | Custom stop sequences |
| `responseMimeType` | string     | `"text/plain"` or `"application/json"` |
| `responseSchema`   | object     | JSON schema for structured output |
| `thinkingConfig`   | object     | Thinking/reasoning configuration |

---

## Message Structure

Roles are `"user"` and `"model"` (not `"assistant"`).

Content uses **parts** arrays:

```json
{ "role": "user", "parts": [{ "text": "Hello" }] }

{ "role": "user", "parts": [
  { "text": "Describe this image:" },
  { "inlineData": {
    "mimeType": "image/png",
    "data": "<base64>"
  }}
]}
```

### Part Types

| Type           | Fields                                     | Used In     |
|----------------|--------------------------------------------|-------------|
| `text`         | `text`                                     | user, model |
| `inlineData`   | `mimeType`, `data` (base64)               | user        |
| `fileData`     | `mimeType`, `fileUri`                      | user        |
| `functionCall` | `name`, `args`                             | model       |
| `functionResponse` | `name`, `response`                    | user        |
| `thought`      | `text` (thinking content)                  | model       |

---

## Thinking / Reasoning

Gemini uses **two different systems** depending on the model generation.

### Gemini 3.x: `thinkingLevel` (discrete levels)

```json
"generationConfig": {
  "thinkingConfig": {
    "thinkingLevel": "medium"
  }
}
```

| Level      | Description                    |
|------------|--------------------------------|
| `minimal`  | Near-zero thinking, lowest latency |
| `low`      | Light reasoning                |
| `medium`   | Balanced reasoning             |
| `high`     | Maximum reasoning depth (default) |

All Gemini 3.x models support all four levels.

### Gemini 2.5: `thinkingBudget` (integer token budget)

```json
"generationConfig": {
  "thinkingConfig": {
    "thinkingBudget": 1024
  }
}
```

| Model          | Default    | Min   | Max    | Disable |
|----------------|-----------|-------|--------|---------|
| 2.5 Pro        | -1 (auto) | 128   | 32,768 | Cannot disable |
| 2.5 Flash      | -1 (auto) | 0     | 24,576 | Set to 0 |
| 2.5 Flash-Lite | Off       | 512   | 24,576 | Set to 0 |

Special value `-1` means dynamic (model decides how much to think).

### Disabling Thinking

```json
"generationConfig": {
  "thinkingConfig": {
    "thinkingBudget": 0
  }
}
```

Or set `thinkingLevel` to `"minimal"` for Gemini 3.x (closest to off).

Note: `thinkingBudget` is accepted on Gemini 3 for backwards compatibility but may cause unexpected behavior. Use `thinkingLevel` for Gemini 3 models.

### Thinking in Responses

Thinking tokens appear as `thought` parts and are counted in `usageMetadata.thoughtsTokenCount`.

### UI Level Mapping

For Gemini 3.x, map directly to API levels. For Gemini 2.5, the budget is a continuous integer -- expose as a slider or map to presets.

---

## Streaming

Enable by using the `streamGenerateContent` endpoint with `?alt=sse`:

```
POST https://generativelanguage.googleapis.com/v1beta/models/{model}:streamGenerateContent?alt=sse&key={API_KEY}
```

### Event Format

Each SSE event is a full `GenerateContentResponse` JSON chunk:

```
data: {"candidates":[{"content":{"parts":[{"text":"Hello"}],"role":"model"},"index":0}],"usageMetadata":{...},"modelVersion":"gemini-3-flash-preview","responseId":"abc123"}

data: {"candidates":[{"content":{"parts":[{"text":" world"}],"role":"model"},"index":0}],"usageMetadata":{...},"modelVersion":"gemini-3-flash-preview","responseId":"abc123"}
```

All chunks share the same `responseId`. The final chunk includes complete `usageMetadata` and a `finishReason`.

---

## Response Format

```json
{
  "candidates": [
    {
      "content": {
        "role": "model",
        "parts": [
          { "text": "The capital of France is Paris." }
        ]
      },
      "finishReason": "STOP",
      "safetyRatings": [
        { "category": "HARM_CATEGORY_HATE_SPEECH", "probability": "LOW" }
      ]
    }
  ],
  "usageMetadata": {
    "promptTokenCount": 10,
    "candidatesTokenCount": 50,
    "totalTokenCount": 60,
    "thoughtsTokenCount": 200
  },
  "modelVersion": "gemini-3-flash-preview",
  "responseId": "abc123"
}
```

### Finish Reasons

| Value              | Meaning                          |
|--------------------|----------------------------------|
| `STOP`             | Model finished naturally         |
| `MAX_TOKENS`       | Hit maxOutputTokens limit        |
| `SAFETY`           | Blocked by safety filters        |
| `RECITATION`       | Blocked for recitation           |
| `OTHER`            | Other reason                     |

---

## Tool Use / Function Calling

### Defining Tools

```json
"tools": [{
  "functionDeclarations": [{
    "name": "get_weather",
    "description": "Gets current weather for a location.",
    "parameters": {
      "type": "object",
      "properties": {
        "location": { "type": "string", "description": "City name" }
      },
      "required": ["location"]
    }
  }]
}]
```

### Tool Config

```json
"toolConfig": {
  "functionCallingConfig": {
    "mode": "AUTO"
  }
}
```

| Mode   | Behavior                           |
|--------|------------------------------------|
| `AUTO` | Model decides (default)            |
| `ANY`  | Must call at least one function    |
| `NONE` | Won't call functions               |

### Flow

1. Model responds with `functionCall` part + `finishReason: "STOP"`
2. Execute the function
3. Send `functionResponse` part in next user message
4. Model responds with final answer

```json
// Model calls a function
{ "role": "model", "parts": [
  { "functionCall": { "name": "get_weather", "args": { "location": "Paris" } } }
]}

// Return function result
{ "role": "user", "parts": [
  { "functionResponse": { "name": "get_weather", "response": { "temp": "72F", "condition": "sunny" } } }
]}
```

---

## Error Handling

```json
{
  "error": {
    "code": 400,
    "message": "Invalid value for thinkingBudget",
    "status": "INVALID_ARGUMENT"
  }
}
```

| Status | Code                     | Common Cause                      |
|--------|--------------------------|-----------------------------------|
| 400    | `INVALID_ARGUMENT`       | Bad request body                  |
| 401    | `UNAUTHENTICATED`        | Invalid API key                   |
| 403    | `PERMISSION_DENIED`      | Key lacks access                  |
| 429    | `RESOURCE_EXHAUSTED`     | Rate limit or quota exceeded      |
| 500    | `INTERNAL`               | Google server error               |
| 503    | `UNAVAILABLE`            | Service temporarily unavailable   |

---

## OpenAI SDK Compatibility

Google provides an OpenAI-compatible endpoint (beta).

### Base URL

```
https://generativelanguage.googleapis.com/v1beta/openai/
```

### Usage (TypeScript)

```typescript
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: "GEMINI_API_KEY",
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
});

const response = await client.chat.completions.create({
  model: "gemini-3-flash-preview",
  max_tokens: 1024,
  messages: [{ role: "user", content: "Hello" }],
});
```

### Supported Features

- Chat completions, streaming, function/tool calling, vision
- Structured output (JSON mode via `response_format`)
- Embeddings, batch API
- Thinking via `reasoning_effort` parameter (maps to `thinkingLevel`/`thinkingBudget` internally)

### NOT Supported

- Cannot use `reasoning_effort` and `thinkingLevel`/`thinkingBudget` simultaneously
- Some safety setting granularity not available through compat layer

### When to Use

- Projects already using the OpenAI SDK that want to add Gemini support
- For full features (safety settings, fine-grained thinking config, file uploads), use the native API
