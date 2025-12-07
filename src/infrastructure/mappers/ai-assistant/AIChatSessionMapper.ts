/**
 * AI Chat Session Mapper
 *
 * Converts backend session DTOs to domain AIChatSession entities.
 * Implements IAIChatSessionMapper interface from domain layer.
 */

import { injectable } from 'tsyringe';
import type { IAIChatSessionMapper } from '@/domain/interfaces/mappers/ai-assistant';
import type { AIChatSession } from '@/domain/entities/ai-assistant';
import { createAIChatSessionId } from '@/domain/value-objects/ai-assistant';
import type { AIChatSessionDTO } from '@/infrastructure/dto/ai-assistant';

/**
 * Maps backend session DTOs to domain AIChatSession entities
 */
@injectable()
export class AIChatSessionMapper implements IAIChatSessionMapper {
  /**
   * Map a single backend session DTO to domain entity
   *
   * Only maps fields that are present in the DTO.
   * Optional fields are left undefined if not provided.
   */
  toAIChatSession(dto: unknown): AIChatSession {
    const sessionDTO = dto as AIChatSessionDTO;

    return {
      id: createAIChatSessionId(sessionDTO.chat_session_id),
      // Only set if provided by API (don't default to 0)
      agentBotId: sessionDTO.agent_bot_id,
      accountId: sessionDTO.account_id,
      // Dates are required - use current time as fallback for created_at
      createdAt: sessionDTO.created_at ? new Date(sessionDTO.created_at) : new Date(),
      updatedAt: new Date(sessionDTO.updated_at),
    };
  }

  /**
   * Map multiple backend session DTOs to domain entities
   */
  toAIChatSessions(dtos: unknown[]): AIChatSession[] {
    return dtos.map(dto => this.toAIChatSession(dto));
  }
}
