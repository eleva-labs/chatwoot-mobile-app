# Research: Products & Patterns — AI-Driven Onboarding, Forms, and Agent UI

> Phase 1D of the AI Onboarding Framework research.
> Date: 2026-02-27

---

## Table of Contents

1. [AI Form Builders](#1-ai-form-builders)
2. [Conversational Onboarding Products](#2-conversational-onboarding-products)
3. [AI Chat + Structured UI Hybrids](#3-ai-chat--structured-ui-hybrids)
4. [Voice-First Onboarding](#4-voice-first-onboarding)
5. [Agent-Driven UI in Production](#5-agent-driven-ui-in-production)
6. [Open-Source Frameworks & Protocols](#6-open-source-frameworks--protocols)
7. [Key Insights & Patterns](#7-key-insights--patterns)
8. [Competitive Matrix](#8-competitive-matrix)
9. [Top Recommendations for Our Design](#9-top-recommendations-for-our-design)

---

## 1. AI Form Builders

### 1.1 Typeform AI

| Attribute | Detail |
|-----------|--------|
| **URL** | https://www.typeform.com/ai/ |
| **Type** | Commercial SaaS |
| **Description** | Leading conversational form builder with AI features across three phases: creation (Creator AI), interaction (Interaction AI), and analysis (Insights AI). |
| **How AI is involved** | AI generates form questions from prompts, auto-imports/translates forms, optimizes question wording for conversion, and adds "Clarify with AI" follow-up questions to open-ended answers. Interaction AI adapts follow-ups dynamically. Uses Anthropic, OpenAI, and AWS models. |
| **Platform support** | Web only. Embeddable via iframe/JS SDK. No native mobile SDK. |
| **Hybrid chat+UI** | One-question-at-a-time "conversational" paradigm — but it is NOT a chat. No persistent input bar; purely structured inputs per step. |
| **Voice support** | No |
| **Pricing** | Free tier, Core from $25/mo, Growth from $83/mo, Enterprise custom. |
| **Key insight** | Typeform pioneered the one-question-at-a-time UX that is the gold standard for high-completion-rate forms. Their "Interaction AI" (Clarify with AI) that generates dynamic follow-ups based on open-ended responses is directly relevant — it's an LLM adapting the flow in real-time. |
| **Relevance** | **HIGH** — The UX pattern (slide-per-question, animated transitions) maps directly to our slide-based model. Their AI follow-up pattern validates our core concept. |

### 1.2 Fillout AI

| Attribute | Detail |
|-----------|--------|
| **URL** | https://www.fillout.com/ai-form-builder |
| **Type** | Commercial SaaS |
| **Description** | AI form builder powered by ChatGPT. Users describe the form they want, or import questions/PDFs, and the AI generates a complete form. |
| **How AI is involved** | AI generates form structure from natural language descriptions. Upcoming: AI-powered form editing ("type what you want to change"). Uses ChatGPT/OpenAI. AI optimizes question language. Brand matching from image uploads. |
| **Platform support** | Web only. Embeddable. No mobile SDK. |
| **Hybrid chat+UI** | No — purely form-based. No conversational mode. |
| **Voice support** | No |
| **Pricing** | Free (1000 submissions/mo), paid plans from $19/mo. |
| **Key insight** | "Describe your form" as input is a good pattern for admin/config side. The AI generates the schema, then humans refine — this is similar to how our AI agent would compose slides, but at runtime rather than build-time. |
| **Relevance** | **LOW** — AI is used at form creation time, not at form-filling time. Different use case. |

### 1.3 Tally

| Attribute | Detail |
|-----------|--------|
| **URL** | https://tally.so/ |
| **Type** | Commercial SaaS (freemium) |
| **Description** | Notion-like form builder — "just start typing" interface. Forms built like documents with inline blocks. |
| **How AI is involved** | AI form generation feature exists but is secondary. Core value is the document-like editing UX, not AI. Conditional logic, calculators, hidden fields for personalization. |
| **Platform support** | Web only. Embeddable. API. No mobile SDK. |
| **Hybrid chat+UI** | No — multi-page form paradigm with conditional logic. |
| **Voice support** | No |
| **Pricing** | Free (unlimited forms/submissions within fair use), Pro $29/mo. |
| **Key insight** | The block-based composition model (like Notion) is interesting for our schema design. Tally's block types (contact info, signatures, file uploads, payments, ratings) map well to our UI block vocabulary. |
| **Relevance** | **MEDIUM** — Block-based composition model is relevant architecture inspiration. |

### 1.4 JotForm AI Agents

| Attribute | Detail |
|-----------|--------|
| **URL** | https://www.jotform.com/ai/agents/ |
| **Type** | Commercial SaaS |
| **Description** | Full AI agent platform that goes beyond forms. AI agents can be deployed across 15+ channels: chatbot, phone, voice, WhatsApp, Messenger, SMS, Instagram, Gmail, Salesforce, Shopify, Kiosk, standalone app, and more. |
| **How AI is involved** | GPT-4 powered agents that conversationally guide users through form filling. Agents can: validate inputs in real-time, trigger workflows, send messages via Slack, schedule in Google Calendar, send API requests, search websites, send emails. Trainable via URL crawling, document uploads, direct text input, custom Q&As. Multi-language support. |
| **Platform support** | **Web + Mobile app** (iOS/Android for human escalation). Embeddable chatbot. Multi-channel (WhatsApp, phone, SMS, etc.). |
| **Hybrid chat+UI** | **YES** — This is the closest commercial product to our vision. AI chatbot agent that guides users through structured data collection conversationally. Mix of chat and structured form elements. |
| **Voice support** | **YES** — Phone Agent and Voice Agent channels. Voice interactions for data collection. |
| **Pricing** | Free tier, paid plans. AI Agents priced separately from forms. |
| **Key insight** | **JotForm is the most relevant commercial product.** Their AI Agents concept is essentially what we're building: an AI that conversationally guides users through structured data collection. Key differences: (1) they target customer service, not onboarding; (2) they're channel-agnostic (WhatsApp, phone, etc.), not native mobile; (3) no schema-driven dynamic UI rendering — it's primarily a chatbot with form integration. |
| **Relevance** | **HIGH** — Validates the concept. Their multi-channel approach and voice support are ahead of our plan. But their UI is chatbot-first, not slide-based like ours. |

### 1.5 Google Forms AI

| Attribute | Detail |
|-----------|--------|
| **URL** | https://workspace.google.com/products/forms/ |
| **Type** | Commercial (part of Google Workspace) |
| **Description** | Google Forms added "Help me create a form" AI feature via Gemini. |
| **How AI is involved** | Gemini generates forms from natural language descriptions. AI assists with question generation. Limited to creation-time AI. |
| **Platform support** | Web. Mobile via Google Forms app. |
| **Hybrid chat+UI** | No |
| **Voice support** | No |
| **Pricing** | Free with Google account. Business features via Workspace. |
| **Key insight** | Minimal AI involvement — creation-time only. Not relevant to our runtime AI concept. |
| **Relevance** | **LOW** |

---

## 2. Conversational Onboarding Products

### 2.1 Intercom Fin AI Agent

| Attribute | Detail |
|-----------|--------|
| **URL** | https://www.intercom.com/fin (now fin.ai) |
| **Type** | Commercial SaaS |
| **Description** | #1 AI agent for customer service. LLM-powered agent that handles support across voice, email, live chat, social channels. Trainable with procedures, knowledge bases, and policies. |
| **How AI is involved** | Deeply LLM-powered. Proprietary Fin AI Engine with custom retrieval, reranking, and generation models (fin-cx-retrieval, fin-cx-reranker). Continuous improvement via "Fin Flywheel" (Train → Test → Deploy → Analyze). 65% end-to-end resolution rate. |
| **Platform support** | Web widget, mobile SDK (iOS/Android), email, voice, social channels. |
| **Hybrid chat+UI** | Chat-first with rich message types (cards, buttons, carousels). Not slide-based — purely chat-oriented. |
| **Voice support** | **YES** — Voice channel with AI agent. |
| **Pricing** | $0.99 per resolution. Helpdesk seats from $29/mo. |
| **Key insight** | Intercom's "Procedures" feature (defining how the AI should handle specific workflows) maps to our step/goal concept. Their test-before-deploy approach is a good pattern. However, they're focused on support/resolution, not data collection/onboarding. The chat-only UI limits structured input collection. |
| **Relevance** | **MEDIUM** — Architectural inspiration for the AI agent's training/procedure model, but fundamentally different UX paradigm (chat vs. slides). |

### 2.2 Appcues

| Attribute | Detail |
|-----------|--------|
| **URL** | https://www.appcues.com/ |
| **Type** | Commercial SaaS |
| **Description** | Customer engagement platform for in-app messaging, behavioral email, and push notifications. Introducing "Appcues AI" — a system of agents that help build better experiences. |
| **How AI is involved** | Recently launched "Appcues AI" — agents for planning, building, and improving experiences. AI-powered growth engine with continuous learning loop: Understand → Decide → Act → Learn. Not fully LLM-driven yet — primarily rule-based with AI augmentation. |
| **Platform support** | **Web + Mobile (native iOS/Android SDK)**. In-app guides, tooltips, modals, checklists. |
| **Hybrid chat+UI** | No chat — in-app overlay guides (tooltips, modals, slideouts, checklists). Rule-based targeting and sequencing. |
| **Voice support** | No |
| **Pricing** | Contact for pricing. Enterprise-focused. |
| **Key insight** | Appcues has the **mobile native SDK** we'd want, and their in-app guides (modals, checklists) overlap with our slide-based UI. Their AI is augmenting the creation/optimization side, not driving the runtime experience. Their "continuous learning" pattern (understand → decide → act → learn) is a good framework. |
| **Relevance** | **MEDIUM** — Relevant for the non-AI parts: mobile SDK, in-app guide patterns, targeting. Their AI is build-time, not runtime. |

### 2.3 Pendo

| Attribute | Detail |
|-----------|--------|
| **URL** | https://www.pendo.io/ |
| **Type** | Commercial SaaS |
| **Description** | Software Experience Management (SXM) platform. Analytics, in-app guides, session replay, NPS, feedback, roadmaps. 14,400+ companies. |
| **How AI is involved** | "Pendo AI" for analytics insights and guide optimization. Agent Analytics for measuring AI adoption. Not LLM-driven for the in-app experience itself — AI assists product teams in deciding what to build. |
| **Platform support** | **Web + Native Mobile** (iOS/Android SDK). |
| **Hybrid chat+UI** | No chat — in-app guides as overlays. Tooltips, lightboxes, banners. Rule-based targeting. |
| **Voice support** | No |
| **Pricing** | Free tier (limited), Growth from custom pricing. |
| **Key insight** | Pendo's strength is **analytics feeding into guide optimization**. They track which guides convert and iterate. For our system, this suggests: instrument every onboarding step, measure completion rates, feed data back to improve the AI's approach. |
| **Relevance** | **LOW-MEDIUM** — Analytics patterns are relevant. Not relevant for the AI-driven conversational aspect. |

### 2.4 WalkMe / UserGuiding / Userpilot

| Attribute | Detail |
|-----------|--------|
| **URL** | Various |
| **Type** | Commercial SaaS |
| **Description** | Digital adoption platforms (DAPs). Overlay tooltips, guided tours, checklists on existing UIs. |
| **How AI is involved** | Primarily rule-based. Some adding AI for content generation and analytics. WalkMe (now SAP) has "WalkMe AI" for automatic walkthrough generation. |
| **Platform support** | Web-focused. WalkMe has mobile support. |
| **Hybrid chat+UI** | No — pure overlay/tooltip model. |
| **Voice support** | No |
| **Pricing** | Enterprise pricing. |
| **Key insight** | These are the "old model" — overlay guides on existing UI. Our approach (AI composing the UI) is fundamentally different and more ambitious. |
| **Relevance** | **LOW** |

---

## 3. AI Chat + Structured UI Hybrids

### 3.1 WhatsApp Business Flows

| Attribute | Detail |
|-----------|--------|
| **URL** | https://business.whatsapp.com/products/flows |
| **Type** | Platform feature (Meta) |
| **Description** | Structured multi-screen experiences within WhatsApp chat. Businesses can build forms, appointment pickers, product selectors, and other structured UIs that appear inline in the chat conversation. |
| **How AI is involved** | Not AI-driven — developer-configured flows with JSON schemas. But the UX pattern is highly relevant: structured forms appearing within a chat context. |
| **Platform support** | WhatsApp (iOS/Android). Not embeddable elsewhere. |
| **Hybrid chat+UI** | **YES — This is THE reference pattern.** Chat messages + structured screens seamlessly. User can type or interact with structured UI. Messages and flows coexist in the same thread. |
| **Voice support** | WhatsApp voice messages are possible but not integrated with flows. |
| **Pricing** | WhatsApp Business API pricing (per conversation). |
| **Key insight** | **WhatsApp Flows is the closest UX paradigm to what we're building.** Key patterns: (1) Flows appear inline in chat as full-screen overlays. (2) Multiple screens within a flow (like our slides). (3) Rich input types: text, dropdowns, radio, checkbox, date/time pickers. (4) JSON-defined screens with layout blocks. (5) User can always go back to chat and type freely. The key difference: WhatsApp Flows are developer-configured, not AI-composed. |
| **Relevance** | **HIGH** — The UX pattern is almost identical to our vision. We add AI-driven composition on top. |

### 3.2 Telegram Bot Inline Keyboards + Mini Apps

| Attribute | Detail |
|-----------|--------|
| **URL** | https://core.telegram.org/bots/features |
| **Type** | Platform feature (Telegram) |
| **Description** | Telegram bots can present: inline keyboards (buttons below messages), reply keyboards (replace keyboard with options), and full Mini Apps (HTML5 web apps embedded in chat). |
| **How AI is involved** | Not inherently AI — developer-programmed. But bots can be powered by LLMs. The structured input mechanisms (keyboards, buttons, Mini Apps) are the relevant pattern. |
| **Platform support** | Telegram (iOS/Android/Desktop). Mini Apps are HTML5 web views. |
| **Hybrid chat+UI** | **YES.** Three layers: (1) Text messages, (2) Inline keyboards (button rows below messages), (3) Mini Apps (full-screen web UIs launched from chat). Very flexible hybrid model. |
| **Voice support** | Voice messages supported. No structured voice interaction. |
| **Pricing** | Free (Telegram Bot API is free). |
| **Key insight** | Telegram's layered approach is instructive: simple choices → inline keyboards, complex interactions → Mini Apps (full screens). Our system maps similarly: simple choices → single-choice/multi-choice blocks, complex flows → full slides. The "always have a text input" pattern matches our persistent input bar. |
| **Relevance** | **MEDIUM-HIGH** — Architecture pattern is very relevant. Not a product we compete with. |

### 3.3 Slack Block Kit

| Attribute | Detail |
|-----------|--------|
| **URL** | https://api.slack.com/block-kit |
| **Type** | Platform feature (Salesforce/Slack) |
| **Description** | Slack's UI framework for building rich, interactive messages. Blocks include: sections, dividers, images, actions (buttons, selects, date pickers, checkboxes), inputs, context. Messages can contain multiple blocks. |
| **How AI is involved** | Not AI-driven — developer-composed. But the Block Kit JSON schema is a mature example of declarative UI specification for chat contexts. |
| **Platform support** | Slack (iOS/Android/Desktop/Web). |
| **Hybrid chat+UI** | **YES.** Messages can contain interactive elements (buttons, menus, date pickers) alongside text. Modal dialogs with multiple inputs. |
| **Voice support** | Slack Huddles (voice/video) but not integrated with Block Kit. |
| **Pricing** | Part of Slack. |
| **Key insight** | **Slack Block Kit's JSON schema is excellent prior art for our slide schema design.** Their vocabulary: `section`, `divider`, `image`, `actions`, `input`, `context`, `header` maps directly to our blocks. Their approach of composing blocks into messages/modals is the same composable pattern we need. |
| **Relevance** | **MEDIUM-HIGH** — Schema design inspiration. Not a competitor. |

---

## 4. Voice-First Onboarding

### 4.1 Current Landscape

There are **no major products** dedicated to voice-first onboarding. The space is fragmented:

| Product/Pattern | Description | Relevance |
|----------------|-------------|-----------|
| **Siri Shortcuts / Apple Intelligence** | Voice can trigger predefined shortcuts, but not dynamic form filling. Limited structured data collection via voice. | LOW |
| **Google Assistant Conversational Actions** | (Deprecated 2023) Allowed structured data collection via voice. Used slot-filling pattern: agent asks questions, user speaks answers, system extracts values. | MEDIUM — The slot-filling pattern is relevant. |
| **Amazon Alexa Skills** | Multi-turn voice conversations for data collection. Dialog delegation feature where Alexa manages slot filling. | MEDIUM — Dialog management pattern is relevant. |
| **Vapi.ai / Bland.ai / Retell.ai** | AI voice agent platforms. Build phone-based AI agents that can collect structured data through conversation. | MEDIUM — Relevant for future voice phase. |
| **Deepgram / AssemblyAI / Whisper** | Speech-to-text APIs. Not onboarding products, but the enabling technology. | LOW (infra, not product) |

**Key insight for voice**: Voice onboarding follows a "slot-filling" pattern: the AI knows what data it needs, asks questions conversationally, and extracts structured values from natural language responses. This maps directly to our model where each step has a "goal" (collect X data) and the AI decides how to achieve it. For voice, the "how" is a spoken question rather than a UI block.

### 4.2 Voice + Visual Hybrid Pattern

The most relevant pattern is **multimodal onboarding**: voice + visual simultaneously. Think of in-car infotainment systems or smart displays (Echo Show, Google Nest Hub) where you see UI + speak commands.

For our system, the future voice phase would work as:
- AI renders a slide (visual)
- User can interact via touch OR speak their answer
- Speech-to-text + LLM extracts the structured value
- Slide updates to reflect the spoken selection

No commercial product does this for onboarding today. We would be innovating here.

---

## 5. Agent-Driven UI in Production

### 5.1 Rabbit R1 / rabbitOS

| Attribute | Detail |
|-----------|--------|
| **URL** | https://www.rabbit.tech/ |
| **Type** | Consumer hardware + OS |
| **Description** | Dedicated AI device. rabbitOS 2 powers a "Large Action Model" (LAM) that can execute tasks across apps. DLAM transforms r1 into a controller for computer OS/browser/apps. |
| **How AI is involved** | "Large Action Model" — AI that can understand and execute multi-step tasks across applications. The AI decides what actions to take and drives the interface. |
| **Platform support** | Dedicated r1 hardware device. DLAM works on computer via USB. |
| **Hybrid chat+UI** | Voice-primary with visual display. AI controls what appears on screen. "Creations" feature lets users vibe-code tools/games. |
| **Voice support** | **YES** — Voice is the primary input. |
| **Pricing** | $199 device, no subscription. |
| **Key insight** | Rabbit's approach of an AI agent that decides UI and actions is conceptually aligned with our vision — but at OS level, not app level. Their "Creations" (AI-generated mini-apps) resonate with our "agent composes slides" model. However, execution has been mixed (limited real-world utility). |
| **Relevance** | **LOW** — Interesting conceptually but different platform/use case. |

### 5.2 Humane AI Pin

| Attribute | Detail |
|-----------|--------|
| **URL** | https://hu.ma.ne/ |
| **Type** | Consumer hardware |
| **Description** | Screenless AI wearable. Voice + laser projection. AI handles all interaction through conversation and projected UI. |
| **How AI is involved** | AI-first: all interactions through natural language. AI decides when to show visual information (projected on palm). |
| **Platform support** | Dedicated hardware. |
| **Voice support** | **YES** — Voice primary. |
| **Pricing** | $699 + $24/mo subscription. Largely failed product. |
| **Key insight** | Demonstrates the pitfalls of going too far into AI-only UI. Users need predictability and control. Our hybrid approach (structured UI + AI flexibility) is better calibrated. |
| **Relevance** | **LOW** — Cautionary tale. |

### 5.3 ChatGPT Custom GPTs / ChatGPT Canvas

| Attribute | Detail |
|-----------|--------|
| **URL** | https://chat.openai.com/ |
| **Type** | Commercial SaaS (OpenAI) |
| **Description** | ChatGPT's Canvas feature allows the AI to render interactive side-panel content (code editor, document editor) alongside chat. Custom GPTs can use actions/tools. |
| **How AI is involved** | The AI decides when to open Canvas and what to render. Tool calls trigger specific UI patterns. |
| **Platform support** | Web + iOS/Android apps. |
| **Hybrid chat+UI** | **YES** — Chat + Canvas (side panel with structured editing). AI decides when to use Canvas vs inline response. |
| **Voice support** | **YES** — Advanced Voice Mode (real-time conversation). |
| **Pricing** | Free tier, Plus $20/mo, Pro $200/mo. |
| **Key insight** | ChatGPT Canvas is the most mainstream example of "AI decides what UI to show." The pattern: AI chooses between text response and structured Canvas based on user intent. Our system generalizes this: AI chooses between chat message and structured slide based on step goals. |
| **Relevance** | **MEDIUM-HIGH** — UX paradigm inspiration. |

---

## 6. Open-Source Frameworks & Protocols

### 6.1 CopilotKit + AG-UI Protocol

| Attribute | Detail |
|-----------|--------|
| **URL** | https://www.copilotkit.ai/ / https://github.com/ag-ui-protocol/ag-ui |
| **Type** | Open-source (MIT license) |
| **Description** | CopilotKit is the agentic frontend framework for building AI copilots in apps. AG-UI (Agent-User Interaction Protocol) is the open protocol that standardizes how AI agents connect to user-facing applications. 12.2k GitHub stars. Trusted by 10%+ of Fortune 500. |
| **How AI is involved** | Deeply AI-native. Defines three types of Generative UI: (1) **Static** — agent chooses from predefined components; (2) **Open-ended** — agent generates arbitrary HTML/iframes; (3) **Declarative** — agent returns structured schema (cards, lists, forms). AG-UI provides event-based protocol for real-time agent-frontend interaction: streaming, state synchronization, tool calls, human-in-the-loop. |
| **Platform support** | React (primary), Angular, Mobile mentioned. AG-UI has community Dart SDK. React Native client listed as "Help Wanted" on GitHub. Works with any LLM and any agent framework (LangGraph, CrewAI, Google ADK, AWS Strands, Mastra, Pydantic AI, etc.) |
| **Hybrid chat+UI** | **YES** — Core feature. Three application surfaces: Chat (threaded), Chat+ (co-creator workspace), Chatless (embedded in app UI). Generative UI renders alongside chat. |
| **Voice support** | Voice listed as a feature on homepage. |
| **Pricing** | Open-source core. Enterprise cloud pricing. |
| **Key insight** | **CopilotKit/AG-UI is the most architecturally relevant project.** Their "Declarative Generative UI" type maps exactly to our schema-driven slide model: agent returns a structured spec, frontend renders it. Their taxonomy of Static vs Open-ended vs Declarative UI perfectly frames our design choices. Key patterns to adopt: (1) Tool-based generative UI (agent calls "render" tools); (2) State synchronization between agent and frontend; (3) Human-in-the-loop (user can override AI decisions). Their React Native support is nascent — opportunity for us. |
| **Relevance** | **CRITICAL** — Architecture reference. We should study AG-UI protocol deeply for our agent↔UI communication design. |

### 6.2 assistant-ui (React + React Native)

| Attribute | Detail |
|-----------|--------|
| **URL** | https://www.assistant-ui.com/ |
| **Type** | Open-source |
| **Description** | React components for AI chat interfaces. Has dedicated `@assistant-ui/react-native` package for Expo/React Native. Composable primitives, reactive hooks, local runtime. |
| **How AI is involved** | Runtime for AI chat UIs. Tool system with `useAssistantTool`, `makeAssistantTool` for registering tools with custom UI renderers — this is the generative UI pattern. Supports AI SDK v5/v6 integration. |
| **Platform support** | **React + React Native (Expo)** — exactly our stack. Shared core via `@assistant-ui/core`. UI layer is platform-specific. |
| **Hybrid chat+UI** | **YES** — Thread-based chat with tool UI renderers. Tools can render custom React (Native) components. Attachments, chain-of-thought, suggestions, speech-to-text, text-to-speech. |
| **Voice support** | **YES** — Dictation (speech-to-text) and Speech Synthesis (text-to-speech) guides available. |
| **Pricing** | Open-source. Cloud persistence add-on (paid). |
| **Key insight** | **This is the most directly usable library for our project.** It already: (1) supports React Native/Expo; (2) integrates with Vercel AI SDK v5 (which we already use); (3) has a tool-based generative UI system; (4) shares core logic between web and mobile; (5) has speech-to-text support. We could potentially build our onboarding system ON TOP of assistant-ui, extending their tool system with our slide/block vocabulary. The `@assistant-ui/react-hook-form` integration suggests they've already thought about AI-assisted form filling. |
| **Relevance** | **CRITICAL** — Potential foundation library. Must evaluate deeply. |

### 6.3 Vercel AI SDK Generative UI

| Attribute | Detail |
|-----------|--------|
| **URL** | https://sdk.vercel.ai/ |
| **Type** | Open-source (Vercel) |
| **Description** | The Vercel AI SDK (already in our codebase) supports "Generative UI" through tool calls. When an AI tool is called, instead of returning text, it renders a React component. |
| **How AI is involved** | Tool calls produce structured output. `experimental_createModelResponse` and tool-based rendering. The AI decides which tool to call, and each tool maps to a UI component. |
| **Platform support** | React (primary), React Native via our existing integration. |
| **Hybrid chat+UI** | **YES** — Chat messages + tool-rendered UI components in the same stream. |
| **Voice support** | Not natively. |
| **Pricing** | Open-source. |
| **Key insight** | We already use AI SDK v5. The generative UI pattern (tool calls → UI components) is the natural way to implement our system: define tools like `render_slide`, `render_single_choice`, etc. The AI calls these tools with parameters (the slide schema), and our frontend renders the corresponding components. This is the most natural integration path given our existing stack. |
| **Relevance** | **CRITICAL** — We should build on this pattern directly. |

### 6.4 AG-UI Generative UI Specifications Ecosystem

| Spec | Description | Relevance |
|------|-------------|-----------|
| **Open-JSON-UI** | JSON-based declarative UI specification. Agent returns structured specs (cards, lists, forms). Cross-platform renderers. | HIGH — Schema format reference |
| **MCP-UI** | Model Context Protocol + UI. Agents return HTML/iframes. Web-first. | LOW — Web-only, security concerns |
| **A2UI** | Agent-to-UI declarative spec. Emerging standard for agent↔UI communication. | MEDIUM — Watch this space |

---

## 7. Key Insights & Patterns

### Pattern 1: Declarative UI Schema (Agent → Frontend)

**Found in:** CopilotKit, Slack Block Kit, WhatsApp Flows, Open-JSON-UI

The most validated pattern for agent-rendered UI is a **declarative JSON schema**. The agent produces a structured spec, the frontend interprets and renders it. This gives:
- **Cross-platform rendering** (same schema → different renderers for mobile/web)
- **Type safety** (Zod validation on schemas)
- **Agent freedom** (AI picks what blocks to use)
- **Developer control** (finite set of blocks, all hand-crafted)

**Recommendation:** Use the **Static Generative UI** pattern from CopilotKit's taxonomy for our MVP. Agent selects from predefined block types. Schemas are Zod-validated. Each block maps to a hand-crafted React Native component.

### Pattern 2: Tool Calls as UI Rendering Mechanism

**Found in:** Vercel AI SDK, CopilotKit, assistant-ui

The cleanest integration pattern: the AI agent "renders" UI by **calling tools**. Each tool corresponds to a block type. This leverages existing streaming infrastructure.

```
AI calls tool: render_slide({ header: "...", blocks: [...] })
Frontend receives tool call → renders Slide component
User interacts → result sent back as tool response
```

**Recommendation:** Implement slide/block rendering as AI SDK tool calls. This maps naturally to our existing `useAIChat` infrastructure.

### Pattern 3: Persistent Free-Form Input + Structured UI

**Found in:** WhatsApp Flows, Telegram Bots, our own requirements

The highest-quality UX has **both** structured inputs (buttons, dropdowns) AND a persistent text input. Users can always "break out" and type naturally. The AI interprets free-form input and maps it to the current step's requirements.

**Recommendation:** This is already in our requirements. Validated by WhatsApp/Telegram patterns.

### Pattern 4: One-At-A-Time Progression

**Found in:** Typeform, onboarding products

Showing one question/slide at a time with clear transitions leads to **3.5x higher completion rates** (Typeform's claim). This is the core of our slide-based model.

### Pattern 5: AI at Runtime, Not Just Build-Time

**Found in:** JotForm AI Agents, Typeform "Clarify with AI", our requirements

Most AI form builders use AI only at creation time (generate questions). The next wave (and our approach) uses AI **at interaction time** — adapting questions, generating follow-ups, handling ambiguity. This is a real differentiator.

### Pattern 6: Continuous Learning Loop

**Found in:** Intercom Fin (Flywheel), Appcues (AI growth engine), Pendo

The best products have: **Train → Deploy → Analyze → Improve** cycles. The AI gets better over time by analyzing completion rates, drop-off points, and user responses.

---

## 8. Competitive Matrix

| Product | AI at Runtime | Mobile Native | Slide/Block UI | Chat Hybrid | Voice | Schema-Driven | Open Source |
|---------|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **Our System (planned)** | YES | YES | YES | YES | Future | YES | Internal |
| Typeform AI | Partial | No | YES | No | No | No | No |
| JotForm AI Agents | YES | Partial | No | YES | YES | No | No |
| Intercom Fin | YES | YES | No | YES | YES | No | No |
| Appcues | No | YES | Partial | No | No | No | No |
| CopilotKit/AG-UI | YES | Partial | YES | YES | Partial | YES | YES |
| assistant-ui | YES | YES | Partial | YES | YES | YES | YES |
| WhatsApp Flows | No | YES | YES | YES | No | YES | No |
| Slack Block Kit | No | YES | YES | YES | No | YES | No |
| Pendo | No | YES | Partial | No | No | No | No |

**Key takeaway:** No existing product combines ALL of: AI at runtime + mobile native + slide-based UI + chat hybrid + schema-driven. This is our unique position.

---

## 9. Top Recommendations for Our Design

### 1. Build on assistant-ui + Vercel AI SDK

assistant-ui already provides:
- React Native/Expo support with shared core
- AI SDK v5 integration (our existing stack)
- Tool-based generative UI (our rendering mechanism)
- Speech-to-text/TTS support
- Thread management and persistence

We should evaluate building our onboarding framework as an extension of assistant-ui's runtime, adding our slide/block vocabulary as custom tool renderers.

### 2. Use the CopilotKit/AG-UI "Static Generative UI" Pattern

Our block vocabulary (single-choice, multi-choice, text-input, etc.) maps to the "Static Generative UI" pattern: a finite set of hand-crafted components that the AI selects from. This gives us:
- Full visual control over every block
- Predictable, polished UI
- Type-safe schemas with Zod
- Cross-platform potential (same schema, different renderers)

### 3. Schema Design: Learn from Slack Block Kit + WhatsApp Flows

Both Slack and WhatsApp use JSON schemas with composable blocks. Our slide schema should follow similar patterns with:
- A vocabulary of block types
- Blocks composed into slides
- Actions (buttons, submit handlers)
- Validation rules per block
- Conditional rendering

### 4. Implement Tool-Call-Based Rendering

Use Vercel AI SDK tool calls as the rendering mechanism:
- Define tools: `render_slide`, `render_choice`, `collect_input`, `show_progress`, `show_success`
- AI calls these tools with structured parameters
- Frontend receives tool calls via streaming
- Each tool maps to a React Native component
- User interaction sends results back as tool responses

### 5. JotForm-Style Multi-Channel Aspiration

While our MVP is mobile-native, JotForm shows the value of multi-channel support. Design the schema and state management to be channel-agnostic from the start, enabling future deployment to:
- React web
- WhatsApp Business (via structured messages)
- SMS (degraded text-only mode)

---

## Appendix: Products Not Deeply Researched (Brief Notes)

| Product | Note |
|---------|------|
| **Adept AI** | Pivoted to enterprise. "AI agent that uses computer interfaces." Acquired by Amazon. |
| **UserGuiding** | Rule-based onboarding overlays. No AI. |
| **Chameleon** | In-app product tours. Rule-based. No AI. |
| **CommandBar** | AI-powered search + nudges. Interesting for search-driven onboarding but not form/data collection. |
| **Formbricks** | Open-source survey platform. No AI at runtime. Potential for self-hosted form rendering. |
| **SurveyJS** | Open-source JSON-schema form renderer. No AI. Potential rendering library for web. |
| **RJSF (React JSON Schema Form)** | Open-source JSON Schema → React form renderer. No RN support. |
