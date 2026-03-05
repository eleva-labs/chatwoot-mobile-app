/**
 * Test Data Builder for AIChatMessage
 *
 * Creates valid AIChatMessage objects with sensible defaults.
 * Use fluent methods to customize fields for specific test scenarios.
 */

import type { AIChatMessage, AIChatMessagePart } from '@application/store/ai-chat/aiChatTypes';

class AIChatMessageBuilder {
  private message: AIChatMessage = {
    id: 'ai-msg-001',
    role: 'assistant',
    content: 'Test AI response',
    timestamp: new Date().toISOString(),
  };

  withId(id: string): this {
    this.message.id = id;
    return this;
  }

  withRole(role: 'user' | 'assistant' | 'system'): this {
    this.message.role = role;
    return this;
  }

  withContent(content: string): this {
    this.message.content = content;
    return this;
  }

  withParts(parts: AIChatMessagePart[]): this {
    this.message.parts = parts;
    return this;
  }

  withSessionId(sessionId: string): this {
    this.message.chat_session_id = sessionId;
    return this;
  }

  withTimestamp(timestamp: string): this {
    this.message.timestamp = timestamp;
    return this;
  }

  withTextPart(text: string): this {
    const parts = this.message.parts ?? [];
    parts.push({ type: 'text', text });
    this.message.parts = parts;
    return this;
  }

  withToolCallPart(toolName: string, args: Record<string, unknown>, state?: string): this {
    const parts = this.message.parts ?? [];
    parts.push({
      type: 'tool-invocation',
      toolName,
      toolCallId: `call-${toolName}-${parts.length}`,
      args,
      state: state ?? 'result',
    });
    this.message.parts = parts;
    return this;
  }

  build(): AIChatMessage {
    return { ...this.message };
  }
}

export const anAIChatMessage = () => new AIChatMessageBuilder();
