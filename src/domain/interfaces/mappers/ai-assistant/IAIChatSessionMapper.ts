/**
 * AI Chat Session Mapper Interface
 *
 * Maps backend session DTOs to domain AIChatSession entities.
 * Implementation lives in infrastructure/mappers/ai-assistant/AIChatSessionMapper.ts
 */

import type { AIChatSession } from '@/domain/entities/ai-assistant';

/**
 * Interface for mapping backend session DTOs to AIChatSession
 */
export interface IAIChatSessionMapper {
  /**
   * Map a single backend session DTO to domain entity
   *
   * @param dto - Backend session data (type is unknown to keep domain pure)
   * @returns Domain AIChatSession entity
   */
  toAIChatSession(dto: unknown): AIChatSession;

  /**
   * Map multiple backend session DTOs to domain entities
   *
   * @param dtos - Array of backend session data
   * @returns Array of domain AIChatSession entities
   */
  toAIChatSessions(dtos: unknown[]): AIChatSession[];
}
