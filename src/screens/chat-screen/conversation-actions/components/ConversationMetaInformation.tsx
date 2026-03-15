import React from 'react';
import Animated from 'react-native-reanimated';

import { AttributeListType, CustomAttribute } from '@domain/types';
import { Conversation } from '@domain/types/Conversation';
import i18n from '@infrastructure/i18n';
import { useAppSelector } from '@application/store/hooks';
import { processContactAttributes } from '@infrastructure/utils/customAttributeUtils';
import { getConversationCustomAttributes } from '@application/store/custom-attribute/customAttributeSlice';
import { AttributeList } from '@infrastructure/ui';

export const ConversationMetaInformation = ({ conversation }: { conversation: Conversation }) => {
  const additionalAttributes = conversation.additionalAttributes;
  const initiatedAt = additionalAttributes.initiatedAt?.timestamp;
  const referer = additionalAttributes.referer;
  const browser = additionalAttributes.browser;
  const sender = conversation.meta.sender;

  const browserName = browser?.browserName
    ? `${browser?.browserName} ${browser?.browserVersion}`
    : '';
  const platformName = browser?.platformName
    ? `${browser?.platformName} ${browser?.platformVersion}`
    : '';

  const conversationCustomAttributes = useAppSelector(getConversationCustomAttributes);
  const { additionalAttributes: { createdAtIp = '' } = {} } = sender;

  const usedConversationCustomAttributes = processContactAttributes(
    conversationCustomAttributes,
    conversation?.customAttributes || {},
    (key, custom) => key in custom,
  );

  const otherConversationDetails: AttributeListType[] = [
    {
      title: i18n.t('CONVERSATION_DETAILS.CONVERSATION_ID'),
      subtitleType: 'light',
      subtitle: conversation.id.toString(),
      type: 'text',
    },
    {
      title: i18n.t('CONVERSATION_DETAILS.INITIATED_AT'),
      subtitleType: 'light',
      subtitle: initiatedAt,
      type: 'date',
    },
    {
      title: i18n.t('CONVERSATION_DETAILS.INITIATED_FROM'),
      subtitleType: 'light',
      subtitle: referer,
      type: 'link',
    },
    {
      title: i18n.t('CONVERSATION_DETAILS.BROWSER'),
      subtitleType: 'light',
      subtitle: browserName,
      type: 'text',
    },
    {
      title: i18n.t('CONVERSATION_DETAILS.OPERATING_SYSTEM'),
      subtitleType: 'light',
      subtitle: platformName,
      type: 'text',
    },
    {
      title: i18n.t('CONVERSATION_DETAILS.IP_ADDRESS'),
      subtitleType: 'light',
      subtitle: createdAtIp,
      type: 'text',
    },
  ];

  const processedAttributes = usedConversationCustomAttributes.map(attribute => ({
    title: attribute.attributeDisplayName,
    subtitle: attribute.value,
    subtitleType: 'dark',
    type: attribute.attributeDisplayType,
  }));

  const allAttributes = [...otherConversationDetails, ...processedAttributes];

  const hasAnyAttributeContainingValue = allAttributes.some(attribute => attribute.subtitle);

  if (!hasAnyAttributeContainingValue) {
    return null;
  }

  return (
    <Animated.View>
      <AttributeList
        sectionTitle={i18n.t('CONVERSATION_DETAILS.TITLE')}
        list={allAttributes as AttributeListType[]}
      />
    </Animated.View>
  );
};
