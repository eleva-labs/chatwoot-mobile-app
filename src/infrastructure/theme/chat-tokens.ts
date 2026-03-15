/**
 * Chat message styling tokens.
 *
 * Centralized variant-based styling for chat message components.
 * All values are Tailwind class strings that auto-switch with theme.
 *
 * Relocated from presentation/ai-chat/styles/chat/tokens.ts to
 * infrastructure/theme/ so that screens/ can import them without
 * violating the layer import rule (screens cannot import from presentation).
 *
 * Token mapping aligned with web BaseBubble.vue variantBaseMap:
 *
 * Web AGENT (outgoing from agent, right side) => bg-n-solid-blue
 * Web USER  (incoming from contact, left side) => bg-n-slate-4
 * Web BOT/TEMPLATE                            => bg-n-solid-iris
 * Web PRIVATE                                 => bg-n-solid-amber
 * Web ERROR                                   => bg-n-ruby-4
 * Web ACTIVITY                                => bg-n-alpha-1
 *
 * Mobile equivalents use the same semantic color tokens registered
 * in tailwind.config.ts (solid-blue, solid-iris, solid-amber).
 */

import { MESSAGE_VARIANTS } from '@domain/constants';

export const chatMessageTokens = {
  /** Incoming from contact (left side) — web: bg-n-slate-4 */
  incoming: {
    background: 'bg-slate-4',
    text: 'text-slate-12',
    border: 'border-slate-4',
    timestamp: 'text-slate-11',
    deliveryStatus: 'text-slate-11',
  },
  /** Outgoing from agent (right side) — web: bg-n-solid-blue */
  outgoing: {
    background: 'bg-solid-blue',
    text: 'text-slate-12',
    border: 'border-slate-6',
    timestamp: 'text-slate-11',
    deliveryStatus: 'text-slate-11',
  },
  activity: {
    background: 'bg-alpha-1',
    text: 'text-slate-11',
  },
  /** Private note — web: bg-n-solid-amber */
  private: {
    background: 'bg-solid-amber',
    text: 'text-amber-12 font-inter-medium-24',
    timestamp: 'text-slate-11',
  },
  /** Email messages */
  email: {
    background: 'bg-slate-3',
    emailBubble: 'bg-solid-1',
    header: 'text-slate-11',
    text: 'text-slate-12',
    body: 'text-slate-12',
    border: 'border-slate-4',
  },
  /** Error — web: bg-n-ruby-4 */
  error: {
    background: 'bg-ruby-4',
    text: 'text-ruby-12',
    border: 'border-ruby-6',
    timestamp: 'text-ruby-12',
  },
  /** Bot/template — web: bg-n-solid-iris */
  bot: {
    background: 'bg-solid-iris',
    text: 'text-slate-12',
    border: 'border-slate-4',
    timestamp: 'text-slate-11',
  },
  /** Unsupported message type */
  unsupported: {
    background: 'bg-solid-amber border border-dashed border-amber-12',
    text: 'text-amber-12',
    border: 'border-amber-12',
    timestamp: 'text-slate-11',
  },
  date: {
    background: 'bg-slate-3',
    text: 'text-slate-11',
  },
  replyQuote: {
    bar: 'bg-slate-5',
    text: 'text-slate-12',
  },
};

/** Default token shape for type safety */
interface MessageTokens {
  background: string;
  text: string;
  border?: string;
  timestamp?: string;
  deliveryStatus?: string;
  [key: string]: string | undefined;
}

/** Maps MESSAGE_VARIANTS values to token sets */
export const getMessageTokensByVariant = (variant: string): MessageTokens => {
  switch (variant) {
    case MESSAGE_VARIANTS.AGENT:
      return chatMessageTokens.outgoing;
    case MESSAGE_VARIANTS.USER:
      return chatMessageTokens.incoming;
    case MESSAGE_VARIANTS.BOT:
    case MESSAGE_VARIANTS.TEMPLATE:
      return chatMessageTokens.bot;
    case MESSAGE_VARIANTS.PRIVATE:
      return chatMessageTokens.private;
    case MESSAGE_VARIANTS.EMAIL:
      return chatMessageTokens.email;
    case MESSAGE_VARIANTS.ERROR:
      return chatMessageTokens.error;
    case MESSAGE_VARIANTS.UNSUPPORTED:
      return chatMessageTokens.unsupported;
    default:
      return chatMessageTokens.incoming;
  }
};
