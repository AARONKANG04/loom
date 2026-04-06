# Anthropic Claude API Reference

## Endpoint & Authentication

```
POST https://api.anthropic.com/v1/messages
```

**Required headers:**

| Header              | Value             |
|---------------------|-------------------|
| `x-api-key`        | `sk-ant-...`      |
| `anthropic-version` | `2023-06-01`     |
| `content-type`     | `application/json` |

**Optional headers:**

| Header           | Value                                    | Description                |
|------------------|------------------------------------------|----------------------------|
| `anthropic-beta` | `interleaved-thinking-2025-05-14`        | Enable beta features       |

---

## Models

### Latest Generation

| Model              | API ID                          | Context | Max Output | Thinking | Pricing (in/out MTok) |
|--------------------|---------------------------------|---------|------------|----------|-----------------------|
| Claude Opus 4.6    | `claude-opus-4-6`               | 1M      | 128K       | Yes      | $5 / $25              |
| Claude Sonnet 4.6  | `claude-sonnet-4-6`             | 1M      | 64K        | Yes      | $3 / $15              |
| Claude Haiku 4.5   | `claude-haiku-4-5-20251001` (alias: `claude-haiku-4-5`) | 200K | 64K | Yes | $1 / $5 |

### Previous Generation

| Model              | API ID                          | Context | Max Output | Thinking |
|--------------------|---------------------------------|---------|------------|----------|
| Claude Sonnet 4.5  | `claude-sonnet-4-5`             | 200K    | 16,384     | Yes      |
| Claude Opus 4      | `claude-opus-4-0`               | 200K    | 32,768     | Yes      |
| Claude Sonnet 4    | `claude-sonnet-4-0`             | 200K    | 16,384     | Yes      |
| Claude 3.7 Sonnet  | `claude-3-7-sonnet-latest`      | 200K    | 16,384     | Yes      |

### Older (No Extended Thinking)

| Model              | API ID                          | Context | Max Output |
|--------------------|---------------------------------|---------|------------|
| Claude 3.5 Sonnet  | `claude-3-5-sonnet-latest`      | 200K    | 8,192      |
| Claude 3.5 Haiku   | `claude-3-5-haiku-latest`       | 200K    | 8,192      |

Use `claude-opus-4-6` and `claude-sonnet-4-6` for the best results.
Query model capabilities programmatically via the Models API.

---

## Request Format

```json
{
  "model": "claude-sonnet-4-0-20250514",
  "max_tokens": 4096,
  "messages": [
    { "role": "user", "content": "Hello" }
  ],
  "system": "You are a helpful assistant.",
  "temperature": 1.0,
  "top_p": 0.999,
  "top_k": 250,
  "stop_sequences": ["\n\nHuman:"],
  "stream": false,
  "thinking": {
    "type": "enabled",
    "budget_tokens": 10000
  },
  "tools": [],
  "tool_choice": { "type": "auto" },
  "metadata": { "user_id": "user-123" }
}
```

### Parameters

| Parameter        | Type           | Required | Description |
|-----------------|----------------|----------|-------------|
| `model`         | string         | Yes      | Model ID |
| `max_tokens`    | integer        | Yes      | Max output tokens |
| `messages`      | array          | Yes      | Conversation messages |
| `system`        | string / array | No       | System prompt |
| `temperature`   | float 0-1      | No       | Default `1.0`. **Must be 1 when thinking is enabled** |
| `top_p`         | float          | No       | Nucleus sampling. **Not allowed with thinking** |
| `top_k`         | integer        | No       | Top-K sampling. **Not allowed with thinking** |
| `stop_sequences`| string[]       | No       | Custom stop sequences |
| `stream`        | boolean        | No       | Enable SSE streaming. Default `false` |
| `thinking`      | object         | No       | Extended thinking config |
| `tools`         | array          | No       | Tool definitions |
| `tool_choice`   | object         | No       | Tool use strategy |
| `metadata`      | object         | No       | e.g. `{ "user_id": "..." }` |

---

## Message Structure

Messages alternate `user` / `assistant`, starting with `user`.

Content can be a **string** or **array of content blocks**:

```json
{ "role": "user", "content": "Hello" }

{ "role": "user", "content": [
  { "type": "text", "text": "Describe this image:" },
  { "type": "image", "source": {
    "type": "base64",
    "media_type": "image/png",
    "data": "<base64>"
  }}
]}
```

### Content Block Types

| Type           | Fields                                    | Used In     |
|----------------|-------------------------------------------|-------------|
| `text`         | `text`                                    | user, assistant |
| `image`        | `source: { type, media_type, data/url }`  | user        |
| `thinking`     | `thinking`                                | assistant   |
| `tool_use`     | `id`, `name`, `input`                     | assistant   |
| `tool_result`  | `tool_use_id`, `content`, `is_error?`     | user        |

---

## Extended Thinking

### How It Works

Anthropic uses a **token budget** (`budget_tokens` integer), NOT discrete levels.
The model can use up to `budget_tokens` tokens for internal reasoning before producing output.

### Enabling

```json
"thinking": {
  "type": "enabled",
  "budget_tokens": 10000
}
```

### Disabling

```json
"thinking": { "type": "disabled" }
```

Or omit the `thinking` field entirely (off by default).

### Constraints

- `budget_tokens` minimum: **1024**
- `budget_tokens` must be **less than** `max_tokens`
- `temperature` **must be 1** when thinking is enabled
- `top_p` and `top_k` **not allowed** with thinking

### UI Level Mapping

Since the API uses a continuous budget, map UI levels to token values:

| UI Level | `budget_tokens` | Description              |
|----------|-----------------|--------------------------|
| low      | 2048            | Light reasoning          |
| medium   | 8192            | Moderate reasoning       |
| high     | 32768           | Deep reasoning           |
| max      | 100000          | Maximum reasoning depth  |

### Response with Thinking

Thinking blocks appear before text in the response:

```json
{
  "content": [
    { "type": "thinking", "thinking": "Let me work through this...\n1. First..." },
    { "type": "text", "text": "The answer is 42." }
  ]
}
```

### Multi-turn

Pass thinking blocks back in assistant messages for multi-turn conversations.
The model needs them for context continuity.

---

## Streaming

Enable with `"stream": true`. Response is SSE (Server-Sent Events).

### Event Lifecycle

```
message_start        -> Message object (empty content)
content_block_start  -> New block stub (index + type)
content_block_delta  -> Incremental text/thinking/json chunks
content_block_stop   -> Block complete
message_delta        -> stop_reason + final usage
message_stop         -> Stream done
ping                 -> Keepalive (ignore)
error                -> Error during stream
```

### Delta Types

**Text:**
```json
{ "type": "content_block_delta", "index": 0,
  "delta": { "type": "text_delta", "text": "Hello" } }
```

**Thinking:**
```json
{ "type": "content_block_delta", "index": 0,
  "delta": { "type": "thinking_delta", "thinking": "Let me consider..." } }
```

**Tool input (JSON chunks):**
```json
{ "type": "content_block_delta", "index": 1,
  "delta": { "type": "input_json_delta", "partial_json": "{\"location\": \"San" } }
```

### Full Stream Example

```
event: message_start
data: {"type":"message_start","message":{"id":"msg_01X...","type":"message","role":"assistant","content":[],"model":"claude-sonnet-4-0-20250514","stop_reason":null,"usage":{"input_tokens":25,"output_tokens":1}}}

event: content_block_start
data: {"type":"content_block_start","index":0,"content_block":{"type":"text","text":""}}

event: content_block_delta
data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"Hello! How can I help?"}}

event: content_block_stop
data: {"type":"content_block_stop","index":0}

event: message_delta
data: {"type":"message_delta","delta":{"stop_reason":"end_turn"},"usage":{"output_tokens":12}}

event: message_stop
data: {"type":"message_stop"}
```

---

## Response Format

```json
{
  "id": "msg_01XFDUDYJgAACzvnptvVoYEL",
  "type": "message",
  "role": "assistant",
  "model": "claude-sonnet-4-0-20250514",
  "content": [
    { "type": "text", "text": "The capital of France is Paris." }
  ],
  "stop_reason": "end_turn",
  "stop_sequence": null,
  "usage": {
    "input_tokens": 25,
    "output_tokens": 15,
    "cache_creation_input_tokens": 0,
    "cache_read_input_tokens": 0
  }
}
```

### Stop Reasons

| Value           | Meaning                         |
|-----------------|----------------------------------|
| `end_turn`      | Model finished naturally         |
| `max_tokens`    | Hit max_tokens limit             |
| `stop_sequence` | Custom stop sequence matched     |
| `tool_use`      | Model wants to call a tool       |

---

## Tool Use

### Defining Tools

```json
"tools": [{
  "name": "get_weather",
  "description": "Gets current weather for a location.",
  "input_schema": {
    "type": "object",
    "properties": {
      "location": { "type": "string", "description": "City name" }
    },
    "required": ["location"]
  }
}]
```

### Tool Choice

| Type                              | Behavior                      |
|-----------------------------------|-------------------------------|
| `{ "type": "auto" }`             | Model decides (default)       |
| `{ "type": "any" }`              | Must use at least one tool    |
| `{ "type": "tool", "name": "X" }`| Must use specific tool        |
| `{ "type": "none" }`             | Won't use tools               |

### Flow

1. Model responds with `tool_use` block + `stop_reason: "tool_use"`
2. Execute the tool
3. Send `tool_result` in next user message
4. Model responds with final answer

```json
// Tool result (user message)
{ "role": "user", "content": [
  { "type": "tool_result", "tool_use_id": "toolu_01abc", "content": "72F sunny" }
]}

// Error result
{ "type": "tool_result", "tool_use_id": "toolu_01abc", "is_error": true,
  "content": "Location not found" }
```

Multiple tool results can be sent in one message for parallel tool calls.

---

## Error Handling

```json
{
  "type": "error",
  "error": {
    "type": "invalid_request_error",
    "message": "max_tokens must be greater than budget_tokens"
  }
}
```

| Status | Error Type               | Common Cause                      |
|--------|--------------------------|-----------------------------------|
| 400    | `invalid_request_error`  | Bad request body                  |
| 401    | `authentication_error`   | Invalid API key                   |
| 403    | `permission_error`       | Key lacks access to model         |
| 429    | `rate_limit_error`       | Too many requests                 |
| 500    | `api_error`              | Anthropic server error            |
| 529    | `overloaded_error`       | API overloaded                    |

---

## OpenAI SDK Compatibility

Anthropic provides an OpenAI-compatible endpoint, so you can use the OpenAI SDK directly.

### Base URL

```
https://api.anthropic.com/v1/
```

### Usage (Python)

```python
from openai import OpenAI

client = OpenAI(
    api_key="sk-ant-...",  # Anthropic API key
    base_url="https://api.anthropic.com/v1/",
)

response = client.chat.completions.create(
    model="claude-sonnet-4-6",
    max_tokens=1024,
    messages=[{"role": "user", "content": "Hello"}],
)
```

### Usage (TypeScript)

```typescript
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: "sk-ant-...",
  baseURL: "https://api.anthropic.com/v1/",
});

const response = await client.chat.completions.create({
  model: "claude-sonnet-4-6",
  max_tokens: 1024,
  messages: [{ role: "user", content: "Hello" }],
});
```

### Supported Features

- `model`, `max_tokens`, `stream`, `temperature` (capped at 1), `top_p`, `stop`
- Tool/function calling (`tools`, `functions`)
- Image input via `image_url`
- Streaming (SSE)
- Extended thinking via `extra_body`: `{ "thinking": { "type": "enabled", "budget_tokens": 8000 } }`
  - Note: thinking content is NOT returned through the OpenAI SDK

### NOT Supported

- `response_format` (no JSON mode via this endpoint)
- `strict` on tools (use native API for guaranteed schema conformance)
- Prompt caching (native API only)
- `logprobs`, `logit_bias`, `seed`, `presence_penalty`, `frequency_penalty`
- `n` must be 1

### When to Use

- Quick testing and comparison with OpenAI models
- Projects already using the OpenAI SDK that want to add Claude support
- For full features (prompt caching, PDF input, thinking output, citations), use the native API
