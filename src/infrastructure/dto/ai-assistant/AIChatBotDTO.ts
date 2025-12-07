/**
 * AI Chat Bot DTO
 *
 * Backend representation of an AI bot.
 * Uses snake_case to match backend API.
 */

export interface AIChatBotDTO {
  id: number;
  name: string;
  avatar_url?: string;
  description?: string;
}

/**
 * Response structure for fetching bots
 */
export interface AIChatBotsResponseDTO {
  bots: AIChatBotDTO[];
}
