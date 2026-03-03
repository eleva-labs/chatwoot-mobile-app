# Research 1c: JSON Schema Form Renderers

> **Date**: 2026-02-27
> **Context**: AI-driven onboarding system where an LLM produces JSON schemas describing UI layouts. We need a rendering layer for React Native (primary) and React web (secondary).
> **Stack**: Expo SDK 52, twrnc styling, Vercel AI SDK v5, Radix theme system

---

## Executive Summary

**The React Native JSON-schema form renderer ecosystem is immature.** Unlike React web — which has several mature, well-maintained libraries (RJSF, JSON Forms, uniforms) — React Native has no battle-tested, actively-maintained library that takes a JSON Schema and renders native mobile form components.

**Key finding**: None of the major libraries (RJSF, JSON Forms, uniforms) natively support React Native out of the box. The few RN-specific attempts are abandoned prototypes with < 10 GitHub stars. The closest viable options are:

1. **Custom schema renderer** (RECOMMENDED) — build a lightweight renderer using our own schema format, tailored to our slide/block vocabulary
2. **UI-Schema** — has a React Native demo with Expo, design-system agnostic architecture
3. **Formily** — claims React Native support, 12.6k stars, but RN package seems incomplete/unpublished

Given our requirements (custom block types like `single-choice`, `image-choice`, `loading`, `success`; twrnc/Radix styling; streaming AI integration), a **custom schema renderer is the strongest recommendation**.

---

## 1. React JSON Schema Form (RJSF)

| Attribute | Details |
|-----------|---------|
| **URL** | https://github.com/rjsf-team/react-jsonschema-form |
| **GitHub Stars** | 15,700 |
| **Latest Version** | v6.3.1 (Feb 2026) |
| **License** | Apache 2.0 |
| **Schema Format** | JSON Schema (Draft-07, 2019-09, 2020-12) + uiSchema |
| **React Native Support** | **NO** — Web only (renders HTML forms) |
| **Custom Themes** | Yes — 10+ themes (MUI, Ant Design, Chakra, Shadcn, Bootstrap, etc.) |
| **Validation** | AJV8-based, built-in |
| **Zod Compatible** | No (uses AJV) |
| **Bundle Size** | ~80-100KB (core + validator + theme) |
| **Maturity** | Very high — used by 6,100+ repos |
| **Relevance** | **LOW for RN** / HIGH for web |

### Analysis
RJSF is the gold standard for JSON Schema forms on the web. It has excellent theme support, a live playground, and strong community. However:
- It renders `<form>`, `<input>`, `<select>` — DOM elements that don't exist in React Native
- No React Native theme exists (community or official)
- There's even a repo called `DaveSauce/failing-native-rjsform-attempt` documenting a failed attempt to make it work with RN
- The architecture assumes DOM throughout; creating an RN binding would be a significant fork
- **Web use case**: Could be used for the secondary React web rendering if we adopt standard JSON Schema

### Verdict
Not viable for React Native. Potentially useful as the web-side renderer if we standardize on JSON Schema.

---

## 2. JSON Forms (Eclipse Source)

| Attribute | Details |
|-----------|---------|
| **URL** | https://github.com/eclipsesource/jsonforms |
| **Website** | https://jsonforms.io |
| **GitHub Stars** | 2,600 |
| **Latest Version** | v3.7.0 (Nov 2025) |
| **License** | MIT |
| **Schema Format** | JSON Schema + UI Schema (layout/control-based) |
| **React Native Support** | **NO** — React, Angular, Vue only |
| **Custom Renderers** | Yes — modular renderer architecture |
| **Validation** | AJV-based, built-in |
| **Zod Compatible** | No |
| **Bundle Size** | ~60-80KB |
| **Maturity** | High — active development, professional support available |
| **Relevance** | **LOW for RN** / MEDIUM for web |

### Analysis
JSON Forms has an interesting architecture with a pure-JS core decoupled from UI frameworks. In theory, you could write React Native renderers since the core is framework-agnostic. However:
- No React Native renderer set exists (checked `/docs/react-native` — returns 404)
- The UI Schema concept (controls + layouts) is interesting and similar to our slide/block model
- Has a `rule` system for conditional visibility — aligns with our dynamic step progression
- The dual-schema approach (JSON Schema + UI Schema) maps well to our use case where the LLM could emit both
- Commercial support available from EclipseSource
- Creating an RN renderer set would be a moderate effort but feasible given the modular architecture

### Verdict
Architecturally interesting but not ready for React Native. The UI Schema concept is worth studying for our own schema design. Writing RN renderers from scratch for JSON Forms core is possible but the effort may not justify the benefit over a custom solution.

---

## 3. Formily (Alibaba)

| Attribute | Details |
|-----------|---------|
| **URL** | https://github.com/alibaba/formily |
| **Website** | https://formilyjs.org |
| **GitHub Stars** | 12,600 |
| **Latest Version** | v2.3.6 (May 2025) |
| **License** | MIT |
| **Schema Format** | JSON Schema + custom "JSchema" for frontend |
| **React Native Support** | **CLAIMED but unverified** |
| **Custom Themes** | Yes — Ant Design, Fusion integrations |
| **Validation** | Built-in, extensive |
| **Zod Compatible** | No (custom validator) |
| **Bundle Size** | Large — complex architecture |
| **Maturity** | High in Chinese ecosystem, moderate internationally |
| **Relevance** | **MEDIUM** |

### Analysis
Formily's GitHub description explicitly says "Support React/React Native/Vue 2/Vue 3" and has `react-native` as a topic tag. However:
- The `@formily/react-native` npm package does **not appear to exist** on npm (returns login page, not found)
- No dedicated React Native documentation found on formilyjs.org
- The website itself returned 403/no content on multiple attempts
- Documentation is primarily in Chinese — could be a barrier
- Last release was May 2025 — still maintained
- The "JSchema" front-end format is interesting but proprietary
- Field-level independent state management (no full tree re-render) is excellent for performance
- Has a visual Form Builder (designable-antd)
- The reactive field management model aligns well with our need for per-field updates during streaming

### Verdict
Promising on paper but React Native support appears incomplete or unpublished. The field-level reactive model is worth studying. Not recommended as a dependency due to uncertainty about RN support and Chinese-centric documentation.

---

## 4. Uniforms (Vazco)

| Attribute | Details |
|-----------|---------|
| **URL** | https://github.com/vazco/uniforms |
| **Website** | https://uniforms.tools |
| **GitHub Stars** | ~1,900 (estimated from community metrics) |
| **Latest Version** | v4.0 |
| **License** | MIT |
| **Schema Format** | JSON Schema, GraphQL, SimpleSchema, Zod, custom bridges |
| **React Native Support** | **NO** — web-only themes (AntD, Bootstrap, MUI, Semantic UI) |
| **Custom Themes** | Yes — 6 theme packages + unstyled base |
| **Validation** | Schema-driven (supports Zod!) |
| **Zod Compatible** | **YES** — has Zod bridge |
| **Bundle Size** | ~30-50KB |
| **Maturity** | High — used by Nokia, Deskpro, etc. |
| **Relevance** | **LOW for RN** / MEDIUM-HIGH for web |

### Analysis
Uniforms stands out for its schema-agnostic bridge pattern — it supports JSON Schema, GraphQL, SimpleSchema, **and Zod** out of the box. This is very relevant to our stack (we use Zod extensively).
- The theme system has only web-focused themes (all output HTML)
- No React Native theme exists
- "Unstyled" theme exists but still renders HTML elements
- The bridge pattern (schema adapter layer) is architecturally excellent
- Commercial variant "Forminer" exists for no-code/low-code use cases
- Comparison table shows it's the only library with automatic form layout + multiple schema support

### Verdict
Not viable for React Native rendering. But the **Zod bridge pattern is a key architectural insight** — we should adopt a similar adapter pattern for schema validation.

---

## 5. UI-Schema

| Attribute | Details |
|-----------|---------|
| **URL** | https://github.com/ui-schema/ui-schema |
| **Website** | https://ui-schema.bemit.codes |
| **GitHub Stars** | 370 |
| **Latest Version** | 0.5.x (next/pre-release), 0.4.7 stable (Dec 2024) |
| **License** | MIT |
| **Schema Format** | JSON Schema (Draft-04 through 2020-12) + UI Schema keywords |
| **React Native Support** | **YES — demo exists** (github.com/ui-schema/demo-react-native) |
| **Custom Widgets** | Yes — headless core, any design system |
| **Validation** | Built-in JSON Schema validators |
| **Zod Compatible** | No |
| **Bundle Size** | Modular — core is small |
| **Maturity** | Low-medium — small community, pre-1.0 |
| **Relevance** | **MEDIUM-HIGH** |

### Analysis
UI-Schema is the **only library found with a working React Native + Expo demo**. Key findings:
- Demo app: `ui-schema/demo-react-native` — uses Expo, TypeScript, custom RN widgets
- The demo includes custom `string`, `boolean`, and `Select` widgets for RN
- Architecture: "isomorphic code: for browser, server, and more" + "not just for React, with vanilla-JS core"
- Has a headless React binding (`@ui-schema/react`) that doesn't assume DOM
- Widget creation is straightforward — you get `value`, `onChange`, `schema`, `errors`, etc.
- Supports JSON Schema versions from Draft-04 to 2020-12
- Performance optimized — only re-renders changed fields
- Has a plugin system for custom behavior
- The RN demo explicitly states "No experience with Expo/React Native. Without checking best practices" — it's a proof of concept, not production-ready
- Small community (370 stars, 3 watchers) — bus factor risk

### Verdict
**Most promising existing library** for our use case. The headless architecture and existing RN demo prove feasibility. However, the small community, pre-1.0 status, and the RN demo being a quick POC mean we'd be taking on risk. Consider forking or studying the architecture for our custom solution.

---

## 6. SurveyJS

| Attribute | Details |
|-----------|---------|
| **URL** | https://github.com/surveyjs/surveyjs |
| **Website** | https://surveyjs.io |
| **GitHub Stars** | ~4,500 |
| **Latest Version** | v2.5.13 (Feb 2026 — very active) |
| **License** | MIT (core) / Commercial (creator, dashboard, PDF) |
| **Schema Format** | Custom JSON schema (SurveyJS format) |
| **React Native Support** | **EARLY POC** — `survey-react-native-ui` v0.1.1 (3 months ago) |
| **Custom Renderers** | Yes — `registerQuestionRenderer()` API |
| **Validation** | Built-in, extensive |
| **Zod Compatible** | No |
| **Bundle Size** | Large — `survey-core` is heavy |
| **Maturity** | Very high (web), very low (RN) |
| **Relevance** | **MEDIUM** |

### Analysis
SurveyJS is a commercial-grade survey/form platform. They recently started a React Native package:
- `survey-react-native-ui` v0.1.1 published 3 months ago — early POC
- Uses React Native Paper (Material Design 3) for theming
- Only supports `text` question type currently
- Has a `registerQuestionRenderer` API for adding custom question types
- 0 weekly downloads — nobody is using it yet
- The web platform is very mature with 30+ question types, conditional logic, custom CSS, etc.
- Commercial licensing for Survey Creator, Dashboard, and PDF Generator
- The schema format is custom (not JSON Schema) but well-documented

### Verdict
Interesting that SurveyJS is actively developing RN support, but it's too early (v0.1.1, text-only). The `registerQuestionRenderer` pattern is relevant to our architecture. Monitor for progress but don't depend on it.

---

## 7. Abandoned / Immature RN-Specific Libraries

### react-native-jsonschema-form (royaizenberg)
- npm: `react-native-jsonschema-form` v0.0.8
- **Last updated: 7 years ago** — dead
- 2 weekly downloads, no README, 122kB
- Irrelevant

### react-native-dynamic-form (athadikonda)
- npm: `react-native-dynamic-form` v0.0.1
- **Last updated: 6 years ago** — dead
- 41 weekly downloads (likely bots/legacy)
- Irrelevant

### @mrizki/dynamic-form
- npm: v1.0.0-build-14
- **Last updated: 6 years ago** — dead
- Uses react-hook-form + custom JSON schema
- Irrelevant

### reactgap/react-native-jsonschema-form
- GitHub: 8 stars
- Updated 4 days ago (surprisingly active!)
- Generates forms from JSON schema for RN
- Very small, potentially worth checking
- **Relevance: LOW-MEDIUM** — too small to depend on

### AndroConsis/react-native-json-schema-form
- GitHub: 3 stars
- Updated 4 days ago
- A React-Native component to build forms out of JSONSchema
- Too small/immature
- **Relevance: LOW**

---

## 8. Server-Driven UI Patterns (Not Libraries, but Architectural Patterns)

### Airbnb Server-Driven UI
- Published widely about rendering UI from server-sent JSON descriptions
- Pattern: Server sends a tree of typed components with props, client has a registry of renderers
- Very relevant to our architecture — the LLM effectively becomes the "server" that drives UI
- No open-source library, but the pattern is well-documented

### Shopify Hydrogen / Mobile SDUI
- Shopify uses server-driven UI extensively in their mobile apps
- Pattern: Backend sends component trees as JSON, mobile client maps to native components
- Similar concept to our slide/block schema approach

### Pattern Summary
Server-driven UI (SDUI) is exactly what we're building. The common pattern is:
1. **Schema/descriptor** — JSON describing what to render (component type, props, children)
2. **Component registry** — client-side map from type strings to actual components
3. **Renderer** — walks the schema tree, looks up components, renders with props
4. **Data binding** — connects form values to a store

This is lightweight to implement custom. The LLM-as-server pattern is a natural fit.

---

## 9. AI/LLM-Specific Form Renderers

No libraries were found specifically designed for rendering AI-generated form schemas. This is a gap in the ecosystem. Relevant adjacent work:

### Vercel AI SDK Generative UI
- The `ai` package's tool system with `streamUI()` allows LLMs to return React components
- This is the closest pattern to our use case
- But it works with React web components, not React Native directly
- We already use Vercel AI SDK v5 — the tool call pattern maps directly to our schema approach

### Vercel v0
- Generates full React components from prompts
- Not a runtime renderer — generates code, not schemas
- Different paradigm from what we need

### No "AI Form SDK" exists
- The concept of "LLM outputs schema, client renders form" is novel enough that no dedicated library exists
- We would be pioneering this pattern for React Native

---

## 10. Cross-Platform Schema Standards

### JSON Schema (json-schema.org)
- **The standard** for describing JSON data structure
- Draft-07, 2019-09, 2020-12 are widely supported
- Great for data validation, but **does not describe UI layout**
- Must be paired with a "UI Schema" for rendering (as RJSF, JSON Forms, UI-Schema all do)

### UI Schema Patterns
Three competing approaches exist:
1. **RJSF uiSchema** — flat object mapping schema fields to UI options (`{"ui:widget": "radio"}`)
2. **JSON Forms UISchema** — tree structure with layout elements (`VerticalLayout > Control`)
3. **Custom vocabulary** — add UI keywords directly to JSON Schema (`"widget": "select"`)

### Recommendation for Our Schema
Our requirements go beyond standard form fields (we have `big-text`, `image-choice`, `loading`, `success`, `progress` blocks). None of the standard approaches cover these. We should:
- Use **JSON Schema** for data validation of collected responses
- Use a **custom slide/block schema** for UI layout (as defined in requirements.md)
- Keep them as separate concerns — the LLM emits the UI schema, validation schemas derive from it

---

## Comparison Matrix

| Library | RN Support | Stars | Schema | Custom Styling | Zod | Active | Relevance |
|---------|-----------|-------|--------|---------------|-----|--------|-----------|
| RJSF | NO | 15.7k | JSON Schema | Yes (themes) | No | Yes | LOW (RN) |
| JSON Forms | NO | 2.6k | JSON Schema + UI Schema | Yes (renderers) | No | Yes | LOW (RN) |
| Formily | CLAIMED | 12.6k | JSON Schema + JSchema | Yes | No | Yes | MEDIUM |
| uniforms | NO | ~1.9k | JSON Schema/Zod/GQL | Yes (themes) | **YES** | Yes | LOW (RN) |
| UI-Schema | **YES (demo)** | 370 | JSON Schema | Yes (headless) | No | Yes | **MEDIUM-HIGH** |
| SurveyJS RN | **POC** | ~4.5k | Custom | Yes (Paper) | No | Yes | MEDIUM |
| Custom build | **YES** | N/A | Custom | **Full control** | **YES** | N/A | **HIGH** |

---

## Recommendations

### Primary Recommendation: Custom Schema Renderer

**Build a lightweight, purpose-built schema renderer.** Rationale:

1. **No existing library solves our problem** — our block vocabulary (single-choice, image-choice, loading, success, progress, big-text) goes well beyond standard form fields
2. **Styling requirements** — we need twrnc/Radix integration; no library supports this
3. **AI integration** — the schema arrives via Vercel AI SDK tool calls with streaming; no library handles this pattern
4. **Cross-platform** — we need RN (primary) and web (secondary); a custom renderer can share schema types while having platform-specific component registries
5. **Performance** — on low-end devices, we need minimal overhead; a purpose-built renderer will be lighter than adapting a generic library
6. **Complexity is manageable** — the renderer is essentially:
   - A schema type → component lookup map
   - A recursive renderer that walks the schema tree
   - Form state management (we can use react-hook-form or zustand)
   - Validation (we already use Zod)

### Architecture Inspired By

Borrow the best patterns from each library:

| Pattern | Source | Application |
|---------|--------|-------------|
| Component registry (type → component map) | RJSF themes, SurveyJS `registerQuestionRenderer` | Block type registry for our UI vocabulary |
| Schema + UI Schema separation | JSON Forms | Data schema (Zod) + Layout schema (custom) |
| Headless core with pluggable renderers | UI-Schema | Platform-agnostic schema parser + RN/web renderers |
| Schema bridge / adapter pattern | uniforms | Zod bridge for validation, custom bridge for layout |
| Field-level independent state | Formily | Per-block state management, no full re-renders |
| Server-driven UI component tree | Airbnb/Shopify SDUI | LLM emits component tree, client renders from registry |

### Secondary Recommendation: Watch UI-Schema

If we want to adopt an existing library rather than build custom:
- **UI-Schema** is the best candidate — headless, JSON Schema based, has RN demo
- Fork the demo, extend with our block types
- Risk: small community (370 stars), pre-1.0, maintainer could abandon
- Mitigation: The core is small enough to maintain ourselves if needed

### Web Rendering (Secondary Platform)

For the React web side, we have more options:
- RJSF with a custom theme (if we standardize on JSON Schema for data)
- Or the same custom renderer pattern with React DOM components
- The custom approach gives us consistency between platforms

---

## Suggested Architecture Sketch

```
┌─────────────────────────────────────────────┐
│             LLM (Vercel AI SDK)             │
│  Emits: { type: "slide", blocks: [...] }    │
│  Via: tool_call("render_slide", schema)      │
└────────────────────┬────────────────────────┘
                     │ JSON Schema
                     ▼
┌─────────────────────────────────────────────┐
│           Schema Parser (shared TS)          │
│  - Zod validation of incoming schema         │
│  - Type narrowing per block type             │
│  - Default value resolution                  │
└────────────────────┬────────────────────────┘
                     │ Typed Block[]
                     ▼
┌─────────────────────────────────────────────┐
│         Block Registry (per-platform)        │
│                                              │
│  RN Registry:          Web Registry:         │
│  "single-choice" →     "single-choice" →     │
│    <RNChoiceCard/>       <WebChoiceCard/>     │
│  "text-input" →        "text-input" →        │
│    <RNTextInput/>        <WebTextInput/>      │
│  "big-text" →          "big-text" →          │
│    <RNBigText/>          <WebBigText/>        │
│  ...                   ...                   │
└────────────────────┬────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────┐
│            Slide Renderer                    │
│  - Maps blocks to registered components      │
│  - Manages form state (per-slide)            │
│  - Handles actions (submit, skip)            │
│  - Integrates with Redux store               │
└─────────────────────────────────────────────┘
```

---

## Next Steps

1. **Define the block schema specification** — formalize the JSON format for all 12+ block types
2. **Prototype the renderer** — build the registry + recursive renderer pattern
3. **Start with 3 block types**: `big-text`, `single-choice`, `text-input`
4. **Validate with AI**: Test that the LLM can reliably produce valid schemas for these types
5. **Add form state management**: Use react-hook-form or custom Zod-validated state
6. **Expand block types** incrementally
