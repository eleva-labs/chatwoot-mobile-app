/**
 * Message Mapper Interface
 *
 * Maps backend message DTOs to Vercel SDK UIMessage format.
 * Implementation lives in infrastructure/mappers/ai-assistant/MessageMapper.ts
 */

import type { UIMessage } from 'ai';

/**
 * Interface for mapping backend messages to UIMessage
 *
 * The mapper handles:
 * - Converting snake_case fields to camelCase
 * - Mapping message parts to SDK format
 * - Handling different part types (text, reasoning, tool)
 */
export interface IMessageMapper {
  /**
   * Map a single backend message DTO to UIMessage
   *
   * @param dto - Backend message data (type is unknown to keep domain pure)
   * @returns Vercel SDK UIMessage
   */
  toUIMessage(dto: unknown): UIMessage;

  /**
   * Map multiple backend message DTOs to UIMessages
   *
   * @param dtos - Array of backend message data
   * @returns Array of Vercel SDK UIMessages
   */
  toUIMessages(dtos: unknown[]): UIMessage[];
}
