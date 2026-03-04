# AI Backend Readiness Report: `render_view` UI Generation Support

**Date**: 2026-03-03  
**Auditor**: AI Backend Audit (automated)  
**Scope**: `/Users/alejandropereira/eleva/chatscommerce/ai-backend`  
**Purpose**: Assess readiness to support AI-driven UI view generation via the `render_view` tool call pattern

---

## 1. Executive Summary

The AI backend has a mature, production-grade streaming infrastructure that is **partially ready** for `render_view` support. The critical plumbing — SSE streaming in Vercel AI SDK v1 format, tool call streaming (`tool-input-start` / `tool-input-available` / `tool-output-available`), and the agent/workflow execution pipeline — is **fully operational**. However, **zero onboarding-specific code exists**: no `render_view` tool, no ViewSchema Pydantic models, no `update_progress`, `mark_step_complete`, `finish_flow`, or `undo_step` tools, and no special handling for the human-in-the-loop pattern where the client sends a tool result back to the AI.

**Overall readiness: ~25% — infrastructure ready, feature layer entirely missing.**

### The 5 Most Important Findings

1. **The streaming pipeline is correctly aligned with Vercel AI SDK v5**: The backend already emits `tool-input-start`, `tool-input-available`, and `tool-output-available` SSE events in the exact format the Vercel `DefaultChatTransport` expects. `render_view` tool calls will stream to the client correctly once the tool is defined.

2. **No `render_view` or any onboarding tool exists anywhere in the codebase**: A search across all of `services/core/app/` and `services/ecs/` returned zero matches for `render_view`, `render_slide`, `onboarding`, `ViewSchema`, or any related concept. The entire feature layer must be built from scratch.

3. **The client's `addToolOutput` → `sendAutomaticallyWhen` round-trip is NOT handled by the backend**: The current `MessageRequest` schema accepts only `List[str]` messages. There is no concept of tool results in the incoming request body. When the client sends a tool result back (after the user submits a view), the backend has no mechanism to receive and forward it to the AI as a `ToolMessage`.

4. **Tools are defined via Python method docstrings on `AITool` subclasses and mapped to LlamaIndex `FunctionTool`**: The tool definition system is docstring-driven (LlamaIndex introspects function signatures and docstrings). There is no OpenAI `strict: true` mode or JSON Schema discriminated union support in the current tool pipeline. The `render_view` tool requires a completely new tool registration mechanism.

5. **Two P0 spikes are still OPEN and block implementation**: SPIKE-1 (verify tool part runtime shape in Vercel AI SDK v5) and SPIKE-2 (validate ViewSchema against OpenAI strict mode) are both unresolved. These spikes are pre-conditions for both the client-side renderer AND the backend tool schema design.

---

## 2. UI Requirements Summary

The mobile and web clients expect the following from the AI backend:

### 2.1 Five Tools the AI Must Be Able to Call

| Tool | Type | Who Executes | Args Schema |
|------|------|-------------|-------------|
| `render_view` | Client-side (human-in-the-loop) | **Client renders, user submits** | `ViewSchema` (discriminated union of block types) |
| `update_progress` | Server auto-execute | Backend (no-op, display-only) | `{ currentStep, totalSteps, stepLabel? }` |
| `mark_step_complete` | Server auto-execute | Backend (persists data to DB) | `{ stepId, data }` |
| `finish_flow` | Server auto-execute | Backend (triggers final setup) | `{ summary }` |
| `undo_step` | Server auto-execute | Backend (clears step + cascading) | `{ stepId, reason? }` |

### 2.2 ViewSchema: What `render_view` Must Produce

The `render_view` tool args must conform to a `ViewSchema` — a JSON object with a `title`, optional `presentation_mode`, and a `blocks` array. Each block has a `type` discriminator:

**MVP 5-block subset (required for Phase 1)**:
```
big_text | single_choice | text_input | info_card | success
```

**Full 11-block schema (target)**:
```
big_text | single_choice | multi_choice | text_input | dropdown |
toggle | image_choice | info_card | confirmation | loading | success
```

Note: `architecture-design.md` uses hyphenated names (`big-text`, `single-choice`) but `spike-2-openai-strict-schema.md` recommends `snake_case` with underscores (`big_text`, `single_choice`) for OpenAI function naming compliance. This naming discrepancy must be resolved before implementation.

### 2.3 The Human-in-the-Loop Round-Trip

The complete flow the backend must support:

```
1. Client sends user message → POST /messaging/agent-systems/message/stream
2. AI backend streams SSE → includes tool-input-start + tool-input-available (render_view args)
3. Client renders the view → user interacts and submits
4. Client calls addToolOutput() + sendAutomaticallyWhen fires
5. Client sends next request → POST (same endpoint) with tool result in messages
6. AI backend receives tool result → passes it to LLM as ToolMessage → AI continues
7. AI may call mark_step_complete, then render next view or finish
```

Step 5–6 is currently **completely unsupported** by the backend.

### 2.4 `sendAutomaticallyWhen` and Multi-Turn Behavior

The Vercel AI SDK `useChat` hook on the client will automatically re-send when a tool output is available. This means the next HTTP request from the client will arrive with a conversation history that includes:
- Previous assistant message containing the `render_view` tool call
- A tool result message (from the user's form submission)

The backend must accept and forward this enriched message history to the LLM, including the tool result, so the AI can continue the flow.

### 2.5 Schema Validation Strategy

The architecture requires **dual validation**:
- Server-side: Zod/Pydantic `safeParse` before streaming to client; retry once on failure
- Client-side: Zod validation as defense-in-depth; fallback to raw tool args display on failure

The server is the primary validation layer. Invalid ViewSchema from the LLM should be retried before sending to the client.

---

## 3. Current Backend Capabilities

### 3.1 How Tools Are Currently Defined

Tools are Python classes inheriting from `AITool` (abstract base). Each tool:
1. Has a `functions: Sequence[str]` class attribute listing its callable method names
2. Defines those methods with type-annotated signatures and docstrings
3. Is registered in `ToolsFactory` via `@ToolsFactory.register(ConfigClass)` decorator
4. Has a companion `AIToolConfig` Pydantic class registered in `ConfigRegistry`

The `LlamaIndexToolMapper` introspects these methods and converts them to `llama_index.core.tools.FunctionTool` objects by reading Python type annotations and docstrings. **There is no JSON Schema, no `strict: true`, no discriminated union support** — tool schemas are derived entirely from Python function signatures.

**File**: `services/core/app/domain/abstract_classes/ai/base/tool.py`  
**File**: `services/core/app/application/factories/base/tools_factory.py`  
**Example tool**: `services/core/app/application/ai/tools/testing/calculator_tool.py`

### 3.2 How the LLM Is Invoked With Tools

The `LlamaIndexAgent` receives an `AIAgentConfig` that includes a `tools: List[AIToolConfigs]` field. During initialization:
1. `ToolsFactory.create_multiple_tools_from_config()` instantiates all `AITool` objects
2. `LlamaIndexToolMapper.to_engine_tool_list()` converts them to `FunctionTool` objects
3. `FunctionAgent(tools=llama_index_tools, llm=..., system_prompt=...)` is created

The underlying LLM is accessed through LlamaIndex's `FunctionAgent`, which manages the tool-calling loop. **LlamaIndex's `FunctionAgent` is the tool-calling orchestrator** — it handles multi-turn tool calling internally, including submitting tool results back to the LLM.

**File**: `services/core/app/application/ai/agent_implementations/llama_index/llama_index_agent.py`

### 3.3 How Streaming Works End-to-End

The streaming pipeline is well-architected and already Vercel AI SDK v5 compatible:

```
User Request → MessageRequest (POST /messaging/agent-systems/message/stream)
    │
    ▼
AgentSystemMessagingApiController.prepare_message_stream()
    │   (resolves chat context, session, chat history)
    ▼
AgentSystemMessagingApiController.get_message_stream_events()
    │   (calls workflow.run_stream())
    ▼
SequentialWorkflow / ConditionalWorkflow
    │   (orchestrates AIRunnableStep instances)
    ▼
AIRunnableStep.run_stream()
    │   (manages block lifecycle: text-start/delta/end, step-start/end)
    ▼
LlamaIndexAgent.run_stream() / ClaudeSDKAgent.run_stream()
    │   (executes LLM with tools, yields stream events)
    ▼
AIStreamEventTypes (domain events: TextDelta, ToolCallStart, ToolCall, ToolResult, ...)
    │
    ▼
_with_message_lifecycle() wrapper (adds Start/End events)
    │
    ▼
VercelSSEEventAdapter.transform_to_standard_format()
    │   Maps to Vercel SSE format:
    │   tool-input-start → {"type":"tool-input-start","toolCallId":"...","toolName":"..."}
    │   tool-input-available → {"type":"tool-input-available","toolCallId":"...","input":{...}}
    │   tool-output-available → {"type":"tool-output-available","toolCallId":"...","output":{...}}
    │
    ▼
EventSourceResponse (SSE) → Client
```

The `x-vercel-ai-ui-message-stream: v1` header is set on all streaming responses.  
**File**: `services/core/app/gateways/apis/agent_system_messaging_api.py`  
**File**: `services/core/app/application/ai/adapters/streaming/vercel_sse_event_adapter.py`  
**File**: `services/core/app/infrastructure/models/schemas/api/vercel_sse_schema.py`

### 3.4 How Tool Results From the Client Are Handled

**They are not.** The `MessageRequest` schema is:
```python
class AgentInput(BaseSchema):
    messages: List[str] = Field(..., description="List of messages")
    context: Optional[Dict] = Field(None, ...)
```

Messages are plain strings. There is no `toolResults`, `toolCallId`, or `ToolMessage` concept in the current request model. When LlamaIndex's `FunctionAgent` internally calls a tool and gets a result, **that is fully managed server-side** within the agent loop — there is no mechanism for the client to provide tool results from outside the server.

The `render_view` human-in-the-loop pattern requires the **client** to submit the tool result (the form values). The backend must accept a new message format that includes tool results in the conversation history, forward them to the LLM, and allow the AI to continue processing.

### 3.5 What the Current Chat Workflow Looks Like

Workflows are configured via JSON/YAML stored in the database and loaded at runtime. The `SequentialWorkflow`, `ConditionalWorkflow`, `ReflectionWorkflow`, and `StageClassifierAIWorkflow` are the available orchestrators. Each workflow runs a series of `AIRunnableStep` instances, where each step can be an `AIAgentConfig` (with tools), `AILLMConfig`, or `AIStructuredOutputLLMConfig`.

Chat history is handled by LlamaIndex's `FunctionAgent` when `use_chat_memory=True`, using `PostgresChatMemory` for persistence. **The chat memory integration is the hook point where tool results from a previous turn would need to be injected**, but this requires significant changes to the message ingestion layer.

**Files**: `services/core/app/application/ai/workflow/workflow_implementations/`  
**File**: `services/core/app/application/ai/workflow/steps/ai_step.py`

---

## 4. Gap Analysis

| Capability | Status | File Reference | Effort |
|------------|--------|---------------|--------|
| `render_view` tool definition (Pydantic ViewSchema + AITool subclass) | **MISSING** | None — needs new file: `tools/onboarding/render_view_tool.py` | L |
| `update_progress` tool definition | **MISSING** | None — needs new file: `tools/onboarding/update_progress_tool.py` | S |
| `mark_step_complete` tool definition + DB persistence | **MISSING** | None — needs tool + new DB table + repository | L |
| `finish_flow` tool definition + backend action | **MISSING** | None — needs tool + integration with workspace setup | L |
| `undo_step` tool definition + cascading invalidation logic | **MISSING** | None — needs tool + step registry + cascade algorithm | L |
| Tool registration in chat workflow/agent | **PARTIAL** | `services/core/app/application/ai/__init__.py` — add imports; workflow config in DB | M |
| Client-sent tool results (user submits view → backend receives result) | **MISSING** | `MessageRequest` schema + controller layer must be extended | XL |
| Multi-turn tool interaction state (AI sends render_view → waits → receives result → continues) | **MISSING** | No concept of "pending tool call" in backend request model | XL |
| ViewSchema validation (Pydantic model matching UI Zod schema) | **MISSING** | None — full Pydantic model hierarchy needed | M |
| Streaming tool call args to client (not just text) | **EXISTS** | `vercel_sse_event_adapter.py` + `agent_system_messaging_api.py` — already works | — |
| `sendAutomaticallyWhen` compatibility (client auto-submits, backend receives as new message) | **MISSING** | `MessageRequest` must accept `UIMessage[]` not `List[str]` | XL |
| Flow/session state tracking (which step the user is on) | **MISSING** | No step registry, no flow state in DB | L |
| Prompt engineering for `render_view` (system prompt with flow config) | **MISSING** | None — needs system prompt builder + flow config storage | M |
| OpenAI strict mode compatibility for ViewSchema | **MISSING / UNKNOWN** | SPIKE-2 is open — LlamaIndex tool mapper does not support strict mode | XL (spike first) |
| Server-side Pydantic validation of LLM-generated ViewSchema before streaming | **MISSING** | No validation hook in streaming pipeline | M |
| Static/semi-static step template enforcement (server intercepts tool call, replaces args) | **MISSING** | No middleware in streaming pipeline for tool arg replacement | L |
| `undo_step` cascading invalidation — step dependency graph | **MISSING** | No flow config storage, no dependency graph | L |
| New DB migrations for step registry + flow state | **MISSING** | No tables for onboarding data | M |
| Rollback context injection into conversation history | **MISSING** | No concept of injecting system messages into history | M |

**Effort key**: S = < 1 day, M = 1–3 days, L = 3–7 days, XL = 1–2+ weeks (architectural change)

---

## 5. Architecture Questions / Research Needed

### 5.1 How Should the AI Know When to Call `render_view` vs Respond With Text?

**Open question.** The system prompt must encode the flow definition and rules. The current backend has a `prompt_template_key` mechanism for loading prompts from the DB, and a `system_prompt` field for inline prompts. The `buildOnboardingSystemPrompt(flowConfig)` function described in `architecture-design.md` (Section 8.2) needs to be implemented server-side and injected into the step config.

**Decision needed**: Is the flow config stored per-agent-system in the DB, injected at request time, or passed by the client in the request body? The current system has no `flowConfig` concept in `MessageRequest`.

### 5.2 How Does Multi-Turn `render_view` Work Mechanically?

**The biggest architectural gap.** Currently, `MessageRequest.agent_input.messages` is `List[str]`. The Vercel AI SDK sends `UIMessage[]` — a rich format that includes message roles, parts arrays (with tool calls and tool results), and message IDs.

The backend must either:

**Option A**: Accept the full `UIMessage[]` format from the client, map it to LlamaIndex's message format (including `ToolMessage`/`ChatMessage` with role `tool`), and pass it to the agent. This requires:
- Rewriting `MessageRequest` to accept `UIMessage[]`
- A new mapper: `UIMessage[] → LlamaIndex ChatMessage[]`
- Handling tool result messages as `ChatMessage(role=MessageRole.TOOL, content=..., additional_kwargs={"tool_call_id": "..."})`

**Option B**: Keep `List[str]` messages but add a separate `tool_results: List[ToolResult]` field that the backend injects into the conversation history before calling the agent.

**Recommendation**: Option A is architecturally cleaner and aligns with what Vercel AI SDK sends natively. Option B is a short-term hack that will break for complex multi-turn flows.

### 5.3 Should Flow State Be Stored in the Backend Session or Inferred From Conversation History?

**Open question with strong opinion in `architecture-design.md`**: Section 4 (Step Registry Schema) argues that messages are the transport and the step registry is derived independently. The step registry must be persisted in the backend DB, linked to the chat session.

**Decision needed**: Which DB table stores the step registry? Should it be a new `onboarding_step_registry` table, or piggyback on custom attributes in the existing `chat_session` table? New migration required either way.

### 5.4 How Does `undo_step` Work Mechanically in the Conversation Thread?

`undo_step` has an `execute` function server-side (unlike `render_view` which is client-side). When the AI calls `undo_step`:
1. The tool executes server-side: clears the step registry entry, computes cascading invalidations, returns the list of invalidated steps
2. The tool result flows back to the AI as the next message
3. The AI then calls `render_view` again for the rolled-back step

The conversation history will contain the original `render_view` + old tool result + `undo_step` + new `render_view`. The backend must not interfere with this history. The rollback context injection (Section 10.3 of `architecture-design.md`) adds a synthetic system message before the latest user message — this requires the backend to be able to insert into the message history before forwarding to the LLM.

**Decision needed**: Does the backend inject the rollback context automatically when it detects a rolled-back step, or does the client send a special field signaling rollback? The former requires the backend to track step state and inject context; the latter is simpler but puts more responsibility on the client.

### 5.5 Can `strict: true` Be Used With the Discriminated Union ViewSchema?

**SPIKE-2 is open and blocks this.** The current tool pipeline uses LlamaIndex's `FunctionTool` which does NOT support OpenAI `strict: true`. To use strict mode, the backend would need to either:

- **Switch to LangChain / OpenAI Python SDK direct calls** for the `render_view` tool definition (bypassing LlamaIndex for this one tool)
- **Extend the LlamaIndex tool mapper** to support `strict: true` in the JSON schema (requires LlamaIndex upstream support or a custom workaround)
- **Drop `strict: true`** for `render_view` specifically (Fallback Option B from SPIKE-2 doc)

**The current LlamaIndex `FunctionTool` does not expose `strict` mode parameters.** This is an additional blocker beyond the Zod schema complexity concern described in SPIKE-2.

### 5.6 How Will the Backend Handle the LlamaIndex Tool-Calling Loop for `render_view`?

LlamaIndex's `FunctionAgent` executes tools server-side within its internal loop. For `render_view`, the tool should NOT execute server-side — its "execution" is client-side user interaction. 

The current pattern for server-side tools is: agent calls tool → LlamaIndex executes the Python method → result returned to agent → agent continues.

For `render_view`, the desired behavior is: agent calls tool → tool args are streamed to client → agent loop **pauses** → client submits tool result → next HTTP request arrives → agent resumes with the tool result.

**This is architecturally incompatible with LlamaIndex's `FunctionAgent` internal tool-calling loop.** LlamaIndex expects tools to return immediately (or be async but still within the same request). The multi-turn human-in-the-loop pattern requires the tool to return a "placeholder" on the first call, then the real result arrives in the next HTTP request.

**Options**:
1. **Return a placeholder immediately**: `render_view` returns `{"status": "pending", "toolCallId": "tc_abc"}` to LlamaIndex, the agent finishes its turn, the client submits the form, the next request arrives with the tool result in conversation history, and the agent reads it from history.
2. **Split into two agent invocations**: Each HTTP request is a complete agent invocation. `render_view` returns a sentinel value that causes the agent to stop. The next request has the full conversation history (including tool result) and the agent continues from there.
3. **Replace LlamaIndex with direct OpenAI/Anthropic SDK calls**: For the onboarding agent specifically, bypass LlamaIndex entirely and use the provider SDK directly for more control over the message format and tool execution loop.

**Option 2 is likely the correct approach** — it maps cleanly to the `sendAutomaticallyWhen` pattern on the client and is standard for stateless HTTP-based AI agents. But it requires the backend to correctly reconstruct the full conversation history including tool results from the `UIMessage[]` the client sends.

---

## 6. Implementation Plan

### Phase 0: Prerequisites (Must Complete First — ~1 week)

| # | Task | Effort | Blocker |
|---|------|--------|---------|
| P0.1 | Complete **SPIKE-1** (verify tool part runtime shape in Vercel AI SDK v5) | 0.5d | Blocks client-side Phase 1 |
| P0.2 | Complete **SPIKE-2** (validate ViewSchema against OpenAI strict mode) | 0.5d | Determines MVP block count and strict mode strategy |
| P0.3 | Decide architecture for multi-turn tool results (Option A/B/C in Section 5.6) | 1d | Blocks everything below |
| P0.4 | Decide `strict: true` workaround strategy for LlamaIndex (Section 5.5) | 0.5d | Determines tool registration approach |
| P0.5 | Design `MessageRequest` v2 schema accepting `UIMessage[]` | 1d | Blocks all tool-result handling |
| P0.6 | Design step registry DB schema + new migration | 1d | Blocks `mark_step_complete`, `undo_step` |

### Phase 1: Minimal Viable `render_view` (MVP — ~2–3 weeks after Phase 0)

#### 1a. ViewSchema Pydantic Model
**Effort**: M (2d)  
**File to create**: `services/core/app/domain/entities/ai/onboarding/view_schema.py`

Define the Pydantic model hierarchy matching the agreed ViewSchema (5-block MVP first, per SPIKE-2 results). Use `Annotated` + `Literal` discriminated union.

```python
# Sketch — exact shape depends on SPIKE-2 outcome
from typing import Annotated, Literal, Union
from pydantic import BaseModel, Field

class BigTextBlock(BaseModel):
    type: Literal["big_text"]
    content: str

class SingleChoiceOption(BaseModel):
    label: str
    value: str

class SingleChoiceBlock(BaseModel):
    type: Literal["single_choice"]
    question: str
    options: list[SingleChoiceOption]

# ... etc for MVP 5 blocks

Block = Annotated[Union[BigTextBlock, SingleChoiceBlock, ...], Field(discriminator="type")]

class ViewSchema(BaseModel):
    title: str
    presentation_mode: Literal["inline", "full"] | None = None
    blocks: list[Block]
```

#### 1b. `render_view` Tool Class
**Effort**: M (2d)  
**File to create**: `services/core/app/application/ai/tools/onboarding/render_view_tool.py`

The tool is client-side (no server execution). It must return a placeholder immediately so LlamaIndex can continue. The key challenge is streaming the args to the client — this already happens automatically via `AIStreamToolCallEvent`.

```python
@ConfigRegistry.register(ConfigCategory.TOOL)
class RenderViewToolConfig(AIToolConfig):
    name: Literal["render_view"] = "render_view"
    # No additional config needed for MVP

@ToolsFactory.register(RenderViewToolConfig)
class RenderViewTool(AITool):
    functions = ["render_view"]

    async def render_view(self, title: str, blocks: list) -> str:
        """
        Render an interactive UI view with blocks for user input.
        The view is rendered on the client side. The tool result will
        contain the user's responses once they submit the form.
        Do not call any other tool until the user submits the view.

        Args:
            title: The title displayed at the top of the view
            blocks: Array of UI blocks (big_text, single_choice, text_input, info_card, success)
        """
        # Client-side tool — return sentinel immediately
        # The real result arrives in the next HTTP request from the client
        return "VIEW_RENDERED_AWAITING_USER_INPUT"
```

**Critical note**: This approach works ONLY if the conversation history from the next request includes the real tool result. The sentinel return value is discarded when the full history arrives.

#### 1c. `update_progress` Tool
**Effort**: S (0.5d)  
**File to create**: `services/core/app/application/ai/tools/onboarding/update_progress_tool.py`

Server-side auto-execute, returns `{"acknowledged": true}`. The client displays progress from the tool args (already streamed as `tool-input-available`).

#### 1d. `MessageRequest` v2 with `UIMessage[]` Support
**Effort**: XL (5–7d)  
**Files to modify**:
- `services/core/app/infrastructure/models/schemas/api/agent_system_messaging_api_schema.py`
- `services/core/app/gateways/controllers/agent_system_messaging_api_controller.py`
- `services/core/app/application/factories/memory/chat_memory_factory.py`
- All layers from API schema down to LlamaIndex message conversion

This is the highest-effort item. The `MessageRequest` must accept either:
- The existing `List[str]` format (backward compatible for current WhatsApp/messaging use case)
- A new `UIMessage[]` format for the onboarding/AI chat use case

A versioned request schema or a `message_format: "plain" | "vercel_ui"` discriminator field would allow backward compatibility.

#### 1e. New Streaming Endpoint for Onboarding Chat
**Effort**: M (2d)  
**File to create**: `services/ecs/chatscomm_api/app/gateways/apis/onboarding_api.py`

A dedicated endpoint (e.g., `POST /api/messaging/agent-systems/onboarding/stream`) that accepts the `UIMessage[]` format, routes to an onboarding-specific workflow, and handles the multi-turn tool result pattern.

#### 1f. Register `render_view` Tool in `__init__.py`
**Effort**: S (0.5d)  
**File to modify**: `services/core/app/application/ai/__init__.py`

Add imports for `RenderViewToolConfig`, `UpdateProgressToolConfig`. Update the agent-system workflow config in the DB to include these tools.

#### 1g. Onboarding System Prompt Builder
**Effort**: M (2d)  
**File to create**: `services/core/app/application/ai/workflow/context_providers/onboarding_system_prompt_provider.py`

Builds the system prompt from a `FlowConfig` (defined in Python or loaded from DB). Encodes step types, templates, and rules as described in `architecture-design.md` Section 8.2.

### Phase 2: Complete Tool Suite (~2 weeks)

| # | Task | Effort | Files |
|---|------|--------|-------|
| 2a | `mark_step_complete` tool + DB table + migration | L | New tool file + new migration + new repository |
| 2b | `finish_flow` tool + workspace setup integration | L | New tool file + integration with existing store setup |
| 2c | `undo_step` tool + cascading invalidation + step registry | L | New tool + step registry table + cascade algorithm |
| 2d | Server-side ViewSchema validation (retry on invalid) | M | New validation middleware in streaming pipeline |
| 2e | Static/semi-static step template enforcement | L | New middleware: intercepts `render_view` args, merges template |
| 2f | Rollback context injection into conversation history | M | New hook in message preprocessing |

### Phase 3: Production Hardening (~1 week)

| # | Task | Effort |
|---|------|--------|
| 3a | Flow/session state persistence (step registry in DB, survives restarts) | M |
| 3b | Resume from checkpoint (AI picks up from last step after app restart) | M |
| 3c | Server-side rate limiting / max tool calls per session | S |
| 3d | Observability: log every `render_view` call with step data for analytics | S |
| 3e | Integration tests for full round-trip (render_view → addToolOutput → continue) | M |

### What Can Be Built Now (Without Blocking Spikes)

These items do NOT require SPIKE-1 or SPIKE-2 to be complete:
- ViewSchema Pydantic model hierarchy (design the Python model based on the requirements doc)
- `update_progress` tool (simple, no schema concerns)
- `mark_step_complete` tool skeleton (DB schema can be designed now)
- `undo_step` cascading invalidation algorithm (pure Python, no schema concerns)
- DB migration design + new alembic migration files
- Onboarding system prompt builder (pure text, no streaming concerns)
- `MessageRequest` v2 schema design (can be designed now, implemented after architecture decision)

### What Needs SPIKE-1 Completed First

- `render_view` tool arg schema (exact field names must match what the client reads)
- `addToolOutput` message format in `MessageRequest` v2

### What Needs SPIKE-2 Completed First

- Final ViewSchema Pydantic model (MVP block count and `strict: true` strategy)
- LlamaIndex `strict: true` workaround or alternative provider strategy
- Decision on whether to support the full 11-block schema or lock to 5 blocks

### What Depends on Client-Side SPIKEs Being Completed

Both SPIKE-1 and SPIKE-2 are **client-side validation spikes** that inform backend design. The backend cannot finalize the `render_view` tool arg schema until SPIKE-2 confirms whether `strict: true` works and which block types are in the MVP schema.

---

## 7. File References

All paths relative to `/Users/alejandropereira/eleva/chatscommerce/ai-backend/`.

### Existing Files (Read During This Audit)

| File | Purpose |
|------|---------|
| `services/core/app/application/ai/tools/__init__.py` | Empty module stub — tools are auto-discovered via imports |
| `services/core/app/application/ai/tools/workflow/workflow_handoff_tool.py` | Reference tool: dynamic function creation pattern |
| `services/core/app/application/ai/tools/workflow/memory_tool.py` | Reference tool: `read_memory` / `write_memory` pattern with schema injection |
| `services/core/app/application/ai/tools/testing/calculator_tool.py` | Reference tool: simplest tool pattern (single function, no deps) |
| `services/core/app/application/ai/__init__.py` | **The tool registry** — all tool configs must be imported here |
| `services/core/app/domain/abstract_classes/ai/base/tool.py` | `AITool` base class, `AIToolConfig`, `AIToolCall`, schema injection pattern |
| `services/core/app/domain/abstract_classes/ai/base/agent.py` | `AIAgentConfig`, `AIAgentOutput`, `AIAgent` abstract base |
| `services/core/app/domain/abstract_classes/ai/workflow/runnable.py` | `Runnable`, `RunnableConfig`, `run_stream()` interface |
| `services/core/app/domain/abstract_classes/ai/workflow/state.py` | `RunnableState`: streaming support, context providers, storage |
| `services/core/app/domain/abstract_classes/ai/workflow/workflow.py` | `Workflow` abstract base, thin wrapper over `Runnable` |
| `services/core/app/domain/entities/ai/streaming_events.py` | **All streaming event types** including `AIStreamToolCallEvent`, `AIStreamToolResultEvent` |
| `services/core/app/application/ai/workflow/steps/ai_step.py` | `AIRunnableStep`: the primary execution unit that runs agents/LLMs |
| `services/core/app/application/ai/agent_implementations/llama_index/llama_index_agent.py` | `LlamaIndexAgent`: creates `FunctionAgent` with tools; maps `AITool` → `FunctionTool` |
| `services/core/app/application/ai/adapters/streaming/vercel_sse_event_adapter.py` | **Key file**: maps domain events → Vercel SSE format; already handles tool events correctly |
| `services/core/app/gateways/apis/agent_system_messaging_api.py` | **The streaming endpoint**: `POST /messaging/agent-systems/message/stream` |
| `services/core/app/infrastructure/models/schemas/api/agent_system_messaging_api_schema.py` | `MessageRequest`: the current (limited) request schema |
| `services/core/app/infrastructure/models/schemas/api/vercel_sse_schema.py` | Vercel SSE Pydantic models including `VercelToolInputAvailableEvent`, `VercelToolOutputAvailableEvent` |

### Files to Create (New)

| File | Purpose |
|------|---------|
| `services/core/app/domain/entities/ai/onboarding/view_schema.py` | Pydantic ViewSchema model hierarchy (5-block MVP first) |
| `services/core/app/domain/entities/ai/onboarding/flow_config.py` | FlowConfig, StepConfig, StepType Pydantic models |
| `services/core/app/domain/entities/ai/onboarding/step_registry.py` | StepRecord, StepRegistry Pydantic models |
| `services/core/app/application/ai/tools/onboarding/render_view_tool.py` | `RenderViewTool` + `RenderViewToolConfig` |
| `services/core/app/application/ai/tools/onboarding/update_progress_tool.py` | `UpdateProgressTool` + `UpdateProgressToolConfig` |
| `services/core/app/application/ai/tools/onboarding/mark_step_complete_tool.py` | `MarkStepCompleteTool` + DB persistence |
| `services/core/app/application/ai/tools/onboarding/finish_flow_tool.py` | `FinishFlowTool` + workspace setup trigger |
| `services/core/app/application/ai/tools/onboarding/undo_step_tool.py` | `UndoStepTool` + cascading invalidation |
| `services/core/app/application/ai/workflow/context_providers/onboarding_prompt_provider.py` | Builds system prompt from FlowConfig |
| `services/ecs/chatscomm_api/app/gateways/apis/onboarding_api.py` | Dedicated onboarding streaming endpoint |
| `services/ecs/chatscomm_api/migrations/versions/vX_X_X_add_onboarding_step_registry.py` | DB migration for step registry table |

### Files to Modify (Existing)

| File | Modification |
|------|-------------|
| `services/core/app/application/ai/__init__.py` | Add imports for all onboarding tool configs |
| `services/core/app/infrastructure/models/schemas/api/agent_system_messaging_api_schema.py` | Extend `MessageRequest` to accept `UIMessage[]` format |
| `services/core/app/gateways/controllers/agent_system_messaging_api_controller.py` | Handle `UIMessage[]` conversion to LlamaIndex messages |
| `services/ecs/chatscomm_api/app/main.py` | Register onboarding router |

---

## 8. Appendix: Naming Discrepancy

`architecture-design.md` uses hyphenated block type names (`big-text`, `single-choice`, `text-input`, etc.) throughout the Zod schemas, while `spike-2-openai-strict-schema.md` recommends underscore names (`big_text`, `single_choice`, `text_input`) for OpenAI function naming compliance.

**Recommendation**: Use underscore names (`big_text`, `single_choice`) for all backend Pydantic models, consistent with SPIKE-2 guidance and the existing `AIToolConfig.name` pattern which enforces `^[a-z][a-z0-9]*(_[a-z0-9]+)*$`. Update the `architecture-design.md` schemas to match once SPIKE-2 is resolved.

---

## 9. Risk Summary

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| LlamaIndex `FunctionAgent` incompatible with human-in-the-loop `render_view` pattern | **High** | **Critical** | Spike it early; consider bypassing LlamaIndex for onboarding agent |
| OpenAI strict mode fails for discriminated union ViewSchema | **Medium** | High | SPIKE-2 already planned; fallback options documented |
| `UIMessage[]` → LlamaIndex message conversion is lossy or buggy | **Medium** | High | Define clear mapping spec before implementation |
| Backward compatibility break in `MessageRequest` schema | **Medium** | Medium | Use versioned schema or feature-flagged format discriminator |
| Rollback + cascading invalidation causes AI context confusion | **Low** | Medium | Rollback context injection + thorough integration tests |
| DB step registry grows unbounded for long flows | **Low** | Low | TTL cleanup job; step registry is session-scoped |
