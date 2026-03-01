/**
 * Chat message styling tokens.
 * Follows the same pattern as AI assistant tokens.
 * All values are Tailwind class strings that auto-switch with theme.
 */
export const chatMessageTokens = {
  incoming: {
    background: 'bg-slate-3',
    text: 'text-slate-12',
    border: 'border-slate-4',
    timestamp: 'text-slate-11',
    deliveryStatus: 'text-slate-11',
  },
  outgoing: {
    background: 'bg-iris-3',
    text: 'text-iris-12',
    border: 'border-iris-6',
    timestamp: 'text-iris-10',
    deliveryStatus: 'text-iris-10',
  },
  activity: {
    background: 'bg-slate-2',
    text: 'text-slate-11',
  },
  private: {
    background: 'bg-amber-3',
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
  error: {
    text: 'text-slate-12',
    border: 'border-slate-4',
  },
  bot: {
    background: 'bg-slate-3',
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
    case 'USER': return chatMessageTokens.outgoing;
    case 'AGENT': return chatMessageTokens.incoming;
    case 'BOT': return chatMessageTokens.bot;
    case 'TEMPLATE': return chatMessageTokens.bot;
    case 'PRIVATE': return chatMessageTokens.private;
    case 'EMAIL': return chatMessageTokens.email;
    case 'ERROR': return chatMessageTokens.error;
    default: return chatMessageTokens.incoming;
  }
};
