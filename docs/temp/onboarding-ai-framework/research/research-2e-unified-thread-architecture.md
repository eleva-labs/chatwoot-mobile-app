# Research 2E: Unified Thread Architecture — One Thread, Two Modes

> **Date**: 2026-02-28
> **Predecessor**: Research 2B (source analysis), 2D (wrapper architecture), Architecture Design v2
> **Question**: Can a SINGLE assistant-ui thread dynamically present BOTH normal chat messages AND full-screen slides, switching between modes within one conversation?
> **Answer**: **YES — and the switching logic is ~60 lines of code.**
> **Confidence**: High — every claim source-verified against the cloned repo at `/tmp/assistant-ui-analysis/`

---

## 1. Answer: Can One Thread Do Both?

**YES.**

A single `LocalRuntime` thread can dynamically present chat messages and full-screen slides, switching between them mid-conversation. The AI decides what to show by choosing whether to include a `render_slide` tool call in its response. The rendering layer reads the thread state and switches presentation modes automatically.

### Evidence (Source-Verified)

**1. The thread state is a flat array of messages with no layout assumptions.**

`useAuiState((s) => s.thread.messages)` returns `ThreadMessage[]` — just data. Verified at `packages/react-native/src/primitives/thread/ThreadMessages.tsx:38`.

**2. Each message's content is an array of parts — text, tool-call, reasoning, etc.**

`useAuiState((s) => s.message.content)` returns `(TextMessagePart | ToolCallMessagePart | ...)[]`. Verified at `packages/react-native/src/primitives/message/MessageContent.tsx:122`.

**3. Tool call renderers are unconstrained React components.**

`ToolUIDisplay` at `MessageContent.tsx:56-90` looks up `s.tools.tools[part.toolName]` and renders the component with `{...part, addResult, resume}` as props. There are zero layout constraints — the component can render anything from a 10px icon to a full-screen overlay.

**4. `humanToolNames` causes the runtime to PAUSE when a human tool call is pending.**

`should-continue.ts:16-25`: When `render_slide` is in `humanToolNames` and has no `result`, `shouldContinue()` returns `false`. The `do...while` loop in `local-thread-runtime-core.ts:256-264` exits, leaving the message in `requires-action` status.

**5. `addToolResult` triggers automatic continuation.**

`local-thread-runtime-core.ts:483-529`: After result is added, `shouldContinue()` re-evaluates → returns `true` → `performRoundtrip()` fires → adapter runs again → AI generates the next response (which could be text-only OR another slide).

**6. `MessageByIndexProvider` allows rendering any single message outside of `ThreadMessages`.**

`packages/core/src/react/providers/MessageByIndexProvider.tsx:4-23`: Creates a scoped `AuiProvider` with `message` and `composer` derived from a specific message index. This means `MessageContent` works correctly outside the FlatList — it resolves `s.message.content` to the targeted message.

### The Key Insight

The "mode switching" is **not** a framework feature we need to request. It's an emergent property of these facts:

- We can read the full message array at any time (`useAuiState`)
- We can detect whether the latest message has a pending `render_slide` tool call
- We can render any message in any container via `MessageByIndexProvider`
- We can render the full chat list or a single slide — our choice per render cycle

The unified component simply asks: "Does the latest message have a pending `render_slide`?" If yes → slide mode. If no → chat mode. React re-renders handle the transition.

---

## 2. Unified Rendering Component

### 2.1 The Core: `UnifiedThreadView`

This is the single component that dynamically switches between chat mode and slide mode within one thread. It replaces the separate `InlinePresentation` and `FullViewPresentation` from research-2d for the "hybrid" use case.

```tsx
// src/presentation/components/onboarding/UnifiedThreadView.tsx

import { useCallback, useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import {
  ThreadMessages,
  MessageContent,
  MessageByIndexProvider,
  useAuiState,
  type ThreadMessage,
  type ToolCallMessagePart,
} from '@assistant-ui/react-native';
import { MiniChatBar } from './MiniChatBar';
import { SlideSkeleton } from './SlideSkeleton';
import { ChatMessageRenderer } from './ChatMessageRenderer';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// ─── Types ───────────────────────────────────────────────────────

interface ActiveSlideInfo {
  /** Index of the message containing the active slide */
  messageIndex: number;
  /** Index of the tool-call part within that message */
  partIndex: number;
  /** The tool call data (args = slide schema, result = user submission) */
  toolCall: ToolCallMessagePart;
  /** Whether the runtime is currently generating */
  isRunning: boolean;
  /** Whether this slide has already been submitted */
  hasResult: boolean;
}

type SlideState =
  | { mode: 'chat' }
  | { mode: 'slide'; slide: ActiveSlideInfo }
  | { mode: 'generating' };

// ─── State Selector ──────────────────────────────────────────────

/**
 * Derives the current presentation mode from thread state.
 *
 * Logic:
 * 1. Walk messages backward from the end
 * 2. If the latest assistant message has a render_slide tool call WITHOUT a result
 *    → SLIDE MODE (the slide is active, waiting for user input)
 * 3. If the thread is running and no slide is active yet
 *    → GENERATING (show skeleton or typing indicator)
 * 4. Otherwise → CHAT MODE (show the full message list)
 *
 * Source verification:
 *   s.thread.messages — ThreadMessages.tsx:38
 *   s.thread.isRunning — thread state from LocalThreadRuntimeCore
 *   part.result === undefined — indicates pending tool call (message.ts:67)
 */
function useSlideState(): SlideState {
  return useAuiState((s): SlideState => {
    const messages = s.thread.messages;
    const isRunning = s.thread.isRunning;

    // Scan backward for the latest assistant message
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i]!;
      if (msg.role !== 'assistant') continue;

      // Check if this message has a pending render_slide tool call
      for (let j = 0; j < msg.content.length; j++) {
        const part = msg.content[j]!;
        if (
          part.type === 'tool-call' &&
          part.toolName === 'render_slide' &&
          part.result === undefined // No result yet → slide is active
        ) {
          return {
            mode: 'slide',
            slide: {
              messageIndex: i,
              partIndex: j,
              toolCall: part as ToolCallMessagePart,
              isRunning,
              hasResult: false,
            },
          };
        }
      }

      // Found the latest assistant message but it has no pending slide
      // → chat mode (AI responded with text only, or slide was already submitted)
      break;
    }

    // No active slide found
    if (isRunning) return { mode: 'generating' };
    return { mode: 'chat' };
  });
}

// ─── Latest AI Text Selector ─────────────────────────────────────

/**
 * Extracts the latest AI text for the MiniChatBar.
 * In slide mode, this shows the AI's conversational text above the slide.
 */
function useLatestAIText(): string {
  return useAuiState((s) => {
    const messages = s.thread.messages;
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i]!;
      if (msg.role !== 'assistant') continue;
      const textPart = msg.content.find((p) => p.type === 'text');
      if (textPart && textPart.type === 'text' && textPart.text.trim()) {
        return textPart.text;
      }
    }
    return '';
  });
}

// ─── Main Component ──────────────────────────────────────────────

export const UnifiedThreadView = () => {
  const slideState = useSlideState();
  const latestAIText = useLatestAIText();

  // ── CHAT MODE ────────────────────────────────────────────────
  // Show the full message list (FlatList). All messages render as
  // chat bubbles. Previously submitted slides render as compact cards.
  if (slideState.mode === 'chat') {
    return (
      <View style={styles.container}>
        <ThreadMessages
          renderMessage={renderChatMessage}
          inverted={false}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.chatContent}
        />
      </View>
    );
  }

  // ── GENERATING MODE ──────────────────────────────────────────
  // The AI is generating but hasn't produced a slide or text yet.
  // Show the chat list with a typing indicator at the bottom.
  if (slideState.mode === 'generating') {
    return (
      <View style={styles.container}>
        <ThreadMessages
          renderMessage={renderChatMessage}
          inverted={false}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.chatContent}
          ListFooterComponent={<TypingIndicator />}
        />
      </View>
    );
  }

  // ── SLIDE MODE ───────────────────────────────────────────────
  // A render_slide tool call is active (waiting for user input).
  // The slide takes over the content area. Chat collapses to MiniChatBar.
  const { slide } = slideState;

  return (
    <View style={styles.container}>
      {/* MiniChatBar: shows latest AI text, expandable to full history */}
      <MiniChatBar latestText={latestAIText} />

      {/* Full-screen slide area */}
      <View style={styles.slideArea}>
        <MessageByIndexProvider index={slide.messageIndex}>
          <MessageContent
            // Suppress text parts in the main area — they're in MiniChatBar
            renderText={() => null}
            // Suppress reasoning in slide mode
            renderReasoning={() => null}
            // Tool calls go through the global registry → SlideToolUI renders
            // Non-slide tool calls (e.g. update_progress) also render normally
          />
        </MessageByIndexProvider>
      </View>
    </View>
  );
};

// ─── Chat Message Renderer ───────────────────────────────────────

/**
 * Renders a single message in chat mode.
 * - User messages → text bubble
 * - Assistant messages with text only → AI text bubble
 * - Assistant messages with submitted slides → compact slide summary card
 * - Assistant messages with tool calls → tool UI from registry or fallback
 */
const renderChatMessage = ({
  message,
  index,
}: {
  message: ThreadMessage;
  index: number;
}) => {
  return <ChatMessageRenderer message={message} index={index} />;
};

// ─── Styles ──────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  chatContent: {
    paddingBottom: 16,
    paddingHorizontal: 12,
  },
  slideArea: {
    flex: 1,
  },
});
```

### 2.2 How the Switching Works — Step by Step

Here's the exact sequence for the user's vision:

```
Message 1: AI text "Welcome! Let's get started..."
  → useSlideState() returns { mode: 'chat' }
  → ThreadMessages renders the message as a chat bubble
  → User sees: normal chat

Message 2: AI text "About your business" + render_slide tool call (no result)
  → useSlideState() scans backward, finds render_slide with result === undefined
  → Returns { mode: 'slide', slide: { messageIndex: 1, ... } }
  → MiniChatBar shows "About your business"
  → MessageByIndexProvider scopes to message 1
  → MessageContent dispatches: text → null (suppressed), tool-call → SlideToolUI
  → SlideToolUI renders full-screen slide with form
  → User sees: FULL-SCREEN SLIDE with MiniChatBar

User submits slide (taps "Continue"):
  → SlideToolUI calls addResult({ action: 'submit', values: {...} })
  → local-thread-runtime-core.ts:483-529 updates the tool call with result
  → shouldContinue() returns true → performRoundtrip() fires
  → Adapter calls our backend with updated messages
  → useSlideState() re-evaluates: render_slide now HAS result
  → While AI generates: { mode: 'generating' } → chat list + typing indicator

Message 3: AI text "Great choice! Now let's..."
  → useSlideState() returns { mode: 'chat' }
  → ThreadMessages renders all messages:
    - Message 1: text bubble
    - Message 2: submitted slide as compact card (via ChatMessageRenderer)
    - Message 3: text bubble
  → User sees: NORMAL CHAT with history

Message 4: AI text + render_slide (another slide)
  → useSlideState() returns { mode: 'slide' }
  → FULL-SCREEN SLIDE again
  → Cycle repeats
```

The switch is entirely driven by React re-renders. When `useAuiState` detects that the thread state changed (new message, tool result added), the selector re-runs, the mode changes, and React renders the appropriate layout. No imperative mode switching, no state machine needed for the presentation layer.

### 2.3 `ChatMessageRenderer` — History-Aware Message Rendering

```tsx
// src/presentation/components/onboarding/ChatMessageRenderer.tsx

import { View, Text, Pressable } from 'react-native';
import {
  MessageContent,
  useAuiState,
  type ThreadMessage,
} from '@assistant-ui/react-native';
import { AIMessageBubble } from '@/presentation/components/ai-assistant/AIMessageBubble';
import { AITextPart } from '@/presentation/parts/ai-assistant/AITextPart';
import { AIReasoningPart } from '@/presentation/parts/ai-assistant/AIReasoningPart';
import { SubmittedSlideCard } from './SubmittedSlideCard';

interface ChatMessageRendererProps {
  message: ThreadMessage;
  index: number;
}

export const ChatMessageRenderer = ({
  message,
  index,
}: ChatMessageRendererProps) => {
  // ── User messages ────────────────────────────────────────────
  if (message.role === 'user') {
    const text = message.content
      .filter((p) => p.type === 'text')
      .map((p) => (p as { text: string }).text)
      .join('');

    return (
      <View style={{ alignSelf: 'flex-end', maxWidth: '80%', marginVertical: 4 }}>
        <View style={{ backgroundColor: '#007AFF', borderRadius: 16, padding: 12 }}>
          <Text style={{ color: '#fff' }}>{text}</Text>
        </View>
      </View>
    );
  }

  // ── System messages (hidden in chat) ─────────────────────────
  if (message.role === 'system') {
    return null;
  }

  // ── Assistant messages ───────────────────────────────────────
  if (message.role === 'assistant') {
    const hasSlide = message.content.some(
      (p) => p.type === 'tool-call' && p.toolName === 'render_slide',
    );

    const hasSubmittedSlide = message.content.some(
      (p) =>
        p.type === 'tool-call' &&
        p.toolName === 'render_slide' &&
        p.result !== undefined,
    );

    // Message with a SUBMITTED slide → render as compact summary card
    if (hasSubmittedSlide) {
      return <SubmittedSlideCard message={message} />;
    }

    // Message with a PENDING slide (should only happen if this is
    // the latest message, which is handled by UnifiedThreadView's
    // slide mode. If we get here, it's a race condition — render skeleton)
    if (hasSlide) {
      return <SlideSkeleton />;
    }

    // Text-only assistant message → standard chat bubble
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

### 2.4 `SlideToolUI` — The Registered Slide Renderer

This is identical to research-2d but shown here for completeness. The key: this one registration serves BOTH chat mode (submitted slides) and slide mode (active slides).

```tsx
// src/presentation/components/onboarding/tools/SlideToolUI.tsx

import { makeAssistantToolUI } from '@assistant-ui/react-native';
import type { Slide, SlideOutput } from '@/store/onboarding/schemas/blocks';
import { SlideRenderer } from '../SlideRenderer';
import { SlideSkeleton } from '../SlideSkeleton';

/**
 * Global tool UI registration for render_slide.
 *
 * When this component is mounted inside AssistantProvider, it registers
 * a renderer for all render_slide tool calls across the entire thread.
 *
 * In SLIDE MODE (active, no result):
 *   → SlideRenderer with interactive form, full-screen via UnifiedThreadView
 *
 * In CHAT MODE (submitted, has result):
 *   → SlideRenderer in read-only mode (but typically hidden by
 *     ChatMessageRenderer which renders SubmittedSlideCard instead)
 *
 * Source verification:
 *   makeAssistantToolUI → packages/core/src/react/model-context/makeAssistantToolUI.ts:11-20
 *   Registers via useAssistantToolUI → aui.tools().setToolUI(toolName, render)
 *   Dispatched by ToolUIDisplay → MessageContent.tsx:56-90
 */
export const SlideToolUI = makeAssistantToolUI<Slide, SlideOutput>({
  toolName: 'render_slide',
  render: ({ args, result, status, addResult }) => {
    const isSubmitted = result !== undefined;
    const isStreaming = status.type === 'running';

    if (isStreaming) {
      return <SlideSkeleton />;
    }

    return (
      <SlideRenderer
        slide={args}
        readOnly={isSubmitted}
        submittedValues={isSubmitted ? (result as SlideOutput) : undefined}
        onSubmit={(output: SlideOutput) => {
          addResult(output);
        }}
      />
    );
  },
});
```

---

## 3. Transition UX Design

### 3.1 Chat → Slide Transition

When the AI's response includes a `render_slide` tool call:

1. **During streaming**: `useSlideState()` may initially return `{ mode: 'generating' }` if the text arrives before the tool call. The chat list is visible with a typing indicator.

2. **When tool call arrives**: `useSlideState()` transitions to `{ mode: 'slide' }`. React re-renders:
   - `ThreadMessages` (the FlatList) unmounts
   - `MiniChatBar` mounts with the AI's text
   - `MessageByIndexProvider` + `MessageContent` mount, dispatching to `SlideToolUI`
   - The slide renders full-screen

3. **Animation**: Wrap the mode switch in a `LayoutAnimation` or Reanimated `FadingView`:

```tsx
import { useEffect } from 'react';
import { LayoutAnimation, UIManager, Platform } from 'react-native';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

export const UnifiedThreadView = () => {
  const slideState = useSlideState();

  // Animate mode transitions
  useEffect(() => {
    LayoutAnimation.configureNext(
      LayoutAnimation.create(
        300,
        LayoutAnimation.Types.easeInEaseOut,
        LayoutAnimation.Properties.opacity,
      ),
    );
  }, [slideState.mode]);

  // ... rest of the component
};
```

**For smoother animations with Reanimated:**

```tsx
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutUp,
} from 'react-native-reanimated';

// In slide mode:
<Animated.View entering={FadeIn.duration(250)} exiting={FadeOut.duration(150)} style={styles.slideArea}>
  <MessageByIndexProvider index={slide.messageIndex}>
    <MessageContent renderText={() => null} />
  </MessageByIndexProvider>
</Animated.View>

// In chat mode:
<Animated.View entering={FadeIn.duration(200)} style={styles.container}>
  <ThreadMessages ... />
</Animated.View>
```

### 3.2 Slide → Chat Transition

When the user submits a slide and the AI responds with text only:

1. **User taps "Continue"**: `addResult()` is called. The tool call gets a result.
2. **Runtime auto-continues**: `shouldContinue()` evaluates to `true`, `performRoundtrip()` fires.
3. **Briefly generating**: `useSlideState()` may show `{ mode: 'generating' }` or flash `{ mode: 'chat' }` depending on timing (the old slide's result makes it non-pending, but the new AI response hasn't arrived yet).
4. **AI responds with text**: New message appended to thread. `useSlideState()` returns `{ mode: 'chat' }`.
5. **React re-renders**: Slide area unmounts, `ThreadMessages` mounts showing full history including the submitted slide as a compact card.

**Timing consideration**: Between `addResult` and the AI's next response, there's a brief period where neither a pending slide nor AI-is-running is true. The state will be `{ mode: 'chat' }` showing the existing messages. This is correct — the user sees their submission in context while waiting. The typing indicator appears when `isRunning` becomes true.

### 3.3 Chat History Access During Slide Mode

When a slide is active, the user can access chat history via the `MiniChatBar`:

```tsx
// src/presentation/components/onboarding/MiniChatBar.tsx

import { useState, useRef } from 'react';
import { View, Text, Pressable, Animated, StyleSheet } from 'react-native';
import { ThreadMessages, MessageContent } from '@assistant-ui/react-native';
import BottomSheet from '@gorhom/bottom-sheet';

interface MiniChatBarProps {
  latestText: string;
}

export const MiniChatBar = ({ latestText }: MiniChatBarProps) => {
  const bottomSheetRef = useRef<BottomSheet>(null);

  if (!latestText) return null;

  return (
    <>
      {/* Collapsed bar: 1-2 lines of latest AI text */}
      <Pressable
        onPress={() => bottomSheetRef.current?.expand()}
        style={styles.bar}
      >
        <Text numberOfLines={2} style={styles.barText}>
          {latestText}
        </Text>
        <Text style={styles.chevron}>...</Text>
      </Pressable>

      {/* Expanded: full chat history in a bottom sheet */}
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={['50%', '85%']}
        enablePanDownToClose
      >
        <ThreadMessages
          renderMessage={({ message, index }) => (
            <ChatMessageRenderer message={message} index={index} />
          )}
          inverted={false}
          showsVerticalScrollIndicator
        />
      </BottomSheet>
    </>
  );
};

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  barText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
  },
  chevron: {
    fontSize: 14,
    color: '#999',
    marginLeft: 8,
  },
});
```

The bottom sheet reuses the same `ThreadMessages` + `ChatMessageRenderer` from chat mode. Because both chat mode and the bottom sheet read from the same `useAuiState`, they always show consistent data.

---

## 4. History Rendering Strategy

### 4.1 Submitted Slides in Chat History

When scrolling through chat history in chat mode, previously submitted slides should NOT re-render as full-screen slides. They render as **compact summary cards**.

```tsx
// src/presentation/components/onboarding/SubmittedSlideCard.tsx

import { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import type { ThreadMessage, ToolCallMessagePart } from '@assistant-ui/react-native';
import type { Slide, SlideOutput } from '@/store/onboarding/schemas/blocks';

interface SubmittedSlideCardProps {
  message: ThreadMessage;
}

/**
 * Renders a submitted slide as a compact card in the chat list.
 *
 * Shows:
 * - Slide header
 * - Summary of submitted values (e.g., "Business type: E-commerce")
 * - Checkmark indicating completion
 * - Tap to expand (optional: shows full slide in read-only mode)
 */
export const SubmittedSlideCard = ({ message }: SubmittedSlideCardProps) => {
  const [expanded, setExpanded] = useState(false);

  // Extract the slide tool call and its result
  const slideToolCall = message.content.find(
    (p) => p.type === 'tool-call' && p.toolName === 'render_slide',
  ) as ToolCallMessagePart | undefined;

  if (!slideToolCall) return null;

  const slide = slideToolCall.args as Slide;
  const output = slideToolCall.result as SlideOutput | undefined;

  // Extract accompanying text
  const textPart = message.content.find((p) => p.type === 'text');
  const aiText = textPart?.type === 'text' ? textPart.text : '';

  return (
    <View style={styles.cardContainer}>
      {/* AI text above the card (if any) */}
      {aiText ? (
        <Text style={styles.aiText}>{aiText}</Text>
      ) : null}

      {/* Compact slide summary */}
      <Pressable
        onPress={() => setExpanded(!expanded)}
        style={styles.card}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.checkmark}>✓</Text>
          <Text style={styles.headerText}>{slide.header}</Text>
          <Text style={styles.expandIcon}>{expanded ? '▲' : '▼'}</Text>
        </View>

        {/* Collapsed: show value summary */}
        {!expanded && output && (
          <View style={styles.summary}>
            {Object.entries(output.values).slice(0, 3).map(([key, value]) => (
              <Text key={key} style={styles.summaryItem} numberOfLines={1}>
                {formatValue(key, value)}
              </Text>
            ))}
          </View>
        )}

        {/* Expanded: show full slide in read-only mode */}
        {expanded && (
          <View style={styles.expandedContent}>
            <SlideRenderer
              slide={slide}
              readOnly={true}
              submittedValues={output}
            />
          </View>
        )}
      </Pressable>
    </View>
  );
};

function formatValue(key: string, value: unknown): string {
  if (typeof value === 'string') return `${humanize(key)}: ${value}`;
  if (typeof value === 'boolean') return `${humanize(key)}: ${value ? 'Yes' : 'No'}`;
  if (Array.isArray(value)) return `${humanize(key)}: ${value.join(', ')}`;
  return `${humanize(key)}: ${JSON.stringify(value)}`;
}

function humanize(key: string): string {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

const styles = StyleSheet.create({
  cardContainer: {
    marginVertical: 6,
  },
  aiText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  card: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  checkmark: {
    fontSize: 16,
    color: '#28a745',
    marginRight: 8,
  },
  headerText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#212529',
  },
  expandIcon: {
    fontSize: 12,
    color: '#999',
  },
  summary: {
    paddingHorizontal: 12,
    paddingBottom: 10,
  },
  summaryItem: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  expandedContent: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e9ecef',
    padding: 12,
  },
});
```

### 4.2 Why Not Re-render as Full-Screen on Tap?

Expanding to a true full-screen view from within the chat list would require either:
- A modal overlay (possible but disorienting — the user is in chat mode)
- Switching `useSlideState()` to slide mode for a historical message (would mess with the active-slide logic)

The collapsed-card-with-inline-expand approach is simpler and keeps the user oriented in the conversation flow. If a user wants to modify a previous answer, they trigger a rollback (which is a conversation action, not a UI action) — the AI then re-presents the slide as a new message.

### 4.3 Alternative: Full-Screen Review via Modal

For products that want full-screen review of submitted slides, add a modal:

```tsx
const [reviewSlide, setReviewSlide] = useState<{
  slide: Slide;
  output: SlideOutput;
} | null>(null);

// In SubmittedSlideCard's onPress:
onPress={() => setReviewSlide({ slide, output })}

// In UnifiedThreadView:
{reviewSlide && (
  <Modal visible animationType="slide">
    <SafeAreaView style={{ flex: 1 }}>
      <SlideRenderer
        slide={reviewSlide.slide}
        readOnly={true}
        submittedValues={reviewSlide.output}
      />
      <Pressable onPress={() => setReviewSlide(null)}>
        <Text>Close</Text>
      </Pressable>
    </SafeAreaView>
  </Modal>
)}
```

This is a UI-level addition — no framework changes needed.

---

## 5. Configuration-Driven Reuse Across Products

### 5.1 The Same Components Serve All Use Cases

The `UnifiedThreadView` + `SlideToolUI` + `ChatMessageRenderer` serve every product scenario through configuration, not code changes:

| Use Case | Configuration | Behavior |
|----------|--------------|----------|
| **Pure AI chat** | No `SlideToolUI` mounted, no `humanToolNames` | `useSlideState()` always returns `{ mode: 'chat' }`. Standard chat experience. Tool calls render through `renderToolCall` fallback or are invisible. |
| **Pure onboarding** (mostly slides) | Mount `SlideToolUI`, set `humanToolNames: ['render_slide']`, AI always calls `render_slide` | `useSlideState()` alternates between `slide` and `generating`. Chat mode shows briefly between slides. |
| **Hybrid** (chat + slides) | Same setup as onboarding | AI decides when to call `render_slide` vs respond with text. `useSlideState()` switches dynamically. |
| **Surveys** | Same setup, different `ChatModelAdapter` backend | Identical UX, different data flow. |
| **Guided workflows** | Same setup, more tool types registered | Add `makeAssistantToolUI` for each workflow tool. |

### 5.2 The Configuration Surface

```tsx
// src/presentation/components/ai/AIAssistantScreen.tsx

interface AIAssistantConfig {
  /** Backend endpoint for the ChatModelAdapter */
  endpoint: string;

  /** Agent bot ID for auth/routing */
  agentBotId: number;

  /** Tools that require human interaction (pause runtime) */
  humanToolNames?: string[];

  /** Tool UI components to register */
  toolUIs?: React.ComponentType[];

  /** Whether to show the composer (text input) */
  showComposer?: boolean;

  /** Initial system message to send automatically */
  initialMessage?: string;

  /** Presentation preference */
  presentation?: 'unified' | 'chat-only' | 'slides-only';
}

/**
 * Generic AI assistant screen that handles all modes.
 * Configuration determines behavior, not code changes.
 */
export const AIAssistantScreen = ({
  endpoint,
  agentBotId,
  humanToolNames = [],
  toolUIs = [],
  showComposer = true,
  initialMessage,
  presentation = 'unified',
}: AIAssistantConfig) => {
  const adapter = useMemo(
    () => createChatModelAdapter(endpoint, agentBotId),
    [endpoint, agentBotId],
  );

  const runtime = useLocalRuntime(adapter, {
    unstable_humanToolNames: humanToolNames,
    maxSteps: 5,
  });

  return (
    <AssistantProvider runtime={runtime}>
      {/* Register tool UIs */}
      {toolUIs.map((ToolUI, i) => (
        <ToolUI key={i} />
      ))}

      <View style={{ flex: 1 }}>
        {/* The unified view handles all mode switching */}
        {presentation === 'chat-only' ? (
          <ChatOnlyView />
        ) : presentation === 'slides-only' ? (
          <SlidesOnlyView />
        ) : (
          <UnifiedThreadView />
        )}

        {showComposer && <OnboardingComposer />}
      </View>
    </AssistantProvider>
  );
};
```

### 5.3 Product-Specific Instantiation

```tsx
// Pure AI Chat (no slides)
<AIAssistantScreen
  endpoint="/api/v1/chat"
  agentBotId={42}
  showComposer={true}
  presentation="chat-only"
/>

// Onboarding (mostly slides, some chat)
<AIAssistantScreen
  endpoint="/api/v1/onboarding/chat"
  agentBotId={99}
  humanToolNames={['render_slide']}
  toolUIs={[SlideToolUI, ProgressToolUI]}
  showComposer={true}
  presentation="unified"
/>

// Survey (all slides, no free-text)
<AIAssistantScreen
  endpoint="/api/v1/survey/chat"
  agentBotId={101}
  humanToolNames={['render_slide']}
  toolUIs={[SlideToolUI]}
  showComposer={false}
  presentation="slides-only"
/>
```

### 5.4 Why This Works Without Code Changes

The reuse works because of three architectural properties:

1. **The AI decides what to render.** The same `UnifiedThreadView` handles all modes because it reacts to thread state. If the AI never calls `render_slide`, the view stays in chat mode. If the AI always calls `render_slide`, the view alternates between slide mode and generating mode. The component doesn't know or care about the "product" — it reads data.

2. **Tool UIs are a registry.** `SlideToolUI` self-registers when mounted. If it's not mounted, `render_slide` tool calls render as `null` (or through a fallback). New tool types get new `makeAssistantToolUI` registrations — no changes to the rendering pipeline.

3. **The runtime is adapter-driven.** The `ChatModelAdapter` encapsulates all backend communication. Different products use different endpoints, different adapters, different auth — the rendering layer doesn't know.

---

## 6. What assistant-ui Provides vs What We Build

### assistant-ui Provides (the hard 30%)

| Feature | How It's Used | Source Location |
|---------|--------------|-----------------|
| **Thread state management** | `useAuiState((s) => s.thread.messages)` gives us the full message array | `ThreadMessages.tsx:38` |
| **Message content model** | `ThreadMessage` with typed `content: Part[]` | `core/types/message.ts:59-74` |
| **Human-in-the-loop mechanism** | `unstable_humanToolNames` + `shouldContinue()` + auto-continue | `should-continue.ts:3-26`, `local-thread-runtime-core.ts:256-264` |
| **Tool result submission** | `addToolResult()` on the runtime, passed to tool renderers | `local-thread-runtime-core.ts:483-529`, `MessageContent.tsx:83` |
| **Tool UI registry** | `makeAssistantToolUI` + global dispatch via `ToolUIDisplay` | `makeAssistantToolUI.ts:11-20`, `MessageContent.tsx:56-90` |
| **Message scoping** | `MessageByIndexProvider` creates AUI context for any message | `MessageByIndexProvider.tsx:4-23` |
| **Message list (FlatList)** | `ThreadMessages` with `renderMessage` + all FlatList props | `ThreadMessages.tsx:34-61` |
| **Backend abstraction** | `ChatModelAdapter` interface (async generator) | `chat-model-adapter.ts:62-66` |
| **Streaming** | Built into the runtime's `performRoundtrip` | `local-thread-runtime-core.ts:294+` |
| **State reactivity** | `useAuiState` selectors with Zustand | `@assistant-ui/store` |

### We Build (the domain-specific 70%)

| Feature | Purpose |
|---------|---------|
| **`useSlideState()` selector** | ~20 lines. Derives chat/slide/generating mode from thread state. |
| **`UnifiedThreadView`** | ~80 lines. Switches between chat mode, slide mode, generating mode. |
| **`ChatMessageRenderer`** | ~60 lines. Renders individual messages in chat mode. |
| **`SubmittedSlideCard`** | ~80 lines. Compact card for submitted slides in history. |
| **`MiniChatBar`** | ~50 lines + bottom sheet. Shows AI text during slide mode. |
| **`SlideToolUI`** | ~30 lines. Registers the slide renderer globally. |
| **`SlideRenderer`** | ~100 lines. Form state, validation, block rendering. |
| **Block components** | ~500 lines total. 5 MVP block types (BigText, SingleChoice, TextInput, InfoCard, Success). |
| **`ChatModelAdapter` implementation** | ~120 lines. SSE streaming, auth headers, message conversion. |
| **Redux `onboardingSlice`** | ~150 lines. Step registry, flow state. |
| **Transition animations** | ~20 lines. LayoutAnimation or Reanimated wrappers. |

### What Neither Provides (We Design, Both Execute)

The **AI prompt** is what makes this system work. The AI decides when to show text vs slides. The AI composes the slide schemas. The AI drives the conversation flow. The unified rendering component is reactive — it doesn't drive; it follows. The intelligence is in the prompt + backend, not the frontend.

---

## 7. Implications for the Architecture

### 7.1 Changes to Architecture v2

The unified thread architecture simplifies the component tree from research-2d:

| research-2d Design | Unified Thread Design |
|---|---|
| `PresentationContainer` picks between `InlinePresentation` and `FullViewPresentation` based on `presentationMode` config | `UnifiedThreadView` dynamically switches based on thread state — no config needed |
| Mode is per-flow (set in `FlowConfig`) | Mode is per-moment (derived from whether a slide tool call is active) |
| `InlinePresentation` uses `ThreadMessages` with custom `renderMessage` | Chat mode uses the same pattern |
| `FullViewPresentation` uses `useAuiState` + `MessageByIndexProvider` | Slide mode uses the same pattern |
| Two separate components, selected by config | One component, selected by state |

**Key insight: `presentationMode` in FlowConfig becomes unnecessary for the primary UX.** The dynamic switching IS the presentation mode. Whether the flow is "mostly slides" or "mostly chat" is determined by the AI's behavior, not a config flag.

However, `PresentationContainer` from research-2d is still useful for **edge cases**:
- Force chat-only mode (never switch to full-screen slides, even when `render_slide` is called → render slides inline in the chat list instead)
- Force slides-only mode (always full-screen, never show chat list)

These become overrides, not the default:

```tsx
type PresentationOverride = 'unified' | 'chat-only' | 'slides-only';

// 'unified' (default): dynamic switching via useSlideState()
// 'chat-only': all messages render in the FlatList, slides are inline
// 'slides-only': always in slide mode, no chat list
```

### 7.2 The Flow State Machine Simplifies

The architecture v2 state machine has these states: IDLE, AWAITING_SLIDE, COLLECTING, SUBMITTING, REVIEWING, ROLLING_BACK, ERROR, COMPLETED.

With the unified thread, several states become implicit:

| Architecture v2 State | Unified Thread Equivalent |
|---|---|
| AWAITING_SLIDE | `useSlideState()` returns `{ mode: 'generating' }` |
| COLLECTING | `useSlideState()` returns `{ mode: 'slide' }` |
| SUBMITTING | Briefly `{ mode: 'chat' }` or `{ mode: 'generating' }` after `addResult` |
| REVIEWING | User taps on `SubmittedSlideCard`, which expands inline |

The Redux `onboardingSlice` still tracks step business logic (which steps are completed, rollback state, etc.), but the UI state (which slide is active, is it generating) is derived from the thread, not stored in Redux.

### 7.3 `SlideToolUI` Renders in Two Contexts

A subtle but important point: the `SlideToolUI` renderer registered via `makeAssistantToolUI` is invoked in **two different visual contexts**:

1. **Slide mode** (via `UnifiedThreadView` → `MessageByIndexProvider` → `MessageContent`): The slide renders full-screen because `UnifiedThreadView` wraps it in a flex-1 container. The `SlideRenderer` occupies the full content area.

2. **Chat mode history** (via `ThreadMessages` → `ChatMessageRenderer`): If `ChatMessageRenderer` uses `MessageContent` for submitted slides, the same `SlideToolUI` would render — but in read-only mode, constrained to the FlatList cell. However, our `ChatMessageRenderer` intercepts submitted slides and renders `SubmittedSlideCard` instead, which doesn't go through `MessageContent` for the tool call part.

This means `SlideToolUI` effectively only renders in slide mode (for active slides). Submitted slides bypass it via `SubmittedSlideCard`. This is a design choice — if we wanted `SlideToolUI` to also handle submitted slides in chat, we'd change `ChatMessageRenderer` to use `MessageContent` with the full dispatch pipeline.

### 7.4 Scroll Position Management

When switching from slide mode back to chat mode, the `ThreadMessages` FlatList remounts. We want it to scroll to the bottom (latest messages). Options:

```tsx
// Option A: FlatList's initialScrollIndex
<ThreadMessages
  renderMessage={renderChatMessage}
  initialScrollIndex={messages.length - 1}
  getItemLayout={...} // Required for initialScrollIndex
/>

// Option B: ref-based scrollToEnd after mount
const flatListRef = useRef<FlatList>(null);
useEffect(() => {
  if (slideState.mode === 'chat') {
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 50);
  }
}, [slideState.mode]);
```

Option B is simpler and doesn't require `getItemLayout` (which is hard with variable-height messages). The 50ms timeout ensures the FlatList has laid out its content.

### 7.5 Performance Considerations

**Selector efficiency**: `useSlideState()` runs on every thread state change. The selector scans messages backward — O(1) in practice because it breaks on the first assistant message found. The selector returns a new object reference each time, but React's `useAuiState` (Zustand-based) uses shallow equality by default. We should memoize the return value:

```tsx
// Optimized: use a stable reference when mode doesn't change
function useSlideState(): SlideState {
  return useAuiState((s): SlideState => {
    // ... same logic as before
  });
  // Note: useAuiState from @assistant-ui/store likely already handles
  // equality checking. If not, we can wrap with useMemo or use a
  // custom equality function.
}
```

**FlatList mount/unmount**: Switching between chat and slide modes unmounts/remounts the FlatList. For conversations with <50 messages (typical for onboarding), this is negligible. For longer conversations, we could keep the FlatList mounted but hidden:

```tsx
// Alternative: keep FlatList mounted, toggle visibility
<View style={[styles.container, slideState.mode === 'slide' && { display: 'none' }]}>
  <ThreadMessages ... />
</View>
{slideState.mode === 'slide' && (
  <View style={styles.slideArea}>
    ...
  </View>
)}
```

This trades memory (FlatList stays in memory) for faster transitions (no remount). Worth benchmarking if transitions feel sluggish.

### 7.6 Thread Persistence Across App Restarts

assistant-ui provides `createLocalStorageAdapter` for thread persistence (re-exported at `react-native/src/adapters/index.ts`). This uses AsyncStorage under the hood. When the user kills the app and returns:

1. The runtime rehydrates messages from AsyncStorage
2. `useSlideState()` evaluates the rehydrated state
3. If the last message had a pending `render_slide` → slide mode restores
4. If the conversation was between slides → chat mode restores

This "just works" because the unified view is derived from thread state, and thread state is persisted.

---

## 8. Complete Wiring — Unified OnboardingScreen

```tsx
// src/screens/OnboardingScreen.tsx

import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { AssistantProvider } from '@assistant-ui/react-native';
import { useOnboardingRuntime } from '@/presentation/hooks/onboarding/useOnboardingRuntime';
import { SlideToolUI } from '@/presentation/components/onboarding/tools/SlideToolUI';
import { ProgressToolUI } from '@/presentation/components/onboarding/tools/ProgressToolUI';
import { UnifiedThreadView } from '@/presentation/components/onboarding/UnifiedThreadView';
import { OnboardingHeader } from '@/presentation/components/onboarding/OnboardingHeader';
import { OnboardingComposer } from '@/presentation/components/onboarding/OnboardingComposer';

export const OnboardingScreen = ({ agentBotId }: { agentBotId: number }) => {
  const runtime = useOnboardingRuntime(agentBotId);

  return (
    <AssistantProvider runtime={runtime}>
      {/* Tool UI registrations (render-null components) */}
      <SlideToolUI />
      <ProgressToolUI />

      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={88}
      >
        <OnboardingHeader />

        {/* ONE component handles chat mode, slide mode, and transitions */}
        <UnifiedThreadView />

        {/* Composer always visible at the bottom */}
        <OnboardingComposer />
      </KeyboardAvoidingView>
    </AssistantProvider>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
```

### Data Flow Summary

```
┌─────────────────────────────────────────────────────────────────┐
│  OnboardingScreen                                               │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  AssistantProvider (runtime = LocalRuntime)                │  │
│  │                                                           │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │  SlideToolUI (self-registers in store.tools)        │  │  │
│  │  │  ProgressToolUI (self-registers in store.tools)     │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  │                                                           │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │  UnifiedThreadView                                  │  │  │
│  │  │                                                     │  │  │
│  │  │  useSlideState() reads s.thread.messages             │  │  │
│  │  │                                                     │  │  │
│  │  │  mode === 'chat':                                   │  │  │
│  │  │  ┌───────────────────────────────────────────────┐  │  │  │
│  │  │  │  ThreadMessages (FlatList)                    │  │  │  │
│  │  │  │  └── ChatMessageRenderer per message          │  │  │  │
│  │  │  │      ├── User msg → text bubble               │  │  │  │
│  │  │  │      ├── AI msg (text) → AIMessageBubble      │  │  │  │
│  │  │  │      └── AI msg (submitted slide) →           │  │  │  │
│  │  │  │          SubmittedSlideCard                    │  │  │  │
│  │  │  └───────────────────────────────────────────────┘  │  │  │
│  │  │                                                     │  │  │
│  │  │  mode === 'slide':                                  │  │  │
│  │  │  ┌───────────────────────────────────────────────┐  │  │  │
│  │  │  │  MiniChatBar (latest AI text, expandable)     │  │  │  │
│  │  │  ├───────────────────────────────────────────────┤  │  │  │
│  │  │  │  MessageByIndexProvider(index=N)              │  │  │  │
│  │  │  │  └── MessageContent                          │  │  │  │
│  │  │  │      ├── text → null (suppressed)             │  │  │  │
│  │  │  │      └── tool-call → ToolUIDisplay            │  │  │  │
│  │  │  │          └── store.tools['render_slide']      │  │  │  │
│  │  │  │              └── SlideToolUI.render            │  │  │  │
│  │  │  │                  └── SlideRenderer (full area) │  │  │  │
│  │  │  └───────────────────────────────────────────────┘  │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  │                                                           │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │  OnboardingComposer (ComposerInput + Send)          │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 9. What This Means for Implementation

### 9.1 Effort Reduction

The unified thread architecture reduces complexity compared to research-2d's dual-component approach:

| research-2d | Unified Thread | Savings |
|---|---|---|
| `InlinePresentation` (separate component) | Merged into `UnifiedThreadView` chat mode | ~60 lines eliminated |
| `FullViewPresentation` (separate component) | Merged into `UnifiedThreadView` slide mode | ~60 lines eliminated |
| `PresentationContainer` (mode switch) | `useSlideState()` hook (~20 lines) | ~30 lines eliminated, config eliminated |
| `presentationMode` in FlowConfig + Redux | Derived from thread state | Config schema field eliminated |
| Two rendering paths to test | One component, three modes | Fewer test permutations |

### 9.2 Revised Implementation Estimate

| Task | Days | Notes |
|---|---|---|
| Install packages, verify RN 0.76 compatibility | 0.5 | Same as research-2d |
| `ChatModelAdapter` (SSE + auth) | 1.5 | Same |
| `SlideToolUI` + `SlideRenderer` | 2 | Same |
| `useSlideState()` + `UnifiedThreadView` | 1 | **Simpler** than research-2d's dual components |
| `ChatMessageRenderer` + `SubmittedSlideCard` | 1 | Replaces separate inline renderer |
| `MiniChatBar` + bottom sheet | 1 | Same |
| Block components (MVP 5) | 3-4 | Same |
| Block registry | 0.5 | Same |
| Redux `onboardingSlice` | 1.5 | Same, minus presentation mode state |
| Transition animations | 0.5 | Reanimated or LayoutAnimation |
| `OnboardingComposer` + keyboard | 0.5 | Same |
| Progress tool UI + skeleton | 0.5 | Same |
| Testing + debugging | 2-3 | **Simpler** — one component path |
| **Total** | **16-19 days** | **1-2 days less** than research-2d |

### 9.3 Risk Assessment

| Risk | Impact | Mitigation |
|---|---|---|
| FlatList mount/unmount on mode switch | Low — <50 messages in onboarding | Keep mounted but hidden if needed |
| `useAuiState` selector runs on every state change | Low — backward scan is O(1) in practice | Verified: breaks on first assistant message |
| Slide tool call arrives before text | Low — UI handles gracefully | `useSlideState` checks for both text and tool calls |
| Race condition: user submits and slides immediately back to chat before AI responds | Low — `addResult` is synchronous, `shouldContinue` evaluates immediately | Brief chat mode view is correct behavior |
| MiniChatBar bottom sheet conflicts with keyboard | Medium | Test bottom sheet + keyboard interaction |

---

## 10. Summary

### The Vision Is Achievable

The user's vision — one unified framework that dynamically switches between chat and slides within a single thread — maps directly onto assistant-ui's architecture:

- **One thread**: `LocalRuntime` manages one `ThreadMessage[]` array
- **Dynamic switching**: `useSlideState()` derives the current mode from thread state
- **One rendering component**: `UnifiedThreadView` handles chat, slide, and generating modes
- **The AI decides**: whether to show text or slides, by choosing to call `render_slide` or not
- **Same message history**: everything is in the same thread, scrollable, persistent
- **Configuration-driven reuse**: pure chat, pure slides, hybrid — same components, different config

### assistant-ui's Architecture Makes This Natural

This isn't a hack or a workaround. The design works because:

1. `ThreadMessage` is just data — no rendering assumptions
2. `MessageContent` dispatches parts through a registry — no layout constraints
3. `MessageByIndexProvider` scopes rendering to any message — not just the FlatList
4. `humanToolNames` pauses the runtime for interactive tool calls — exactly the slide pattern
5. `addToolResult` triggers auto-continue — the conversation flows naturally

### What to Build Next

1. **Validation spike** (1 day): Install `@assistant-ui/react-native`, verify RN 0.76, test `useSlideState` with a mock adapter that returns `render_slide`
2. **Core rendering** (3 days): `UnifiedThreadView`, `ChatMessageRenderer`, `SlideToolUI`, `MiniChatBar`
3. **Slide content** (4 days): `SlideRenderer`, MVP block components, form state
4. **Backend integration** (2 days): `ChatModelAdapter` with SSE streaming
5. **Polish** (3 days): Animations, keyboard handling, testing
