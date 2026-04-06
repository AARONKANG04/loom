# OpenAI API Reference

## Endpoint & Authentication

```
POST https://api.openai.com/v1/chat/completions
```

**Required headers:**

| Header           | Value                    |
|------------------|--------------------------|
| `Authorization`  | `Bearer sk-...`          |
| `Content-Type`   | `application/json`       |

**Optional headers:**

| Header               | Value            | Description         |
|----------------------|------------------|---------------------|
| `OpenAI-Organization`| `org-xxxxxx`     | Organization ID     |
| `OpenAI-Project`     | `proj-xxxxxx`    | Project ID          |

---

## Models

### GPT-5.x (Latest Generation)

| Model ID        | Context  | Max Output | Reasoning          | Pricing (in/out MTok) |
|-----------------|----------|------------|--------------------|-----------------------|
| `gpt-5.4`      | ~1M      | 128K       | levels (none-xhigh)| $2.50 / $15           |
| `gpt-5.4-mini` | 400K     | 128K       | levels (none-xhigh)| $0.75 / $4.50         |
| `gpt-5.4-nano` | 400K     | 128K       | levels (none-xhigh)| $0.20 / $1.25         |

### Reasoning (o-series)

| Model ID   | Context | Max Output | Reasoning          | Pricing (in/out MTok) |
|------------|---------|------------|--------------------|-----------------------|
| `o3`       | 200K    | 100K       | levels (low/med/hi)| $2.00 / $8.00         |
| `o4-mini`  | 200K    | 100K       | levels (low/med/hi)| $1.10 / $4.40         |
| `o3-mini`  | 200K    | 100K       | levels (low/med/hi)| $1.10 / $4.40         |

### GPT-4.1

| Model ID        | Context | Max Output | Reasoning | Pricing (in/out MTok) |
|-----------------|---------|------------|----------|-----------------------|
| `gpt-4.1`      | ~1M     | 32K        | none     | $2.00 / $8.00         |
| `gpt-4.1-mini` | ~1M     | 32K        | none     | $0.40 / $1.60         |
| `gpt-4.1-nano` | ~1M     | 32K        | none     | $0.05 / $0.20         |

### GPT-4o (Legacy)

| Model ID       | Context | Max Output | Reasoning | Pricing (in/out MTok) |
|----------------|---------|------------|----------|-----------------------|
| `gpt-4o`       | 128K    | 16K        | none     | $2.50 / $10.00        |
| `gpt-4o-mini`  | 128K    | 16K        | none     | $0.15 / $0.60         |

---

## Request Format

```json
{
  "model": "gpt-4.1",
  "messages": [
    {"role": "system", "content": "You are a helpful assistant."},
    {"role": "user", "content": "Hello!"}
  ],
  "max_completion_tokens": 4096,
  "temperature": 1.0,
  "top_p": 1.0,
  "frequency_penalty": 0.0,
  "presence_penalty": 0.0,
  "stop": null,
  "stream": false,
  "stream_options": null,
  "tools": null,
  "tool_choice": "auto",
  "response_format": {"type": "text"},
  "reasoning_effort": null
}
```

### Parameters

| Parameter              | Type           | Default  | Description |
|------------------------|----------------|----------|-------------|
| `model`                | string         | required | Model ID |
| `messages`             | array          | required | Conversation messages |
| `max_completion_tokens`| integer        | varies   | Max output tokens (includes reasoning tokens). Use instead of `max_tokens` |
| `temperature`          | float 0-2      | 1.0      | **Not supported for reasoning models** |
| `top_p`                | float          | 1.0      | **Not supported for reasoning models** |
| `frequency_penalty`    | float -2 to 2  | 0.0      | Penalize repeated tokens |
| `presence_penalty`     | float -2 to 2  | 0.0      | Penalize tokens already present |
| `stop`                 | string/array   | null     | Up to 4 stop sequences |
| `stream`               | boolean        | false    | Enable SSE streaming |
| `stream_options`       | object         | null     | `{"include_usage": true}` for usage in final chunk |
| `reasoning_effort`     | string         | varies   | Reasoning depth (see below) |
| `tools`                | array          | null     | Tool definitions |
| `tool_choice`          | string/object  | "auto"   | Tool calling strategy |
| `response_format`      | object         | text     | Output format control |
| `seed`                 | integer        | null     | Deterministic sampling (best-effort) |

---

## Messages

Messages alternate roles, starting with `system`/`developer` then `user`.

### Role Types

**System message** (for GPT-4o, GPT-4.1):
```json
{"role": "system", "content": "You are a helpful assistant."}
```

**Developer message** (preferred for reasoning models — o-series, GPT-5.x):
```json
{"role": "developer", "content": "You are a helpful assistant."}
```

**User message** (text):
```json
{"role": "user", "content": "Hello!"}
```

**User message** (with image):
```json
{"role": "user", "content": [
  {"type": "text", "text": "What's in this image?"},
  {"type": "image_url", "image_url": {"url": "https://...", "detail": "auto"}}
]}
```

**Assistant message:**
```json
{"role": "assistant", "content": "The answer is 42."}
```

**Tool result:**
```json
{"role": "tool", "tool_call_id": "call_abc123", "content": "{\"temp\": 22}"}
```

---

## Reasoning

### Which Models Support It

| Models              | `reasoning_effort` values              | Default    |
|---------------------|----------------------------------------|------------|
| o3, o4-mini, o3-mini| `low`, `medium`, `high`                | `medium`   |
| GPT-5.4, 5.4-mini/nano | `none`, `low`, `medium`, `high`, `xhigh` | `none` |
| GPT-4.1, GPT-4o    | **Not supported**                      | —          |

### Usage

```json
{
  "model": "o4-mini",
  "messages": [{"role": "user", "content": "Solve this..."}],
  "max_completion_tokens": 25000,
  "reasoning_effort": "high"
}
```

### Constraints for Reasoning Models

- `temperature` and `top_p` are **not supported** — omit them
- Use `max_completion_tokens` (not `max_tokens`) — budget covers reasoning + output
- Use `"role": "developer"` instead of `"role": "system"`

### Reasoning in Responses

Reasoning tokens are **internal and not exposed** in the response content. They appear only in usage:

```json
"usage": {
  "completion_tokens": 2919,
  "completion_tokens_details": {
    "reasoning_tokens": 1792
  }
}
```

---

## Streaming

Enable with `"stream": true`.

### Event Format

Each line: `data: {json}` — terminated with `data: [DONE]`.

**First chunk** (role):
```json
{"choices": [{"delta": {"role": "assistant", "content": ""}, "finish_reason": null}]}
```

**Content chunks:**
```json
{"choices": [{"delta": {"content": "Hello"}, "finish_reason": null}]}
```

**Final chunk:**
```json
{"choices": [{"delta": {}, "finish_reason": "stop"}]}
```

**Usage chunk** (if `stream_options.include_usage: true`):
```json
{"choices": [], "usage": {"prompt_tokens": 18, "completion_tokens": 2, "total_tokens": 20}}
```

**Termination:**
```
data: [DONE]
```

Reconstruct the full message by concatenating all `delta.content` values.

---

## Response Format

```json
{
  "id": "chatcmpl-abc123",
  "object": "chat.completion",
  "created": 1728073417,
  "model": "gpt-4.1",
  "choices": [{
    "index": 0,
    "message": {
      "role": "assistant",
      "content": "The response text.",
      "refusal": null,
      "tool_calls": null
    },
    "finish_reason": "stop"
  }],
  "usage": {
    "prompt_tokens": 20,
    "completion_tokens": 150,
    "total_tokens": 170,
    "completion_tokens_details": {
      "reasoning_tokens": 0
    }
  }
}
```

### Finish Reasons

| Value            | Meaning                              |
|------------------|--------------------------------------|
| `stop`           | Natural stop or stop sequence        |
| `length`         | Hit max_completion_tokens limit      |
| `tool_calls`     | Model requesting tool calls          |
| `content_filter` | Content filtered                     |

---

## Tool Use

### Defining Tools

```json
"tools": [{
  "type": "function",
  "function": {
    "name": "get_weather",
    "description": "Get current weather for a location",
    "parameters": {
      "type": "object",
      "properties": {
        "location": {"type": "string"}
      },
      "required": ["location"],
      "additionalProperties": false
    },
    "strict": true
  }
}]
```

`"strict": true` enables Structured Outputs — guarantees arguments match schema.

### Tool Choice

| Value                                                   | Behavior              |
|---------------------------------------------------------|-----------------------|
| `"auto"`                                                | Model decides (default)|
| `"none"`                                                | Won't call tools      |
| `"required"`                                            | Must call a tool      |
| `{"type": "function", "function": {"name": "X"}}`      | Force specific tool   |

### Tool Call in Response

```json
{
  "message": {
    "role": "assistant",
    "content": null,
    "tool_calls": [{
      "id": "call_abc123",
      "type": "function",
      "function": {
        "name": "get_weather",
        "arguments": "{\"location\":\"Paris\"}"
      }
    }]
  },
  "finish_reason": "tool_calls"
}
```

### Sending Results Back

```json
{"role": "tool", "tool_call_id": "call_abc123", "content": "22C, sunny"}
```

For parallel tool calls, send one `tool` message per call, all in sequence.

---

## Structured Outputs

### response_format Options

**Plain text** (default):
```json
{"type": "text"}
```

**JSON mode** (valid JSON, no schema):
```json
{"type": "json_object"}
```

**JSON Schema** (strict schema conformance):
```json
{
  "type": "json_schema",
  "json_schema": {
    "name": "result",
    "strict": true,
    "schema": {
      "type": "object",
      "properties": {
        "answer": {"type": "string"}
      },
      "required": ["answer"],
      "additionalProperties": false
    }
  }
}
```

---

## Error Handling

```json
{
  "error": {
    "message": "Invalid API key",
    "type": "invalid_request_error",
    "param": null,
    "code": "invalid_api_key"
  }
}
```

| Status | Meaning                |
|--------|------------------------|
| 400    | Bad request            |
| 401    | Invalid API key        |
| 403    | Forbidden              |
| 429    | Rate limited           |
| 500    | Server error           |
| 503    | Service unavailable    |
