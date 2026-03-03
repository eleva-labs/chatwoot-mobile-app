# Spike: Verify Tool Part Shape in Vercel AI SDK v5

**Status**: OPEN — must complete before Phase 1 implementation
**Blocking**: AIPartRenderer render_view dispatch, ViewRenderer props
**Effort**: 0.5 day
**Priority**: P0 — Phase 1 cannot start without this

## Problem

The `AIPartRenderer` dispatches tool parts by reading `part.toolName`. But the exact runtime
shape of a no-execute tool call part in Vercel AI SDK v5's `UIMessage` is not documented clearly
and may differ from what's in `parts.ts` type definitions.

Specifically unknown:
- Is the tool name in `part.toolName` or parsed from `part.type` (e.g., `"tool-render_view"` → `"render_view"`)?
- Are the tool arguments in `part.args` or `part.input`?
- Does the part have `toolCallId`? If so, what key?
- What does the part look like DURING streaming (args not yet complete) vs AFTER (args complete)?

## Background

The current `AIPartRenderer.tsx` (line 154) reads the tool name as:
```typescript
const toolName = 'toolName' in part ? (part as { toolName?: string }).toolName : undefined;
```

This works if the SDK puts the tool name in `part.toolName`. But `proposal-architecture-review.md`
(finding C1) and `proposal-package-extraction-review.md` (finding C2) both flag that AI SDK v5
typed tool parts have `type: 'tool-render_view'` (name encoded in type string) and `input` (not
`args`). The existing `ToolCallPart` interface in `parts.ts` uses `toolName` and `args?`, which
may reflect the Chatwoot backend format rather than what the SDK produces for no-execute tools.

The `startsWith('tool-')` detection in `isToolPart()` will correctly catch any format. The
unknown is what fields appear on the part object itself.

## How to Spike

1. Add a temporary `console.warn('TOOL_PART:', JSON.stringify(part, null, 2))` to `AIPartRenderer.tsx`
   in the tool dispatch branch (where `isToolPart(part)` is true):

```typescript
// In AIPartRenderer.tsx, step 4 (line ~153):
if (isToolPart(part)) {
  // SPIKE-1: Log actual runtime shape
  console.warn('[SPIKE-1] TOOL_PART:', JSON.stringify(part, null, 2));

  const toolName = 'toolName' in part ? (part as { toolName?: string }).toolName : undefined;
  // ...
}
```

2. From the AI backend, send a test tool call: `render_view` with a simple
   `{ view: { title: "Test", blocks: [{ type: "info_card", title: "Hello", body: "World" }] } }`.

3. Capture the logged part shape in iOS simulator (use `xcrun simctl spawn booted log stream`
   per AGENTS.md logging instructions).

4. Document the exact shape here and update `src/domain/types/ai-chat/parts.ts` type definitions
   accordingly.

5. Remove the temporary `console.warn` before committing.

## Expected Outcome

A confirmed type definition like:

```typescript
// Confirmed runtime shape (fill in after spike):
interface ToolCallPartRuntime {
  type: string;        // e.g., "tool-render_view"
  toolName: string;    // e.g., "render_view"  ← confirm this exists
  args: unknown;       // OR: input: unknown   ← confirm which key
  toolCallId: string;  // ← confirm this key name
  state: ToolState;    // "input-streaming" | "input-available" | "output-available" | "output-error"
}
```

## Additional Checks During Spike

While running the spike, also verify:

1. **During streaming** (`state: 'input-streaming'`): What does `args` / `input` look like when the JSON is only partially received? Is it a partial string or a partial object?

2. **After streaming complete** (`state: 'input-available'`): Is the value a parsed object (Record<string, unknown>) or a string that needs JSON.parse?

3. **After addToolOutput** (`state: 'output-available'`): Does the part update in-place or is a new part added? Does `part.result` or `part.output` hold the tool result?

4. **sendAutomaticallyWhen callback**: What does the messages array look like when a tool output has been added? This determines how to detect "render_view has been submitted" in the callback.

## Update This Doc When Complete

Replace this section with:
- The confirmed runtime shape (copy of actual JSON.stringify output)
- Any differences from what `parts.ts` currently defines
- The updated `parts.ts` ToolCallPart interface
- The confirmed `sendAutomaticallyWhen` pattern for detecting render_view completion
- Link to the commit that updated `parts.ts`
