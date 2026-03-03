# Architecture Design Review: AI Onboarding Framework

> **Reviewer**: Senior Principal Engineer (Critical Review)
> **Date**: 2026-02-28
> **Document Reviewed**: `architecture-design.md` (Phase 2)
> **Supporting Documents**: `requirements.md`, `research-landscape.md`, `research-2a-assistant-ui-evaluation.md`
> **Codebase Files Cross-Referenced**: `parts.ts`, `AIPartRenderer.tsx`, `aiChatSchemas.ts`, `constants.ts`, `useAIChat.ts`, `useAIChatSessions.ts`, `AIMessageBubble.tsx`

---

## Executive Summary

The architecture is well-researched, well-written, and directionally sound. The decision to build custom on the existing AI chat infrastructure is correct and well-justified. The schema-driven, tool-call-based approach maps cleanly to the existing codebase and to the AI SDK v5 API surface.

However, there are **5 findings that need resolution before implementation begins**:

1. **CRITICAL — Tool part type mismatch**: The architecture assumes tool parts have `type: 'tool-call'` with a `toolName` property. In AI SDK v5, typed tool parts have `type: 'tool-render_slide'` with an `input` property (not `args`). This invalidates the `AIPartRenderer` integration code and the `sendAutomaticallyWhen` callback.

2. **CRITICAL — OpenAI strict mode incompatibility with optional fields**: The `SlideSchema` and block schemas use extensive `.optional()` fields. OpenAI's strict mode requires all properties to be `required` in the JSON Schema, with optional semantics expressed via `z.union([z.string(), z.null()])` or explicit nullable. The current schemas will fail at the provider level.

3. **IMPORTANT — `render_slide` tool: outputSchema vs no-execute pattern confusion**: The architecture defines `outputSchema: SlideOutputSchema` on a tool with no `execute`. But the SDK v5 `ToolOutputProperties` type requires either `execute` + optional `outputSchema`, or `outputSchema` + no `execute`. The current code shows `outputSchema` on the tool definition but uses `addToolOutput` on the client. The `outputSchema` is actually for client-side tools — this is correct in intent, but the tool definition code in Section 3 uses `inputSchema: SlideSchema` (correct property name) while also specifying `outputSchema`, which may not match the actual `tool()` function signature correctly. This needs verification with actual SDK compilation.

4. **IMPORTANT — `sendAutomaticallyWhen` checks the wrong part shape**: The callback checks `p.type?.startsWith('tool-')` and `p.toolName === 'render_slide'` — but in SDK v5 typed parts, the tool name is encoded in the type (`tool-render_slide`) and the field is `input` not `args`. The property `toolName` doesn't exist on `ToolUIPart`.

5. **IMPORTANT — FlashList with full-width slides is an unsolved performance concern**: FlashList requires items with the same type to have the same height for virtualization. Full-width slides with variable numbers of blocks will have vastly different heights. This is a known FlashList limitation that causes rendering glitches and recycling bugs.

---

## Detailed Findings

### CRITICAL

#### C1: Tool Part Type Format Mismatch with AI SDK v5

**Description**: Throughout the architecture, tool parts are referenced using the old SDK format:
- `part.type === 'tool-call'` (Section 4.5)
- `(part as ToolCallPart).toolName` (Section 4.5)
- `(part as ToolCallPart).args` (Section 4.5)
- `p.toolName === 'render_slide'` (Section 6.3)

**Evidence**: In AI SDK v5 (`ai@5.0.93`), when tools are typed via `UIMessage<METADATA, DATA_PARTS, TOOLS>`, tool parts are `ToolUIPart` with:
```typescript
// From node_modules/ai/dist/index.d.ts:1578-1582
type ToolUIPart<TOOLS extends UITools> = ValueOf<{
    [NAME in keyof TOOLS & string]: {
        type: `tool-${NAME}`;
    } & UIToolInvocation<TOOLS[NAME]>;
}>;
```

So a `render_slide` tool part has `type: 'tool-render_slide'`, NOT `type: 'tool-call'`. The fields are `input` (not `args`) and the `toolName` property doesn't exist — the name is encoded in the `type` string.

**Crucially**, the existing codebase uses the `startsWith('tool-')` pattern (in `isToolPart()` at `parts.ts:102-103`) which *would* match `tool-render_slide`. However, the codebase's `ToolCallPart` interface uses `toolName` and `args` properties (which come from the Chatwoot backend format, not the SDK's typed format). There's a mismatch between the existing types and what the SDK actually produces for typed tools.

**Impact**: The `AIPartRenderer` extension code in Section 4.5 won't work as written. The `sendAutomaticallyWhen` callback in Section 6.3 won't match. The entire tool identification and data extraction pipeline needs to account for the SDK v5 typed part shape.

**Recommended Fix**:
1. Decide whether to use typed `UIMessage<..., TOOLS>` or untyped `UIMessage` (the current codebase uses untyped).
2. If untyped, verify what shape the parts actually have at runtime when a tool with no `execute` streams to the client — they may still arrive as `tool-call` with `toolName`/`args` in the untyped case.
3. If typed, update all part access patterns to use `part.type === 'tool-render_slide'` and `part.input` instead of `part.args`.
4. Add a small spike to stream a tool-call to the client and log the actual part shape. **Do this before implementing anything.**

---

#### C2: OpenAI Strict Mode Incompatibility with `.optional()` Fields

**Description**: The block schemas use `.optional()` extensively (e.g., `alignment`, `size`, `defaultValue`, `layout`, `validation`, `description`, `icon`, `subheader`, `actions`, `metadata`). OpenAI's structured output / strict mode does not support optional properties in the JSON Schema sense. When `strict: true` is set, OpenAI requires all properties to be listed in `required`, and optional semantics must use nullable types (`anyOf: [type, { type: "null" }]`).

**Evidence**: From OpenAI's [Structured Outputs documentation](https://platform.openai.com/docs/guides/structured-outputs):
> "All fields must be required... to make a field optional, use a union type with null"

The Vercel AI SDK's `zodSchema()` converter handles this by converting Zod `.optional()` to JSON Schema with `anyOf: [type, { type: "null" }]` and adding the property to `required`. But this means the LLM must explicitly output `null` for every optional field, which:
- Increases token usage significantly (every optional field in every block must be explicitly null)
- May cause LLM errors with complex schemas (the full SlideSchema discriminated union with 11 variants is very large)
- May hit OpenAI's structured output schema complexity limits (the discriminated union with 11 members, each with multiple nullable fields, could exceed the nesting/size constraints)

**Impact**: At best, token waste and slower responses. At worst, OpenAI rejects the schema or the LLM struggles to produce valid output, causing retry loops and degraded UX.

**Recommended Fix**:
1. Minimize optional fields in the block schemas. Make deliberate choices: fields that the LLM will almost always want to set should be required with sensible defaults. Fields that are truly optional should use `z.string().nullable()` or `z.union([z.string(), z.null()])` explicitly.
2. Consider splitting the schema: a simplified "LLM-facing" schema (fewer optional fields) and a richer "client-side" schema that applies defaults.
3. Test the full `SlideSchema` against OpenAI's structured output limits. The discriminated union of 11 types may need to be simplified for the initial MVP (matching the 5-block MVP set in Appendix B).
4. Consider whether `providerOptions: { openai: { strict: true } }` belongs on the individual tool definition or on the `streamText` call. In the current SDK, `providerOptions` on `tool()` is passed through, but `strict` is typically set at the tool level — verify this compiles.

---

### IMPORTANT

#### I1: `addToolOutput` Typing Requires Generic UIMessage

**Description**: The `addToolOutput` method in the SDK is typed as:
```typescript
addToolOutput: <TOOL extends keyof InferUIMessageTools<UI_MESSAGE>>({
  tool, toolCallId, output,
}: { tool: TOOL; toolCallId: string; output: InferUIMessageTools<UI_MESSAGE>[TOOL]["output"]; })
```

For the `tool` parameter to accept `'render_slide'` and for `output` to be typed as `SlideOutput`, the `useChat` hook must be parameterized with a typed `UIMessage` that includes the tool definitions.

**Evidence**: The current `useAIChat` uses `useChat()` without type parameters (defaults to `UIMessage`). To use `addToolOutput({ tool: 'render_slide', ... })`, you'd need `useChat<UIMessage<unknown, UIDataTypes, { render_slide: { input: Slide; output: SlideOutput } }>>()`.

**Impact**: Without proper typing, `addToolOutput` will accept `tool: string` (which works at runtime but loses type safety), or it may require a type assertion. The architecture doesn't address this.

**Recommended Fix**: Either:
1. Define a typed `OnboardingUIMessage` type and parameterize `useChat` with it.
2. Or use `as any` assertions on `addToolOutput` calls and accept the type safety loss (pragmatic but not ideal).
3. Document this decision explicitly in the architecture.

---

#### I2: `sendAutomaticallyWhen` Race Condition with Multi-Step Tool Calls

**Description**: The architecture uses `sendAutomaticallyWhen` to auto-trigger the next AI generation when the user submits a slide. But `sendAutomaticallyWhen` is called "when the stream is finished or a tool call is added" (from the SDK types). If the AI's response to a slide submission involves multiple tool calls (e.g., `mark_step_complete` + `update_progress` + `render_slide`), and the server uses `stopWhen: stepCountIs(5)`, the multi-step execution happens server-side. The client receives a single stream response containing all steps.

However, the `render_slide` tool has no `execute`, so the server will NOT auto-execute it. The server will stop when it hits `render_slide` (because it can't execute it). The `sendAutomaticallyWhen` function then needs to detect that the stream finished with a pending `render_slide` tool call (state: `input-available`) and NOT auto-send — because the user hasn't submitted yet.

The current `sendAutomaticallyWhen` checks for `tool-result` / `output-available` state on `render_slide`, which is correct for post-submission. But: what if `mark_step_complete` has an output-available state? The current check only looks at `render_slide`, so it won't accidentally trigger on other tools. This seems correct but fragile.

**Impact**: Potential race condition: if the check is too broad (matches any tool result), it could trigger infinite auto-send loops. If too narrow, it might miss the submission signal.

**Recommended Fix**:
1. Explicitly document the expected message flow after `addToolOutput`:
   - Client calls `addToolOutput` for `render_slide` → message updated with `tool-render_slide` in state `output-available`
   - `sendAutomaticallyWhen` fires, sees `output-available` on `render_slide`, returns `true`
   - SDK sends messages to server → server processes, calls `mark_step_complete`, `update_progress`, next `render_slide`
   - Stream finishes → `sendAutomaticallyWhen` fires again, sees new `render_slide` in state `input-available` (NOT `output-available`), returns `false`
2. Add explicit tests for this flow before implementing.
3. Consider adding a debounce or flag to prevent `sendAutomaticallyWhen` from firing multiple times per submission cycle.

---

#### I3: `stopWhen: stepCountIs(5)` May Be Insufficient

**Description**: The architecture sets `stopWhen: stepCountIs(5)` to "allow up to 5 tool calls per request." But a single slide flow could involve:
1. Text response ("Great choice!")
2. `mark_step_complete` (step 1)
3. `update_progress` (step 2)
4. Text response ("Now let's...") (step 3? — depends on whether text counts as a step)
5. `render_slide` for next step (step 4 or 5)

If text responses count as separate steps (they do in the SDK — each `streamText` continuation after a tool result is a new step), 5 steps may not be enough for the AI to do: respond to submission → save → update progress → transition text → next slide.

**Evidence**: From the SDK types, `stepCountIs` counts the number of steps in `streamText`'s multi-step execution. Each tool call + response is a step. Text-only responses between tool calls are also steps.

**Impact**: The AI might be cut off mid-flow, requiring the client to send another request to continue. This creates an inconsistent UX where sometimes the next slide appears immediately and sometimes the user has to wait for a second round-trip.

**Recommended Fix**:
1. Test empirically with the actual flow to determine how many steps are needed.
2. Consider `stepCountIs(10)` or even higher, since `render_slide` (with no `execute`) will naturally stop the server — the step count is a safety net, not the primary flow control.
3. Use `prepareStep` to dynamically adjust behavior per step rather than relying on a static count.

---

#### I4: FlashList with Variable-Height Slides

**Description**: The architecture proposes rendering slides as full-width items in the existing FlashList message list. FlashList is optimized for items of uniform (or predictable) height. Full-width slides with 1-6 blocks of different types will have wildly different heights.

**Evidence**: FlashList's [`estimatedItemSize`](https://shopify.github.io/flash-list/docs/guides/estimated-item-size/) and [`getItemType`](https://shopify.github.io/flash-list/docs/guides/section-list/) help but don't fully solve the variable-height problem. Known issues:
- Items may overlap or leave gaps when scrolled quickly
- Recycled items may flash with incorrect heights before layout recalculation
- `getItemType` can help by separating slides from messages, but each slide is still variable height

The architecture mentions extending `getItemType` for slides (Section 9) but doesn't address the fundamental variable-height issue.

**Impact**: Visual glitches during scroll, especially when scrolling back through submitted (read-only) slides. May require abandoning FlashList for the onboarding screen in favor of a regular `ScrollView` or `FlatList` (with attendant performance implications if there are many messages).

**Recommended Fix**:
1. Use `getItemType` to return a unique type per item (e.g., `'message'`, `'slide'`, `'progress'`).
2. Set `estimatedItemSize` to the weighted average of expected item heights.
3. If glitches persist, consider a `FlatList` with `getItemLayout` (if heights can be pre-calculated) or a plain `ScrollView` (acceptable for onboarding since the message count is bounded — typically <30 items in an onboarding flow).
4. Test early with realistic slide content and scroll aggressively to identify issues.

---

#### I5: Free-Form Text While Slide is Pending — Stale Tool Call State

**Description**: Section 7.2 describes the scenario where the user types free-form text while a slide is displayed. The AI interprets the text and moves forward, bypassing the slide. But what happens to the pending `render_slide` tool call?

The tool call is in state `input-available` — the server is waiting for a tool result. When the user sends a text message instead, the client calls `sendMessage()` which sends a new user message. This creates a new request to the server. But the previous conversation history still contains the unresolved `render_slide` tool call.

**Evidence**: Looking at the existing `useAIChat.ts`, `sendMessage` uses `prepareSendMessagesRequest` which only sends the last message. But the SDK's `AbstractChat` sends all messages. If the conversation history contains an unresolved tool call, OpenAI may refuse to process the new message or may hallucinate a tool result.

**Impact**: Undefined behavior. The AI may:
- Error out because there's a pending tool call without a result
- Hallucinate a tool result to resolve the pending call
- Ignore the pending call (depends on model behavior)

**Recommended Fix**:
1. When the user sends free-form text while a slide is pending, first call `addToolOutput` with `state: 'output-error'` or a `{ action: 'skip', values: {} }` result to resolve the pending tool call, THEN send the text message.
2. Or: automatically inject a tool result before the text message in the conversation history.
3. This needs to be an explicit part of the architecture, not left to "the AI handles it."

---

#### I6: Redux Slice `activeSlide.schema` Stores Full Slide Object

**Description**: The Redux slice (Section 5.2) stores `activeSlide.schema: Slide` — the full parsed slide schema. Redux state should be serializable and minimal. Storing the full Zod-parsed object is fine (it's just a POJO), but:

1. The `formValues` are stored alongside the schema. When the user types in a text input, every keystroke updates `formValues` in Redux, causing a Redux dispatch per keystroke. This is a performance concern.
2. The `submitted` boolean means read-only detection is in Redux, but the tool call state (which already tracks whether output is available) is in the SDK. This is duplicate state.

**Impact**: Performance issues with text input blocks (dispatch per keystroke). State duplication between Redux and SDK.

**Recommended Fix**:
1. Keep `formValues` in local `useState` within the `SlideRenderer` component (as the pseudocode in Section 4.4 already does!). Don't put it in Redux.
2. The Redux slice should only store: `flowId`, `flowStatus`, `completedSteps`, `currentStepId`, `progress`, `lastSavedAt`, `resumeData`. Remove `activeSlide` — the SDK's message state already tracks the active tool call.
3. Derive `isSlideSubmitted` from the tool call's state (`output-available` vs `input-available`) rather than a separate Redux boolean.
4. This eliminates the state desynchronization risk entirely.

---

### MINOR

#### M1: `z.record(z.string(), z.unknown())` in Zod v4

**Description**: The architecture uses `z.record(z.string(), z.unknown())` in `SlideOutputSchema` and `mark_step_complete`. While Zod v4 accepts both `z.record(keySchema, valueSchema)` and `z.record(valueSchema)`, this is correct.

**Evidence**: Tested locally — `z.record(z.string(), z.unknown())` works in Zod v4.1.13. The existing codebase also uses this pattern in `aiChatSchemas.ts:45`.

**Impact**: None — this is correct.

**Status**: No action needed.

---

#### M2: Schema Uses `z.infer<typeof Schema>` but Zod v4 Also Supports `z.output<typeof Schema>`

**Description**: Zod v4 distinguishes between `z.input<>` (what goes in) and `z.output<>` (what comes out after transforms). `z.infer<>` is an alias for `z.output<>`. Since none of the schemas use transforms, this distinction doesn't matter. But it's worth noting for consistency with Zod v4 idioms.

**Impact**: None.

---

#### M3: Block ID Collision Risk

**Description**: Block IDs are strings set by the LLM (e.g., `"business_type"`, `"company_name"`). If the AI generates two blocks with the same ID on the same slide, the form state `Record<string, unknown>` will clobber one value.

**Impact**: Low — the system prompt instructs the AI, and `strict` mode validates against the schema. But the schema doesn't enforce unique IDs (it can't — Zod can't express array-level uniqueness constraints easily).

**Recommended Fix**: Add a client-side validation step in `SlideRenderer` that deduplicates block IDs and warns in `__DEV__`.

---

#### M4: `ConfirmationBlock` Output Schema is Underspecified

**Description**: The `SlideOutputSchema` uses `z.record(z.string(), z.unknown())` for all values. The comment says confirmation blocks output `{ confirmed: boolean, edits?: Record<string, string> }`, but this isn't enforced in the schema. The server-side tool will receive an `unknown` value and must trust the shape.

**Impact**: Low — the server can parse/validate. But it means the output type safety is lost.

**Recommended Fix**: Consider a per-block-type output schema that the `SlideRenderer` constructs based on the block types present. This is a future enhancement, not blocking.

---

#### M5: `ImageChoiceBlock.imageUrl` — LLM Generates URLs?

**Description**: The `ImageChoiceBlock` schema has `imageUrl: z.string()` on each option. This implies the LLM generates image URLs. In practice, the LLM doesn't have access to your image hosting. The URLs would need to come from the system prompt or a predefined set.

**Impact**: Minor — the system prompt can include available image URLs. But this is worth calling out as a design constraint: the flow config must provide image URLs for any `image-choice` steps.

**Recommended Fix**: Document in the system prompt section that image choice options must reference pre-configured image URLs from the flow definition.

---

#### M6: Missing `id` on `SlideSchema` Itself

**Description**: Individual blocks have `id` fields, but the `SlideSchema` itself has no `id`. If the AI renders multiple slides in a conversation, there's no way to reference a specific slide except by its `toolCallId` (which is generated by the AI, not the schema).

**Impact**: Low — `toolCallId` serves this purpose. But having a semantic `slideId` (e.g., `"business_type_slide"`) would help with analytics and debugging.

**Recommended Fix**: Consider adding `id: z.string().optional()` to `SlideSchema` for traceability.

---

### QUESTIONS

#### Q1: How Does the Existing `getDeduplicatedToolParts` Interact with `render_slide`?

**Description**: `AIMessageBubble.tsx` uses `getDeduplicatedToolParts()` to show only the latest state per `toolCallId`. When a `render_slide` tool call transitions from `input-available` → `output-available` (after submission), the dedup logic keeps only the latest.

**Question**: In the existing rendering pipeline, tool parts render via `AIToolPart` which shows a collapsible tool invocation display. After extending `AIPartRenderer` for onboarding, will the dedup logic need to change? Specifically:
- Should `render_slide` parts be excluded from the standard dedup (since they render as slides, not collapsible tools)?
- Will there be both a `tool-render_slide` part AND a separate `tool-call` part for the same tool call?

**Decision Needed**: Clarify how slide tool parts flow through the existing message splitting logic in `AIMessageBubble`. The `reasoningParts` / `toolParts` / `textParts` split may need a fourth category: `slideParts`.

---

#### Q2: Should Onboarding Use a Separate `useChat` Instance or Extend the Existing One?

**Description**: The architecture shows `useOnboardingChat` creating a new `DefaultChatTransport` with a different endpoint (`/api/v1/onboarding/chat`). This creates a separate `useChat` instance.

**Question**: How does this interact with the existing AI chat feature? If the user has both AI chat and onboarding active:
- Are there two concurrent `useChat` instances?
- Does the onboarding session interfere with the AI chat session in AsyncStorage (`@ai_chat_active_session`)?
- Should onboarding use a separate AsyncStorage key?

**Decision Needed**: Confirm that onboarding uses its own AsyncStorage key for session persistence (e.g., `@onboarding_active_session`) and that the two `useChat` instances are fully independent.

---

#### Q3: What Happens When the AI Calls `render_slide` During Streaming?

**Description**: When `streamText` streams a response, tool call parts arrive progressively. The `render_slide` tool call arguments stream in as partial JSON. Should the client:
- Wait until the tool call is complete (`input-available`) before rendering the slide?
- Show a loading skeleton while the tool args are streaming?
- Show a partial slide as blocks become parseable?

**Decision Needed**: The architecture doesn't specify the streaming UX for slides. For text parts, the existing system shows tokens as they arrive. For tool calls, the existing `AIToolPart` shows a loading state. Slides need a defined behavior.

**Recommendation**: Show a slide-shaped skeleton while the tool args stream, then render the full slide when `input-available`. Don't try to render partial slides — the discriminated union makes partial parsing fragile.

---

#### Q4: How Does the Server Know Which Onboarding Flow to Use?

**Description**: Section 6.2 shows `buildOnboardingSystemPrompt(flowConfig)` but doesn't specify how `flowConfig` reaches the server. Is it:
- Stored in the database and looked up by tenant/user?
- Sent by the client in the request body?
- Hardcoded in the server for the MVP?

**Decision Needed**: This is a backend architecture question, but the client needs to know whether it sends a `flowId` in the request or whether the server determines the flow automatically.

---

#### Q5: Rate Limiting on Slide Submissions

**Description**: There's no mention of rate limiting. A user could rapidly submit → AI generates → submit → AI generates in a tight loop. Each submission triggers an API call (via `addToolOutput` + `sendAutomaticallyWhen`).

**Question**: Should there be a client-side debounce on slide submissions? The `experimental_throttle: 150` on `useChat` throttles UI updates but not API calls.

**Recommendation**: Add a simple guard: disable the submit button while `status === 'submitted' || status === 'streaming'`. This is implicit in the UI (the next slide hasn't appeared yet), but should be explicit in the code.

---

#### Q6: Keyboard Avoidance with Text Input Blocks Inside Slides Inside FlashList

**Description**: The component tree shows `KeyboardAvoidingWrapper` at the root, but text input blocks are deeply nested: `OnboardingScreen > FlashList > SlideRenderer > BlockRenderer > TextInputBlock > TextInput`. `KeyboardAvoidingView` adjusts the view's position/padding, but FlashList may not respond correctly to keyboard-driven layout changes.

**Question**: Has this been tested? The existing AI chat has a simple text input at the bottom (outside the list). Here, the text input is INSIDE a list item, which is a fundamentally different layout challenge.

**Recommendation**: Test this specific scenario early. You may need `ScrollView.scrollToEnd()` or `scrollToItem` when a text input within a slide gains focus. Consider using `react-native-keyboard-aware-scroll-view` or implementing custom focus management.

---

## Missing From Architecture

### 1. Error Boundaries for Block Components

**Status**: Not addressed.

**Issue**: If a block component throws during render (e.g., `ImageChoiceBlock` with an invalid `imageUrl`), the entire slide (and potentially the entire message list) crashes due to React's error propagation.

**Recommendation**: Wrap `BlockRenderer` in an error boundary that:
- Catches render errors per block
- Shows a fallback "This block couldn't be rendered" placeholder
- Logs the error for debugging
- Doesn't crash the slide or the chat

---

### 2. Analytics / Telemetry

**Status**: Not addressed.

**Issue**: The requirements mention no analytics, but in practice, onboarding completion rates, drop-off points, time-per-slide, and error rates are critical business metrics.

**Recommendation**: Define event tracking points:
- `onboarding_started` (flow begins)
- `slide_rendered` (AI generates slide — with `stepId`)
- `slide_submitted` (user submits — with `stepId`, `timeOnSlide`, `action`)
- `slide_skipped` (user skips)
- `freeform_input` (user types instead of using slide)
- `onboarding_completed` (finish_onboarding called)
- `onboarding_error` (error occurred — with error type)
- `onboarding_abandoned` (user closes without completing)

---

### 3. Testing Strategy

**Status**: Mentioned in requirements research phases but absent from architecture.

**Issue**: How do you test AI-generated slides without hitting the LLM? The architecture doesn't define a testing approach.

**Recommendation**:
1. **Unit tests for block components**: Render each block type with mock data, assert correct output.
2. **Unit tests for `SlideRenderer`**: Pass mock `Slide` objects, assert form state management works.
3. **Integration test for `addToolOutput` flow**: Mock the transport, simulate a `render_slide` tool call, submit, verify `addToolOutput` is called correctly.
4. **Snapshot/recorded conversations**: Record real AI conversations (tool calls + responses) and replay them in tests. This validates the full pipeline without hitting the LLM.
5. **Storybook-style component catalog**: Build each block type with mock data for visual QA (consider using Expo's Story feature or a similar pattern).

---

### 4. Accessibility

**Status**: Mentioned in requirements (FR-7: "screen reader support, minimum touch targets") but absent from architecture.

**Issue**: Block components need explicit accessibility attributes:
- `SingleChoiceBlock`: each option needs `accessibilityRole="radio"`, `accessibilityState={{ selected }}`
- `MultiChoiceBlock`: `accessibilityRole="checkbox"`, `accessibilityState={{ checked }}`
- `TextInputBlock`: `accessibilityLabel` from `block.label`
- `DropdownBlock`: accessibility for picker/modal
- `SlideRenderer`: `accessibilityRole="form"`, `accessibilityLabel` from header
- Slide transitions: announce new slide via `AccessibilityInfo.announceForAccessibility()`
- Error messages: `accessibilityLiveRegion="polite"` (Android)

**Recommendation**: Add a11y requirements to each block type in the schema specification. Include VoiceOver/TalkBack testing in the acceptance criteria.

---

### 5. Concurrent/Multiple Onboarding Flows

**Status**: Not addressed.

**Issue**: Can a user have multiple onboarding flows? What if they start onboarding, abandon it, and start again? The Redux state has a single `flowId` and `activeSlide`.

**Recommendation**: For MVP, enforce single active flow. If `flowStatus === 'active'`, resume it. Don't allow starting a new flow until the current one is completed or explicitly abandoned. Document this constraint.

---

### 6. Offline / Network Error During Slide Rendering

**Status**: Partially addressed (Section 7.3 covers submission errors) but not slide rendering.

**Issue**: What if the network drops WHILE the AI is streaming a `render_slide` tool call? The client may receive partial tool args (state: `input-streaming`) that never complete.

**Recommendation**: 
1. Show a timeout/error state if a tool call stays in `input-streaming` for more than N seconds.
2. Provide a "Retry" button that calls `regenerate()` on the chat.
3. The existing `AIChatError` component could be reused.

---

### 7. Deep Link / Resume UX

**Status**: Section 5.6 describes resume-from-checkpoint using conversation ID, but doesn't address the UX.

**Issue**: When the user resumes:
- Do they see all previous slides (scrollable history)?
- Does the AI re-render the current slide (fresh tool call)?
- What if the AI "forgets" the conversation context (if the backend doesn't persist the full conversation)?

**Recommendation**: Define the resume UX explicitly:
1. On resume, send a message like `"[system: user is resuming onboarding from checkpoint X]"`
2. The AI re-renders the current slide based on conversation history
3. Previously completed slides are visible in the message history (scrollable)
4. If conversation history is lost (backend purge), restart from step 1 but use `completedSteps` from Redux to skip already-completed steps

---

### 8. Backend API Contract

**Status**: The architecture defines the server-side tool handlers as pseudocode but doesn't define the actual API contract between mobile client and backend.

**Issue**: The `useOnboardingChat` hook needs to know:
- Endpoint URL (`/api/v1/onboarding/chat`)
- Request format (same as AI chat? Different?)
- Response format (SSE stream with same headers?)
- How `flowId` / `flowConfig` is communicated
- Whether the existing `prepareSendMessagesRequest` format works or needs changes

**Recommendation**: Define a minimal API contract document or at least specify:
- Request body shape (does it include `flow_id`? `step_id`?)
- Response headers (`X-Chat-Session-Id`, anything onboarding-specific?)
- Whether the endpoint is on the existing Rails backend or the AI backend

---

## Summary Scorecard

| Area | Score | Notes |
|------|-------|-------|
| Schema Design | 7/10 | Good structure but OpenAI strict mode issue is blocking |
| AI SDK Integration | 6/10 | Directionally correct but part type format mismatch is critical |
| State Management | 8/10 | Redux slice is mostly right, just needs trimming (remove activeSlide) |
| Component Architecture | 7/10 | Solid design, FlashList concern needs testing |
| Cross-Platform Strategy | 9/10 | Pragmatic MVP approach with clear extraction path |
| Reuse Assessment | 9/10 | Accurate and honest |
| Data Flow Diagrams | 8/10 | Clear and useful, missing the stale tool call scenario |
| Completeness | 6/10 | Missing error boundaries, analytics, testing, a11y, API contract |

**Overall**: The architecture is a strong foundation with a few critical gaps that need resolution before Phase 3. The two critical findings (C1, C2) are both verifiable with short spikes (<1 day each) and should be resolved first.
