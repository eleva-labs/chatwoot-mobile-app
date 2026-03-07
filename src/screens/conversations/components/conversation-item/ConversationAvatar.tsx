import React, { memo } from 'react';
import { ImageURISource } from 'react-native';
import { LinearTransition } from 'react-native-reanimated';
import isEqual from 'lodash/isEqual';

import { Avatar, AvatarStatusType } from '@infrastructure/ui/common';
import { AnimatedNativeView } from '@infrastructure/ui/native-components';
import { AvailabilityStatus } from '@domain/types';

type ConversationAvatarProps = {
  src: ImageURISource;
  name: string;
  status: AvailabilityStatus;
};

const checkIfPropsAreSame = (prev: ConversationAvatarProps, next: ConversationAvatarProps) => {
  const arePropsEqual = isEqual(prev, next);
  return arePropsEqual;
};

export const ConversationAvatar = memo((props: ConversationAvatarProps) => {
  const { src, name, status } = props;
  return (
    <AnimatedNativeView layout={LinearTransition.springify().damping(28).stiffness(200)}>
      <Avatar
        size="2xl"
        src={src}
        name={name}
        status={status as AvatarStatusType}
        parentsBackground="bg-solid-1"
      />
    </AnimatedNativeView>
  );
}, checkIfPropsAreSame);

ConversationAvatar.displayName = 'ConversationAvatar';
