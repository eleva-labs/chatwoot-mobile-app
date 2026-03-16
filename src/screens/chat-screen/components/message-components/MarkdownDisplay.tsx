import React, { useMemo } from 'react';
import { Linking } from 'react-native';
import Markdown, { MarkdownIt } from '@ronradtke/react-native-markdown-display';

import { useMarkdownTheme, useThemedStyles } from '@infrastructure/hooks';

type MarkdownDisplayProps = {
  messageContent: string;
  isIncoming?: boolean;
  isOutgoing?: boolean;
  isBotText?: boolean;
  isPrivate?: boolean;
  isMessageFailed?: boolean;
};

export const MarkdownDisplay = (props: MarkdownDisplayProps) => {
  const { messageContent, isIncoming, isOutgoing, isBotText, isPrivate, isMessageFailed } = props;
  const themedTailwind = useThemedStyles();
  const handleURL = (url: string) => {
    Linking.openURL(url).then(() => {});
    return true;
  };

  const textStyle = themedTailwind.style(
    isIncoming ? 'text-slate-12' : '',
    isOutgoing || isBotText ? 'text-slate-12' : '',
    isPrivate ? 'text-amber-12 font-inter-medium-24' : '',
    isMessageFailed ? 'text-ruby-12' : '',
  );

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
