import React from 'react';
import Animated from 'react-native-reanimated';

import { messageTimestamp } from '@infrastructure/utils/dateTimeUtils';
import { localizeActivityMessage } from '@infrastructure/utils/activityMessageUtils';
import { useThemedStyles } from '@infrastructure/hooks';

type ActivityBubbleProps = {
  text: string;
  timeStamp: number;
};

export const ActivityBubble = (props: ActivityBubbleProps) => {
  const { text, timeStamp } = props;
  const localizedText = localizeActivityMessage(text);
  const themedTailwind = useThemedStyles();
  return (
    <Animated.View style={themedTailwind.style('flex flex-row justify-center py-2 px-6')}>
      <Animated.View
        style={themedTailwind.style(
          'flex flex-row items-center bg-slate-3 rounded-full px-3 py-1.5',
        )}>
        <Animated.Text
          style={themedTailwind.style(
            'text-cxs font-inter-420-20 tracking-[0.32px] leading-[18px] text-slate-11 text-center',
          )}>
          {localizedText} {messageTimestamp(timeStamp)}
        </Animated.Text>
      </Animated.View>
    </Animated.View>
  );
};
