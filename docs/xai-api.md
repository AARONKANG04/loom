# xAI Grok API Reference

## Endpoint & Authentication

xAI provides an OpenAI-compatible Chat Completions API and a newer Responses API.

### Chat Completions (OpenAI-compatible)

```
POST https://api.x.ai/v1/chat/completions
```

### Responses API (recommended)

```
POST https://api.x.ai/v1/responses
```

**Required headers:**

| Header          | Value              |
|-----------------|--------------------|
| `Authorization` | `Bearer xai-...`   |
| `Content-Type`  | `application/json` |

API keys are created at [console.x.ai](https://console.x.ai).

---

## Models

### Grok 4.20 (Latest — 2M context)

| Model ID                          | Name                  | Reasoning  | Pricing (in/out MTok) |
|-----------------------------------|-----------------------|------------|-----------------------|
| `grok-4.20-0309-reasoning`        | Grok 4.20 (Reasoning) | Always-on  | $2.00 / $6.00       |
| `grok-4.20-0309-non-reasoning`    | Grok 4.20             | None       | $2.00 / $6.00       |
| `grok-4.20-multi-agent-0309`      | Grok 4.20 Multi-Agent | Always-on  | $2.00 / $6.00       |

### Grok 4.1 Fast (2M context, budget-friendly)

| Model ID                          | Name                       | Reasoning | Pricing (in/out MTok) |
|-----------------------------------|----------------------------|----------|-----------------------|
| `grok-4-1-fast-reasoning`         | Grok 4.1 Fast (Reasoning)  | Always-on | $0.20 / $0.50       |
| `grok-4-1-fast-non-reasoning`     | Grok 4.1 Fast              | None      | $0.20 / $0.50       |

### Grok 4 (Original — 256K context)

| Model ID       | Name   | Reasoning | Pricing (in/out MTok) |
|----------------|--------|----------|-----------------------|
| `grok-4-0709`  | Grok 4 | Always-on | $3.00 / $15.00       |

### Grok 3 (Older — 131K context)

| Model ID           | Name             | Reasoning            | Pricing (in/out MTok) |
|--------------------|------------------|----------------------|-----------------------|
| `grok-3`           | Grok 3           | Always-on            | $3.00 / $15.00       |
| `grok-3-mini`      | Grok 3 Mini      | Levels (low/high)    | $0.30 / $0.50        |
| `grok-3-mini-fast` | Grok 3 Mini Fast | Levels (low/high)    | $0.60 / $4.00        |

### Cached Input Pricing

Grok 4.20 and 4.1 Fast models support prompt caching:

| Tier           | Cached Input $/MTok |
|----------------|---------------------|
| Grok 4.20      | $0.20               |
| Grok 4.1 Fast  | $0.05               |

---

## Request Format (Chat Completions)

```json
{
  "model": "grok-4.20-0309-reasoning",
  "messages": [
    { "role": "system", "content": "You are a helpful assistant." },
    { "role": "user", "content": "Hello!" }
  ],
  "max_tokens": 4096,
  "temperature": 0.7,
  "top_p": 0.9,
  "stream": false,
  "stop": null,
  "tools": null,
  "tool_choice": "auto",
  "reasoning_effort": "high"
}
```

### Parameters

| Parameter          | Type          | Required | Description |
|--------------------|---------------|----------|-------------|
| `model`            | string        | Yes      | Model ID |
| `messages`         | array         | Yes      | Conversation messages |
| `max_tokens`       | integer       | No       | Max output tokens |
| `temperature`      | float 0-2     | No       | Default `0`. **Not supported for reasoning models** |
| `top_p`            | float         | No       | Nucleus sampling. **Not supported for reasoning models** |
| `stop`             | string/array  | No       | Stop sequences. **Not supported for reasoning models** |
| `stream`           | boolean       | No       | Enable SSE streaming. Default `false` |
| `reasoning_effort` | string        | No       | `"low"` or `"high"`. **Only for grok-3-mini variants** |
| `tools`            | array         | No       | Tool definitions (OpenAI format) |
| `tool_choice`      | string/object | No       | Tool calling strategy |
| `deferred`         | boolean       | No       | Async processing. Poll via `GET /v1/chat/deferred-completion/{id}` |

### xAI-specific: Search Parameters

```json
{
  "search_parameters": {
    "mode": "auto",
    "max_search_results": 5,
    "return_citations": true,
    "sources": [{ "type": "web" }, { "type": "x" }]
  }
}
```

| Field                | Type    | Description                                    |
|----------------------|---------|------------------------------------------------|
| `mode`               | string  | `"off"`, `"on"`, `"auto"`                      |
| `max_search_results` | integer | Max results to retrieve                        |
| `return_citations`   | boolean | Include citation metadata in response          |
| `sources`            | array   | Filter: `{ "type": "web" }`, `{ "type": "x" }`|

---

## Messages

Standard OpenAI message format with `system`, `user`, `assistant`, and `tool` roles.

```json
{ "role": "system", "content": "You are a helpful assistant." }
{ "role": "user", "content": "What is the weather?" }
{ "role": "assistant", "content": "I'll check for you." }
{ "role": "tool", "tool_call_id": "call_abc", "content": "72F, sunny" }
```

### Multi-modal (user message with image)

```json
{
  "role": "user",
  "content": [
    { "type": "text", "text": "What's in this image?" },
    { "type": "image_url", "image_url": { "url": "https://..." } }
  ]
}
```

---

## Reasoning

### Model Behavior

| Model                         | Reasoning          | `reasoning_effort`       | `reasoning_content` exposed? |
|-------------------------------|--------------------|--------------------------|------------------------------|
| `grok-4.20-*-reasoning`       | Always-on          | NOT supported (errors)   | No (encrypted via Responses API only) |
| `grok-4-1-fast-reasoning`     | Always-on          | NOT supported (errors)   | No (encrypted via Responses API only) |
| `grok-3-mini` / `mini-fast`   | Controllable       | `"low"` / `"high"`       | Yes, in `reasoning_content`  |
| All `non-reasoning` models    | None               | N/A                      | No                           |

### Usage with grok-3-mini

```json
{
  "model": "grok-3-mini",
  "messages": [{ "role": "user", "content": "Solve: 2x + 3 = 7" }],
  "reasoning_effort": "high"
}
```

### Constraints for Reasoning Models

- `temperature`, `top_p`, `stop`, `presence_penalty`, `frequency_penalty` are **not supported**
- Reasoning tokens count toward output token billing

### Reasoning in Responses

For `grok-3-mini`, reasoning is returned in `message.reasoning_content`:

```json
{
  "choices": [{
    "message": {
      "role": "assistant",
      "reasoning_content": "Let me solve 2x + 3 = 7...\n2x = 4\nx = 2",
      "content": "x = 2"
    }
  }]
}
```

For `grok-4` reasoning models, reasoning is internal. Encrypted reasoning can be retrieved via the Responses API with `include: ["reasoning.encrypted_content"]`.

---

## Streaming

Enable with `"stream": true`. Standard SSE format (OpenAI-compatible).

### Event Format

Each line: `data: {json}` — terminated with `data: [DONE]`.

**Content chunks:**
```json
{"choices": [{"delta": {"content": "Hello"}, "finish_reason": null}]}
```

**Final chunk:**
```json
{"choices": [{"delta": {}, "finish_reason": "stop"}]}
```

**Usage** (if `stream_options: { "include_usage": true }`):
```json
{"choices": [], "usage": {"prompt_tokens": 18, "completion_tokens": 42, "total_tokens": 60}}
```

---

## Responses API

The Responses API is xAI's newer, recommended API surface.

### Create a Response

```
POST /v1/responses
```

```json
{
  "model": "grok-4.20-0309-reasoning",
  "input": "What is the capital of France?",
  "reasoning_effort": "high"
}
```

### Key Differences from Chat Completions

| Feature                   | Chat Completions | Responses API |
|---------------------------|------------------|---------------|
| Conversation management   | Client-side      | Server-side (`previous_response_id`) |
| `reasoning_effort` levels | `low`, `high`    | `low`, `medium`, `high` |
| Response storage          | No               | 30 days (retrievable) |
| Encrypted reasoning       | No               | Yes, with `include` param |

### Chaining Conversations

```json
{
  "model": "grok-4.20-0309-reasoning",
  "input": "Tell me more about that.",
  "previous_response_id": "resp_abc123"
}
```

### Retrieve a Response

```
GET /v1/responses/{response_id}
```

---

## Response Format (Chat Completions)

```json
{
  "id": "chatcmpl-abc123",
  "object": "chat.completion",
  "created": 1728073417,
  "model": "grok-4.20-0309-reasoning",
  "choices": [{
    "index": 0,
    "message": {
      "role": "assistant",
      "content": "The capital of France is Paris."
    },
    "finish_reason": "stop"
  }],
  "usage": {
    "prompt_tokens": 20,
    "completion_tokens": 15,
    "total_tokens": 35
  }
}
```

### Finish Reasons

| Value           | Meaning                      |
|-----------------|------------------------------|
| `stop`          | Natural stop or stop sequence |
| `length`        | Hit max_tokens limit          |
| `tool_calls`    | Model requesting tool calls   |

---

## Tool Use

Standard OpenAI tool calling format.

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
        "location": { "type": "string" }
      },
      "required": ["location"]
    }
  }
}]
```

### Tool Choice

| Value                                                  | Behavior               |
|--------------------------------------------------------|------------------------|
| `"auto"`                                               | Model decides (default)|
| `"none"`                                               | Won't call tools       |
| `"required"`                                           | Must call a tool       |
| `{"type": "function", "function": {"name": "X"}}`     | Force specific tool    |

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
{ "role": "tool", "tool_call_id": "call_abc123", "content": "22C, sunny" }
```

---

## Deferred Processing

For long-running requests, use deferred mode:

```json
{
  "model": "grok-4.20-0309-reasoning",
  "messages": [{ "role": "user", "content": "..." }],
  "deferred": true
}
```

Poll for completion:
```
GET /v1/chat/deferred-completion/{request_id}
```

---

## Error Handling

```json
{
  "error": {
    "message": "Invalid API key",
    "type": "invalid_request_error",
    "code": "invalid_api_key"
  }
}
```

| Status | Meaning               |
|--------|-----------------------|
| 400    | Bad request           |
| 401    | Invalid API key       |
| 403    | Forbidden             |
| 429    | Rate limited          |
| 500    | Server error          |
