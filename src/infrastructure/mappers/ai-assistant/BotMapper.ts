/**
 * Bot Mapper
 *
 * Converts backend bot DTOs to domain AIBot entities.
 * Implements IBotMapper interface from domain layer.
 */

import { injectable } from 'tsyringe';
import type { IBotMapper } from '@/domain/interfaces/mappers/ai-assistant';
import type { AIBot } from '@/domain/entities/ai-assistant';
import { createBotId } from '@/domain/value-objects/ai-assistant';
import type { AIChatBotDTO } from '@/infrastructure/dto/ai-assistant';

/**
 * Extended DTO type with optional fields that may come from the API
 */
interface ExtendedBotDTO extends AIChatBotDTO {
  account_id?: number;
  is_active?: boolean;
}

/**
 * Maps backend bot DTOs to domain AIBot entities
 */
@injectable()
export class BotMapper implements IBotMapper {
  /**
   * Map a single backend bot DTO to domain entity
   *
   * Only maps fields that are present in the DTO.
   * Optional fields are left undefined if not provided.
   */
  toAIBot(dto: unknown): AIBot {
    const botDTO = dto as ExtendedBotDTO;

    return {
      id: createBotId(botDTO.id),
      name: botDTO.name,
      description: botDTO.description,
      avatarUrl: botDTO.avatar_url,
      // Only set if provided by API
      accountId: botDTO.account_id,
      isActive: botDTO.is_active,
    };
  }

  /**
   * Map multiple backend bot DTOs to domain entities
   */
  toAIBots(dtos: unknown[]): AIBot[] {
    return dtos.map(dto => this.toAIBot(dto));
  }
}
