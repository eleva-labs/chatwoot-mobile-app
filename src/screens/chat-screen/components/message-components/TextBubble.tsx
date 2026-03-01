import React from 'react';
import { Message } from '@/types';
import { MarkdownBubble } from './MarkdownBubble';
import { EmailMeta } from './EmailMeta';

export type TextBubbleProps = {
  item: Message;
  variant: string;
};

export const TextBubble = (props: TextBubbleProps) => {
  const messageItem = props.item as Message;
  const { variant } = props;

  const { content, contentAttributes, sender } = messageItem;

  return (
    <React.Fragment>
      {contentAttributes && <EmailMeta {...{ contentAttributes, sender }} />}
      <MarkdownBubble messageContent={content} variant={variant} />
    </React.Fragment>
  );
};
