/**
 * Shared Infrastructure Services
 *
 * Base classes and common services.
 */

export { ApiClient, ApiError } from './ApiClient';

export type { ApiResponse, RequestOptions } from './ApiClient';

// Re-export buildQueryString from endpoints for convenience
export { buildQueryString } from '@/infrastructure/services/ai-assistant/endpoints';

// Re-export DI tokens for backward compatibility
// Prefer importing from '@/dependency-injection' directly
export { SHARED_TOKENS } from '@/dependency-injection';
