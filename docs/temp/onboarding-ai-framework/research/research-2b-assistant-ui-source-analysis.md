# Research 2b: assistant-ui Source Code Deep Analysis

**Date**: 2026-02-28
**Source**: `https://github.com/Yonom/assistant-ui` (cloned to `/tmp/assistant-ui-analysis`)
**Focus**: Can assistant-ui support full-screen slide rendering? How extensible is the component/rendering pipeline?

---

## 1. Repository Structure Overview

The repo is a monorepo with 28 packages under `packages/`:

| Package | Purpose |
|---------|---------|
| `core/` | Platform-agnostic runtime, store, types, and React primitives |
| `react/` | Web-specific primitives (Radix-based, DOM) |
| `react-native/` | React Native primitives (View/FlatList-based) |
| `store/` | Zustand-based store infrastructure (`useAui`, `useAuiState`, `AuiProvider`) |
| `tap/` | Reactive primitives (resources, effects, state) for store clients |
| `react-ai-sdk/` | Vercel AI SDK integration |
| `react-langgraph/` | LangGraph integration |
| `assistant-stream/` | Streaming protocol |
| `ui/` | Pre-built UI components (web only) |
| `react-markdown/` | Markdown renderer |
| `react-native/` | **Our primary interest** |

### Architecture Layers

```
┌─────────────────────────────────┐
│  UI Layer (react/ or react-native/) │  ← Platform-specific primitives
├─────────────────────────────────┤
│  Core React (core/src/react/)       │  ← Shared React logic (MessageParts, ThreadMessages, tools)
├─────────────────────────────────┤
│  Store (store/)                     │  ← Zustand-based state management
├─────────────────────────────────┤
│  Runtime (core/src/runtime/)        │  ← Runtime interfaces, base classes
├─────────────────────────────────┤
│  Runtimes (core/src/runtimes/)      │  ← LocalRuntime, ExternalStoreRuntime
└─────────────────────────────────┘
```

---

## 2. React Native Package Analysis

### 2.1 Package Structure

```
packages/react-native/src/
├── index.ts                    # Re-exports everything
├── primitives/
│   ├── thread/
│   │   ├── ThreadRoot.tsx       # Just a <View> wrapper
│   │   ├── ThreadMessages.tsx   # FlatList-based message list
│   │   ├── ThreadEmpty.tsx      # Conditional render when no messages
│   │   ├── ThreadIf.tsx         # Conditional render based on thread state
│   │   └── ThreadSuggestion.tsx
│   ├── message/
│   │   ├── MessageRoot.tsx      # Just a <View> wrapper
│   │   ├── MessageContent.tsx   # Switch-based part renderer
│   │   ├── MessageParts.tsx     # Re-exports core MessagePrimitiveParts with RN defaults
│   │   ├── MessageIf.tsx        # Conditional render based on message role/status
│   │   └── MessageAttachments.tsx
│   ├── composer/
│   ├── actionBar/
│   └── ...
├── primitive-hooks/             # Hooks for accessing thread/message state
├── runtimes/
│   ├── useLocalRuntime.ts       # Creates LocalRuntimeCore
│   └── useRemoteThreadListRuntime.ts
├── context/
│   ├── AssistantContext.tsx      # AssistantProvider wrapping AssistantProviderBase
│   └── providers/
├── model-context/               # Re-exports core tools/data UI APIs
├── client/                      # Re-exports core Tools, DataRenderers clients
└── types/                       # Re-exports core component types
```

### 2.2 ThreadMessages — The Critical Component

**File**: `packages/react-native/src/primitives/thread/ThreadMessages.tsx:34-61`

```tsx
export const ThreadMessages = ({
  renderMessage,
  ...flatListProps
}: ThreadMessagesProps) => {
  const messages = useAuiState((s) => s.thread.messages);
  // ...
  return (
    <FlatList
      data={messages as unknown as ThreadMessage[]}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      {...flatListProps}
    />
  );
};
```

**Key findings:**

1. **It IS a FlatList wrapper** — `ThreadMessages` wraps React Native's `FlatList` directly.
2. **Rendering is fully customizable** — it takes a `renderMessage` prop which is a function `(props: { message: ThreadMessage; index: number }) => ReactElement`. You control what each message looks like.
3. **FlatList props are forwarded** — `...flatListProps` means you can pass any FlatList prop (horizontal, pagingEnabled, snapToAlignment, etc.).
4. **MessageScope is automatically provided** — Each message gets wrapped in a `MessageScope` that provides the `AuiProvider` context for that message (lines 16-32).
5. **BUT: There's also `ThreadPrimitiveMessages`** — The RN package re-exports `ThreadPrimitiveMessages` from `@assistant-ui/core/react` (see `packages/react-native/src/primitives/thread/index.ts:6`). This is a non-FlatList version that just renders all messages as React elements — useful for custom layouts.

**Assessment**: `ThreadMessages` is NOT constraining. You can:
- Replace `FlatList` entirely by using `ThreadPrimitiveMessages` or `ThreadPrimitiveMessageByIndex`
- Pass `pagingEnabled` to FlatList for full-screen slides
- Build a completely custom component using `useThreadMessages()` hook + `MessageByIndexProvider`

### 2.3 ThreadRoot — Trivial Wrapper

**File**: `packages/react-native/src/primitives/thread/ThreadRoot.tsx:8-9`

```tsx
export const ThreadRoot = ({ children, ...viewProps }: ThreadRootProps) => {
  return <View {...viewProps}>{children}</View>;
};
```

Just a `<View>`. No layout constraints.

### 2.4 MessageRoot — Trivial Wrapper

**File**: `packages/react-native/src/primitives/message/MessageRoot.tsx:8-9`

```tsx
export const MessageRoot = ({ children, ...viewProps }: MessageRootProps) => {
  return <View {...viewProps}>{children}</View>;
};
```

Just a `<View>`. No layout constraints. Compare with the web version which adds hover handling, viewport anchoring, etc.

### 2.5 MessageContent — The Part Renderer (RN-specific)

**File**: `packages/react-native/src/primitives/message/MessageContent.tsx:113-183`

This is a **switch-statement-based part renderer** with pluggable renderers:

```tsx
export const MessageContent = ({
  renderText,
  renderToolCall,
  renderImage,
  renderReasoning,
  renderSource,
  renderFile,
  renderData,
}: MessageContentProps) => {
  const content = useAuiState((s) => s.message.content);
  return (
    <>
      {content.map((part, index) => {
        switch (part.type) {
          case "text":
            return renderText ? renderText({ part, index }) : <DefaultTextRenderer />;
          case "tool-call":
            return <ToolUIDisplay Fallback={renderToolCall} part={part} index={index} />;
          case "data":
            return <DataUIDisplay Fallback={renderData} part={part} index={index} />;
          // ... image, reasoning, source, file
        }
      })}
    </>
  );
};
```

**Key findings:**

1. **Every part type has a custom render prop** — `renderText`, `renderToolCall`, `renderImage`, etc.
2. **Tool calls have a global registry** — `ToolUIDisplay` (line 56-90) checks `s.tools.tools[part.toolName]` in the store first, then falls back to `renderToolCall` prop.
3. **Data parts have a global registry** — `DataUIDisplay` (line 92-111) checks `s.dataRenderers.renderers[part.name]`.
4. **No layout constraints on renderers** — A tool renderer receives the full tool call part and can render anything: a full-screen modal, a slide, an interactive form, etc.
5. **`addResult` and `resume` methods are passed to tool renderers** (line 74-85) — enabling interactive tool calls.

### 2.6 MessageParts — Core Primitive (Alternative API)

**File**: `packages/react-native/src/primitives/message/MessageParts.tsx:22-53`

This is an alternative to `MessageContent` that uses the **core `MessagePrimitiveParts`** component from `@assistant-ui/core/react`. It provides a component-based API:

```tsx
<MessagePrimitiveParts
  components={{
    Text: MyTextComponent,
    Image: MyImageComponent,
    tools: {
      by_name: { myTool: MyToolComponent },
      Fallback: DefaultToolComponent,
    },
    data: {
      by_name: { myData: MyDataComponent },
    },
    ToolGroup: MyToolGroupWrapper,
    ChainOfThought: MyChainOfThoughtComponent,
  }}
/>
```

The core `MessagePrimitiveParts` (in `packages/core/src/react/primitives/message/MessageParts.tsx:469-559`) groups consecutive tool calls and reasoning parts into ranges, then renders them through the appropriate components. Tool calls are dispatched through the same global registry (`ToolUIDisplay`) that `MessageContent` uses.

---

## 3. Tool UI System Deep Dive

### 3.1 Registration Flow

**`useAssistantToolUI`** — `packages/core/src/react/model-context/useAssistantToolUI.ts:10-17`

```tsx
export const useAssistantToolUI = (tool) => {
  const aui = useAui();
  useEffect(() => {
    if (!tool?.toolName || !tool?.render) return undefined;
    return aui.tools().setToolUI(tool.toolName, tool.render);
  }, [aui, tool?.toolName, tool?.render]);
};
```

This registers a React component as the renderer for a specific tool name. The `setToolUI` method is provided by the `Tools` client.

**`makeAssistantToolUI`** — `packages/core/src/react/model-context/makeAssistantToolUI.ts:11-20`

```tsx
export const makeAssistantToolUI = (tool) => {
  const ToolUI = () => {
    useAssistantToolUI(tool);
    return null;
  };
  ToolUI.unstable_tool = tool;
  return ToolUI;
};
```

Returns a zero-UI component that self-registers when mounted. Mount it anywhere in the tree and it registers its tool renderer globally.

### 3.2 Tools Store Client

**File**: `packages/core/src/react/client/Tools.ts:13-97`

The `Tools` resource manages a `ToolsState`:

```tsx
type ToolsState = {
  tools: Record<string, ToolCallMessagePartComponent[]>;
};
```

- Tools are stored as **arrays of components per tool name** (supports multiple registrations, first one wins).
- `setToolUI` pushes to the array and returns an unsubscribe function that removes it.
- The `toolkit` prop auto-registers tools from a toolkit config (including their `render` property and model context).

### 3.3 Dispatch: How Tool Renderers Are Invoked

**RN MessageContent** — `packages/react-native/src/primitives/message/MessageContent.tsx:56-90`:

```tsx
const ToolUIDisplay = ({ Fallback, part, index }) => {
  const aui = useAui();
  const Render = useAuiState((s) => {
    const renders = s.tools.tools[part.toolName];
    if (Array.isArray(renders)) return renders[0];
    return renders;
  });

  if (Render) {
    return (
      <Render
        {...(part as ToolCallMessagePartProps)}
        addResult={partMethods.addToolResult}
        resume={partMethods.resumeToolCall}
      />
    );
  }
  if (Fallback) return <Fallback part={part} index={index} />;
  return null;
};
```

**Core MessageParts** — `packages/core/src/react/primitives/message/MessageParts.tsx:253-266`:

```tsx
const ToolUIDisplay = ({ Fallback, ...props }) => {
  const Render = useAuiState((s) => {
    const Render = s.tools.tools[props.toolName] ?? Fallback;
    if (Array.isArray(Render)) return Render[0] ?? Fallback;
    return Render;
  });
  if (!Render) return null;
  return <Render {...props} />;
};
```

**Key insight**: The tool renderer is just a React component. It receives the tool call data as props. There are **zero layout constraints** on what it renders. It could render:
- A small inline widget
- A full-screen modal
- A slide with complex interactive content
- An absolutely positioned overlay

### 3.4 Data Renderers (Similar Pattern)

**File**: `packages/core/src/react/client/DataRenderers.ts:6-42`

Same pattern as tools: `DataRenderersState = { renderers: Record<string, DataMessagePartComponent[]> }`. Registered via `useAssistantDataUI` or `makeAssistantDataUI`. Dispatched through `DataUIDisplay`.

### 3.5 ToolCallMessagePartProps — What Tool Renderers Receive

**File**: `packages/core/src/react/types/MessagePartComponentTypes.ts:54-61`

```tsx
export type ToolCallMessagePartProps<TArgs, TResult> = MessagePartState &
  ToolCallMessagePart<TArgs, TResult> & {
    addResult: (result: TResult | ToolResponse<TResult>) => void;
    resume: (payload: unknown) => void;
  };
```

Where `ToolCallMessagePart` includes:
- `toolCallId`, `toolName`, `args`, `result`, `isError`, `argsText`
- `status` (from `MessagePartState`) — includes `"running"`, `"complete"`, `"requires-action"`
- `addResult` — function to submit the tool result back to the runtime
- `resume` — function to resume a paused tool call

---

## 4. Runtime Architecture

### 4.1 LocalRuntime

**File**: `packages/core/src/runtimes/local/local-runtime-core.ts:8-32`

`LocalRuntimeCore` extends `BaseAssistantRuntimeCore` and owns a `LocalThreadListRuntimeCore` which creates `LocalThreadRuntimeCore` instances.

**File**: `packages/core/src/runtimes/local/local-thread-runtime-core.ts:35-534`

`LocalThreadRuntimeCore` is the workhorse:
- Manages a `MessageRepository` (tree-structured message storage with branches)
- Runs the chat model via `ChatModelAdapter.run()`
- Handles streaming (async generator support)
- Manages tool result submission via `addToolResult()` (lines 483-529)
- Auto-continues after tool results via `shouldContinue()` (line 264, 521-528)
- Supports `unstable_humanToolNames` for "human-in-the-loop" tools (lines 264, 524)

### 4.2 ChatModelAdapter Interface

**File**: `packages/core/src/runtime/utils/chat-model-adapter.ts:62-66`

```tsx
export type ChatModelAdapter = {
  run(options: ChatModelRunOptions):
    | Promise<ChatModelRunResult>
    | AsyncGenerator<ChatModelRunResult, void>;
};
```

Where `ChatModelRunOptions` includes:
- `messages` — full conversation history
- `runConfig` — custom run configuration
- `abortSignal` — for cancellation
- `context` — model context (system prompt, tools, etc.)

And `ChatModelRunResult` includes:
- `content` — array of `ThreadAssistantMessagePart` (text, tool-call, reasoning, source, file, image, data)
- `status` — message status
- `metadata` — state, annotations, data, steps, timing, custom

**Assessment**: The adapter is simple and flexible. Any backend can implement it. It supports both promise-based and streaming (async generator) responses.

### 4.3 ExternalStoreRuntime

**File**: `packages/core/src/runtimes/external-store/external-store-adapter.ts:60-111`

The `ExternalStoreAdapter` bridges to external state management:

```tsx
type ExternalStoreAdapterBase<T> = {
  messages?: readonly T[];
  messageRepository?: ExportedMessageRepository;
  isRunning?: boolean;
  isDisabled?: boolean;
  isLoading?: boolean;
  suggestions?: readonly ThreadSuggestion[];
  state?: ReadonlyJSONValue;
  extras?: unknown;
  onNew: (message: AppendMessage) => Promise<void>;
  onEdit?: (message: AppendMessage) => Promise<void>;
  onReload?: (parentId, config) => Promise<void>;
  onCancel?: () => Promise<void>;
  onAddToolResult?: (options: AddToolResultOptions) => Promise<void> | void;
  convertMessage?: ExternalStoreMessageConverter<T>;
  adapters?: { attachments?, speech?, dictation?, feedback?, threadList? };
};
```

**Assessment**: This is how you'd bridge to Redux or any external state. You provide messages and callbacks. The runtime handles the rest. `onAddToolResult` is the key callback for interactive tool calls.

### 4.4 Can the Runtime Be Extended with Custom Message Types?

**No, not directly.** The `ThreadMessage` type is a discriminated union:

```tsx
// packages/core/src/types/message.ts:232-233
export type ThreadMessage = BaseThreadMessage &
  (ThreadSystemMessage | ThreadUserMessage | ThreadAssistantMessage);
```

Message parts are also fixed unions (`ThreadAssistantMessagePart`, `ThreadUserMessagePart`). However, you can use:
- **`DataMessagePart`** — a named data part with arbitrary payload (`{ type: "data", name: string, data: T }`)
- **`ToolCallMessagePart`** — tool calls with arbitrary args and results
- **`metadata.custom`** — arbitrary `Record<string, unknown>` on every message

These extensibility points are sufficient for most use cases without needing new message types.

---

## 5. Message Content Rendering Pipeline

### 5.1 How MessageContent Decides What to Render

**RN-specific `MessageContent`** — `packages/react-native/src/primitives/message/MessageContent.tsx:113-183`

Simple `switch` on `part.type`:
- `"text"` → `renderText` prop (or `<Text>` default)
- `"tool-call"` → Global tool registry first, then `renderToolCall` fallback
- `"image"` → `renderImage` prop (no default)
- `"reasoning"` → `renderReasoning` prop (no default)
- `"source"` → `renderSource` prop (no default)
- `"file"` → `renderFile` prop (no default)
- `"data"` → Global data registry first, then `renderData` fallback

**Core `MessagePrimitiveParts`** — `packages/core/src/react/primitives/message/MessageParts.tsx:469-559`

More sophisticated — groups consecutive tool calls into `toolGroup` ranges, consecutive reasoning into `reasoningGroup` ranges, or chains them all into `chainOfThoughtGroup`. Then delegates to `MessagePartComponent` which uses the same switch.

### 5.2 Part Registry? No — It's a Switch + Global Store

There is no formal "part type registry" that you can extend with new types. The `switch` statement in `MessageContent` and `MessagePartComponent` handles a fixed set of types. Unknown types log a warning and render null:

```tsx
// packages/core/src/react/primitives/message/MessageParts.tsx:362
default:
  console.warn(`Unknown message part type: ${type}`);
  return null;
```

**However**: The `DataMessagePart` type is the escape hatch. It has a `name` field and arbitrary `data`, and its renderer is looked up from the data renderers registry. This is effectively a custom part type system.

### 5.3 Tool Call Rendering Priority

1. **Global tool registry** (`s.tools.tools[toolName]`) — registered via `useAssistantToolUI`, `makeAssistantToolUI`, or toolkit config
2. **`renderToolCall` prop / `tools.by_name[toolName]` component** — passed directly to `MessageContent` / `MessagePrimitiveParts`
3. **`tools.Fallback` component** — generic fallback for any unregistered tool
4. **`null`** — if nothing matches, tool call is invisible

### 5.4 Relationship Between `renderToolCall`, `renderToolUI`, and Global Registry

- **`renderToolCall`** (RN `MessageContent` prop) = local fallback for tool calls in that specific message content instance
- **`useAssistantToolUI` / `makeAssistantToolUI`** = global registration into the store's `tools.tools[toolName]`
- **`tools.by_name` / `tools.Fallback`** (core `MessagePrimitiveParts` components prop) = local component overrides

The global registry is checked FIRST. If a tool renderer is registered globally via `useAssistantToolUI`, it takes priority over the local `renderToolCall`/`Fallback` props.

---

## 6. Layout Flexibility Assessment (THE KEY QUESTION)

### 6.1 Is There Anything That CONSTRAINS Rendering to a Chat-List Format?

**No.** Here's why:

1. **`ThreadRoot`** is just `<View>` (RN) or `<div>` (web). No layout enforcement.

2. **`ThreadMessages`** (RN) is a `FlatList` wrapper but:
   - Accepts all FlatList props (including `horizontal`, `pagingEnabled`)
   - The `renderMessage` prop gives full control over each message's rendering
   - You don't have to use it at all

3. **`ThreadPrimitiveMessages`** (core, re-exported to RN) is NOT a FlatList — it renders `Array.from({ length: messagesLength }, ...)` as plain React elements. You can wrap them in anything.

4. **`ThreadPrimitiveMessageByIndex`** lets you render a single message by index with full context.

5. **`MessageRoot`** is just `<View>`. No bubble styling, no constraints.

6. **`MessageContent`** renders parts as Fragments. No layout wrapper.

7. **Tool renderers are arbitrary React components** with zero layout constraints.

### 6.2 Could ThreadMessages Be Replaced for Full-Screen Slides?

**Yes, trivially.** Three approaches:

#### Approach A: FlatList with Paging
```tsx
<ThreadMessages
  renderMessage={({ message, index }) => (
    <View style={{ width: screenWidth, height: screenHeight }}>
      <FullScreenSlide message={message} />
    </View>
  )}
  horizontal
  pagingEnabled
  snapToAlignment="start"
/>
```

This works because `ThreadMessages` forwards all FlatList props.

#### Approach B: Custom Component with ThreadPrimitiveMessageByIndex
```tsx
const FullScreenView = () => {
  const messages = useThreadMessages();
  const [activeIndex, setActiveIndex] = useState(messages.length - 1);

  return (
    <View style={{ flex: 1 }}>
      <ThreadPrimitiveMessageByIndex
        index={activeIndex}
        components={{
          AssistantMessage: FullScreenSlideComponent,
          UserMessage: CompactUserMessage,
        }}
      />
    </View>
  );
};
```

#### Approach C: Direct Store Access
```tsx
const ActiveToolSlide = () => {
  const messages = useAuiState((s) => s.thread.messages);
  const lastMessage = messages[messages.length - 1];
  const toolCall = lastMessage?.content.find(p => p.type === 'tool-call' && !p.result);

  if (toolCall) {
    return (
      <MessageByIndexProvider index={messages.length - 1}>
        <FullScreenToolRenderer toolCall={toolCall} />
      </MessageByIndexProvider>
    );
  }
  return <ChatView />;
};
```

### 6.3 Is There a "Current Message" or "Active Tool Call" Concept?

**Not explicitly**, but it's easy to derive:

- **Last message**: `useAuiState((s) => s.thread.messages[s.thread.messages.length - 1])`
- **Running status**: `useAuiState((s) => s.thread.isRunning)`
- **Message with pending tool call**: Check `message.status.type === "requires-action"` and `message.status.reason === "tool-calls"`
- **Specific tool call status**: Each `ToolCallMessagePart` has a `result` field — `undefined` means pending
- **Human tool call detection**: `unstable_humanToolNames` in `LocalRuntimeOptions` marks tools that should pause for user input

### 6.4 Does the Runtime Expose "Latest Message with Pending Tool Call"?

Yes, through the store:

```tsx
// Find the latest message that requires action (has pending tool calls)
const pendingMessage = useAuiState((s) => {
  const msgs = s.thread.messages;
  for (let i = msgs.length - 1; i >= 0; i--) {
    if (msgs[i].status?.type === 'requires-action') return msgs[i];
  }
  return null;
});
```

The `shouldContinue` function (`packages/core/src/runtimes/local/should-continue.ts:3-25`) shows exactly how the runtime decides if a tool call is "human" (requiring UI):

```tsx
export const shouldContinue = (result, humanToolNames) => {
  return (
    result.status?.type === "requires-action" &&
    result.status.reason === "tool-calls" &&
    result.content.every(
      (c) => c.type !== "tool-call" || !!c.result || !humanToolNames.includes(c.toolName)
    )
  );
};
```

When `shouldContinue` returns `false` because a human tool call is pending (has no result and IS in `humanToolNames`), the runtime pauses. The tool's UI renderer is displayed, and when the user submits via `addResult`, the runtime auto-continues (line 521-528 of `local-thread-runtime-core.ts`).

---

## 7. Web vs RN Comparison

### 7.1 What's Shared (in `core/`)

| Component | Location |
|-----------|----------|
| `ThreadPrimitiveMessages` | `core/src/react/primitives/thread/ThreadMessages.tsx` |
| `MessagePrimitiveParts` | `core/src/react/primitives/message/MessageParts.tsx` |
| `MessageByIndexProvider` | `core/src/react/providers/` |
| `PartByIndexProvider` | `core/src/react/providers/` |
| `useAssistantToolUI` | `core/src/react/model-context/useAssistantToolUI.ts` |
| `makeAssistantToolUI` | `core/src/react/model-context/makeAssistantToolUI.ts` |
| `useAssistantTool` | `core/src/react/model-context/useAssistantTool.ts` |
| `useAssistantDataUI` | `core/src/react/model-context/useAssistantDataUI.ts` |
| `Tools` client | `core/src/react/client/Tools.ts` |
| `DataRenderers` client | `core/src/react/client/DataRenderers.ts` |
| All runtime code | `core/src/runtime/`, `core/src/runtimes/` |
| All types | `core/src/types/` |
| Store scopes | `core/src/store/scopes/` |

### 7.2 What's Platform-Specific

| Feature | Web (`react/`) | RN (`react-native/`) |
|---------|---------------|---------------------|
| ThreadRoot | Radix `Primitive.div` | `<View>` |
| MessageRoot | Radix `Primitive.div` + hover tracking + viewport anchoring | `<View>` (bare) |
| ThreadMessages | Re-exports core `ThreadPrimitiveMessages` | Custom `FlatList` wrapper + re-exports core |
| MessageContent | Uses core `MessagePrimitiveParts` | Custom switch-based renderer |
| MessageParts | Web defaults (`<p>`, `<span>`) | RN defaults (`<Text>`) |
| ThreadViewport | Scrollable div with auto-scroll, turn anchoring | Not present (FlatList handles scrolling) |
| ThreadScrollToBottom | Button component | Not present |
| AssistantModal | Floating modal | Not present |
| Error boundary | `MessageError` component | Not present |

### 7.3 Maturity Comparison

**Web**: Very mature. 18 primitive directories, comprehensive viewport management, Radix integration, selection toolbar, error handling, hover states.

**React Native**: Functional but minimal. 10 primitive directories, basic wrappers around core. Missing:
- Viewport management (no `ThreadViewport` equivalent)
- Error boundaries
- Selection toolbar
- Assistant modal
- The `MessageRoot` doesn't track hover (makes sense for mobile)

The RN package is a thin layer over `core/react`. Most of the intelligence is in core (which is platform-agnostic React). The RN primitives are deliberately simple, which actually makes them MORE flexible for custom layouts.

---

## 8. Verdict: Can assistant-ui Support Full-View Slides?

### Answer: YES — with minimal effort

assistant-ui's architecture is **highly favorable** for full-screen slide rendering. Here's the assessment:

### What Works Out of the Box

1. **Tool renderers are unconstrained** — A `makeAssistantToolUI` component can render absolutely anything. It receives tool args and a `addResult` callback. It could render a full-screen product card, an onboarding questionnaire, or an interactive map.

2. **Data renderers are unconstrained** — Same pattern via `makeAssistantDataUI`. Custom named data parts with arbitrary payloads and arbitrary rendering.

3. **`ThreadMessages` accepts FlatList props** — You can make it paginated, horizontal, snapping to full-screen slides.

4. **`ThreadPrimitiveMessageByIndex`** enables rendering a single message — Perfect for "show only the current step" UIs.

5. **`useThreadMessages()` hook** gives raw access to all messages — Build any custom rendering.

6. **The `requires-action` + `humanToolNames` mechanism** is exactly the "human-in-the-loop" pattern needed for interactive slides — the runtime pauses until `addResult` is called.

7. **The runtime is backend-agnostic** — `ChatModelAdapter` works with any AI backend.

### What Would Need to Be Built

1. **A "slide controller" layer** — Something that determines which message/tool-call is "active" and should be shown full-screen. This doesn't exist but is trivial to build on top of `useAuiState`.

2. **Full-screen slide wrapper components** — Custom `renderMessage` or custom tool UI components that render as full-screen views instead of chat bubbles. This is application-level code, not framework-level.

3. **Navigation between slides** — Previous/next controls. Could use message branching (`switchToBranch`) or simple index-based navigation on the FlatList.

4. **Hybrid chat+slide mode** — A mode switcher that shows regular chat for some messages and full-screen slides for tool calls. This would be a custom `renderMessage` that checks the message type.

### What Would NOT Need to Change

- The runtime layer (LocalRuntime, ExternalStoreRuntime)
- The store/state management
- The tool registration system
- The ChatModelAdapter interface
- The message type system
- Any core package code

### Confidence Level: HIGH

The architecture cleanly separates rendering concerns from runtime/state concerns. The primitive components are intentionally thin in the RN package. The tool UI system is a global registry of plain React components with no layout constraints. The `DataMessagePart` provides a built-in extensibility point for custom content types.

The only question is whether the DX is good enough for a slide-based experience — i.e., does the ergonomics of tool UI registration, result submission, and state management feel natural when building full-screen interactive flows rather than chat UIs? Based on the source analysis, the answer is yes: the `addResult` callback, `requires-action` status, and `humanToolNames` mechanism provide a clean API for interactive multi-step flows.
