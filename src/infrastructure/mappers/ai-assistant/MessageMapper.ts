/**
 * Message Mapper
 *
 * Converts backend message DTOs to Vercel SDK UIMessage format.
 * Implements IMessageMapper interface from domain layer.
 */

import { injectable } from 'tsyringe';
import type { UIMessage } from 'ai';
import type { IMessageMapper } from '@/domain/interfaces/mappers/ai-assistant';
import type { AIChatMessageDTO, AIChatMessagePartDTO } from '@/infrastructure/dto/ai-assistant';
// Use domain constants for part types (no hardcoded strings)
import { PART_TYPES } from '@/domain/types/ai-assistant/constants';

/**
 * Maps backend message DTOs to UIMessage format
 */
@injectable()
export class MessageMapper implements IMessageMapper {
  /**
   * Map a single backend message DTO to UIMessage
   */
  toUIMessage(dto: unknown): UIMessage {
    const messageDTO = dto as AIChatMessageDTO;

    return {
      id: messageDTO.id,
      role: messageDTO.role,
      content: messageDTO.content || '',
      parts: this.mapParts(messageDTO.parts),
      createdAt: messageDTO.timestamp ? new Date(messageDTO.timestamp) : new Date(),
    };
  }

  /**
   * Map multiple backend message DTOs to UIMessages
   */
  toUIMessages(dtos: unknown[]): UIMessage[] {
    return dtos.map(dto => this.toUIMessage(dto));
  }

  /**
   * Map message parts from DTO format to SDK format
   */
  private mapParts(parts?: AIChatMessagePartDTO[]): UIMessage['parts'] {
    if (!parts || parts.length === 0) {
      return undefined;
    }

    return parts.map(part => this.mapPart(part)).filter(Boolean) as UIMessage['parts'];
  }

  /**
   * Map a single part from DTO to SDK format
   * Uses domain PART_TYPES constants (no hardcoded strings)
   */
  private mapPart(part: AIChatMessagePartDTO): UIMessage['parts'][number] | null {
    const type = part.type;

    // Text parts
    if (type === PART_TYPES.TEXT) {
      return {
        type: PART_TYPES.TEXT,
        text: part.text || '',
      };
    }

    // Reasoning parts
    if (type === PART_TYPES.REASONING) {
      return {
        type: PART_TYPES.REASONING,
        reasoning: part.text || '',
      };
    }

    // Tool call parts - handle both SDK format and backend variants
    if (type === PART_TYPES.TOOL_CALL || type === PART_TYPES.TOOL_INPUT_AVAILABLE) {
      return {
        type: PART_TYPES.TOOL_CALL,
        toolCallId: part.toolCallId || '',
        toolName: part.toolName || '',
        args: part.args || {},
      };
    }

    // Tool result parts - handle both SDK format and backend variants
    if (type === PART_TYPES.TOOL_RESULT || type === PART_TYPES.TOOL_OUTPUT_AVAILABLE) {
      return {
        type: PART_TYPES.TOOL_RESULT,
        toolCallId: part.toolCallId || '',
        toolName: part.toolName || '',
        result: part.result,
      };
    }

    // Unknown part type - return as text if has content
    if (part.text) {
      return {
        type: PART_TYPES.TEXT,
        text: part.text,
      };
    }

    return null;
  }
}
