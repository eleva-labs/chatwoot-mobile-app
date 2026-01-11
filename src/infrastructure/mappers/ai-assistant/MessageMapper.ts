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

    // Map parts first, ensuring we always have an array
    const parts = this.mapParts(messageDTO.parts, messageDTO.content);

    return {
      id: messageDTO.id,
      role: messageDTO.role,
      parts, // Always an array, never undefined
      // Note: createdAt is not a standard UIMessage property in SDK v5
      // Store in metadata if needed
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
   * Always returns an array (never undefined)
   */
  private mapParts(parts?: AIChatMessagePartDTO[], fallbackContent?: string): UIMessage['parts'] {
    // If no parts but we have content, create a text part
    if (!parts || parts.length === 0) {
      if (fallbackContent) {
        return [{ type: 'text' as const, text: fallbackContent }];
      }
      return []; // Empty array, never undefined
    }

    const mappedParts = parts
      .map(part => this.mapPart(part))
      .filter((part): part is NonNullable<typeof part> => part !== null);

    // If all parts were filtered out but we have content, use that
    if (mappedParts.length === 0 && fallbackContent) {
      return [{ type: 'text' as const, text: fallbackContent }];
    }

    return mappedParts;
  }

  /**
   * Map a single part from DTO to SDK format
   */
  private mapPart(part: AIChatMessagePartDTO): UIMessage['parts'][number] | null {
    const type = part.type;

    // Text parts
    if (type === PART_TYPES.TEXT) {
      return {
        type: 'text' as const,
        text: part.text || '',
      };
    }

    // Reasoning parts - SDK v5 uses 'text' not 'reasoning'
    if (type === PART_TYPES.REASONING) {
      return {
        type: 'reasoning' as const,
        text: part.text || (part as { reasoning?: string }).reasoning || '',
        state: 'done' as const,
      };
    }

    // Tool call parts - SDK v5 uses 'dynamic-tool' type
    if (type === PART_TYPES.TOOL_CALL || type === PART_TYPES.TOOL_INPUT_AVAILABLE) {
      return {
        type: 'dynamic-tool' as const,
        toolCallId: part.toolCallId || '',
        toolName: part.toolName || '',
        state: 'input-available' as const,
        input: part.args || {},
      } as UIMessage['parts'][number];
    }

    // Tool result parts - SDK v5 uses 'dynamic-tool' with output
    if (type === PART_TYPES.TOOL_RESULT || type === PART_TYPES.TOOL_OUTPUT_AVAILABLE) {
      return {
        type: 'dynamic-tool' as const,
        toolCallId: part.toolCallId || '',
        toolName: part.toolName || '',
        state: 'output-available' as const,
        input: part.args || {},
        output: part.result,
      } as UIMessage['parts'][number];
    }

    // Unknown part type - return as text if has content
    if (part.text) {
      return {
        type: 'text' as const,
        text: part.text,
      };
    }

    console.warn('[MessageMapper] Unknown part type:', type);
    return null;
  }
}
