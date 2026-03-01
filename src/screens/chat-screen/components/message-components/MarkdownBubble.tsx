import React from 'react';
import { StyleSheet } from 'react-native';
import Markdown, { MarkdownIt } from 'react-native-markdown-display';
import { openURL } from '@/utils/urlUtils';

import { MESSAGE_VARIANTS } from '@/constants';
import { useThemedStyles } from '@/hooks';

type MarkdownBubbleProps = {
  messageContent: string;
  variant: string;
};

const variantTextMap = {
  [MESSAGE_VARIANTS.AGENT]: 'text-slate-12',
  [MESSAGE_VARIANTS.USER]: 'text-slate-12',
  [MESSAGE_VARIANTS.BOT]: 'text-slate-12',
  [MESSAGE_VARIANTS.TEMPLATE]: 'text-slate-12',
  [MESSAGE_VARIANTS.ERROR]: 'text-ruby-12',
  [MESSAGE_VARIANTS.PRIVATE]: 'text-amber-12 font-inter-medium-24',
};

export const MarkdownBubble = (props: MarkdownBubbleProps) => {
  const { messageContent, variant } = props;
  const themedTailwind = useThemedStyles();
  const handleURL = (url: string) => {
    openURL({ URL: url });
    return true;
  };

  const textStyle = themedTailwind.style(variantTextMap[variant]);

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
    ordered_list_icon: {
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
