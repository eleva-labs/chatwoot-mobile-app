import React, { useEffect, useState } from 'react';
import { Text } from 'react-native';

import { useThemedStyles } from '@/hooks';
import { NativeView } from '@/components-next/native-components';
import { formatTimeToShortForm, formatRelativeTime } from '@/utils/dateTimeUtils';

// Constants from Vue component
const MINUTE_IN_MS = 60000;
const HOUR_IN_MS = MINUTE_IN_MS * 60;
const DAY_IN_MS = HOUR_IN_MS * 24;

type LastActivityTimeProps = {
  timestamp: number;
  createdAt?: number;
};

export const LastActivityTime = ({ timestamp, createdAt }: LastActivityTimeProps) => {
  const themedTailwind = useThemedStyles();
  const [lastActivityTime, setLastActivityTime] = useState(
    formatTimeToShortForm(formatRelativeTime(timestamp)),
  );
  const [createdAtTime, setCreatedAtTime] = useState(
    createdAt ? formatTimeToShortForm(formatRelativeTime(createdAt)) : '',
  );

  useEffect(() => {
    const getRefreshTime = () => {
      const timeDiff = Date.now() - timestamp * 1000;
      if (timeDiff > DAY_IN_MS) return DAY_IN_MS;
      if (timeDiff > HOUR_IN_MS) return HOUR_IN_MS;
      return MINUTE_IN_MS;
    };

    const updateTime = () => {
      setLastActivityTime(formatTimeToShortForm(formatRelativeTime(timestamp)));
      if (createdAt) {
        setCreatedAtTime(formatTimeToShortForm(formatRelativeTime(createdAt)));
      }
    };

    const timer = setTimeout(function refresh() {
      updateTime();
      // Set up next refresh
      setTimeout(refresh, getRefreshTime());
    }, getRefreshTime());

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const displayText = createdAtTime ? `${createdAtTime} · ${lastActivityTime}` : lastActivityTime;

  return (
    <NativeView>
      <Text style={themedTailwind.style('text-xxs font-inter-420-20 leading-4 text-slate-10')}>
        {displayText}
      </Text>
    </NativeView>
  );
};
