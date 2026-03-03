# Research 1A: AI-Driven Form & Onboarding Frameworks

> **Date**: 2026-02-27
> **Scope**: Open-source and commercial frameworks for AI-driven onboarding, form generation, and generative UI
> **Context**: Building an AI-driven onboarding system for React Native (Expo SDK 52) + React web, using Vercel AI SDK v5 for streaming

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Category 1: Generative UI Frameworks (Agent -> UI)](#category-1-generative-ui-frameworks)
3. [Category 2: Vercel AI SDK Patterns](#category-2-vercel-ai-sdk-patterns)
4. [Category 3: AI Form Builders (Open Source)](#category-3-ai-form-builders-open-source)
5. [Category 4: Business Agent Platforms with UI](#category-4-business-agent-platforms-with-ui)
6. [Category 5: Commercial AI Form/Onboarding Products](#category-5-commercial-ai-formonboarding-products)
7. [Category 6: JSON Schema Form Renderers](#category-6-json-schema-form-renderers)
8. [Key Findings & Gaps](#key-findings--gaps)
9. [Recommendations](#recommendations)

---

## Executive Summary

**No existing framework directly solves our use case.** The combination of requirements we have -- an LLM agent that dynamically selects and composes slide-based UI blocks (not just chat) for onboarding, running on React Native with Vercel AI SDK v5 streaming -- is novel. However, several frameworks provide patterns, components, or architectural ideas we can adopt.

The most relevant findings are:

1. **Vercel AI SDK v5 Tool Calling + Generative UI** -- Already in our stack; the `tool-{name}` parts pattern is the canonical way to render agent-driven UI in a chat context. HIGH relevance.
2. **CopilotKit** -- The most mature generative UI framework (29k stars). React-only (no React Native), but the AG-UI protocol and architectural patterns are highly instructive.
3. **Tambo** -- Generative UI SDK for React (11k stars). Zod-schema-driven component selection by AI. React-only, but the component registration + streaming pattern is directly applicable.
4. **Open Agents Builder** -- Full agent platform with forms, intake, e-commerce. Web-only (Next.js), but validates the "agent picks UI blocks" paradigm for business workflows.
5. **Baidu COSUI** -- UI protocol for AI agents that defines JSON + Markdown protocols for agent-to-UI communication. Conceptually aligned with our schema-driven approach.

**Key gap**: None of these work on React Native. We will need to build a custom rendering layer, but can adopt the schema/protocol patterns from CopilotKit, Tambo, and Vercel AI SDK.

---

## Category 1: Generative UI Frameworks

### 1.1 CopilotKit

| Attribute | Details |
|-----------|---------|
| **Name** | CopilotKit |
| **URL** | https://github.com/CopilotKit/CopilotKit |
| **License** | MIT (open-source) |
| **Stars** | 29.1k |
| **Platform** | React (web), Angular. **No React Native support.** |
| **Maturity** | Production-ready. 1,300+ releases, used by 1.5k+ projects. |
| **Relevance** | **HIGH** (architectural patterns, not direct integration) |

**What it does:**
- The leading "Frontend for Agents & Generative UI" framework
- Agents can render UI components dynamically in the chat context
- Three types of generative UI: Static (AG-UI Protocol), Declarative (A2UI), Open-ended (MCP Apps)
- `useAgent` hook gives programmatic access to agent state
- Shared state between agents and UI components
- Human-in-the-loop: agents pause for user input/confirmation

**How it handles AI/LLM:**
- Created the AG-UI (Agent-User Interaction) Protocol, adopted by Google, LangChain, AWS, Microsoft
- Integrates with LangGraph, CrewAI, Mastra, PydanticAI
- Backend tool rendering: agents call tools that return UI

**How it renders dynamic UI:**
- Tools map to React components
- Agent calls tool -> tool returns data -> React component renders
- Streaming support for real-time updates

**Schema/spec format:**
- AG-UI Protocol (open standard for agent-to-UI communication)
- Tool definitions with Zod schemas

**Why it matters for us:**
- Validates the "agent selects UI via tool calls" pattern
- AG-UI Protocol is the closest existing standard for agent-driven UI
- Shared state pattern is relevant for our onboarding state management
- **Limitation**: No React Native support, so we can't use it directly

---

### 1.2 Tambo

| Attribute | Details |
|-----------|---------|
| **Name** | Tambo |
| **URL** | https://github.com/tambo-ai/tambo |
| **License** | MIT |
| **Stars** | 11k |
| **Platform** | React (web). **No React Native support.** |
| **Maturity** | v1.0 released. Active development (5k+ commits). |
| **Relevance** | **HIGH** (Zod-schema component registration is very close to our needs) |

**What it does:**
- "Build agents that speak your UI"
- Register components with Zod schemas; the AI picks which one to render and streams props
- Two component types: Generative (render once) and Interactable (persist and update)
- Full MCP integration
- Local tools for client-side execution

**How it handles AI/LLM:**
- Built-in agent: brings your own API key (OpenAI, Anthropic, Gemini, etc.)
- Tambo Cloud or self-hosted backend manages conversation state
- Streaming infrastructure built-in (props stream as LLM generates)

**How it renders dynamic UI:**
- Component registration with Zod schemas:
  ```typescript
  const components: TamboComponent[] = [
    {
      name: "Graph",
      description: "Displays data as charts",
      component: Graph,
      propsSchema: z.object({
        data: z.array(z.object({ name: z.string(), value: z.number() })),
        type: z.enum(["line", "bar", "pie"]),
      }),
    },
  ];
  ```
- AI selects component, generates props based on Zod schema
- Streaming: props stream to components as generated

**Schema/spec format:**
- Zod schemas define component props (effectively tool input schemas)
- AI selects component by name + description matching

**Why it matters for us:**
- **Very close to our architecture**: Zod schema -> AI selects -> component renders
- The "component vocabulary" concept maps directly to our "UI blocks"
- Interactable components = our "persistent input state per slide"
- **Limitation**: React-only, requires Tambo backend (cloud or self-hosted)
- **Inspiration**: We can adopt the Zod-schema component registration pattern with our own Vercel AI SDK backend

---

### 1.3 Baidu COSUI

| Attribute | Details |
|-----------|---------|
| **Name** | COSUI |
| **URL** | https://github.com/baidu/cosui |
| **License** | Apache-2.0 |
| **Stars** | 57 |
| **Platform** | Web (San framework, not React). Mobile H5 + PC. |
| **Maturity** | Early stage (18 commits, no releases). |
| **Relevance** | **MEDIUM** (protocol design is relevant, implementation is not) |

**What it does:**
- UI protocol + rendering SDK + component library for generative UI, AI agents, LLM apps
- Two protocol types:
  - **Markdown extension protocol**: Markdown text with structured rendering + dynamic interaction
  - **JSON dynamic protocol**: Flexible JSON for dynamic composition
- Component layering: base components + industry-specific components
- Multi-platform (mobile H5 + PC)
- Theme customization

**Why it matters for us:**
- The dual-protocol approach (Markdown for text content, JSON for structured UI) aligns with our chat-text + slide-schema model
- Mobile H5 support shows the concept works on mobile
- **Limitation**: San framework (not React/RN), very early stage, Chinese documentation only

---

## Category 2: Vercel AI SDK Patterns

### 2.1 Vercel AI SDK v5 -- Generative UI via Tool Calling

| Attribute | Details |
|-----------|---------|
| **Name** | Vercel AI SDK (ai package) |
| **URL** | https://sdk.vercel.ai/docs/ai-sdk-ui/generative-user-interfaces |
| **License** | Apache-2.0 |
| **Stars** | 22.1k |
| **Platform** | React, Next.js. `@ai-sdk/react` works in React Native. |
| **Maturity** | Production-ready (v5.0). |
| **Relevance** | **CRITICAL** -- Already in our stack |

**How Generative UI works in AI SDK v5:**

1. Define tools with Zod input schemas on the server
2. Model calls tools based on conversation context
3. Tool parts stream to client via `toUIMessageStreamResponse()`
4. Client renders typed tool parts: `part.type === 'tool-displayWeather'`
5. Tool parts have states: `input-streaming`, `input-available`, `output-available`, `output-error`

**Key patterns for our use case:**

- **Tool = UI Block**: Each of our slide block types (`single-choice`, `text-input`, `big-text`, etc.) can be a tool
- **Tool input = Block props**: The Zod schema for each tool defines what the AI generates
- **Typed tool parts**: `tool-renderSlide`, `tool-renderChoice` etc. render different components
- **Client-side tools**: User interaction tools that pause for input (like `askForConfirmation`)
- **`addToolOutput`**: Client sends user selections back to the conversation
- **`sendAutomaticallyWhen`**: Auto-continue after user completes input
- **Multi-step calls**: Agent can chain multiple tool calls (slide after slide)
- **Tool call streaming**: Props stream in real-time as AI generates

**Important limitation for React Native:**
- `@ai-sdk/rsc` (React Server Components) does NOT work in React Native
- `@ai-sdk/react` (`useChat` hook) DOES work in React Native
- The tool-calling pattern via `useChat` is our primary integration path

**Architecture implication:**
- Our "slide schema" should be defined as tool input schemas (Zod)
- The AI generates slides by calling tools like `render_slide`, `render_choice`, etc.
- The client renders appropriate React Native components for each tool part
- User responses go back via `addToolOutput` -> next AI turn

---

### 2.2 Vercel AI SDK RSC (Generative UI with Server Components)

| Attribute | Details |
|-----------|---------|
| **Name** | @ai-sdk/rsc |
| **URL** | https://sdk.vercel.ai/docs/ai-sdk-rsc/generative-ui |
| **Status** | **Experimental** -- Vercel recommends AI SDK UI for production |
| **Platform** | Next.js only (requires React Server Components) |
| **Relevance** | **LOW** (does not work in React Native at all) |

**What it does:**
- `streamUI`: Model responds with actual React Server Components
- Server-side rendering of AI-generated UI
- `createStreamableUI`: Streams UI from server to client

**Why it's not relevant:**
- Requires RSC, which is Next.js only
- Cannot run in React Native
- Vercel themselves recommend migrating to the tool-calling `useChat` pattern
- However, the concept of "AI generates UI structure, client renders" is the same pattern we'll implement

---

## Category 3: AI Form Builders (Open Source)

### 3.1 CERN React Formule

| Attribute | Details |
|-----------|---------|
| **Name** | React Formule |
| **URL** | https://github.com/cern-sis/react-formule |
| **License** | MIT |
| **Stars** | 14 |
| **Platform** | React (web) |
| **Maturity** | Active development, v1.9.0 |
| **Relevance** | **MEDIUM** (LLM-to-JSON-Schema form generation is relevant) |

**What it does:**
- Form builder based on JSON Schema and RJSF (React JSON Schema Form)
- **FormuleAI**: Generate and modify form schemas using natural language prompts
- Drag-and-drop form editor with live preview
- Supports OpenAI and Gemini providers
- Diff view for AI-proposed changes before applying

**How AI integration works:**
- User types natural language prompt (e.g., "Add a field for email address")
- AI generates JSON Schema modifications
- Shows diff before/after for user approval
- "Vibe Mode" auto-applies changes without approval

**Schema format:**
- Standard JSON Schema
- RJSF UI Schema for rendering hints

**Why it matters for us:**
- Validates that LLMs can reliably generate JSON schemas for forms
- The prompt engineering for form generation is reusable
- JSON Schema is a well-established standard we could adopt
- **Limitation**: Design-time form generation (human edits forms), not runtime agent-driven rendering
- **Limitation**: React web only, RJSF is not React Native compatible

---

### 3.2 XiaojuSurvey (DiDi)

| Attribute | Details |
|-----------|---------|
| **Name** | XiaojuSurvey |
| **URL** | https://github.com/didi/xiaoju-survey |
| **License** | Apache-2.0 |
| **Stars** | 3.7k |
| **Platform** | Web (Vue3), with React Native SDK for embedding |
| **Maturity** | Production-grade (used at DiDi, 40+ question types) |
| **Relevance** | **MEDIUM** (survey/form schema design, AI generation) |

**What it does:**
- Enterprise form/survey builder and analytics platform
- 40+ question types, 100+ templates
- AI-powered questionnaire generation from natural language
- Logic branching, skip logic, conditional display
- Data analytics and export

**How AI integration works:**
- "AI generates questionnaire" from a conversation
- One-click LLM integration
- Real-time preview during generation

**Schema format:**
- Custom "Questionnaire Meta Protocol" (standardized survey schema)
- Question type protocol
- Material protocol (UI components)

**Why it matters for us:**
- The most mature open-source survey/form system with AI integration
- Their schema protocol for question types is well-designed and battle-tested
- React Native SDK exists for embedding surveys
- **Limitation**: Vue3 web app (not React), survey-focused (not conversational onboarding)
- **Inspiration**: Question type taxonomy, schema protocol design, branching logic

---

### 3.3 Form-Axis

| Attribute | Details |
|-----------|---------|
| **Name** | Form-Axis |
| **URL** | https://github.com/adarshaacharya/form-axis |
| **License** | Open source |
| **Stars** | 8 |
| **Platform** | Web (Next.js + Convex) |
| **Maturity** | Prototype/demo |
| **Relevance** | **LOW** |

**What it does:**
- AI-powered form builder with "conversational interface"
- Uses LLM to generate form schemas from conversation
- Next.js + Convex + Clerk

**Why it's noted:**
- Validates the concept of conversational form creation
- Too small/early to be useful directly

---

## Category 4: Business Agent Platforms with UI

### 4.1 Open Agents Builder

| Attribute | Details |
|-----------|---------|
| **Name** | Open Agents Builder |
| **URL** | https://github.com/CatchTheTornado/open-agents-builder |
| **License** | MIT |
| **Stars** | 159 |
| **Platform** | Web (Next.js) |
| **Maturity** | v0.7.0, active development |
| **Relevance** | **MEDIUM** (validates agent-driven intake forms & business workflows) |

**What it does:**
- Multi-agent development IDE and platform for business
- Build customer-facing AI agents for: e-commerce, bookings, intake forms, NPS, CPQ
- Vercel AI tools integration
- Multi-agent workflows (oneOf, parallel, sequence, evaluator, forEach)
- Embeddable chat interface for end users
- Order management, product catalog, calendar/booking

**How it handles AI/LLM:**
- System prompt defines agent behavior and goal
- Vercel AI SDK tools for business actions (createOrder, bookCalendar, etc.)
- Agent dynamically sets questions based on previous answers
- Goal-focused: agent knows what data to collect

**How it renders dynamic UI:**
- Chat interface with agent-driven questions
- Agent adapts questions dynamically based on context
- Collects data in any format (JSON, markdown)
- Result storage and session management

**Why it matters for us:**
- **Closest conceptual match**: Agent-driven, goal-oriented data collection via conversational UI
- Proves the pattern of "agent dynamically chooses questions" works for business use cases
- Uses Vercel AI SDK tools (same as our stack)
- **Limitation**: Web-only (Next.js), chat-only (no structured slides/blocks)
- **Inspiration**: Agent prompt design for goal-oriented data collection

---

### 4.2 Laudspeaker

| Attribute | Details |
|-----------|---------|
| **Name** | Laudspeaker |
| **URL** | https://github.com/laudspeaker/laudspeaker |
| **License** | Open source |
| **Stars** | 2.6k |
| **Platform** | Web (React + NestJS) |
| **Maturity** | Established (state machine based) |
| **Relevance** | **LOW** (product onboarding tool, not AI-driven) |

**What it does:**
- Open-source customer engagement and product onboarding platform
- State machine-based flow design
- Multi-channel: email, SMS, push, in-app
- Alternative to Braze/OneSignal/Appcues

**Why it's noted:**
- State machine approach to onboarding is relevant for our step progression
- Not AI-driven; traditional rule-based flows
- **Inspiration**: State machine design for flow management

---

## Category 5: Commercial AI Form/Onboarding Products

### 5.1 Typeform AI

| Attribute | Details |
|-----------|---------|
| **Name** | Typeform (with AI features) |
| **URL** | https://typeform.com |
| **Type** | Commercial SaaS |
| **Pricing** | Free tier, paid plans from $25/mo |
| **Platform** | Web, embeddable |
| **Relevance** | **LOW** (no API for dynamic AI-driven forms) |

**AI features:**
- AI-powered form generation from prompts
- Smart suggestions for question types
- No real-time agent-driven form rendering
- Static forms generated by AI, not dynamic agent-driven flows

---

### 5.2 Fillout AI / Tally AI

| Attribute | Details |
|-----------|---------|
| **Name** | Fillout / Tally |
| **Type** | Commercial SaaS |
| **Relevance** | **LOW** |

**Status:**
- Both offer AI-assisted form creation (generate forms from prompts)
- Not agent-driven runtime rendering
- No SDK/API for embedding dynamic AI forms
- Static form builders with AI as a design-time assistant

---

### 5.3 Appcues / Pendo / Userpilot / WalkMe

| Attribute | Details |
|-----------|---------|
| **Name** | Various product onboarding tools |
| **Type** | Commercial SaaS |
| **Relevance** | **LOW** |

**What they do:**
- In-app product tours, tooltips, checklists
- Rule-based (not AI-driven)
- Focus on feature adoption, not data collection onboarding
- SDKs available but for overlaying guides on existing UI

**Why they're not relevant:**
- Traditional, non-AI onboarding tools
- Focus on product tours, not conversational data collection
- No LLM integration

---

### 5.4 Usertour (Open Source)

| Attribute | Details |
|-----------|---------|
| **Name** | Usertour |
| **URL** | https://github.com/usertour/usertour |
| **License** | Open source |
| **Stars** | 1.9k |
| **Platform** | Web |
| **Relevance** | **LOW** (product tours, not AI onboarding) |

Open-source alternative to Userflow/Appcues. Product tours, checklists, surveys. Not AI-driven.

---

## Category 6: JSON Schema Form Renderers

These are not AI-specific but are relevant for the "render forms from schema" part of our architecture.

### 6.1 React JSON Schema Form (RJSF)

| Attribute | Details |
|-----------|---------|
| **URL** | https://github.com/rjsf-team/react-jsonschema-form |
| **Stars** | 14k+ |
| **Platform** | React web (no React Native) |
| **Relevance** | **MEDIUM** (schema design reference) |

- Industry standard for rendering forms from JSON Schema
- Not React Native compatible
- Schema format is well-documented and could inform our slide schema design

### 6.2 react-native-onboarding-swiper

| Attribute | Details |
|-----------|---------|
| **URL** | https://github.com/jfilter/react-native-onboarding-swiper |
| **Stars** | 1.1k |
| **Platform** | React Native |
| **Relevance** | **LOW** (static slides, no AI) |

- Traditional swipeable onboarding slides for React Native
- Fixed content, no dynamic rendering
- Could inform our slide transition/animation patterns

---

## Key Findings & Gaps

### What exists:
1. **Generative UI frameworks** (CopilotKit, Tambo) solve "agent renders UI" for React web
2. **Vercel AI SDK v5** has native support for tool-call-driven UI rendering
3. **AI form builders** (React Formule, XiaojuSurvey) can generate schemas from natural language
4. **Business agent platforms** (Open Agents Builder) do agent-driven data collection
5. **JSON Schema** is the de facto standard for form schema representation

### What doesn't exist (our gap):
1. **No AI-driven onboarding framework for React Native** -- Every generative UI framework is React web only
2. **No "slide-based" agent UI** -- All existing solutions are chat-based; none compose full-screen slide layouts
3. **No cross-platform (RN + web) generative UI SDK** -- This is greenfield
4. **No framework combining chat + structured slides** in a single agent-driven flow
5. **No Vercel AI SDK v5 + React Native generative UI examples** -- We'd be pioneers

### Patterns to adopt:

| Pattern | Source | How to apply |
|---------|--------|-------------|
| Tool calls as UI blocks | Vercel AI SDK v5 | Each slide block type = a tool with Zod schema |
| Component registration with Zod schemas | Tambo | Register RN components with schemas, AI selects |
| AG-UI protocol | CopilotKit | Reference for agent-to-UI communication protocol |
| `addToolOutput` for user input | Vercel AI SDK v5 | User selections sent back as tool results |
| Multi-step tool calls | Vercel AI SDK v5 | Agent chains slide-after-slide in one conversation |
| Dual protocol (text + structured) | Baidu COSUI | Chat text (markdown) + slide schema (JSON) |
| Question type taxonomy | XiaojuSurvey | 40+ battle-tested question types inform our block types |
| State machine for flow | Laudspeaker | Step progression with state machine (XState?) |

---

## Recommendations

### 1. Build custom, don't adopt an existing framework

No existing framework fits our requirements (React Native + Vercel AI SDK v5 + slide-based + cross-platform). We need to build a custom framework, but we can heavily borrow patterns.

### 2. Architecture: Vercel AI SDK v5 tool-calling is our foundation

The `useChat` + tool parts pattern from Vercel AI SDK v5 is the right foundation:
- Define slide/block types as tools with Zod schemas
- Agent calls `render_slide` tool with block definitions
- Client renders React Native components for each tool part
- User interactions go back via `addToolOutput`
- `sendAutomaticallyWhen` handles auto-advance

### 3. Schema design: Learn from Tambo + RJSF + XiaojuSurvey

- Use Zod schemas (like Tambo) for type-safe block definitions
- Reference RJSF's JSON Schema patterns for form field definitions
- Reference XiaojuSurvey's question type taxonomy for block types

### 4. Protocol design: Inspired by CopilotKit AG-UI + COSUI

- Define a clear agent-to-UI protocol for our slide schema
- Support both text (chat/streaming) and structured (slide blocks) content
- Define typed message parts for each block type

### 5. Rendering layer: Platform-specific, shared schemas

- Core logic (schemas, state, AI communication) is shared TypeScript
- React Native rendering layer uses our existing Radix + twrnc components
- React web rendering layer (future) uses standard React components
- Both consume the same Zod-defined schemas

---

## Framework Comparison Matrix

| Framework | Open Source | React Native | AI-Driven | Structured UI (not just chat) | Streaming | Schema Format | Relevance |
|-----------|-----------|-------------|-----------|------------------------------|-----------|--------------|-----------|
| **Vercel AI SDK v5** | Yes | Partial (`useChat` works) | Yes (tool calling) | Yes (via tool parts) | Yes | Zod schemas | **CRITICAL** |
| **CopilotKit** | Yes (MIT) | No | Yes (AG-UI) | Yes (generative UI) | Yes | AG-UI protocol | **HIGH** |
| **Tambo** | Yes (MIT) | No | Yes (built-in agent) | Yes (component selection) | Yes | Zod schemas | **HIGH** |
| **Open Agents Builder** | Yes (MIT) | No | Yes (Vercel AI tools) | Partial (chat + forms) | Yes | Custom | **MEDIUM** |
| **React Formule** | Yes (MIT) | No | Yes (LLM form gen) | Yes (form builder) | No | JSON Schema | **MEDIUM** |
| **XiaojuSurvey** | Yes (Apache) | Partial (embed SDK) | Yes (AI generation) | Yes (40+ types) | No | Custom protocol | **MEDIUM** |
| **Baidu COSUI** | Yes (Apache) | No (mobile H5) | Yes (protocol) | Yes (JSON + Markdown) | No | JSON/Markdown | **MEDIUM** |
| **Typeform/Fillout/Tally** | No | No | Design-time only | Yes (forms) | No | Proprietary | **LOW** |
| **Appcues/Pendo/WalkMe** | No | Some | No | Yes (product tours) | No | Proprietary | **LOW** |

---

## Next Steps

1. **Research 1B**: Deep-dive into Vercel AI SDK v5 Generative UI patterns specifically for React Native
2. **Research 1C**: Evaluate JSON Schema form renderers that work on React Native
3. **Phase 2**: Architecture design based on these findings (schema spec, component architecture, state machine, AI integration, cross-platform strategy)
