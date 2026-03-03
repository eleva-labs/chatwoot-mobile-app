# Research 2D: assistant-ui Wrapper Architecture — Concrete Design

> **Date**: 2026-02-28
> **Predecessor**: Research 2A (BUILD CUSTOM), 2B (source analysis), 2C (greenfield evaluation)
> **Question**: Can we INSTALL assistant-ui (not fork) and build wrappers on top to render full-screen interactive slides?
> **Answer**: **YES — and it's architecturally cleaner than the custom build path.**
> **Confidence**: High

---

## 0. Why This Re-Evaluation

Prior research recommended BUILD CUSTOM based on three arguments:

1. **Version immaturity** — v0.1.x, 8 days old
2. **Migration cost** — discarding 80% of existing AI chat code
3. **Chat paradigm mismatch** — assistant-ui is "chat-first"

The user pushes back on argument #1:

- The web package has 1,100+ releases — the underlying code is battle-tested
- The low version numbers on `core`/`react-native` are because packages were JUST EXTRACTED, not because the code is new
- YC-backed with 8.6k stars

This document drops the abstract evaluation and builds a **concrete, code-verified wrapper architecture** showing exactly how each piece works. The reader can judge whether it's viable based on actual code, not risk assessments.

---

## 1. Package Strategy

### What We Install

```json
{
  "dependencies": {
    "@assistant-ui/react-native": "^0.1.1",
    "@assistant-ui/core": "^0.1.2",
    "@assistant-ui/store": "^0.2.1"
  }
}
```

`@assistant-ui/react-native` depends on `@assistant-ui/core`, `@assistant-ui/store`, `@assistant-ui/tap`, `assistant-stream`, and `zustand@^5`. These are transitive — npm resolves them automatically.

### Peer Dependencies

```
react: ^18 || ^19           ✅ We use React 18 (Expo SDK 52)
react-native: *             ✅ Wildcard — accepts RN 0.76 (our version)
@types/react: * (optional)  ✅ Already installed
```

**Source-verified**: `packages/react-native/package.json` line 47-51 confirms `react-native: "*"` as peer dep. The `^0.84.0` is a devDependency only (line 62), used for development/testing, NOT enforced at install time.

### The Zustand Question

`@assistant-ui/core` has `zustand: ^5.0.11` as a peer dep. Our app uses Redux. This is NOT a conflict — Zustand and Redux coexist without issues. They're both just state containers with different APIs. Many apps use both. assistant-ui's Zustand usage is internal to its store layer and doesn't leak into our Redux patterns.

**Impact**: Adds ~3KB gzipped (Zustand) + ~15KB (assistant-ui core+store+tap+assistant-stream) to bundle. Acceptable for the functionality gained.

### New Dependency: `zod@^4`

**CRITICAL FINDING**: `@assistant-ui/core` has a peer dependency on `zod: "^4.0.0"` (line 69 of `packages/core/package.json`). Our project likely uses Zod 3.x. This is an optional peer dep (line 79-81: `"zod": { "optional": true }`), so it won't block installation, but if assistant-ui's tool definitions use Zod 4 features internally, there could be incompatibilities.

**Mitigation**: Zod 4 is backward-compatible with Zod 3 schemas for basic usage. Our slide schemas are pure Zod — they work in either version. If we use assistant-ui's `tool()` helper that expects Zod 4, we may need to upgrade Zod or skip that helper and define tools without it.

---

## 2. Runtime Setup

### 2.1 ChatModelAdapter — Our SSE Backend Bridge

The `ChatModelAdapter` is the single integration point between assistant-ui and our backend. It's a simple interface:

```typescript
// Source: packages/core/src/runtime/utils/chat-model-adapter.ts:62-66
type ChatModelAdapter = {
  run(options: ChatModelRunOptions):
    | Promise<ChatModelRunResult>
    | AsyncGenerator<ChatModelRunResult, void>;
};
```

Here's our concrete implementation:

```typescript
// src/presentation/hooks/onboarding/OnboardingChatModelAdapter.ts

import type {
  ChatModelAdapter,
  ChatModelRunOptions,
  ChatModelRunResult,
  ThreadMessage,
  TextMessagePart,
  ToolCallMessagePart,
} from '@assistant-ui/react-native';
import { getStore } from '@/store'; // Our DeviseTokenAuth store accessor

/**
 * ChatModelAdapter that talks to our Rails/ai-backend via SSE streaming.
 * 
 * This replaces our `DefaultChatTransport` but the HTTP/SSE logic is identical.
 * The adapter is a thin wrapper that translates between assistant-ui's message
 * format and our backend's SSE protocol.
 */
export function createOnboardingAdapter(
  endpoint: string,
  agentBotId: number,
): ChatModelAdapter {
  return {
    async *run({ messages, abortSignal, context }) {
      // 1. Get auth headers from Redux store (DeviseTokenAuth pattern)
      const state = getStore().getState();
      const { accessToken, client: clientId, uid } = state.auth.headers;
      
      // 2. Convert assistant-ui ThreadMessage[] to our backend's message format
      const backendMessages = convertToBackendFormat(messages);
      
      // 3. Make SSE streaming request
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'access-token': accessToken,
          client: clientId,
          uid: uid,
        },
        body: JSON.stringify({
          messages: backendMessages,
          agent_bot_id: agentBotId,
          // Flow config, step context, etc. can be passed here
        }),
        signal: abortSignal,
      });

      if (!response.ok) {
        throw new Error(`Backend error: ${response.status}`);
      }

      // 4. Parse SSE stream and yield ChatModelRunResult chunks
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      
      // Accumulated state for the current assistant message
      const textParts: TextMessagePart[] = [];
      const toolCalls: Map<string, ToolCallMessagePart> = new Map();
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6);
          if (data === '[DONE]') break;
          
          try {
            const event = JSON.parse(data);
            
            switch (event.type) {
              case 'text-delta': {
                // Append to existing text part or create new one
                if (textParts.length === 0) {
                  textParts.push({ type: 'text', text: '' });
                }
                textParts[textParts.length - 1] = {
                  type: 'text',
                  text: textParts[textParts.length - 1]!.text + event.delta,
                };
                break;
              }
              case 'tool-call-begin': {
                toolCalls.set(event.toolCallId, {
                  type: 'tool-call',
                  toolCallId: event.toolCallId,
                  toolName: event.toolName,
                  args: {},
                  argsText: '',
                });
                break;
              }
              case 'tool-call-delta': {
                const tc = toolCalls.get(event.toolCallId)!;
                toolCalls.set(event.toolCallId, {
                  ...tc,
                  argsText: tc.argsText + event.delta,
                });
                break;
              }
              case 'tool-call': {
                const tc = toolCalls.get(event.toolCallId)!;
                toolCalls.set(event.toolCallId, {
                  ...tc,
                  args: JSON.parse(tc.argsText || '{}'),
                });
                break;
              }
              case 'tool-result': {
                const tc = toolCalls.get(event.toolCallId)!;
                toolCalls.set(event.toolCallId, {
                  ...tc,
                  result: event.result,
                });
                break;
              }
            }
            
            // Yield accumulated state after each event
            yield {
              content: [
                ...textParts,
                ...Array.from(toolCalls.values()),
              ],
            };
          } catch {
            // Skip malformed SSE events
          }
        }
      }

      // 5. Final yield with completion status
      const hasUnresolvedHumanTools = Array.from(toolCalls.values()).some(
        tc => tc.toolName === 'render_slide' && !tc.result,
      );
      
      yield {
        content: [...textParts, ...Array.from(toolCalls.values())],
        status: hasUnresolvedHumanTools
          ? { type: 'requires-action', reason: 'tool-calls' }
          : { type: 'complete', reason: 'stop' },
      };
    },
  };
}

/**
 * Convert assistant-ui ThreadMessage[] to our backend's expected format.
 * This maps tool-call parts to the format our Rails/Python backend expects.
 */
function convertToBackendFormat(messages: readonly ThreadMessage[]) {
  return messages.map(msg => {
    if (msg.role === 'user') {
      return {
        role: 'user',
        content: msg.content
          .filter((p): p is TextMessagePart => p.type === 'text')
          .map(p => p.text)
          .join(''),
      };
    }
    if (msg.role === 'assistant') {
      return {
        role: 'assistant',
        content: msg.content.map(part => {
          if (part.type === 'text') return { type: 'text', text: part.text };
          if (part.type === 'tool-call') {
            return {
              type: 'tool_call',
              id: part.toolCallId,
              name: part.toolName,
              arguments: JSON.stringify(part.args),
              ...(part.result !== undefined ? { result: part.result } : {}),
            };
          }
          return null;
        }).filter(Boolean),
      };
    }
    return { role: msg.role, content: msg.content };
  });
}
```

### 2.2 LocalRuntime Configuration with humanToolNames

```typescript
// src/presentation/hooks/onboarding/useOnboardingRuntime.ts

import { useLocalRuntime, type LocalRuntimeOptions } from '@assistant-ui/react-native';
import { useMemo } from 'react';
import { createOnboardingAdapter } from './OnboardingChatModelAdapter';

const ONBOARDING_ENDPOINT = '/api/v1/onboarding/chat';

export function useOnboardingRuntime(agentBotId: number) {
  const adapter = useMemo(
    () => createOnboardingAdapter(ONBOARDING_ENDPOINT, agentBotId),
    [agentBotId],
  );

  const options: LocalRuntimeOptions = useMemo(() => ({
    // Mark render_slide as a human tool — this causes the runtime to PAUSE
    // when the AI calls render_slide, waiting for addToolResult to be called
    // with the user's form submission.
    //
    // Source verification:
    //   local-thread-runtime-core.ts line 264: shouldContinue checks humanToolNames
    //   should-continue.ts line 17-25: if toolName is in humanToolNames AND has no result,
    //     shouldContinue returns false → runtime pauses → message status = "requires-action"
    unstable_humanToolNames: ['render_slide'],
    
    // Max steps per roundtrip (safety net)
    maxSteps: 5,
  }), []);

  return useLocalRuntime(adapter, options);
}
```

### 2.3 How addToolResult Flows Back

The flow, verified from source:

1. AI calls `render_slide` → adapter yields a `ToolCallMessagePart` with `toolName: 'render_slide'`
2. Adapter yields final status `{ type: 'requires-action', reason: 'tool-calls' }`
3. `shouldContinue()` (line 17-25 of `should-continue.ts`) sees `'render_slide'` in `humanToolNames` with no result → returns `false`
4. The `do...while` loop in `startRun()` (line 256-264 of `local-thread-runtime-core.ts`) exits
5. The message stays in `requires-action` status — the UI renders the slide
6. User fills out the slide and taps "Continue"
7. Our code calls `aui.message().part({ index }).addToolResult(result)` (or via the `addResult` prop passed to the tool renderer)
8. `addToolResult()` (line 483-529 of `local-thread-runtime-core.ts`) updates the tool-call part with the result
9. `shouldContinue()` re-evaluates — now `render_slide` HAS a result → returns `true`
10. Line 521-528: `performRoundtrip` is called → adapter's `run()` is called again with the updated messages → AI sees the tool result and generates the next step

This is the exact human-in-the-loop pattern we need. No custom code required for the flow mechanics.

---

## 3. Slide Tool Registration

### 3.1 Using makeAssistantToolUI

The tool UI registration is in `@assistant-ui/core/react` and re-exported by `@assistant-ui/react-native`:

```typescript
// Source: packages/core/src/react/model-context/makeAssistantToolUI.ts
// Re-exported at: packages/react-native/src/model-context/index.ts line 6
```

Our registration:

```typescript
// src/presentation/components/onboarding/tools/SlideToolUI.tsx

import { makeAssistantToolUI } from '@assistant-ui/react-native';
import type { Slide, SlideOutput } from '@/store/onboarding/schemas/blocks';
import { SlideRenderer } from '../SlideRenderer';

/**
 * Register the render_slide tool UI.
 * 
 * When mounted inside AssistantProvider, this component:
 * 1. Registers a renderer for tool calls with toolName === 'render_slide'
 * 2. When MessageContent encounters a render_slide tool-call part, it renders
 *    this component instead of the default (null)
 * 3. The renderer receives: args (our SlideSchema), result, status, addResult
 * 
 * Source verification:
 *   MessageContent.tsx line 56-90: ToolUIDisplay checks s.tools.tools[part.toolName]
 *   If a renderer is registered, it's called with the tool call props + addResult
 */
export const SlideToolUI = makeAssistantToolUI<Slide, SlideOutput>({
  toolName: 'render_slide',
  render: ({ args, result, status, addResult }) => {
    // `args` is the parsed SlideSchema from the AI's tool call
    // `result` is the SlideOutput (undefined until user submits)
    // `status` has .type: 'running' | 'complete' | 'incomplete' | 'requires-action'
    // `addResult` sends the user's form data back as the tool result

    const isSubmitted = result !== undefined;
    const isStreaming = status.type === 'running';

    if (isStreaming) {
      return <SlideSkeleton />;
    }

    return (
      <SlideRenderer
        slide={args}
        readOnly={isSubmitted}
        submittedValues={isSubmitted ? result : undefined}
        onSubmit={(output: SlideOutput) => {
          addResult(output);
        }}
      />
    );
  },
});
```

### 3.2 How the Dispatch Works (Verified)

When `MessageContent` renders an assistant message, for each `tool-call` part:

1. **Line 68-72** of `MessageContent.tsx`: Looks up `s.tools.tools['render_slide']` in the store
2. If found (because `SlideToolUI` is mounted and registered it), renders the registered component
3. **Line 79-86**: Passes `{...part, addResult: partMethods.addToolResult, resume: partMethods.resumeToolCall}` as props
4. The `addResult` function (line 83) is `aui.message().part({ index }).addToolResult`
5. This calls through to `LocalThreadRuntimeCore.addToolResult()` (line 483)

**No layout constraints exist in this pipeline.** The registered component renders as a plain React element inside a Fragment (line 140-148). It can be a 10px icon or a full-screen overlay — there's nothing constraining it.

### 3.3 Registering Other Tools (Non-Interactive)

For tools that don't need human interaction (e.g., `update_progress`, `mark_step_complete`), we have two options:

**Option A: Server-executed tools (preferred)**
These tools have `execute` functions on the server. The adapter receives their results in the stream. We register UI renderers only for visual display:

```typescript
export const ProgressToolUI = makeAssistantToolUI<
  { currentStep: number; totalSteps: number; stepLabel?: string },
  { acknowledged: boolean }
>({
  toolName: 'update_progress',
  render: ({ args }) => {
    return <ProgressBar current={args.currentStep} total={args.totalSteps} label={args.stepLabel} />;
  },
});
```

**Option B: Silent tools (no UI)**
For `mark_step_complete` and `finish_onboarding`, we may not want any visible UI. Simply don't register a tool UI — `MessageContent` will render `null` for unregistered tools (line 88-89: `if (Fallback) return ...; return null;`).

---

## 4. Dual Presentation Mode Implementation

### 4.1 Mode A: Inline (Chat with Full-Width Slides)

In inline mode, slides render as items in the `ThreadMessages` FlatList. Each message is either a regular chat bubble or a full-width slide.

```typescript
// src/presentation/components/onboarding/InlinePresentation.tsx

import {
  ThreadMessages,
  MessageContent,
  useAuiState,
  type ThreadMessage,
} from '@assistant-ui/react-native';
import { View, Dimensions } from 'react-native';
import { AIMessageBubble } from '@/presentation/components/ai-assistant/AIMessageBubble';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * Inline presentation: slides and chat messages in a single FlatList.
 * 
 * ThreadMessages is a FlatList wrapper (verified: ThreadMessages.tsx line 53-60).
 * It accepts all FlatList props via ...flatListProps spread.
 * The renderMessage prop gives us full control over each message's rendering.
 */
export const InlinePresentation = () => {
  return (
    <ThreadMessages
      renderMessage={({ message, index }) => (
        <InlineMessageRenderer message={message} index={index} />
      )}
      // FlatList props forwarded (verified: ThreadMessages.tsx line 34-37)
      inverted={false}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 16 }}
    />
  );
};

/**
 * Per-message renderer. Detects tool calls and renders slides full-width.
 * Regular messages render as chat bubbles.
 */
const InlineMessageRenderer = ({ 
  message, 
  index, 
}: { 
  message: ThreadMessage; 
  index: number; 
}) => {
  if (message.role === 'user') {
    return <UserMessageBubble message={message} />;
  }

  if (message.role === 'assistant') {
    // Check if this message contains a render_slide tool call
    const hasSlide = message.content.some(
      (p) => p.type === 'tool-call' && p.toolName === 'render_slide',
    );

    if (hasSlide) {
      // Full-width slide message: text + slide + actions
      return (
        <View style={{ width: SCREEN_WIDTH }}>
          {/* MessageContent automatically dispatches to SlideToolUI for render_slide
              and renders text parts with our custom renderer */}
          <MessageContent
            renderText={({ part }) => (
              <AITextBubble text={part.text} />
            )}
            // renderToolCall is the FALLBACK — only used if no global tool UI registered.
            // Since SlideToolUI is mounted, render_slide goes through the global registry.
            // Other tools fall through to this fallback:
            renderToolCall={({ part }) => (
              <GenericToolCallDisplay part={part} />
            )}
          />
        </View>
      );
    }

    // Regular assistant message (text only)
    return (
      <AIMessageBubble>
        <MessageContent
          renderText={({ part }) => <AITextPart text={part.text} />}
          renderReasoning={({ part }) => <AIReasoningPart text={part.text} />}
        />
      </AIMessageBubble>
    );
  }

  return null;
};
```

**Key insight**: `MessageContent` (verified at line 113-183 of the RN source) iterates over `s.message.content` and dispatches each part. For `tool-call` parts, it first checks the global tool registry (`ToolUIDisplay` at line 56-90). If `SlideToolUI` is mounted (which registers `render_slide` in the store), that renderer gets called with `addResult`. Text parts go to `renderText`. Everything happens through composition, not source modification.

### 4.2 Mode B: Full-View (Slide Takes Over Screen)

This is the critical test. In full-view mode, the active slide fills the content area. The chat history is hidden behind a `MiniChatBar`.

```typescript
// src/presentation/components/onboarding/FullViewPresentation.tsx

import { useAuiState, useAui, MessageContent } from '@assistant-ui/react-native';
import { MessageByIndexProvider } from '@assistant-ui/react-native';
import type { ThreadMessage, ToolCallMessagePart } from '@assistant-ui/react-native';
import { View, ScrollView } from 'react-native';
import { MiniChatBar } from './MiniChatBar';
import { SlideSkeleton } from './SlideSkeleton';

/**
 * Full-view presentation: the active slide takes over the content area.
 * 
 * This component does NOT use ThreadMessages or any FlatList.
 * Instead, it reads thread state directly via useAuiState selectors
 * and renders a single slide at a time.
 * 
 * Source verification:
 *   useAuiState is exported at packages/react-native/src/index.ts line 81
 *   It's from @assistant-ui/store and provides selector-based state access
 *   s.thread.messages gives us the full message array
 *   s.thread.isRunning tells us if the AI is generating
 */
export const FullViewPresentation = () => {
  // Extract the state we need with fine-grained selectors
  const activeSlideInfo = useAuiState((s) => {
    const messages = s.thread.messages;
    const isRunning = s.thread.isRunning;
    
    // Find the latest assistant message with a pending render_slide tool call
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i]!;
      if (msg.role !== 'assistant') continue;
      
      for (let j = 0; j < msg.content.length; j++) {
        const part = msg.content[j]!;
        if (
          part.type === 'tool-call' && 
          part.toolName === 'render_slide'
        ) {
          return {
            messageIndex: i,
            partIndex: j,
            toolCall: part as ToolCallMessagePart,
            isRunning,
            hasResult: part.result !== undefined,
          };
        }
      }
    }
    
    return { messageIndex: -1, partIndex: -1, toolCall: null, isRunning, hasResult: false };
  });

  // Extract latest AI text for MiniChatBar
  const latestAIText = useAuiState((s) => {
    const messages = s.thread.messages;
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i]!;
      if (msg.role !== 'assistant') continue;
      const textPart = msg.content.find(p => p.type === 'text');
      if (textPart && textPart.type === 'text') return textPart.text;
    }
    return '';
  });

  return (
    <View style={{ flex: 1 }}>
      {/* MiniChatBar: shows latest AI text, expandable to full history */}
      <MiniChatBar latestText={latestAIText} />
      
      {/* Active slide area */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>
        {activeSlideInfo.isRunning && !activeSlideInfo.toolCall && (
          <SlideSkeleton />
        )}
        
        {activeSlideInfo.toolCall && activeSlideInfo.messageIndex >= 0 && (
          // MessageByIndexProvider scopes the AUI context to the specific message
          // This allows MessageContent and tool renderers to access the correct
          // message state (including addResult for the tool call).
          //
          // Source verification:
          //   MessageByIndexProvider is re-exported from @assistant-ui/core/react
          //   at packages/react-native/src/index.ts line 139
          <MessageByIndexProvider index={activeSlideInfo.messageIndex}>
            <MessageContent
              renderText={() => null} // Hide text in full-view (shown in MiniChatBar)
              // No renderToolCall fallback needed — SlideToolUI handles render_slide
            />
          </MessageByIndexProvider>
        )}
      </ScrollView>
    </View>
  );
};
```

**Why this works**: 

1. `useAuiState((s) => s.thread.messages)` gives us direct access to the full message array — verified at `ThreadMessages.tsx` line 38 and the `@assistant-ui/store` exports.

2. `MessageByIndexProvider` sets up the scoped context for a specific message index. This is exactly what `ThreadMessages` does internally for each FlatList item (verified at `ThreadMessages.tsx` lines 16-32, where `MessageScope` wraps each item with `Derived` + `AuiProvider`).

3. Within that scope, `MessageContent` dispatches parts as normal. The `SlideToolUI` registered globally is found via `ToolUIDisplay` → `s.tools.tools['render_slide']`. The `addResult` callback is correctly wired to the specific message and part index.

4. We render `MessageContent` with `renderText={() => null}` to suppress text parts in the main area (they show in `MiniChatBar`). The slide tool renderer is the only visible output.

**No assistant-ui source modification required.** We're using only public APIs: `useAuiState`, `MessageByIndexProvider`, `MessageContent`, and the tool UI registry.

### 4.3 MiniChatBar Component

```typescript
// src/presentation/components/onboarding/MiniChatBar.tsx

import { useRef, useState } from 'react';
import { View, Text, Pressable, Animated } from 'react-native';
import { ThreadMessages, MessageContent } from '@assistant-ui/react-native';

interface MiniChatBarProps {
  latestText: string;
}

export const MiniChatBar = ({ latestText }: MiniChatBarProps) => {
  const [expanded, setExpanded] = useState(false);

  if (!latestText) return null;

  return (
    <View>
      {/* Collapsed: 1-2 lines of latest AI text */}
      <Pressable onPress={() => setExpanded(!expanded)}>
        <Text numberOfLines={2} style={{ /* styling */ }}>
          {latestText}
        </Text>
        <Text>{expanded ? '▲' : '▼'}</Text>
      </Pressable>
      
      {/* Expanded: full chat history in a bottom sheet */}
      {expanded && (
        <View style={{ maxHeight: 300 }}>
          {/* Re-use ThreadMessages for the full chat history */}
          <ThreadMessages
            renderMessage={({ message }) => (
              <CompactChatBubble message={message} />
            )}
            inverted={false}
          />
        </View>
      )}
    </View>
  );
};
```

### 4.4 Switching Between Modes

```typescript
// src/presentation/components/onboarding/PresentationContainer.tsx

import { InlinePresentation } from './InlinePresentation';
import { FullViewPresentation } from './FullViewPresentation';
import type { PresentationMode } from '@/store/onboarding/schemas/flowConfig';

interface PresentationContainerProps {
  mode: PresentationMode;
}

export const PresentationContainer = ({ mode }: PresentationContainerProps) => {
  if (mode === 'full-view') {
    return <FullViewPresentation />;
  }
  return <InlinePresentation />;
};
```

Both modes use the same `SlideToolUI` registration. The difference is only in HOW messages are laid out — inline uses `ThreadMessages` (FlatList), full-view uses `useAuiState` + `MessageByIndexProvider`. Both go through `MessageContent` → `ToolUIDisplay` → `SlideToolUI.render` → `SlideRenderer`.

---

## 5. Step Rollback Integration

### 5.1 Injecting System Messages

The `ThreadSystemMessage` type exists in assistant-ui:

```typescript
// Source: packages/core/src/types/message.ts line 174-186
type ThreadSystemMessage = {
  readonly role: "system";
  readonly content: readonly [TextMessagePart];
  readonly metadata: { readonly custom: Record<string, unknown>; ... };
};
```

With `LocalRuntime`, we can append system messages directly:

```typescript
import { useAui } from '@assistant-ui/react-native';
import type { ThreadMessage } from '@assistant-ui/react-native';

function useRollbackContextInjection() {
  const aui = useAui();

  const injectRollbackContext = async (
    stepRegistry: StepRegistry,
  ) => {
    const rolledBackSteps = Object.values(stepRegistry)
      .filter(s => s.status === 'rolled_back' || s.status === 'invalidated');

    if (rolledBackSteps.length === 0) return;

    const validSteps = Object.values(stepRegistry)
      .filter(s => s.status === 'completed');

    const summaryText = `
ROLLBACK NOTICE: The following steps have been rolled back:
${rolledBackSteps.map(s => `- ${s.stepId}`).join('\n')}

Current valid collected data:
${validSteps.map(s => `- ${s.stepId}: ${JSON.stringify(s.responseData)}`).join('\n')}

Re-collect data for rolled-back steps.
    `.trim();

    // Use the composer to send a system-like message
    // or inject through the adapter by prepending to the next request
    // (See section 5.3 for the recommended approach)
  };

  return { injectRollbackContext };
}
```

### 5.2 Resolving Pending Slides Before Free-Text

When the user types free text while a `render_slide` tool call is pending, we need to resolve it first. This maps directly to `addToolResult`:

```typescript
function useHandleFreeText() {
  const aui = useAui();

  const sendFreeText = async (text: string) => {
    // 1. Check for pending render_slide tool call
    const messages = aui.threads().thread('main').getState().messages;
    const lastMsg = messages[messages.length - 1];
    
    if (lastMsg?.role === 'assistant' && lastMsg.status?.type === 'requires-action') {
      // Find the pending render_slide tool call
      for (let i = 0; i < lastMsg.content.length; i++) {
        const part = lastMsg.content[i]!;
        if (
          part.type === 'tool-call' && 
          part.toolName === 'render_slide' && 
          !part.result
        ) {
          // 2. Resolve it with a 'skip' action
          // This calls LocalThreadRuntimeCore.addToolResult() (line 483-529)
          // Which updates the tool-call part with the result,
          // then shouldContinue() returns true → auto-continues
          aui.message().part({ index: i }).addToolResult({
            action: 'skip',
            values: {},
          });
          
          // Wait for the auto-continue to complete
          // (the runtime will call adapter.run() with the skip result)
          break;
        }
      }
    }
    
    // 3. Send the text message
    aui.composer().setText(text);
    aui.composer().send();
  };

  return { sendFreeText };
}
```

### 5.3 Rollback via ChatModelAdapter Message Transformation

The cleanest approach for rollback context injection is at the adapter level. The `ChatModelAdapter.run()` receives the full `messages` array. We can transform it before sending to the backend:

```typescript
export function createOnboardingAdapter(
  endpoint: string,
  agentBotId: number,
  getStepRegistry: () => StepRegistry, // Injected from Redux
): ChatModelAdapter {
  return {
    async *run({ messages, abortSignal, context }) {
      const stepRegistry = getStepRegistry();
      
      // Inject rollback context into the messages before sending to backend
      const augmentedMessages = injectRollbackContext(messages, stepRegistry);
      
      // ... rest of SSE streaming as before, using augmentedMessages
    },
  };
}

function injectRollbackContext(
  messages: readonly ThreadMessage[],
  stepRegistry: StepRegistry,
): ThreadMessage[] {
  const rolledBackSteps = Object.values(stepRegistry)
    .filter(s => s.status === 'rolled_back' || s.status === 'invalidated');

  if (rolledBackSteps.length === 0) return [...messages];

  // Create a system message with rollback context
  const rollbackMessage: ThreadMessage = {
    id: `rollback-ctx-${Date.now()}`,
    role: 'system',
    content: [{
      type: 'text',
      text: `ROLLBACK: Steps ${rolledBackSteps.map(s => s.stepId).join(', ')} are rolled back. Re-collect their data.`,
    }],
    createdAt: new Date(),
    metadata: { custom: {} },
  };

  // Insert before the latest message
  const result = [...messages];
  result.splice(result.length - 1, 0, rollbackMessage);
  return result;
}
```

This is transparent to assistant-ui — the runtime doesn't know or care that we modified messages before sending them to the backend. The adapter is our code and we have full control.

### 5.4 Message History and Rollback

assistant-ui's `LocalThreadRuntimeCore` uses a `MessageRepository` that supports branching. Messages are append-only within a branch. We do NOT need to delete messages for rollback — we inject rollback context as additional messages (same approach as the current architecture in `architecture-design.md` Section 10.3).

The step registry remains in our Redux store (exactly as designed in the architecture). assistant-ui manages the conversation messages; we manage the step business logic. They interact at the adapter boundary.

---

## 6. What We Build vs What assistant-ui Provides

| Component/Feature | assistant-ui provides | We build on top |
|---|---|---|
| **Runtime/state management** | `LocalRuntime`, Zustand stores, `useAuiState` selectors | — |
| **Thread message model** | `ThreadMessage`, `ToolCallMessagePart`, status types | — |
| **Human-in-the-loop flow** | `unstable_humanToolNames`, `shouldContinue`, auto-continue after `addToolResult` | — |
| **Tool UI registry** | `makeAssistantToolUI`, `ToolUIDisplay` dispatch | Register `SlideToolUI` |
| **Message list (inline mode)** | `ThreadMessages` (FlatList wrapper with all props forwarded) | Custom `renderMessage` |
| **Message part rendering** | `MessageContent` with per-type render props + global tool registry | `renderText`, `SlideToolUI` |
| **Message scoping** | `MessageByIndexProvider`, `AuiProvider`, `Derived` | Used in full-view mode |
| **Composer (text input)** | `ComposerRoot`, `ComposerInput`, `ComposerSend` | Light styling wrapper |
| **Thread persistence** | `createLocalStorageAdapter` (AsyncStorage) | Pass our AsyncStorage |
| **SSE streaming transport** | `ChatModelAdapter` interface (we implement) | `createOnboardingAdapter` |
| **Auth headers** | — | DeviseTokenAuth in adapter |
| **Slide Zod schemas** | — | All block schemas (unchanged from architecture) |
| **SlideRenderer** | — | Full slide rendering component |
| **Block components** | — | All 11 block types (BigText, SingleChoice, etc.) |
| **Block registry** | — | Type→component map |
| **Form state/validation** | — | useState per slide, Zod validation |
| **Presentation mode switching** | — | PresentationContainer, InlinePresentation, FullViewPresentation |
| **Full-view slide extraction** | — | useAuiState selector + MessageByIndexProvider |
| **MiniChatBar** | — | Collapsed chat overlay in full-view mode |
| **Progress bar** | — | ProgressToolUI renderer |
| **Step registry** | — | Redux slice (unchanged from architecture) |
| **Rollback logic** | — | Context injection in adapter |
| **Slide transitions** | — | Reanimated animations |
| **Keyboard avoidance** | — | KeyboardAvoidingView wrapper |
| **Markdown rendering** | — | Reuse existing `AITextPart` |
| **Error handling/display** | — | Custom error UI |
| **Scroll management** | FlatList (basic) | Additional auto-scroll hooks if needed |

### Summary: assistant-ui provides ~30% of the total system, but it's the HARDEST 30%

The runtime layer (streaming, message model, tool registration, human-in-the-loop flow, state management) is the most complex and bug-prone part of any AI chat system. This is exactly where our existing 5 streaming invariants live. assistant-ui handles all of this.

We build the slide-specific layer on top: schemas, renderers, block components, presentation modes, step management. This is **domain-specific work** that no library could provide — it's our product.

---

## 7. Risks and Limitations

### 7.1 What Works Without Source Modification

Everything described in this document works through **public APIs only**:

- `useLocalRuntime` + `ChatModelAdapter` → runtime setup
- `makeAssistantToolUI` → tool registration
- `useAuiState` → state access
- `MessageByIndexProvider` → message scoping
- `MessageContent` with render props → part rendering
- `ThreadMessages` with `renderMessage` + forwarded FlatList props → inline mode
- `addToolResult` via `aui.message().part()` → tool result submission

### 7.2 Potential Issues

| Risk | Impact | Mitigation |
|---|---|---|
| **Zod 4 peer dep** | Medium — our Zod 3 schemas may not work with assistant-ui's `tool()` helper | Skip `tool()` helper; define tools without it, or upgrade to Zod 4 (backward compatible for basic schemas) |
| **`unstable_humanToolNames`** has "unstable" prefix | Low — the API is clearly intentional and used in production web apps; the prefix signals it may be renamed, not removed | Pin version; update if renamed |
| **FlatList vs FlashList** | Medium — `ThreadMessages` uses FlatList, our existing chat uses FlashList for performance | For inline mode, use `ThreadMessages` (FlatList is fine for onboarding's ~20 items). Could also build custom using `useAuiState` + FlashList if needed. |
| **Store scope types** | Low — assistant-ui uses `@assistant-ui/store` with custom scope types (`s.thread`, `s.message`, etc.) that we need to learn | Types are well-defined; IDE autocomplete works |
| **Version 0.x breaking changes** | Medium — API surface could change between 0.1 and 0.2 | Pin exact versions; the wrapper layer isolates our code from breaking changes |
| **No ExternalStoreRuntime for bridging to Redux** | Low — we don't need it; `LocalRuntime` + our Redux step registry coexist cleanly | Two separate concerns: assistant-ui owns conversation state, Redux owns step business state |
| **React Native 0.76 compatibility** | Low — peer dep is `"*"`, and all RN APIs used are basic (View, FlatList, TextInput, Pressable, Text). No RN 0.84-specific APIs used. | Test early; fall back to `@assistant-ui/core` only if issues |

### 7.3 What WOULD Require Source Modification

Based on thorough source analysis, the following scenarios would require forking or patching:

1. **Custom message types beyond ThreadMessage union** — The `ThreadMessage` type is a fixed union of system/user/assistant. If we needed a custom "slide" message role, we'd need to modify core types. **But we don't need this** — slides are tool calls within assistant messages, which is the intended pattern.

2. **Custom part types beyond the fixed set** — The `MessageContent` switch handles: text, tool-call, image, reasoning, source, file, data. If we needed a completely new part type, we'd need to modify the switch. **But we don't need this** — `tool-call` with our `render_slide` tool name is sufficient, and `data` parts exist as an escape hatch.

3. **Replacing FlatList with FlashList in ThreadMessages** — The RN `ThreadMessages` component hard-codes `FlatList`. To use FlashList, we'd need to either fork the component or build our own using `useAuiState`. **Building our own is trivial** — `ThreadMessages` is 61 lines, and we can replicate its logic with FlashList in ~80 lines using `useAuiState` + `MessageScope`.

4. **Changing the shouldContinue logic** — If we needed different auto-continue behavior (e.g., pausing on ALL tool calls, not just human ones), we'd need to modify `should-continue.ts`. **But the existing logic is exactly what we need.**

---

## 8. Comparison: Effort Estimate

### Wrapper Approach (This Document)

| Task | Days | Risk |
|---|---|---|
| Install packages, verify compatibility on Expo SDK 52 / RN 0.76 | 0.5 | Low |
| `ChatModelAdapter` (SSE streaming, auth headers, message conversion) | 1.5 | Low — straightforward fetch + SSE parsing |
| `SlideToolUI` registration + `SlideRenderer` wiring | 0.5 | Low — direct API usage |
| Inline presentation (`ThreadMessages` + custom `renderMessage`) | 1 | Low |
| Full-view presentation (`useAuiState` + `MessageByIndexProvider`) | 1.5 | Medium — novel pattern, needs testing |
| `MiniChatBar` (collapsed chat in full-view) | 1 | Low |
| `PresentationContainer` mode switching | 0.5 | Low |
| Block components (MVP 5: BigText, SingleChoice, TextInput, InfoCard, Success) | 3-4 | Low — standard RN components |
| `SlideRenderer` (form state, validation, actions) | 2 | Low |
| Block registry | 0.5 | Low |
| Redux `onboardingSlice` (step registry, flow state) | 1.5 | Low — proven patterns |
| Free-text handling (resolve pending slide + send) | 0.5 | Low |
| Rollback context injection in adapter | 0.5 | Low |
| `ComposerInput` styling + keyboard avoidance | 0.5 | Low |
| Progress tool UI + slide skeleton | 0.5 | Low |
| Testing + integration debugging | 2-3 | Medium |
| **Total** | **17-21 days** | |

### Custom Build Approach (From Architecture v2)

| Task | Days | Risk |
|---|---|---|
| Extend `useAIChat` hook for onboarding (different endpoint, `addToolOutput`) | 1-2 | Low |
| Build `useOnboardingChat` hook with `sendAutomaticallyWhen` | 1.5 | Medium — new invariant territory |
| Tool part type spike (resolve shape uncertainty — Section 14.1) | 1 | **HIGH — this is an unknown** |
| Extend `AIPartRenderer` for `render_slide` and `update_progress` | 1 | Low |
| Build slide rendering pipeline (`SlideRenderer`, `BlockRenderer`) | 2 | Low |
| Block components (MVP 5) | 3-4 | Low |
| Block registry | 0.5 | Low |
| Redux `onboardingSlice` (step registry, flow state) | 1.5 | Low |
| `PresentationContainer` + Inline presentation | 1 | Low |
| Full-view presentation + `MiniChatBar` | 2 | Medium |
| Free-text handling (resolve pending tool call) | 1 | Medium — must verify `addToolOutput` behavior |
| Rollback context injection | 0.5 | Low |
| Slide skeleton + streaming UX | 0.5 | Low |
| Testing + integration debugging | 3-4 | Medium |
| **Total** | **20-26 days** | |

### Key Differences

| Factor | Wrapper Approach | Custom Build |
|---|---|---|
| **Days** | 17-21 | 20-26 |
| **Savings** | ~3-5 days | — |
| **Where savings come from** | No runtime/state build; no tool part spike; no streaming invariant work; `addToolResult` just works | Must handle all streaming mechanics, tool part shapes, invariants |
| **Biggest risk** | RN 0.76 compatibility (mitigated: test day 1) | Tool part type spike (Section 14.1 of arch doc — unknown shape at runtime) |
| **Streaming bugs** | assistant-ui handles (battle-tested from 1,100+ web releases) | Our responsibility (proven for chat, unproven for tool-call flows) |
| **Lines of code we write** | ~2,500 (slides + blocks + presentation + redux) | ~3,500 (same + runtime + transport + part rendering + invariants) |
| **Lines of code we DON'T write** | ~1,000 (runtime, state, tool dispatch, message model) | 0 |
| **Dependency risk** | Medium (v0.1.x) | Zero |
| **Maintenance** | Track upstream API changes (low frequency — core is stable) | Own everything |
| **Web story (future)** | Excellent — same core, swap `@assistant-ui/react` for web UI | Must build from scratch |
| **Breaking change impact** | Our wrapper layer isolates us — update adapter + tool registration | N/A |

### The Tool Part Type Spike: A Concrete Advantage

The custom build approach has an acknowledged unknown: Section 14.1 of the architecture document describes a required spike to determine the actual runtime shape of tool call parts in AI SDK v5. The properties might be `toolName`/`args` or `type: 'tool-render_slide'`/`input`. All code examples use helper functions that abstract over this uncertainty.

With assistant-ui, **this problem doesn't exist**. The `ToolCallMessagePart` type is well-defined:

```typescript
// Source: packages/core/src/types/message.ts line 59-74
type ToolCallMessagePart = {
  readonly type: "tool-call";
  readonly toolCallId: string;
  readonly toolName: string;
  readonly args: TArgs;
  readonly result?: TResult | undefined;
  readonly isError?: boolean | undefined;
  readonly argsText: string;
  ...
};
```

And the dispatch in `MessageContent` (line 128: `case "tool-call"`) is definitive. There is no ambiguity about the shape. The adapter translates whatever our backend sends into this format, and the tool registry handles the rest.

---

## 9. Complete Wiring: OnboardingScreen

Here's how all the pieces compose into the final screen:

```typescript
// src/screens/OnboardingScreen.tsx

import { AssistantProvider } from '@assistant-ui/react-native';
import { useOnboardingRuntime } from '@/presentation/hooks/onboarding/useOnboardingRuntime';
import { SlideToolUI } from '@/presentation/components/onboarding/tools/SlideToolUI';
import { ProgressToolUI } from '@/presentation/components/onboarding/tools/ProgressToolUI';
import { PresentationContainer } from '@/presentation/components/onboarding/PresentationContainer';
import { OnboardingHeader } from '@/presentation/components/onboarding/OnboardingHeader';
import { OnboardingComposer } from '@/presentation/components/onboarding/OnboardingComposer';
import { useAppSelector } from '@/store';
import { View } from 'react-native';

export const OnboardingScreen = ({ agentBotId }: { agentBotId: number }) => {
  // 1. Create the runtime (LocalRuntime with our SSE adapter)
  const runtime = useOnboardingRuntime(agentBotId);
  
  // 2. Get presentation mode from Redux
  const presentationMode = useAppSelector(
    (s) => s.onboarding.activePresentationMode,
  );

  return (
    // 3. AssistantProvider makes the runtime available to all descendants
    <AssistantProvider runtime={runtime}>
      {/* 4. Tool UI registrations — these are render-null components
          that register their renderers in the global store.
          Verified: makeAssistantToolUI returns a component that calls
          useAssistantToolUI → aui.tools().setToolUI(toolName, render) */}
      <SlideToolUI />
      <ProgressToolUI />
      
      {/* 5. Screen layout */}
      <View style={{ flex: 1 }}>
        <OnboardingHeader />
        
        {/* 6. Presentation mode strategy — inline or full-view */}
        <PresentationContainer mode={presentationMode} />
        
        {/* 7. Input bar — wraps ComposerInput with our styling */}
        <OnboardingComposer />
      </View>
    </AssistantProvider>
  );
};
```

```typescript
// src/presentation/components/onboarding/OnboardingComposer.tsx

import { ComposerRoot, ComposerInput, ComposerSend } from '@assistant-ui/react-native';
import { View, Pressable, Text } from 'react-native';

/**
 * Composer wraps assistant-ui's ComposerInput with our styling.
 * 
 * ComposerInput handles:
 * - Text state management (connected to the runtime's composer state)
 * - Send on submit (connected to runtime.composer.send())
 * - Placeholder text
 * 
 * We just style it with twrnc.
 */
export const OnboardingComposer = () => {
  return (
    <ComposerRoot>
      <View style={{ flexDirection: 'row', padding: 8 }}>
        <ComposerInput
          placeholder="Type a message..."
          style={{ flex: 1, padding: 12, borderRadius: 20, /* twrnc styles */ }}
          multiline
        />
        <ComposerSend>
          <Pressable style={{ padding: 12 }}>
            <Text>Send</Text>
          </Pressable>
        </ComposerSend>
      </View>
    </ComposerRoot>
  );
};
```

### Data Flow Diagram

```
┌──────────────────────────────────────────────────────────────┐
│  OnboardingScreen                                            │
│  ┌──────────────────────────────────────────────────────────┐│
│  │  AssistantProvider (runtime={LocalRuntime})               ││
│  │  ┌──────────────────────────────────────────────────────┐││
│  │  │  SlideToolUI (registers render_slide renderer)       │││
│  │  │  ProgressToolUI (registers update_progress renderer)  │││
│  │  └──────────────────────────────────────────────────────┘││
│  │  ┌──────────────────────────────────────────────────────┐││
│  │  │  PresentationContainer                               │││
│  │  │  ├── InlinePresentation (ThreadMessages)              │││
│  │  │  │   └── MessageContent                               │││
│  │  │  │       ├── renderText → AITextPart                  │││
│  │  │  │       └── ToolUIDisplay                            │││
│  │  │  │           └── s.tools.tools['render_slide']        │││
│  │  │  │               └── SlideToolUI.render               │││
│  │  │  │                   └── SlideRenderer                │││
│  │  │  │                       └── BlockRenderer → Blocks   │││
│  │  │  │                                                    │││
│  │  │  └── FullViewPresentation (useAuiState)               │││
│  │  │      ├── MiniChatBar (latestAIText)                   │││
│  │  │      └── MessageByIndexProvider                       │││
│  │  │          └── MessageContent                           │││
│  │  │              └── ToolUIDisplay                        │││
│  │  │                  └── SlideToolUI.render               │││
│  │  │                      └── SlideRenderer                │││
│  │  └──────────────────────────────────────────────────────┘││
│  │  ┌──────────────────────────────────────────────────────┐││
│  │  │  OnboardingComposer (ComposerInput + ComposerSend)   │││
│  │  └──────────────────────────────────────────────────────┘││
│  └──────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────┘

                        ┌───────────────────┐
  User taps "Continue"  │                   │
  ─────────────────────▶│  SlideRenderer    │
                        │  calls addResult  │
                        └────────┬──────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │  LocalThreadRuntimeCore  │
                    │  .addToolResult()        │
                    │  (line 483-529)          │
                    └────────┬────────────────┘
                             │
                             ▼
                    ┌─────────────────────────┐
                    │  shouldContinue()        │
                    │  returns true            │
                    │  (tool has result now)   │
                    └────────┬────────────────┘
                             │
                             ▼
                    ┌─────────────────────────┐
                    │  performRoundtrip()      │
                    │  → adapter.run()         │
                    │  → SSE to our backend    │
                    └────────┬────────────────┘
                             │
                             ▼
                    ┌─────────────────────────┐
                    │  AI sees tool result,    │
                    │  generates next slide    │
                    │  or text response        │
                    └─────────────────────────┘
```

---

## 10. What Changes From the Architecture v2

If we adopt this wrapper approach, here's what changes in the architecture document:

### Unchanged (95% of the architecture)
- All Zod block schemas (Section 2) — identical
- Flow configuration schemas (Section 3) — identical
- Step registry schemas (Section 4) — identical
- Tool taxonomy (Section 5) — identical (same tools, same semantics)
- Component architecture (Section 6) — mostly identical (SlideRenderer, BlockRenderer, blocks, MiniChatBar, PresentationContainer)
- State machine design (Section 7) — identical (same states, same transitions)
- Data flow (Section 9) — identical (same happy path, same free-text handling, same error recovery)
- Step rollback (Section 10) — identical (same context injection, same cascading invalidation)
- Static vs dynamic steps (Section 11) — identical (server-side enforcement)
- Cross-platform strategy (Section 12) — IMPROVED (shared `@assistant-ui/core` for web)

### Changed
| What | Architecture v2 (Custom) | Wrapper Approach |
|---|---|---|
| **Runtime/transport** | `useChat` + `DefaultChatTransport` | `useLocalRuntime` + `ChatModelAdapter` |
| **Message model** | AI SDK v5 `UIMessage` | assistant-ui `ThreadMessage` |
| **Tool registration** | Manual switch in `AIPartRenderer` | `makeAssistantToolUI` global registry |
| **Tool result submission** | `addToolOutput` (AI SDK v5) | `addToolResult` (assistant-ui's wrapper) |
| **Message list** | FlashList (`AIChatMessagesList`) | FlatList (`ThreadMessages`) or custom |
| **State access** | Redux selectors + SDK state | `useAuiState` selectors + Redux for step registry |
| **Free-text resolution** | `addToolOutput({ action: 'skip' })` then `sendMessage()` | `addToolResult({ action: 'skip' })` then `aui.composer().send()` |
| **Streaming invariants** | Our 5 invariants | Handled by assistant-ui runtime |
| **Tool part shape** | Unknown (spike needed — Section 14.1) | Defined: `ToolCallMessagePart` |
| **Text/part rendering** | `AITextPart`, `AIToolPart`, `AIReasoningPart` | `MessageContent` render props |

### NOT Changed (Critical Architecture Decisions Preserved)
- D1: Single `render_slide` tool with block array ✅
- D2: Inline default presentation mode ✅
- D3: Dual presentation modes ✅
- D4: MiniChatBar for full-view mode ✅
- D5: StepRegistry in Redux ✅
- D6: Rollback via context injection ✅
- D7: `undo_step` tool ✅
- D8: Server-side template enforcement ✅
- D10: Form state in local useState ✅
- D11: Phased implementation ✅

---

## 11. Conclusion

### The Wrapper Approach Is Viable

Every API we need exists and works as documented:

1. **`ChatModelAdapter`** — Simple async generator interface. We implement SSE streaming + auth headers. No hacks needed.

2. **`unstable_humanToolNames`** — Exactly the mechanism for human-in-the-loop slides. The runtime pauses, the UI renders, user submits, runtime auto-continues. Source-verified behavior.

3. **`makeAssistantToolUI`** — Global tool renderer registration. Our `SlideToolUI` renders full-screen slides inside `MessageContent`. No layout constraints. Source-verified.

4. **`useAuiState`** — Direct state access for full-view mode. We extract the active tool call and render it outside the message list. Source-verified.

5. **`MessageByIndexProvider`** — Scopes `MessageContent` to a specific message. Enables tool UI dispatch + `addResult` wiring in full-view mode. Source-verified.

6. **`ThreadMessages`** — FlatList wrapper with all props forwarded. Custom `renderMessage` for full-width slides. Source-verified.

### The Architecture Is Cleaner

The wrapper approach provides a cleaner separation of concerns than the custom build:

- **assistant-ui owns conversation mechanics** — message model, streaming, tool dispatch, auto-continue, state management. These are general-purpose and well-tested.
- **We own slide mechanics** — schemas, block rendering, form state, presentation modes, step management. These are domain-specific and uniquely ours.
- **The adapter is the bridge** — `ChatModelAdapter` translates between assistant-ui's world and our backend. Rollback context injection happens here transparently.

### Recommendation

**INSTALL `@assistant-ui/react-native` as a dependency and build the slide system on top.**

The concrete code in this document demonstrates that every requirement from the architecture can be met through composition — wrappers, custom renderers, and the adapter pattern. No source modification is needed.

The 3-5 day savings is real but secondary. The primary advantage is **architectural**: we get a battle-tested runtime layer for free, eliminate the tool part type spike, avoid building streaming invariants for a new flow, and gain a path to web support via `@assistant-ui/react`.

### Suggested First Step

A 1-day validation spike:

1. Install `@assistant-ui/react-native` in the Chatwoot mobile app
2. Verify it builds and resolves correctly on Expo SDK 52 / RN 0.76
3. Set up `useLocalRuntime` with a mock `ChatModelAdapter` that returns a hardcoded `render_slide` tool call
4. Mount `SlideToolUI` with a minimal renderer
5. Verify the slide renders and `addResult` triggers the next roundtrip

If this spike succeeds, proceed with the full implementation. If it fails on RN 0.76 compatibility, fall back to the custom build approach with high confidence that it was the right call.
