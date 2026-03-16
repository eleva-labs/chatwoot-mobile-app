import { Conversation, Contact } from '@domain/types';

import {
  getMessageVariables,
  replaceVariablesInMessage,
  getUndefinedVariablesInMessage,
} from '@chatwoot/utils';

type MessageVariables = {
  [key: string]: string | number | boolean;
};

export const allMessageVariables = ({ conversation }: { conversation: Conversation }) => {
  if (!conversation) return {};
  const contact = conversation?.meta?.sender as Contact;
  return getMessageVariables({
    // @ts-ignore
    conversation,

    // @ts-ignore
    contact,
  }) as MessageVariables;
};

export const replaceMessageVariables = ({
  message,
  variables,
}: {
  message: string;

  // @ts-ignore
  variables: MessageVariables;
}) => {
  return replaceVariablesInMessage({ message, variables });
};

export const getAllUndefinedVariablesInMessage = ({
  message,
  variables,
}: {
  message: string;
  variables: MessageVariables;
}) => {
  return getUndefinedVariablesInMessage({ message, variables });
};
