/**
 * Chat message styling tokens.
 * Follows the same pattern as AI assistant tokens.
 * All values are Tailwind class strings that auto-switch with theme.
 */
/**
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
    text: 'text-amber-12',
    border: 'border-amber-6',
  },
  email: {
    background: 'bg-slate-2',
    emailBubble: 'bg-solid-1',
    header: 'text-slate-11',
    body: 'text-slate-12',
    border: 'border-slate-6',
  },
  /** Error — web: bg-n-ruby-4 */
  error: {
    background: 'bg-ruby-4',
    text: 'text-ruby-12',
    border: 'border-ruby-6',
  },
  /** Bot/template — web: bg-n-solid-iris */
  bot: {
    background: 'bg-solid-iris',
    text: 'text-slate-12',
    border: 'border-slate-4',
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

/** Maps MESSAGE_VARIANTS to token sets */
export const getMessageTokensByVariant = (variant: string) => {
  switch (variant) {
    case 'USER':
      return chatMessageTokens.outgoing;
    case 'AGENT':
      return chatMessageTokens.incoming;
    case 'BOT':
      return chatMessageTokens.bot;
    case 'TEMPLATE':
      return chatMessageTokens.bot;
    case 'PRIVATE':
      return chatMessageTokens.private;
    case 'EMAIL':
      return chatMessageTokens.email;
    case 'ERROR':
      return chatMessageTokens.error;
    default:
      return chatMessageTokens.incoming;
  }
};
