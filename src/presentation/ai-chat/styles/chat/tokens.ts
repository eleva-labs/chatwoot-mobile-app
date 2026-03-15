/**
 * Re-export chat message tokens from their canonical location in infrastructure/theme.
 *
 * The tokens were relocated to infrastructure/theme/chat-tokens.ts so that
 * screens/ can import them without violating the layer import rule
 * (screens cannot import from presentation).
 */
export { chatMessageTokens, getMessageTokensByVariant } from '@infrastructure/theme/chat-tokens';
