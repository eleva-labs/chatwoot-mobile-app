# Human-in-the-Loop Tool Execution: Alternatives & Recommendation

**Context:** Onboarding AI agent — FastAPI backend, LlamaIndex `FunctionAgent`, Vercel AI SDK v5  
**Status:** Research / Architecture Decision  
**Date:** 2026-03-03

---

## 1. The Problem Statement

### What "human-in-the-loop" means here (NOT the generic definition)

In the generic sense, "human-in-the-loop" means pausing an AI workflow for human approval. That
is NOT what we need.

Our specific problem is:

> The agent calls a tool (`render_view`) whose **execution surface is the client screen**, not the
> server. The tool causes a UI form to render in the mobile app. The user fills out the form. The
> filled data must be returned to the agent so it can continue reasoning.

This is a **client-side tool** in Vercel AI SDK v5 terms. But unlike typical client-side tools
(e.g., `getLocation`), it is **not auto-executable** — it requires a human to fill something out,
which takes seconds to minutes. The tool call and its result span **two separate HTTP requests**.

### The core constraint

The FastAPI backend is **stateless between HTTP requests**. There is no persistent coroutine, no
running agent process, no thread waiting for a reply. Each POST to `/ai/chat` is a fresh
invocation. The conversation history carried in the request body is the only continuity.

### The exact data flow

```
Request 1 (user → backend):
  POST /ai/chat
  body: { messages: [...history] }

  Backend:
    - Reconstructs agent from messages history
    - Agent LLM decides to call render_view(view_id, prefill)
    - render_view has no execute() on backend — streams tool call args to client
    - Response streams: [tool-call: render_view(args)]

  Client (Vercel AI SDK):
    - Receives tool call as a UIMessage part (type: 'tool-render_view', state: 'input-available')
    - Renders a UI form using tool args as configuration
    - User fills out the form
    - SDK calls addToolOutput({ tool: 'render_view', toolCallId, output: formData })
    - sendAutomaticallyWhen triggers next request

Request 2 (client → backend, automatic):
  POST /ai/chat
  body: { messages: [...history, assistantMsgWithToolCall, toolResultMsg] }

  Backend:
    - Reconstructs agent from messages history (now includes tool result)
    - Agent sees completed render_view with user-submitted data
    - Agent continues: validates data, calls next tool or responds to user
    - Streams final response
```

The agent never pauses. Both requests complete quickly. The human wait time is entirely on the
client side between the two requests.

---

## 2. Established Patterns Found

### 2.1 OpenAI-Native Tool Result in Messages Array

**Source:** https://platform.openai.com/docs/guides/function-calling  
**Framework:** OpenAI Chat Completions API

**How it works:**

The OpenAI API has a standardized multi-step tool call flow:

1. Call the API with `tools` list → model returns `tool_calls` in the assistant message
2. Execute the tool (server-side or client-side)
3. Append to messages array:
   - The assistant message (with `tool_calls`)
   - One `{ role: "tool", tool_call_id: ..., content: ... }` message per call
4. Call the API again with the extended messages array
5. Model reads tool results and continues generating

```python
# Step 1: initial request
messages = [{"role": "user", "content": "..."}]
response = client.chat.completions.create(model="gpt-4.1", messages=messages, tools=tools)

# Step 2: append assistant message with tool_calls
messages.append(response.choices[0].message)

# Step 3: execute tools and append results
for tool_call in response.choices[0].message.tool_calls:
    result = execute_tool(tool_call.function.name, tool_call.function.arguments)
    messages.append({
        "role": "tool",
        "tool_call_id": tool_call.id,
        "content": json.dumps(result)
    })

# Step 4: call again with full history
final_response = client.chat.completions.create(model="gpt-4.1", messages=messages, tools=tools)
```

**For client-side tools:** If the tool cannot be executed server-side, the server simply
streams the tool call to the client (without an `execute` function). The client executes it
and includes the result in the next request's `messages` array — which the server reconstructs
verbatim from request body.

**Pros for our stack:**
- Perfectly stateless — no server-side waiting
- Proven pattern used at scale in production
- No framework-specific abstractions needed
- The Vercel AI SDK already serializes tool calls and results in this exact format as
  `UIMessage` parts, which can be converted to model messages via `convertToModelMessages()`

**Cons for our stack:**
- LlamaIndex's `FunctionAgent` uses its own message format (`ChatMessage`), not the raw
  OpenAI messages array. We must map between formats.
- LlamaIndex does not natively expose a "resume from tool result" API that exactly mirrors
  this pattern.

**Compatibility:** High, but requires mapping work at the backend boundary.

---

### 2.2 Stateless Round-Trip Pattern (Conversation History as State Machine)

**Source:** General pattern derived from OpenAI function-calling docs, Vercel AI SDK docs  
**Framework:** Any stateless HTTP backend

**How it works:**

The entire agent state is encoded in the conversation history (messages array). Each request
carries the full history. The backend reconstructs the agent, feeds it the full history, and
the agent resumes from the last message's logical state.

When a tool call has been issued and a tool result is present in the history, the LLM's next
generation step naturally continues past the tool result — producing either another tool call
or a final text response.

Key insight: **The LLM's "memory" IS the messages array.** The agent does not resume from a
paused coroutine — it re-reads the history and its next generation is conditioned on the full
context including the tool result.

```
Turn 1: [user_msg] → [assistant_msg(tool_call=render_view)]
         Client renders form, user fills it
Turn 2: [user_msg, assistant_msg(tool_call), tool_result_msg] → [assistant_msg("Got your data, here's what I found...")]
```

**Pros:**
- Truly stateless — no server affinity, no distributed state
- Horizontally scalable (any server can handle any request)
- No Redis/DB needed for agent state
- Natural fit for FastAPI + LlamaIndex where agent is instantiated per-request

**Cons:**
- Context window grows with each turn (mitigated by summarization or context pruning)
- LlamaIndex `FunctionAgent` must be initialized with the full history each time, including
  the prior tool call and tool result, so the LLM does not re-execute the same tool
- We must NOT include the `render_view` tool in the `tools` list after its result is present,
  or configure the agent with `tool_choice=auto` and rely on context to prevent re-calls

**Compatibility:** High — this is the natural fit for a stateless FastAPI backend.

---

### 2.3 LlamaIndex Workflow with `InputRequiredEvent` / `HumanResponseEvent`

**Source:** https://docs.llamaindex.ai/python/llamaagents/workflows/human_in_the_loop/  
**Framework:** LlamaIndex Workflows (llama-agents new)

**How it works:**

LlamaIndex's new Workflow system (separate from `FunctionAgent`) supports a first-class
human-in-the-loop concept using typed events. A workflow step can emit an `InputRequiredEvent`
and then `await` a `HumanResponseEvent` from an external source.

```python
from llama_index.core.workflow import (
    Workflow, step, Event, StartEvent, StopEvent
)

class InputRequiredEvent(Event):
    view_id: str
    prefill: dict

class HumanResponseEvent(Event):
    form_data: dict

class OnboardingWorkflow(Workflow):
    @step
    async def decide_next_view(self, ev: StartEvent | HumanResponseEvent) -> InputRequiredEvent | StopEvent:
        # If HumanResponseEvent, process the form data
        # If StartEvent, decide which view to show first
        ...
        return InputRequiredEvent(view_id="profile_form", prefill={})

    @step
    async def process_response(self, ev: HumanResponseEvent) -> StopEvent:
        # Process submitted data
        ...
        return StopEvent(result="Onboarding complete")
```

The workflow is run and suspended when it emits `InputRequiredEvent`. The caller receives the
event, sends it to the client, waits for a response, then resumes the workflow by injecting
`HumanResponseEvent`.

In a server context, resumption requires the workflow instance to persist between requests
(in memory, Redis, or a durable execution engine like DBOS).

**LlamaIndex also documents a stateless variant** for HTTP deployments, where the workflow
state is serialized and sent to the client (or stored in a DB keyed by session), then
deserialized on the next request. This is functionally equivalent to pattern 2.2.

**Pros:**
- Explicit, typed event system — readable intent
- First-class LlamaIndex support with documentation
- `InputRequiredEvent` / `HumanResponseEvent` is a well-established vocabulary
- LlamaIndex Workflows now support durable execution (DBOS integration for persistence)

**Cons:**
- Requires migrating from `FunctionAgent` to the Workflow abstraction
- Stateful variant requires persistent workflow instance (Redis, DBOS, or DB) — adds infra
  complexity
- The stateless variant is essentially pattern 2.2 with LlamaIndex-specific wrappers
- LlamaAgents (new) is a different product from LlamaIndex Framework — docs are split across
  `python/llamaagents/` and `python/framework/` namespaces, making it hard to navigate
- Durable workflow execution (DBOS) is overkill for our use case

**Compatibility:** Medium — requires significant refactoring of existing `LlamaIndexAgent`
wrapper. The Workflow abstraction is incompatible with `FunctionAgent` directly.

---

### 2.4 Vercel AI SDK v5 Client-Side Tool Pattern (`addToolOutput` + `sendAutomaticallyWhen`)

**Source:** https://sdk.vercel.ai/docs/ai-sdk-ui/chatbot-tool-usage  
**Framework:** Vercel AI SDK v5 (`useChat`)

**How it works:**

The Vercel AI SDK v5 explicitly supports tools that require user interaction. The flow:

1. Backend streams tool call(s) without an `execute` function (client-side tool)
2. Client receives `UIMessage` part with `state: 'input-available'` for the tool
3. Client renders UI (form, confirmation dialog, etc.)
4. User interacts and provides output
5. `addToolOutput({ tool: 'toolName', toolCallId, output })` is called
6. `sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls` triggers auto-submit

```typescript
// Server: tool WITHOUT execute function = client-side tool
const result = streamText({
  model,
  messages: await convertToModelMessages(messages),
  tools: {
    render_view: {
      description: 'Render a UI form for the user to fill out',
      inputSchema: z.object({
        view_id: z.string(),
        prefill: z.record(z.unknown()).optional(),
      }),
      // NO execute() — this is a client-side tool
    },
  },
});
return result.toUIMessageStreamResponse();

// Client: handle user interaction
const { messages, addToolOutput } = useChat({
  sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
});

// In render: when part.type === 'tool-render_view' && part.state === 'input-available'
<OnboardingForm
  config={part.input}
  onSubmit={(formData) => {
    addToolOutput({
      tool: 'render_view',
      toolCallId: part.toolCallId,
      output: formData,
    });
  }}
/>
```

**This pattern is fully compatible with our mobile app.** The `useAIChat` hook already
integrates `addToolOutput` from the SDK. What is missing is:
1. The backend must return the tool call WITHOUT executing it server-side
2. The request body on the second call must carry the tool result in the messages array

**Pros:**
- Official Vercel AI SDK pattern — fully documented and supported
- Already partially implemented in the mobile app's `useAIChat.ts`
- `sendAutomaticallyWhen` handles automatic re-submission cleanly
- Tool result is typed (via `tool-render_view` part type)
- No server-side state needed

**Cons:**
- Does not prescribe what the backend should do with the tool result in Request 2
  (that is our responsibility)

**Compatibility:** Full — this is the client side of the solution. The server side needs to
be implemented.

---

### 2.5 LangChain Interrupt/Resume Pattern (for Comparison)

**Source:** LangGraph documentation  
**Framework:** LangGraph (LangChain's graph execution engine)

**How it works:**

LangGraph has a first-class `interrupt()` primitive. An agent node can call `interrupt(value)`
to pause execution mid-graph. The graph state is persisted (via a checkpointer — SQLite,
Postgres, Redis). The API returns the interrupted state to the caller. On the next request,
the graph is resumed from the exact pause point by injecting a `Command(resume=value)`.

```python
# In a LangGraph node
def collect_form(state):
    form_data = interrupt({"view_id": "profile", "prefill": {}})
    # Execution resumes HERE with form_data populated
    return {"collected": form_data}
```

**Pros:**
- Semantically clean — the code reads like synchronous code even though it's async/resumable
- LangGraph checkpointers handle persistence transparently
- First-class framework support

**Cons:**
- Requires LangGraph, not LangChain agents (different abstraction)
- Requires a persistent checkpointer (DB/Redis) — adds infra dependency
- Incompatible with our LlamaIndex stack without full rewrite
- The "clean" resume semantics come at the cost of statefulness
- LangGraph adds significant complexity and lock-in

**Compatibility:** None — requires replacing the entire agent framework.

---

### 2.6 OpenAI Tool Execution Approval Pattern (`needsApproval`)

**Source:** https://sdk.vercel.ai/docs/ai-sdk-core/tools-and-tool-calling#tool-execution-approval  
**Framework:** Vercel AI SDK v5 Core + UI

**How it works:**

The SDK supports `needsApproval: true | ((input) => boolean)` on a tool. When triggered:
1. The tool is NOT executed
2. The stream returns a `tool-approval-request` part
3. The client calls `addToolApprovalResponse({ id, approved })` to approve/deny
4. On the next generation, the tool either executes or is denied

This is designed for server-side tools that need approval before executing. Not directly
applicable to our client-rendered form case, but related.

**Pros:**
- Built into the SDK
- Approval decision is semantic (approved/denied) not data-carrying

**Cons:**
- This is approval for server-side execution, not data collection from the user
- Cannot carry arbitrary form data as the "approval response"
- Doesn't fit `render_view` semantics — we're not approving server-side code, we're
  collecting user input that the LLM needs for its next reasoning step

**Compatibility:** Low — wrong abstraction for our problem.

---

## 3. Recommended Approach for Our Stack

### Recommendation: Stateless Round-Trip with Vercel AI SDK Client-Side Tool Pattern

**The recommended approach combines patterns 2.2 + 2.4.** It requires minimal changes to
the existing backend and no new infrastructure.

### Why this fits

| Constraint | How it fits |
|------------|-------------|
| Stateless HTTP (no running coroutine) | Tool result arrives in Request 2's messages array |
| LlamaIndex `FunctionAgent` | Already accepts full message history; LLM auto-resumes |
| Vercel AI SDK v5 `useChat` | `addToolOutput` + `sendAutomaticallyWhen` are built for this |
| No Redis/DB for agent state | Messages array IS the state |
| Streaming SSE response | `toUIMessageStreamResponse()` or FastAPI `StreamingResponse` |

### What changes are needed to the existing backend

The `render_view` tool must be defined **without an `execute` function**. When the LLM calls
it, LlamaIndex will generate a tool call event but NOT execute the tool. The backend streams
the tool call down to the client. On Request 2, the backend receives the full history
including the tool result, reconstructs the `FunctionAgent` with that history, and the LLM
continues from the tool result.

**Critical:** The backend must reconstruct the `FunctionAgent`'s chat history including the
tool call and tool result messages from Request 2's body. LlamaIndex's `FunctionAgent.run()`
accepts either a string input (single turn) or a list of `ChatMessage` objects. We must pass
the full history.

Concretely:
1. Parse `UIMessage[]` from the request body (Vercel AI SDK format)
2. Convert to LlamaIndex `ChatMessage[]` using a mapper
3. Detect if the last message includes a tool result for `render_view`
4. Pass the full `ChatMessage[]` to `FunctionAgent.run()` (or use `chat()` method)
5. Stream the response back

### Whether to keep LlamaIndex or replace it

**Keep LlamaIndex for the onboarding agent.** The changes needed are at the boundary
(message format conversion), not inside the agent core. The `LlamaIndexAgent` class already
supports streaming and tool calls. Adding client-side tool support requires:

1. Marking `render_view` as a client-side tool (no `execute` in the tool config)
2. Updating the message reconstruction logic to accept a full `ChatMessage[]` history
   instead of just a `str` input

However, there is one important consideration: **LlamaIndex's `FunctionAgent.run()` currently
takes a single string input, not a messages array.** To support resuming with tool results,
we need to either:
- (a) Pass the tool result as a formatted string appended to the user message (hack, fragile)
- (b) Use `FunctionAgent`'s `arun()` or underlying `AgentRunner` with explicit memory
     pre-seeded with the full history (correct approach)
- (c) Use the LLM directly (bypass `FunctionAgent`) to generate the continuation step when
     a tool result is present (pragmatic, avoids `FunctionAgent` limitations)

Option (b) is preferred: pre-seed the LlamaIndex `ChatMemoryBuffer` with the full
conversation history before calling `FunctionAgent.run()`.

### The exact message format the backend needs to accept from the Vercel AI SDK client

The Vercel AI SDK v5 sends `UIMessage[]` in the request body. After a client-side tool
interaction, the last two messages are:

```json
[
  {
    "id": "msg_abc",
    "role": "assistant",
    "parts": [
      { "type": "tool-render_view", "toolCallId": "call_xyz", "state": "output-available",
        "input": { "view_id": "profile_form", "prefill": {} },
        "output": { "name": "Alice", "email": "alice@example.com" }
      }
    ]
  }
]
```

Actually the SDK sends the messages in this format and the server must call
`convertToModelMessages(messages)` (SDK function) or equivalent to expand them into
OpenAI-format model messages including the `tool` role message.

The FastAPI endpoint receives `UIMessage[]` and must:
1. Run `convertToModelMessages()` equivalent in Python (mapping `UIMessage` → `ChatMessage`)
2. Detect the assistant message with a `render_view` tool call + tool result
3. Build LlamaIndex `ChatMessage` list including:
   - Prior user/assistant messages
   - The assistant message with tool call
   - The `tool` role message with the form data result
4. Pre-seed agent memory with this history

---

## 4. Rejected Alternatives

### 4.1 LlamaIndex Workflow with `InputRequiredEvent` / `HumanResponseEvent` (Stateful)

**Rejected because:**
- Requires migrating `FunctionAgent` to the Workflow abstraction — significant refactor
- Stateful version requires persistent storage (Redis, DBOS) for workflow instances
- The benefits (event typing, explicit suspend/resume) do not justify the migration cost
- The stateless variant of this pattern reduces to pattern 2.2 anyway
- Adds a new major abstraction (`Workflow`, `step`, event classes) to an already complex stack

### 4.2 LangGraph Interrupt/Resume

**Rejected because:**
- Requires replacing LlamaIndex entirely with LangGraph
- Requires a persistent checkpointer (Postgres/Redis) for graph state
- Deep framework lock-in
- Conceptually appealing but operationally expensive for a stateless FastAPI service

### 4.3 OpenAI Tool Execution Approval (`needsApproval`)

**Rejected because:**
- Approval pattern carries only `approved: boolean`, not arbitrary form data
- Designed for server-side tool gate, not client-side data collection
- Wrong semantic fit

### 4.4 Server-Sent Events with Long-Running Connection

**Rejected because:**
- Would require keeping an HTTP connection open while the user fills a form (minutes)
- SSE connections time out and are not designed for user-input latency
- Incompatible with stateless HTTP and load balancing
- Adds complexity with no benefit over the round-trip pattern

### 4.5 WebSocket Persistent Connection

**Rejected because:**
- Would require migrating the entire chat transport from SSE to WebSocket
- The mobile app's `useAIChat.ts` transport is SSE-based (`DefaultChatTransport`)
- Adds connection management complexity (reconnects, heartbeats)
- Still requires server-side state for the suspended agent

---

## 5. Implementation Sketch

### FastAPI Endpoint

```python
# app/gateways/apis/onboarding_chat_api.py

from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List

router = APIRouter()

class UIMessagePart(BaseModel):
    type: str
    text: str | None = None
    toolCallId: str | None = None
    toolName: str | None = None
    input: dict | None = None
    output: dict | None = None
    state: str | None = None

class UIMessage(BaseModel):
    id: str
    role: str  # "user" | "assistant" | "tool"
    parts: List[UIMessagePart] = []

class OnboardingChatRequest(BaseModel):
    messages: List[UIMessage]
    agent_bot_id: str
    chat_session_id: str | None = None

@router.post("/onboarding/chat/stream")
async def onboarding_chat_stream(
    request: OnboardingChatRequest,
    # ... auth dependencies
):
    chat_messages = map_ui_messages_to_chat_messages(request.messages)

    async def generate():
        async for event in run_onboarding_agent_stream(
            chat_messages=chat_messages,
            agent_bot_id=request.agent_bot_id,
        ):
            yield format_sse_event(event)

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "X-Chat-Session-Id": get_or_create_session_id(request),
            "Cache-Control": "no-cache",
        },
    )
```

### Message Format Reconstruction

```python
# app/application/ai/mappers/ui_message_mapper.py

from llama_index.core.llms import ChatMessage, MessageRole, TextBlock, ImageBlock
from llama_index.core.tools import ToolOutput

def map_ui_messages_to_chat_messages(ui_messages: List[UIMessage]) -> List[ChatMessage]:
    """
    Convert Vercel AI SDK UIMessage[] to LlamaIndex ChatMessage[].

    Handles:
    - user messages (text parts)
    - assistant messages (text parts + tool call parts)
    - tool result messages (embedded in assistant parts with output)
    """
    result: List[ChatMessage] = []

    for msg in ui_messages:
        if msg.role == "user":
            text = " ".join(
                p.text for p in msg.parts if p.type == "text" and p.text
            )
            result.append(ChatMessage(role=MessageRole.USER, content=text))

        elif msg.role == "assistant":
            # Extract text content
            text_parts = [p.text for p in msg.parts if p.type == "text" and p.text]

            # Extract tool calls (state: input-available or output-available)
            tool_call_parts = [
                p for p in msg.parts
                if p.type.startswith("tool-") and p.toolCallId
            ]

            # Build the assistant ChatMessage with additional_kwargs for tool calls
            assistant_msg = ChatMessage(
                role=MessageRole.ASSISTANT,
                content=" ".join(text_parts),
                additional_kwargs={
                    "tool_calls": [
                        {
                            "id": p.toolCallId,
                            "type": "function",
                            "function": {
                                "name": p.type.removeprefix("tool-"),
                                "arguments": json.dumps(p.input or {}),
                            },
                        }
                        for p in tool_call_parts
                    ]
                } if tool_call_parts else {},
            )
            result.append(assistant_msg)

            # For tool parts that have output (tool result), append tool messages
            for p in tool_call_parts:
                if p.output is not None:
                    result.append(ChatMessage(
                        role=MessageRole.TOOL,
                        content=json.dumps(p.output),
                        additional_kwargs={
                            "tool_call_id": p.toolCallId,
                            "name": p.type.removeprefix("tool-"),
                        },
                    ))

    return result
```

### Agent Initialization with Pre-Seeded History

```python
# app/application/ai/onboarding/onboarding_agent.py

from llama_index.core.agent.workflow import FunctionAgent
from llama_index.core.memory import ChatMemoryBuffer
from llama_index.core.llms import ChatMessage

async def run_onboarding_agent_stream(
    chat_messages: List[ChatMessage],
    agent_bot_id: str,
) -> AsyncGenerator:
    # Initialize LLM + tools
    llm = build_llm_for_agent_bot(agent_bot_id)
    tools = build_onboarding_tools()  # render_view has NO execute()

    # Build agent
    agent = FunctionAgent(
        tools=tools,
        llm=llm,
        system_prompt=ONBOARDING_SYSTEM_PROMPT,
        streaming=True,
    )

    # Extract latest user message as the "input" for this turn
    # All prior messages (including tool calls + results) become memory
    if not chat_messages:
        return

    # Separate prior history from current user input
    # If last message is a user turn, use it as input
    # If last message is a tool result (we're resuming), the "input" is the
    # prior user message + context; the tool results are already in history
    last_user_idx = max(
        (i for i, m in enumerate(chat_messages) if m.role == MessageRole.USER),
        default=-1
    )
    if last_user_idx == -1:
        return

    prior_messages = chat_messages[:last_user_idx]
    current_input = chat_messages[last_user_idx].content

    # Pre-seed memory with prior history so agent sees tool calls + results
    memory = ChatMemoryBuffer.from_defaults(chat_history=prior_messages)

    # Run agent — it will see the tool result in memory and NOT re-call render_view
    handler = agent.run(current_input, memory=memory)

    async for event in handler.stream_events():
        yield map_stream_event_to_sse(event)
```

### Client-Side (mobile app)

The mobile app's `useAIChat.ts` already has the transport infrastructure. The addition is:

```typescript
// In AIChatInterface or a new OnboardingChatInterface
const { messages, addToolOutput } = useChat({
  transport: new DefaultChatTransport({ api: '/onboarding/chat/stream' }),
  sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
});

// In the message renderer:
for (const part of message.parts) {
  if (part.type === 'dynamic-tool' && part.toolName === 'render_view') {
    // OR typed: part.type === 'tool-render_view'
    if (part.state === 'input-available') {
      return (
        <OnboardingFormView
          config={part.input}
          onSubmit={(formData) => {
            addToolOutput({
              toolCallId: part.toolCallId,
              output: formData,
              // for typed tools: tool: 'render_view'
            });
          }}
        />
      );
    }
  }
}
```

Note: `render_view` must be declared as a known (static) tool in the backend's `tools`
definition with an `inputSchema` (Zod/JSON schema) but **no `execute` function**. The
Vercel AI SDK will then generate typed parts (`tool-render_view`) rather than `dynamic-tool`.

---

## 6. Open Questions

### 6.1 LlamaIndex `FunctionAgent` Memory Pre-Seeding

**Question:** Does `FunctionAgent.run(input, memory=memory)` correctly handle a `memory`
pre-seeded with tool call + tool result messages? Or does the agent re-execute the tool
because it sees the tool call in history but not through its own execution path?

**Risk:** Medium. LlamaIndex's `FunctionAgent` internally checks tool call execution state
through its own tracking. Pre-seeding memory may not update this internal state, causing
the agent to re-execute `render_view`.

**Spike needed:** Write a test where a `FunctionAgent` is initialized with memory containing
a tool call + tool result, and verify it produces a continuation rather than re-executing.

**Fallback:** If pre-seeding fails, use the LLM directly (no `FunctionAgent`) for Request 2
continuation. The LLM call with the full message history (including `tool` role message)
will generate a continuation — then parse any new tool calls and route accordingly.

### 6.2 Tool Call Deduplication

**Question:** If the agent is initialized with a history that includes a `render_view` call
and its result, will the LLM call `render_view` again for a different view, or will it proceed
to use the collected data?

**Risk:** Low — the LLM sees the completed tool call and result in context, which serves as
strong signal to proceed. But the system prompt should explicitly state: "Do not call
`render_view` again if its result is already in the conversation."

### 6.3 Multiple Concurrent Tool Calls

**Question:** Can the agent call multiple tools in a single response? If `render_view` is
called alongside another tool that DOES have an `execute` function, what happens?

**Answer (design decision):** The onboarding agent should NOT call `render_view` in parallel
with other tools. The system prompt should constrain it: "Call `render_view` only when it is
the sole action needed. After calling it, wait for the user's response before proceeding."

### 6.4 Form Validation and Re-Rendering

**Question:** If the user submits a form with invalid data, the agent may respond by calling
`render_view` again with validation errors. The client must handle receiving a second
`render_view` call in the same session — do we render a new form or update the existing one?

**Design decision needed:** The `render_view` tool args should include a `validation_errors`
field. The client replaces the current form with a new one (re-render on each `render_view`
call), not accumulates them.

### 6.5 Message Format Version Compatibility

**Question:** The Vercel AI SDK v5 UIMessage format is still evolving. Our Python mapper
(`map_ui_messages_to_chat_messages`) hardcodes assumptions about the `parts` array structure.
What happens when the SDK changes the format?

**Mitigation:** Pin the `ai` and `@ai-sdk/react` packages in `package.json` and document the
version dependency in this mapper. Add a version assertion in the mapper.

### 6.6 Session Continuity for Onboarding

**Question:** The current `useAIChat.ts` uses a `chat_session_id` header for session
continuity. For onboarding, does the session ID belong to the Chatwoot conversation session
(existing system) or a new onboarding-specific session?

**Design decision needed:** Onboarding sessions are likely separate from chat sessions
(different context, different persistence). The `/onboarding/chat/stream` endpoint may need
its own session management separate from the existing `aiChatService.ts`.

### 6.7 Streaming Interruption During Form Fill

**Question:** If the user takes a long time to fill the form (minutes), and the mobile app
goes to background, the SSE connection from Request 1 has already completed (the tool call
was streamed in full). There is no active connection to interrupt. Request 2 is only sent
when the user submits the form. This is actually fine — but we should confirm the client
does not time out or lose form state during background time.

**Mitigation:** Form state should be persisted in local component state (not SDK message
state) so backgrounding does not lose the partially filled form. The SDK message state
already persists the tool call arguments (the form config).

---

## Summary

| Aspect | Decision |
|--------|----------|
| Pattern | Stateless round-trip + Vercel AI SDK client-side tool |
| Backend changes | Add `render_view` tool without `execute`; add message history mapper |
| Frontend changes | Add `render_view` tool renderer in message parts; already has `addToolOutput` |
| Infrastructure | None — fully stateless, no Redis/DB for agent state |
| LlamaIndex | Keep — update to accept full message history via memory pre-seeding |
| Biggest risk | LlamaIndex `FunctionAgent` memory pre-seeding behavior (needs spike) |

The pattern is established, documented by Vercel AI SDK, consistent with OpenAI's function
calling model, and requires the least new infrastructure. The main implementation work is the
Python-side `UIMessage → ChatMessage` mapper and the `render_view` tool definition.
