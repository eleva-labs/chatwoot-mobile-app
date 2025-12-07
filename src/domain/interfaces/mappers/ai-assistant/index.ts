/**
 * AI Assistant Mapper Interfaces
 *
 * Domain contracts for data transformation.
 * Infrastructure layer provides concrete implementations.
 */

export type { IMapper } from './IMapper';
export type { IMessageMapper } from './IMessageMapper';
export type { IAIChatSessionMapper } from './IAIChatSessionMapper';
export type { IBotMapper } from './IBotMapper';

// Re-export entities for backward compatibility
// Prefer importing from '@/domain/entities/ai-assistant' directly
export type { AIChatSession, AIBot } from '@/domain/entities/ai-assistant';
