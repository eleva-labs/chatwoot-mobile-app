/**
 * Bot Mapper Interface
 *
 * Maps backend bot DTOs to domain AIBot entities.
 * Implementation lives in infrastructure/mappers/ai-assistant/BotMapper.ts
 */

import type { AIBot } from '@/domain/entities/ai-assistant';

/**
 * Interface for mapping backend bot DTOs to AIBot
 */
export interface IBotMapper {
  /**
   * Map a single backend bot DTO to domain entity
   *
   * @param dto - Backend bot data (type is unknown to keep domain pure)
   * @returns Domain AIBot entity
   */
  toAIBot(dto: unknown): AIBot;

  /**
   * Map multiple backend bot DTOs to domain entities
   *
   * @param dtos - Array of backend bot data
   * @returns Array of domain AIBot entities
   */
  toAIBots(dtos: unknown[]): AIBot[];
}
