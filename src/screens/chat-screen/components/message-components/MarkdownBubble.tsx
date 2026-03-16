import React, { useMemo } from 'react';
import Markdown, { MarkdownIt } from '@ronradtke/react-native-markdown-display';
import { openURL } from '@infrastructure/utils/urlUtils';

import { useMarkdownTheme, useThemedStyles } from '@infrastructure/hooks';
import { getMessageTokensByVariant } from '@infrastructure/theme/chat-tokens';

type MarkdownBubbleProps = {
  messageContent: string;
  variant: string;
};

export const MarkdownBubble = (props: MarkdownBubbleProps) => {
  const { messageContent, variant } = props;
  const themedTailwind = useThemedStyles();
  const handleURL = (url: string) => {
    openURL({ URL: url });
    return true;
  };

  const tokens = getMessageTokensByVariant(variant);
  const textStyle = themedTailwind.style(tokens.text);
  const textColor = textStyle.color as string | undefined;

  const baseStyles = useMarkdownTheme({
    textColor,
  });

  // Merge variant-specific text color into list items and icons
  const styles = useMemo(
    () => ({
      ...baseStyles,
      list_item: {
        ...baseStyles.list_item,
        ...textStyle,
      },
      bullet_list_icon: {
        ...baseStyles.bullet_list_icon,
        ...textStyle,
      },
      ordered_list_icon: {
        ...baseStyles.ordered_list_icon,
        ...textStyle,
      },
    }),
    [baseStyles, textStyle],
  );

  return (
    <Markdown
      mergeStyle
      markdownit={MarkdownIt({
        linkify: true,
        typographer: true,
      })}
      onLinkPress={handleURL}
      style={styles}>
      {messageContent}
    </Markdown>
  );
};
