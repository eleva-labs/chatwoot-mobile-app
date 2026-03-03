# AI Chat Architecture — Integration Overview

> **Version**: 2.0 (2026-03-03) — Complete rewrite. v1.0 described the rejected assistant-ui approach; this version describes the actual implemented architecture.
> **Purpose**: High-level integration guide — read this to understand the full system in 15 minutes
> **Audience**: Engineers implementing Phase 1 (render_view), extending the AI chat, or evaluating the system
> **Prerequisite reading**: None — this document IS the entry point. It references detailed docs for deep dives.

---

## 1. Overview & Approach

We use **Vercel AI SDK v5 `useChat` directly** — no external component library sits between us and the SDK. The AI streams responses from our FastAPI backend via SSE. Tool calls are intercepted in the part renderer and dispatched to registered renderers. No assistant-ui, no LocalRuntime, no Zustand.

The system is built in three layers:

```
┌─────────────────────────────────────────────────────────────┐
│  AI Backend (FastAPI, Python)                               │
│  Streams SSE: text parts, tool-call parts, reasoning parts  │
└───────────────────────────────┬─────────────────────────────┘
                                │ SSE over HTTP
┌───────────────────────────────┼─────────────────────────────┐
│  Transport Layer              │                             │
│  DefaultChatTransport (AI SDK v5)                           │
│  • Auth headers (via ChatConfig.transport.getHeaders)       │
│  • Session ID extraction (X-Chat-Session-Id header)         │
│  • Request body preparation (agentBotId, sessionId)         │
│  useAIChat.ts                 │                             │
└───────────────────────────────┼─────────────────────────────┘
                                │ UIMessage[] with parts array
┌───────────────────────────────┼─────────────────────────────┐
│  React UI Layer               │                             │
│  AIChatInterface → AIChatMessagesList (FlashList)           │
│  → AIMessageBubble (per message)                            │
│  → AIPartRenderer (per part)                                │
│    ├── AITextPart (text parts)                              │
│    ├── AIReasoningPart (reasoning parts)                    │
│    └── Tool parts (type.startsWith('tool-'))                │
│        → tools registry lookup by toolName                  │
│        → AIToolPart (default, shows input/output)           │
│        → [PHASE 1] AIViewRenderer (for render_view tool)   │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Data Flow (Actual)

The complete path from AI backend to rendered UI:

```
AI Backend (FastAPI)
  │
  │  SSE stream — three part types:
  │    { type: "text-delta", textDelta: "Hello" }
  │    { type: "reasoning", ... }
  │    { type: "tool-call", toolCallId: "tc_1", toolName: "render_view", args: {...} }
  │
  ▼
DefaultChatTransport  (useAIChat.ts — wraps SDK's DefaultChatTransport)
  │  • Injects auth headers
  │  • Extracts session ID from response headers (ref-then-state deferral, INV-1)
  │  • Calls config.transport.prepareRequest for body format
  │
  ▼
useChat (Vercel AI SDK v5, @ai-sdk/react)
  │  • Parses SSE stream into UIMessage[]
  │  • Each message has a .parts array
  │  • Emits onFinish when stream ends
  │
  ▼
UIMessage[].parts array — per-message part dispatch
  │
  ▼
AIChatMessagesList  (FlashList — performance-optimized for streaming)
  │
  ▼
AIMessageBubble  (per message — handles avatar layout, role styling)
  │
  ▼
AIPartRenderer  (per part — registry dispatch)
  │
  ├── part.type === 'text'       → AITextPart
  │     • Markdown rendering (injected via AIChatProvider registry)
  │     • Streaming cursor when isStreaming
  │
  ├── part.type === 'reasoning'  → AIReasoningPart
  │     • Collapsible (AICollapsible)
  │     • Markdown rendering
  │
  └── part.type.startsWith('tool-') → tool dispatch
        │
        ├── Read toolName from part (see SPIKE-1 for exact field name)
        ├── Look up toolsRegistry.get(toolName)
        │
        ├── toolName === 'render_view' [PHASE 1]
        │     → AIViewRenderer
        │         → ViewRenderer (renders ViewSchema into form)
        │             → BlockRenderer (maps block.type → component)
        │                 ├── BigTextBlock
        │                 ├── SingleChoiceBlock
        │                 ├── TextInputBlock
        │                 ├── InfoCardBlock
        │                 └── SuccessBlock
        │
        └── No registered renderer → AIToolPart (shows tool name + args + result)
```

---

## 3. Tool Call Pipeline — How render_view Works (Phase 1 Design)

When the AI sends a `render_view` tool call, the following sequence occurs:

```
Step 1: AI generates tool call
  Backend sends SSE chunk with tool-call part:
    { toolName: "render_view", args: { view: ViewSchema }, toolCallId: "tc_abc" }
  [NOTE: Exact field names must be confirmed by SPIKE-1]

Step 2: SDK buffers and delivers to parts array
  UIMessage.parts contains a tool part with type starting with 'tool-'
  Part state transitions: input-streaming → input-available → (no execute) stays here

Step 3: AIPartRenderer dispatches
  isToolPart(part) === true   ← uses startsWith('tool-')
  toolName extracted from part ← confirm field name in SPIKE-1
  toolsRegistry.get('render_view') → AIViewRenderer

Step 4: AIViewRenderer renders the view
  Reads ViewSchema from part.args (or part.input — confirm in SPIKE-1)
  Validates with Zod (defense-in-depth)
  Renders form with block components
  User fills out form and taps "Continue"

Step 5: User submits → tool output added
  addToolOutput({
    tool: 'render_view',
    toolCallId: 'tc_abc',
    output: { action: 'submit', values: { field_id: 'user value', ... } }
  })

Step 6: Auto-continue
  sendAutomaticallyWhen callback detects pending tool result
  useChat triggers next AI generation automatically
  AI receives tool result and continues conversation
```

### Why No `execute` on render_view

`render_view` is a **client-side, human-in-the-loop tool**. The server streams the tool call args to the client without executing anything server-side. The client renders the view, waits for user interaction, then calls `addToolOutput` to send the result back. The AI SDK's `sendAutomaticallyWhen` option handles the automatic re-submission after tool output is added.

---

## 4. Key Files (Actual Paths)

All files exist and are production code as of 2026-03-03.

| File | Purpose |
|------|---------|
| `src/presentation/ai-chat/hooks/ai-assistant/useAIChat.ts` | Core transport hook: wraps `DefaultChatTransport`, manages session ID (ref-then-state INV-1), handles AppState lifecycle, exposes `addToolOutput` |
| `src/presentation/ai-chat/hooks/ai-assistant/useAIChatProvider.tsx` | React context provider: holds `AIChatRegistries` (parts registry, tools registry, markdownRenderer). Context-scoped, not singleton. |
| `src/presentation/ai-chat/parts/ai-assistant/AIPartRenderer.tsx` | Part dispatch: checks parts registry, then `isTextPart`/`isReasoningPart`/`isToolPart`, then tools registry by `toolName`. Wraps custom renderers in error boundaries. |
| `src/domain/types/ai-chat/parts.ts` | Type definitions and type guards: `isToolPart` uses `startsWith('tool-')`. `ToolCallPart` has `toolCallId`, `toolName`, `args?`. `deriveToolDisplayState` handles both SDK and backend formats. |
| `src/domain/types/ai-chat/constants.ts` | `PART_TYPES`, `TOOL_STATES`, `CHAT_STATUS`, `MESSAGE_ROLES` — shared constants used across mobile and web. |
| `src/domain/types/ai-chat/chatConfig.ts` | `ChatConfig` interface split into `TransportConfig`, `ChatBehaviorConfig`, `ChatUIConfig`, `SessionsAdapter`, `PersistenceAdapter` |
| `src/presentation/ai-chat/hooks/ai-assistant/useAIChatSessions.ts` | Session management: hybrid pattern — reactive reads use Redux selectors, imperative commands use adapter or Redux dispatch. |
| `src/presentation/ai-chat/containers/ai-assistant/AIChatInterface.tsx` | Main container: wires `useAIChat`, `useAIChatBot`, `useAIChatSessions`, `useMessageBridge`. Renders `AIChatProvider` > `AIChatMessagesList` > `AIInputField`. |
| `src/presentation/ai-chat/containers/ai-assistant/FloatingAIAssistant.tsx` | App entry point: FAB button + animated panel. Renders `AIChatInterface` when expanded. |

---

## 5. Presentation Modes (Designed, Not Yet Implemented for Views)

Three modes are designed for how `render_view` tool results appear in the UI. These are NOT yet implemented — they are the Phase 1 target.

### Mode A — Inline (Default)

The view renders as a full-width item in the FlashList, interleaved with chat bubbles. This is the default mode and follows the WhatsApp Flows pattern.

```
FlashList (vertical scroll)
├── [AI text bubble] "Welcome! Let's get you set up..."
├── [VIEW — full width]
│   ┌─────────────────────────────────────────────────┐
│   │  Header: "About your business"                  │
│   │  ─────────────────────────────────────────────  │
│   │  ○ E-commerce                                   │
│   │  ○ SaaS                                         │
│   │  ○ Services                                     │
│   │  ─────────────────────────────────────────────  │
│   │  [Continue]  [Skip]                             │
│   └─────────────────────────────────────────────────┘
├── [AI text bubble] "Great choice! Now let's..."
└── [VIEW — next view]
    └── ...
```

Triggered by: `presentation_mode: "inline"` in ViewSchema (or absence of the field — default).

### Mode B — Full-View

The active view takes over the content area. AI text appears in a collapsible MiniChatBar at the top. Previous views remain accessible via chat history in an expandable sheet.

```
┌─────────────────────────────────────────────┐
│  AIChatHeader                                │
├─────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────┐ │
│  │  MiniChatBar (collapsible)              │ │
│  │  "Great choice! Now let's talk..."  [▼] │ │
│  └─────────────────────────────────────────┘ │
│                                             │
│  ACTIVE VIEW (takes over content area)      │
│                                             │
│  Header: "Team size"                        │
│  ○ Just me                                  │
│  ○ 2-10                                     │
│  ○ 11-50                                    │
│  [Continue]                                 │
│                                             │
├─────────────────────────────────────────────┤
│  AIInputField (persistent)                  │
└─────────────────────────────────────────────┘
```

Triggered by: `presentation_mode: "full"` in ViewSchema.

### Mode C — Simulated External (Future)

Appears as a separate screen via React Navigation overlay/modal, simulating an external app or deep-linked screen. Not planned for Phase 1.

---

## 6. Component Dependency Graph

How the pieces connect in the currently implemented system:

```
FloatingAIAssistant
└── AIChatInterface
    ├── AIChatProvider (context: registries, i18n)
    │   └── provides: partsRegistry, toolsRegistry, markdownRenderer
    │
    ├── useAIChat(chatwootChatConfig, options)
    │   ├── DefaultChatTransport (AI SDK)
    │   ├── useChat (Vercel AI SDK v5)
    │   └── returns: messages, sendMessage, stop, addToolOutput, sessionId
    │
    ├── useAIChatBot(agentBotId, accountId)
    │   └── returns: selectedBotId, selectedBot
    │
    ├── useAIChatSessions(adapter, selectedBotId, options)
    │   └── returns: sessions, showSessions, handleSelectSession, handleNewConversation
    │
    ├── useMessageBridge(options)
    │   └── merges backend messages with SDK messages
    │
    ├── AIChatHeader
    │
    ├── AIChatMessagesView (React.memo)
    │   ├── useAIChatScroll(activeSessionId, isLoading, msgLength, listDataLen)
    │   └── AIChatMessagesList (FlashList)
    │       └── AIMessageBubble (per message)
    │           └── AIPartRenderer (per part)
    │               ├── AITextPart
    │               ├── AIReasoningPart
    │               │   └── AICollapsible
    │               └── AIToolPart (current default for tool parts)
    │                   [PHASE 1: replace with AIViewRenderer for render_view]
    │
    ├── AIInputField
    └── AIChatSessionPanel
```

---

## 7. What's NOT in This System

### Legacy onboarding module — completely separate

`src/modules/onboarding/` is the old static wizard-based onboarding. It is a **completely separate system** with its own screens, DI/tsyringe, and Redux slice. It shares no code with the AI chat system. It is being deprecated in favor of the AI-driven approach described in this document.

There is no dependency between `src/modules/onboarding/` and `src/presentation/ai-chat/`.

### No assistant-ui

The codebase contains **zero imports from `@assistant-ui/*`**. None of these exist in the system:
- `LocalRuntime`, `AssistantProvider`, `AssistantRuntimeProvider`
- `makeAssistantToolUI`, `humanToolNames`
- `useAuiState`, `MessageByIndexProvider`, `MessageContent`
- `@assistant-ui/react-native`, `@assistant-ui/core`, `@assistant-ui/store`

assistant-ui was evaluated and rejected (Decision 1). The architecture docs in Phase 2 (research files) describe it in detail for historical context.

---

## 8. Rejected Approaches

### Decision 1: assistant-ui rejected

assistant-ui was the first candidate for managing the AI chat runtime. Key rejection reasons:
- No React Native support (web-only)
- Adds Zustand as a dependency alongside our existing Redux store
- Pre-1.0 API surface with frequent breaking changes
- Our existing code already handles streaming, message parts, and tool calls — wrapping it in assistant-ui would add complexity, not reduce it

**What we kept from the evaluation**: The conceptual patterns — tool registration API, unified thread (chat + views in one stream), human-in-the-loop tool pattern. These patterns were re-implemented directly on our Vercel AI SDK v5 stack.

### Decision 2: Single render_view tool (not one tool per block type)

Using separate tools per block type (e.g., `render_single_choice`, `render_text_input`) was considered and rejected. A view is a composite layout — the AI needs to compose multiple blocks in one atomic call. Multi-tool coordination is fragile with current LLMs.

### Decision 3: Context-scoped registry (not module-level singleton)

A module-level singleton registry was the initial design (`partRegistry.register('text', AITextPart)` at import time). This was replaced with a context-scoped registry via `AIChatProvider`. See `proposal-package-extraction-review.md` C1 for the full rationale.

---

## 9. Phase 1 Prerequisites

Before writing any Phase 1 (render_view) code, two spikes must be completed:

### SPIKE-1: Verify tool part runtime shape

**File**: `spike-1-tool-part-shape.md`

The `AIPartRenderer` dispatches tool parts by reading `part.toolName`. But the exact runtime shape of a no-execute tool call part in Vercel AI SDK v5's `UIMessage` must be confirmed before building the `render_view` dispatch path. Specifically:
- Is tool name in `part.toolName` or encoded in `part.type` (e.g., `"tool-render_view"`)?
- Are tool arguments in `part.args` or `part.input`?
- What is the exact key for the tool call ID?
- What does the part look like during streaming (args incomplete) vs after (args complete)?

**Why this blocks Phase 1**: `AIPartRenderer` step 4 already reads `part.toolName` for the tools registry lookup (line 154). If the actual runtime shape puts the tool name elsewhere, the entire tool dispatch will silently fail. `addToolOutput` also requires the correct `toolCallId` field name.

### SPIKE-2: Validate ViewSchema against OpenAI strict mode

**File**: `spike-2-openai-strict-schema.md`

The `render_view` tool will use `providerOptions: { openai: { strict: true } }`. The proposed ViewSchema uses a discriminated union of 11 block types, each with optional fields. This may hit OpenAI's JSON Schema complexity limits or fail due to optional field handling in strict mode.

**Why this blocks Phase 1**: If the full schema fails, we need to know before implementing `ViewRenderer` whether to use 3 blocks, 5 blocks, or 11 blocks. The block component implementations depend on which schema passes.

---

## Reference Documents

For deep dives into specific areas:

| Document | What It Covers |
|----------|---------------|
| `architecture-design.md` | Full architecture v2: all Zod schemas (with `render_slide` naming — update to `render_view`), tool definitions, state machine, rollback flow, static/dynamic steps, component tree, data flows |
| `requirements.md` | Vision, core concepts, functional/non-functional requirements (generalized from onboarding 2026-03-03) |
| `proposals/proposal-architecture-review.md` | Critical findings on tool part types (C1), OpenAI strict mode (C2), and other implementation issues |
| `proposals/proposal-package-extraction-review.md` | Singleton registry problem (C1), ChatConfig split (I3), versioning strategy |
| `proposals/proposal-rn-mobile-improvements.md` | Current RN code quality issues and extraction preparation |
| `spike-1-tool-part-shape.md` | Spike plan for verifying tool part shape |
| `spike-2-openai-strict-schema.md` | Spike plan for validating ViewSchema against OpenAI strict mode |
