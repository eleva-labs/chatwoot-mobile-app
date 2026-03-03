import React from 'react';
import { Linking, StyleSheet } from 'react-native';
import Markdown, { MarkdownIt } from 'react-native-markdown-display';

import { useThemedStyles } from '@infrastructure/hooks';

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

  const styles = StyleSheet.create({
    text: {
      fontSize: 16,
      letterSpacing: 0.32,
      lineHeight: 22,
      ...textStyle,
    },
    strong: {
      fontFamily: 'Inter-600-20',
      fontWeight: '600',
    },
    em: {
      fontStyle: 'italic',
    },
    paragraph: {
      marginTop: 0,
      marginBottom: 0,
      fontFamily: 'Inter-400-20',
    },
    bullet_list: {
      minWidth: 200,
    },
    ordered_list: {
      minWidth: 200,
    },
    list_item: {
      flexDirection: 'row',
      justifyContent: 'flex-start',
      alignItems: 'center',
      ...textStyle,
    },
    bullet_list_icon: {
      marginLeft: 0,
      marginRight: 8,
      fontWeight: '900',
      ...textStyle,
    },
  });
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
