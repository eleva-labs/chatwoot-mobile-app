# Research 1b: Generative UI Patterns for AI-Driven Onboarding

**Date**: 2026-02-27
**Scope**: How AI/LLM systems produce dynamic user interfaces — patterns, frameworks, protocols, and cross-platform strategies.

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Pattern 1: Vercel AI SDK — Tool-Based Generative UI (AI SDK UI)](#pattern-1-vercel-ai-sdk--tool-based-generative-ui)
3. [Pattern 2: Vercel AI SDK — RSC Streaming UI (Deprecated)](#pattern-2-vercel-ai-sdk--rsc-streaming-ui)
4. [Pattern 3: Vercel AI SDK — Custom Data Parts](#pattern-3-vercel-ai-sdk--custom-data-parts)
5. [Pattern 4: assistant-ui — React Native Generative UI](#pattern-4-assistant-ui--react-native-generative-ui)
6. [Pattern 5: CopilotKit — Static Generative UI via AG-UI](#pattern-5-copilotkit--static-generative-ui-via-ag-ui)
7. [Pattern 6: CopilotKit — Declarative Generative UI (A2UI / Open-JSON-UI)](#pattern-6-copilotkit--declarative-generative-ui)
8. [Pattern 7: OpenAI Function Calling — Schema-Driven UI](#pattern-7-openai-function-calling--schema-driven-ui)
9. [Pattern 8: Custom Tool-Call-to-Schema Pattern (Our Approach)](#pattern-8-custom-tool-call-to-schema-pattern)
10. [Cross-Platform Strategy Analysis](#cross-platform-strategy-analysis)
11. [Recommendation for Our Use Case](#recommendation-for-our-use-case)
12. [References](#references)

---

## Executive Summary

Generative UI is the pattern of having an AI/LLM produce user interfaces dynamically rather than hardcoding them. After extensive research across the Vercel AI SDK, CopilotKit/AG-UI, assistant-ui, OpenAI, and LangChain ecosystems, three dominant paradigms emerge:

| Type | How It Works | React Native? | Our Fit |
|------|-------------|---------------|---------|
| **Static GenUI** (Tool→Component mapping) | LLM calls a tool; client maps tool name to a pre-built component | Yes | **Best fit** |
| **Declarative GenUI** (Schema→Renderer) | LLM outputs a structured JSON schema; client interprets and renders | Yes | **Best fit** |
| **Open-Ended GenUI** (HTML/iframe) | LLM generates arbitrary HTML/markup | No (web only) | Not applicable |

**Key finding**: The **tool-call-to-component** pattern (used by Vercel AI SDK v5, assistant-ui, and CopilotKit) is the dominant production pattern and maps directly to our architecture. The LLM calls a tool like `render_slide`, the tool's structured output (our slide schema) gets streamed to the client, and the client renders it using pre-built React Native components. This works today with our existing Vercel AI SDK v5 infrastructure.

**Secondary finding**: The **custom data parts** pattern in Vercel AI SDK v5 (`createUIMessageStream` + typed data parts) offers a cleaner alternative for streaming structured UI alongside text, with built-in reconciliation (update-in-place) support.

---

## Pattern 1: Vercel AI SDK — Tool-Based Generative UI

### Source
- [Vercel AI SDK: Generative User Interfaces](https://sdk.vercel.ai/docs/ai-sdk-ui/generative-user-interfaces)
- [Vercel AI SDK: Chatbot Tool Usage](https://sdk.vercel.ai/docs/ai-sdk-ui/chatbot-with-tool-calling)

### How It Works

1. Define **tools** with Zod schemas on the server (in `streamText`)
2. LLM decides when to call a tool based on conversation context
3. Tool executes server-side and returns structured data
4. Client receives tool call parts in the message's `parts` array
5. Client maps tool part types (`tool-{toolName}`) to React components
6. Each tool part has lifecycle states: `input-streaming` → `input-available` → `output-available` | `output-error`

```typescript
// Server: Define tool
tools: {
  render_slide: {
    description: 'Render an onboarding slide with structured UI blocks',
    inputSchema: z.object({
      header: z.string(),
      subheader: z.string().optional(),
      blocks: z.array(blockSchema),
      actions: actionsSchema.optional(),
    }),
    execute: async (slideData) => {
      // Validate and return — the tool output IS the UI schema
      return slideData;
    },
  },
}

// Client: Render tool parts
message.parts.map(part => {
  if (part.type === 'tool-render_slide') {
    switch (part.state) {
      case 'input-streaming':
        return <SlideLoading partialInput={part.input} />;
      case 'input-available':
        return <SlideLoading />;
      case 'output-available':
        return <OnboardingSlide schema={part.output} />;
    }
  }
});
```

### Key Features
- **Tool call streaming**: Partial tool inputs stream in real-time (enabled by default in v5)
- **Typed tool parts**: `tool-{toolName}` gives type-safe access to input/output
- **Client-side tools**: Tools without `execute` function render UI that collects user input; `addToolOutput` sends results back
- **Multi-step calls**: `stopWhen: stepCountIs(5)` enables agentic loops
- **Tool approval**: `needsApproval: true` for human-in-the-loop confirmation

### Platform Compatibility
- **React (Next.js)**: Full support, production-ready (used by v0.dev)
- **React Native**: `useChat` hook works via `@ai-sdk/react` — it's a pure React hook with no DOM/RSC dependency. Uses HTTP fetch for transport. **Confirmed compatible.**
- **Transport**: `DefaultChatTransport` uses standard HTTP POST + SSE streaming

### Schema/Protocol Format
- Tool input/output schemas defined with Zod
- Wire format: UI Message Stream Protocol (SSE with typed chunks)
- Tool parts carry typed `input` and `output` objects

### Streaming Compatibility
- Full streaming support — tool call inputs stream incrementally
- Text and tool parts interleave naturally in the `parts` array
- `step-start` parts mark boundaries between multi-step iterations

### Maturity
- **Production-ready** — Vercel explicitly recommends AI SDK UI over RSC for production
- Used in v0.dev (Vercel's AI coding product)
- AI SDK v5 is the current stable release

### Mapping to Our Use Case
This is the **primary recommended pattern**. Our `render_slide` tool maps exactly to this:
- LLM calls `render_slide` with our slide JSON schema as input
- Tool executes (validates schema, maybe enriches data)
- Client receives typed tool part and renders `<OnboardingSlide>`
- User interactions (choice selection, text input) feed back as messages
- Free-form chat input works alongside — `useChat` handles both

---

## Pattern 2: Vercel AI SDK — RSC Streaming UI (Deprecated)

### Source
- [Vercel AI SDK RSC: Generative UI](https://sdk.vercel.ai/docs/ai-sdk-rsc/generative-ui)
- [Migration Guide: RSC to UI](https://sdk.vercel.ai/docs/ai-sdk-rsc/migrating-to-ui)

### How It Works
- `streamUI` / `createStreamableUI` stream actual React Server Components from server to client
- Server renders JSX and sends the serialized component tree over the wire
- Client hydrates and displays the streamed components

### Why It's Not Applicable
- **Requires React Server Components** — not available in React Native
- **Marked experimental** — Vercel explicitly warns against production use
- **Known bugs**: Component flickering on `.done()`, crashes with many suspense boundaries, quadratic data transfer
- **Cannot abort streams** via server actions
- **Vercel's own recommendation**: Migrate to AI SDK UI (Pattern 1)

### Platform Compatibility
- Next.js App Router only
- **NOT compatible with React Native**

### Maturity
- Experimental, deprecated in favor of AI SDK UI
- Will not receive further investment

### Mapping to Our Use Case
**Not applicable** — React Native cannot use RSC. However, the _conceptual_ model (LLM generates UI that streams to client) is exactly what we're building, just with JSON schemas instead of serialized React components.

---

## Pattern 3: Vercel AI SDK — Custom Data Parts

### Source
- [Vercel AI SDK: Streaming Custom Data](https://sdk.vercel.ai/docs/ai-sdk-ui/streaming-data)

### How It Works

A newer AI SDK v5 pattern where custom typed data parts are streamed alongside text and tool calls:

1. Define custom data part types using TypeScript generics on `UIMessage`
2. Server uses `createUIMessageStream` + `writer.write()` to stream custom data
3. Client receives data parts in the `message.parts` array alongside text parts
4. **Reconciliation**: Writing to the same `id` updates existing parts in-place

```typescript
// Types: Define custom message type
type MyUIMessage = UIMessage<never, {
  slide: {
    header: string;
    blocks: Block[];
    status: 'loading' | 'ready';
  };
  progress: {
    step: number;
    total: number;
  };
}>;

// Server: Stream data parts
writer.write({
  type: 'data-slide',
  id: 'slide-1',
  data: { header: 'Loading...', blocks: [], status: 'loading' },
});

// Later, update the same part:
writer.write({
  type: 'data-slide',
  id: 'slide-1',  // Same ID = reconciliation/update
  data: { header: 'Choose your business', blocks: [...], status: 'ready' },
});

// Client: Render data parts
message.parts
  .filter(part => part.type === 'data-slide')
  .map(part => <OnboardingSlide data={part.data} />);
```

### Key Features
- **Type-safe data streaming**: Custom data part schemas defined with TypeScript
- **Reconciliation**: Same `id` → update in place (progressive loading, live updates)
- **Transient parts**: `transient: true` — sent to client but NOT stored in message history (useful for status notifications)
- **Source parts**: Built-in support for RAG source attribution
- **Independent of tool calls**: Data parts stream alongside text without requiring the LLM to call a tool

### Platform Compatibility
- **React Native**: Yes — `useChat` hook + `message.parts` work identically
- **React Web**: Yes
- **Any SSE-capable client**: The stream protocol is standard SSE

### Schema/Protocol Format
- Custom TypeScript generics on `UIMessage`
- SSE-based wire format (UI Message Stream Protocol)
- No Zod schema required (unlike tools) — just TypeScript types

### Streaming Compatibility
- Full streaming — data parts can be sent at any point during generation
- Reconciliation enables progressive loading (skeleton → real data)
- Can interleave with text streaming

### Maturity
- Production-ready (part of AI SDK v5 stable)
- Less documented/adopted than the tool-call pattern

### Mapping to Our Use Case
**Strong alternative to Pattern 1**. Instead of the LLM calling a `render_slide` tool, the server-side logic could directly stream slide data parts:

- **Pro**: More control — server-side orchestration can decide what slides to show without depending on LLM tool calls
- **Pro**: Reconciliation enables progressive slide building (stream partial slide, then complete)
- **Pro**: Transient parts for status updates ("Connecting your account...")
- **Con**: Less "agentic" — the LLM doesn't autonomously decide to render UI
- **Con**: Requires custom server-side orchestration instead of leveraging LLM's tool-calling ability

**Verdict**: Best used as a complement to Pattern 1. Use tools for LLM-driven UI decisions, data parts for server-driven UI updates (loading states, progress indicators).

---

## Pattern 4: assistant-ui — React Native Generative UI

### Source
- [assistant-ui: React Native Getting Started](https://www.assistant-ui.com/docs/react-native)
- [assistant-ui: Generative UI (Tool UI)](https://www.assistant-ui.com/docs/guides/tool-ui)
- [assistant-ui: React Native Hooks](https://www.assistant-ui.com/docs/react-native/hooks)

### How It Works

`assistant-ui` is a React component library for AI chat interfaces with explicit React Native support via `@assistant-ui/react-native`. Its generative UI pattern:

1. Define tools on the backend (any framework — Vercel AI SDK, LangGraph, Mastra)
2. Register **Tool UI renderers** on the client using `makeAssistantToolUI` or `useAssistantToolUI`
3. When a tool is called, the registered renderer displays custom UI
4. Renderers receive typed `args`, `result`, `status`, and interactive callbacks (`addResult`, `resume`)

```typescript
// React Native: Register tool UI
import { useAssistantToolUI } from "@assistant-ui/react-native";

useAssistantToolUI({
  toolName: "render_slide",
  render: ({ args, result, status }) => (
    <View>
      {status?.type === "running"
        ? <Text>Loading slide...</Text>
        : <OnboardingSlide schema={result} />}
    </View>
  ),
});

// Or declarative component approach:
const SlideToolUI = makeAssistantTool({
  toolName: "render_slide",
  description: "Render an onboarding slide",
  parameters: slideSchema,
  execute: async (slideData) => slideData,
  render: ({ args, result }) => <OnboardingSlide schema={result} />,
});
```

### Key Features
- **Shared core with web**: `@assistant-ui/core` provides identical runtime, state management, and type system
- **React Native primitives**: Built on `View`, `TextInput`, `FlatList`, `Pressable`
- **Tool system**: `useAssistantTool`, `makeAssistantTool`, `useAssistantToolUI` for registering tools with UI
- **Human-in-the-loop**: `human()` / `resume()` pattern for tools that need user approval
- **Local runtime**: `useLocalRuntime` with pluggable `ChatModelAdapter` — can work without a server
- **Thread management**: Multi-thread support with persistence via AsyncStorage
- **Selector-based re-renders**: `useThread(s => s.isRunning)` — fine-grained, avoids unnecessary renders

### Platform Compatibility
- **React Native (Expo)**: First-class support with `@assistant-ui/react-native`
- **React Web**: Full support via `@assistant-ui/react`
- **Shared runtime**: `@assistant-ui/core` is platform-agnostic
- **Backend agnostic**: Works with Vercel AI SDK, LangGraph, Mastra, custom backends

### Schema/Protocol Format
- Tool schemas use Zod or JSON Schema
- Runtime uses Vercel AI SDK's data stream protocol (or custom transports)
- Tool UIs are component-based (not schema-based) — you write React/React Native components

### Streaming Compatibility
- Full streaming via data stream protocol
- Partial results streaming in tool UIs
- Field-level validation with `useToolArgsFieldStatus`

### Maturity
- Active open-source project (assistant-ui.com)
- React Native support is newer but functional
- Growing community, backed by commercial cloud offering
- v0.11-0.12 — evolving API surface

### Mapping to Our Use Case
**Highly relevant** — provides the exact infrastructure we need:

- React Native tool UI renderers for our slide types
- Shared runtime core means web support comes nearly free
- Thread management and persistence built-in
- `useAssistantTool` pattern maps directly to our `render_slide`, `render_choice`, etc.

**Consideration**: Adopting assistant-ui means replacing our current custom AI chat UI with their component system. This is a significant dependency decision. We should evaluate whether to:
1. **Adopt assistant-ui** as our chat/generative UI framework (less custom code, more dependency)
2. **Use the same pattern** but implement it ourselves with Vercel AI SDK directly (more control, more work)

---

## Pattern 5: CopilotKit — Static Generative UI via AG-UI

### Source
- [CopilotKit: Generative UI Patterns](https://www.copilotkit.ai/generative-ui)
- [CopilotKit: AG-UI Protocol](https://www.copilotkit.ai/ag-ui)

### How It Works

CopilotKit classifies generative UI into three types. Their **Static GenUI** pattern:

1. Agent defines tools (using any framework — LangGraph, CrewAI, Vercel AI SDK)
2. AG-UI protocol transports tool calls from agent to frontend
3. Frontend has pre-built React components mapped to each tool name
4. Agent decides which tool to call; frontend renders the corresponding component

AG-UI (Agent-User Interaction) is a protocol for bi-directional communication between agentic backends and user-facing apps. It handles:
- Shared state synchronization
- Tool-based generative UI
- Human-in-the-loop interactions
- Predictive updates
- Subgraph support

### Key Features
- **Framework agnostic**: Works with LangGraph, CrewAI, Google ADK, AWS Strands, Pydantic AI, Mastra
- **Bi-directional**: Not just agent→UI, but UI→agent state sync
- **Enterprise features**: Guardrails, analytics, self-improvement via RLHF
- **React & Angular**: First-party clients (no React Native client yet)

### Platform Compatibility
- **React Web**: Full support
- **Angular**: Full support
- **React Native**: No first-party client — community clients emerging
- **Mobile**: Not yet supported natively

### Schema/Protocol Format
- AG-UI protocol (event-based, SSE streaming)
- Tool definitions use standard function schemas
- A2UI (Google's declarative GenUI spec) supported as a generative UI format

### Streaming Compatibility
- Full streaming via AG-UI event stream
- Supports text streaming, tool calls, state updates

### Maturity
- **Production-ready** for web — trusted by Fortune 500 companies
- 22k+ GitHub stars, 1M+ weekly downloads
- AG-UI protocol is open-source and framework-neutral
- React Native support is not mature

### Mapping to Our Use Case
CopilotKit's **conceptual framework** (Static vs Declarative vs Open-Ended GenUI) is highly useful for understanding our design space. Their **Static GenUI** pattern is essentially what we're building:

- Agent calls `render_slide` tool → Frontend renders `<OnboardingSlide>` component
- This is the same pattern as Vercel AI SDK tool-based generative UI

**However**, CopilotKit itself is not directly usable because:
1. No React Native support
2. Heavy framework — overkill for our focused onboarding use case
3. AG-UI protocol adds complexity without clear benefit over Vercel AI SDK's stream protocol

**Takeaway**: Use CopilotKit's taxonomy (Static/Declarative/Open-Ended) for our architecture documentation, but implement using Vercel AI SDK directly.

---

## Pattern 6: CopilotKit — Declarative Generative UI

### Source
- [CopilotKit: A2UI and Declarative GenUI](https://www.copilotkit.ai/ag-ui-and-a2ui)
- [CopilotKit: Generative UI Types](https://www.copilotkit.ai/generative-ui)

### How It Works

**Declarative GenUI** is a middle ground between static components and open-ended HTML:

1. Agent outputs a **structured specification** (JSON schema defining cards, lists, forms, widgets)
2. Frontend has a **renderer** that interprets the schema and renders appropriate components
3. The schema vocabulary is richer than static tool mapping but constrained (not arbitrary HTML)

Three emerging specs in this space:

| Spec | Origin | Format | Status |
|------|--------|--------|--------|
| **A2UI** | Google | JSONL-based, streaming, platform-agnostic | Launched 2025, CopilotKit is launch partner |
| **Open-JSON-UI** | OpenAI | Open standardization of OpenAI's internal schema | Early/emerging |
| **MCP-UI** | Microsoft + Shopify | iframe-based, extends MCP for user-facing experiences | Early/emerging |

### Key Features
- **Cross-platform rendering**: Same schema → different renderers (React, React Native, desktop)
- **Agent flexibility**: Agent can compose novel UI combinations without pre-built components for each
- **Constrained creativity**: Schema defines what's possible, preventing arbitrary/unsafe output
- **Streaming support**: A2UI is JSONL-based with built-in streaming semantics

### Platform Compatibility
- **Conceptually cross-platform** — the whole point is platform-agnostic schemas
- **React Native**: Requires building a schema renderer (no off-the-shelf library)
- **React Web**: A2UI has web renderers emerging

### Mapping to Our Use Case
**This is conceptually closest to our requirements**. Our slide JSON schema IS a declarative GenUI spec:

```json
{
  "type": "slide",
  "header": "Let's set up your workspace",
  "blocks": [
    { "type": "single-choice", "id": "business_type", "options": [...] }
  ],
  "actions": { "primary": { "label": "Continue" } }
}
```

We are essentially building a **custom declarative GenUI specification** with a **React Native renderer**.

**Decision point**: Should we adopt an existing spec (A2UI) or define our own?
- **Our own**: More control, simpler, exactly matches our needs
- **A2UI**: Broader ecosystem compatibility, but more complex and unproven in RN
- **Recommendation**: Define our own schema (as outlined in requirements.md), but structure it so migration to A2UI is possible later.

---

## Pattern 7: OpenAI Function Calling — Schema-Driven UI

### Source
- [OpenAI: Function Calling Guide](https://platform.openai.com/docs/guides/function-calling)

### How It Works

OpenAI's function calling (tool use) provides the foundation that all generative UI patterns build on:

1. Define functions with JSON Schema parameters
2. LLM decides when to call functions based on conversation context
3. Client executes the function and returns results
4. LLM incorporates results into its response

### Key Concepts for UI Generation
- **`strict: true`**: Guarantees the LLM output exactly matches the JSON Schema (no hallucinated fields)
- **Parallel tool calls**: LLM can call multiple tools simultaneously (e.g., render slide + show progress)
- **Tool choice control**: `tool_choice: "required"` forces tool use; `tool_choice: { name: "render_slide" }` forces a specific tool
- **Structured Outputs**: Related feature — guarantees JSON conformance for any response, not just tool calls

### Why Strict Mode Matters for Us
With `strict: true`, the LLM **cannot** produce invalid slide schemas. This eliminates the need for extensive client-side validation/fallbacks:

```json
{
  "type": "function",
  "name": "render_slide",
  "strict": true,
  "parameters": {
    "type": "object",
    "properties": {
      "header": { "type": "string" },
      "blocks": {
        "type": "array",
        "items": { "$ref": "#/$defs/block" }
      }
    },
    "required": ["header", "blocks"],
    "additionalProperties": false
  }
}
```

### Platform Compatibility
- **Universal**: Function calling is a backend API pattern — works with any frontend
- Works with Vercel AI SDK's `streamText` tool definitions

### Mapping to Our Use Case
This is the **backend foundation** of our approach:
- Our `render_slide` tool uses OpenAI/Anthropic function calling
- Strict mode ensures valid schemas
- Parallel calls enable simultaneous slide + progress rendering
- The Vercel AI SDK wraps this with `streamText` + Zod schemas

---

## Pattern 8: Custom Tool-Call-to-Schema Pattern (Our Approach)

### Synthesis: Our Recommended Architecture

Based on all research, the pattern that best fits our requirements:

```
┌─────────────────────────────────────────────────────────────┐
│                       AI Backend                             │
│                                                              │
│  System Prompt (onboarding flow definition)                  │
│  ↓                                                           │
│  LLM (Claude/GPT) with tools:                               │
│    • render_slide(schema)  — structured UI                   │
│    • show_progress(step, total) — progress indicator         │
│    • mark_step_complete(step_id, data) — persist data        │
│    • request_input(field) — free-form input prompt           │
│  ↓                                                           │
│  streamText → toUIMessageStreamResponse()                    │
└─────────────────────┬───────────────────────────────────────┘
                      │ SSE Stream (UI Message Protocol)
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                    React Native Client                        │
│                                                              │
│  useChat() hook                                              │
│  ↓                                                           │
│  message.parts.map(part => {                                 │
│    'text'              → <StreamingText />                   │
│    'tool-render_slide' → <OnboardingSlide schema={output} /> │
│    'tool-show_progress'→ <ProgressBar step={output.step} />  │
│    'reasoning'         → <ThinkingIndicator />               │
│  })                                                          │
│  ↓                                                           │
│  <OnboardingSlide> renders blocks:                           │
│    'single-choice' → <ChoiceList />                          │
│    'text-input'    → <TextInput />                           │
│    'big-text'      → <BigText />                             │
│    'confirmation'  → <ConfirmationCard />                    │
│  ↓                                                           │
│  User interactions → sendMessage() or addToolOutput()        │
└─────────────────────────────────────────────────────────────┘
```

### Why This Works

1. **Leverages existing infrastructure**: Our app already uses Vercel AI SDK v5 `useChat` with `message.parts` rendering
2. **Platform-portable**: `useChat` works identically in React Native and React Web
3. **Type-safe**: Zod schemas on server + TypeScript tool part types on client
4. **Streaming**: Tool call inputs stream incrementally; text streams alongside
5. **Agentic**: LLM decides what to render, when, and how — not hardcoded step sequences
6. **Schema-driven**: The slide schema is the contract; renderers are platform-specific
7. **Fallback-friendly**: If tool call fails or schema is invalid, fall back to text chat

### Schema Layer (Shared)
```typescript
// Shared between platforms
const slideSchema = z.object({
  type: z.literal('slide'),
  header: z.string(),
  subheader: z.string().optional(),
  blocks: z.array(blockSchema),
  actions: actionsSchema.optional(),
});

const blockSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('single-choice'), id: z.string(), options: z.array(optionSchema) }),
  z.object({ type: z.literal('text-input'), id: z.string(), placeholder: z.string().optional() }),
  z.object({ type: z.literal('big-text'), text: z.string() }),
  // ... other block types
]);
```

### Rendering Layer (Platform-Specific)
```typescript
// React Native
const BlockRenderer = ({ block }: { block: Block }) => {
  switch (block.type) {
    case 'single-choice': return <RNChoiceList options={block.options} />;
    case 'text-input': return <RNTextInput placeholder={block.placeholder} />;
    case 'big-text': return <RNBigText>{block.text}</RNBigText>;
  }
};

// React Web (future)
const BlockRenderer = ({ block }: { block: Block }) => {
  switch (block.type) {
    case 'single-choice': return <WebChoiceList options={block.options} />;
    // Same schema, different components
  }
};
```

---

## Cross-Platform Strategy Analysis

### What Can Be Shared

| Layer | Shareable? | How |
|-------|-----------|-----|
| **Slide schema (Zod)** | Yes | Shared TypeScript package |
| **Tool definitions** | Yes | Server-side, platform-independent |
| **useChat hook logic** | Yes | `@ai-sdk/react` works in both RN and Web |
| **Message part routing** | Mostly | Same `parts.map()` logic, different component imports |
| **State management** | Yes | Redux slices, Zod validation |
| **Block renderers** | No | Platform-specific (View vs div) |
| **Animations** | No | Platform-specific (Reanimated vs CSS) |
| **Styling** | Partially | twrnc (RN) vs Tailwind (Web) — similar API |

### Existing Cross-Platform Approaches

1. **assistant-ui**: `@assistant-ui/core` (shared) + `@assistant-ui/react` (web) + `@assistant-ui/react-native` (mobile). Most mature cross-platform AI chat solution.

2. **React Native Web**: Could theoretically use RN components on web, but adds complexity and is not recommended for our case.

3. **Custom schema + dual renderers**: Define a platform-agnostic schema, build renderers per platform. This is what we're proposing.

### Recommendation
Use approach #3 (custom schema + dual renderers) because:
- Maximum control over the schema vocabulary
- No dependency on third-party component libraries for our core onboarding flow
- Schema is the contract — renderers are implementation details
- Can evaluate assistant-ui later if the chat UI layer needs standardization

---

## Recommendation for Our Use Case

### Primary Pattern: Tool-Based Generative UI (Vercel AI SDK v5)

**Use `streamText` + tools + `useChat` + `message.parts`** — this is the most mature, production-proven pattern that works with React Native today.

### Implementation Strategy

1. **Define slide tools** with Zod schemas in the AI backend (`render_slide`, `render_choice`, `show_progress`)
2. **Stream via `toUIMessageStreamResponse()`** — standard Vercel AI SDK streaming
3. **Render in React Native** by extending our existing `message.parts` rendering in `AIMessageBubble` / `AIChatMessagesList`
4. **Use custom data parts** for server-driven updates (loading states, progress) that don't need LLM decision-making
5. **User input flows back** via `sendMessage()` (free-form text) or `addToolOutput()` (structured selections)

### What We Don't Need
- **AI SDK RSC** — Not compatible with React Native, deprecated
- **CopilotKit/AG-UI** — No React Native support, overkill for our use case
- **A2UI/Open-JSON-UI** — Too early, unproven in RN, unnecessary abstraction
- **assistant-ui** — Worth evaluating for chat UI, but not required for generative UI

### Risk Mitigation
- **Invalid schemas**: Use `strict: true` in tool definitions (OpenAI) + Zod validation on client
- **LLM not calling tools**: Use `tool_choice: "required"` or strong system prompt instructions
- **Streaming interruptions**: Vercel AI SDK handles reconnection; persist partial state in Redux
- **Cross-platform divergence**: Schema is the contract — validate on both platforms

---

## References

1. Vercel AI SDK v5 — Generative UI: https://sdk.vercel.ai/docs/ai-sdk-ui/generative-user-interfaces
2. Vercel AI SDK v5 — Tool Calling: https://sdk.vercel.ai/docs/ai-sdk-ui/chatbot-with-tool-calling
3. Vercel AI SDK v5 — Streaming Custom Data: https://sdk.vercel.ai/docs/ai-sdk-ui/streaming-data
4. Vercel AI SDK RSC — Migration Guide: https://sdk.vercel.ai/docs/ai-sdk-rsc/migrating-to-ui
5. OpenAI — Function Calling: https://platform.openai.com/docs/guides/function-calling
6. CopilotKit — Generative UI Taxonomy: https://www.copilotkit.ai/generative-ui
7. CopilotKit — AG-UI Protocol: https://www.copilotkit.ai/ag-ui
8. CopilotKit — A2UI and Declarative GenUI: https://www.copilotkit.ai/ag-ui-and-a2ui
9. assistant-ui — React Native: https://www.assistant-ui.com/docs/react-native
10. assistant-ui — Tool UI (Generative UI): https://www.assistant-ui.com/docs/guides/tool-ui
11. assistant-ui — React Native Hooks: https://www.assistant-ui.com/docs/react-native/hooks
12. LangChain JS — Agent Framework: https://js.langchain.com/docs/
