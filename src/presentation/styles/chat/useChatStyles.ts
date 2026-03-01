import { useMemo } from 'react';
import { useThemedStyles } from '@/hooks';
import { chatMessageTokens, getMessageTokensByVariant } from './tokens';

export const useChatStyles = () => {
  const themedStyles = useThemedStyles();
  return useMemo(
    () => ({
      style: themedStyles.style,
      color: themedStyles.color,
      tokens: chatMessageTokens,
      getTokens: getMessageTokensByVariant,
    }),
    [themedStyles.style, themedStyles.color],
  );
};
