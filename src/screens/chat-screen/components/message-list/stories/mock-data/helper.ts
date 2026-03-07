import camelcaseKeys from 'camelcase-keys';
import { Message } from '@domain/types';
import { getGroupedMessages } from '@infrastructure/utils';
import flatMap from 'lodash/flatMap';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getAllGroupedMessages = (messages: any[]) => {
  const MESSAGES_LIST_MOCKDATA = [...messages].reverse();

  const updatedMessages = MESSAGES_LIST_MOCKDATA.map(
    value => camelcaseKeys(value, { deep: true }) as unknown as Message,
  );

  const groupedMessages = getGroupedMessages(updatedMessages);

  const allMessages = flatMap(groupedMessages, section => [
    ...section.data,
    { date: section.date },
  ]);

  return allMessages;
};
