# Spike: Validate ViewSchema Against OpenAI Structured Output (strict mode)

**Status**: OPEN — must complete before Phase 1 implementation
**Blocking**: ViewSchema Zod definition, AI backend tool registration
**Effort**: 0.5 day
**Priority**: P0 — Phase 1 cannot start without this

## Problem

OpenAI's structured output with `strict: true` has constraints:
- All properties must be listed in `required`
- No `additionalProperties: true`
- Schema depth and complexity limits (undocumented but empirically around 5 levels deep, ~100 properties)

The proposed `render_view` tool uses a discriminated union of 11 block types, each with their own
properties. This may hit OpenAI's complexity limits when compiled to JSON Schema.

Additionally, the Zod `.optional()` fields throughout the block schemas must be expressed as
`z.union([z.string(), z.null()])` (nullable) rather than truly optional under strict mode. The
Vercel AI SDK's `zodSchema()` converter handles this automatically, but it means the LLM must
output explicit `null` for every optional field — increasing token usage and potentially causing
LLM compliance issues.

## Background

From `proposal-architecture-review.md` (finding C2):
> "The current schemas will fail at the provider level... the LLM must explicitly output null for
> every optional field — increasing token usage... may hit OpenAI's structured output schema
> complexity limits."

From `architecture-design.md` Section 2 (OpenAI Strict Mode Guidance):
> "MVP subset only — For the MVP, use only the 5-block subset (BigText, SingleChoice, TextInput,
> InfoCard, Success) with strict mode. The full 11-block discriminated union may exceed OpenAI's
> schema complexity limits."

## MVP Schema to Test (5 blocks first)

```typescript
import { z } from 'zod';

const ViewSchema = z.object({
  title: z.string(),
  presentation_mode: z.enum(["inline", "full"]).optional(),
  blocks: z.array(z.discriminatedUnion("type", [
    z.object({ type: z.literal("big_text"), content: z.string() }),
    z.object({
      type: z.literal("single_choice"),
      question: z.string(),
      options: z.array(z.object({ label: z.string(), value: z.string() })),
    }),
    z.object({
      type: z.literal("text_input"),
      label: z.string(),
      placeholder: z.string().optional(),
    }),
    z.object({ type: z.literal("info_card"), title: z.string(), body: z.string() }),
    z.object({ type: z.literal("success"), message: z.string() }),
  ])),
});
```

Note: Block type names use `snake_case` with underscores (not hyphens) to align with OpenAI
function naming conventions that prefer alphanumeric + underscore.

## How to Spike

1. Add the above Zod schema to the AI backend tool definitions (in `ai-backend/`).

2. Register `render_view` as a tool with `strict: true`:
   ```python
   # In AI backend tool definitions
   render_view_tool = {
     "type": "function",
     "function": {
       "name": "render_view",
       "description": "Render an interactive UI view with blocks for user input",
       "strict": True,
       "parameters": <zodSchema(ViewSchema) converted to JSON Schema>
     }
   }
   ```

3. Make a test call to OpenAI with `strict: true` and this tool. A minimal test prompt:
   "Show me a single choice question asking what type of business I run."

4. **If it succeeds**: Document the confirmed schema and proceed with 5-block MVP.

5. **If it fails**: Try the fallback options below, starting with Option A.

6. Document what works here and in `architecture-design.md` Section 2.

## Fallback Options (if strict mode fails)

### Option A: Reduce to 3-block MVP only for Phase 1
Use only `big_text`, `single_choice`, and `success` for the initial Phase 1. Expand to 5 blocks
in Phase 1.5 after confirming the 3-block schema works.

### Option B: Remove `strict: true` from render_view tool
Drop `strict: true` for `render_view` specifically while keeping it on other tools. The LLM
will use best-effort JSON generation. Add robust client-side Zod validation as defense-in-depth
(already planned in `architecture-design.md` Section 2 schema validation strategy).

Trade-off: Higher risk of malformed JSON from the LLM, but better schema flexibility and no
token overhead from null fields.

### Option C: Split into separate tools per block type (revisit Decision 2)
Decision 2 rejected this approach because multi-tool coordination is fragile. However, if strict
mode consistently fails for discriminated unions, separate tools per block type may be the only
path to strict mode compliance.

This would mean: `render_big_text`, `render_single_choice`, `render_text_input`, `render_info_card`,
`render_success` — each with a simple flat schema that easily passes strict mode.

Only pursue this if Options A and B are both unacceptable.

## Also Test: Full 11-Block Schema

After the 5-block MVP passes (or Option A/B is chosen), also test the full 11-block schema to
understand the ceiling:

```typescript
// Full schema from architecture-design.md Section 2
// (BigText, SingleChoice, MultiChoice, TextInput, Dropdown, Toggle,
//  ImageChoice, InfoCard, Confirmation, Loading, Success)
```

This determines whether the full schema can be used in later phases or whether the MVP subset
must be the permanent production schema.

## Update This Doc When Complete

Replace this section with:
- The result of the 5-block test (pass/fail + error message if fail)
- The chosen fallback option if 5-block failed
- The confirmed working schema (copy the Zod code that passed)
- The result of the full 11-block test (if attempted)
- An example OpenAI API call with the tool definition that succeeded
- Link to the commit that added the confirmed schema to `architecture-design.md`
