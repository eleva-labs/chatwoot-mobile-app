import React, { useCallback } from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated from 'react-native-reanimated';
import { useThemedStyles } from '@/hooks';
import type { AIChatSession } from '@/services/AIChatService';
import { formatDistanceToNow } from 'date-fns';

interface SessionItemProps {
  session: AIChatSession;
  isActive: boolean;
  isLastItem: boolean;
  onPress: () => void;
}

export const AISessionItem: React.FC<SessionItemProps> = React.memo(
  ({ session, isActive, isLastItem, onPress }) => {
    const themedTailwind = useThemedStyles();

    const formatDate = useCallback((dateString: string) => {
      try {
        const date = new Date(dateString);
        return formatDistanceToNow(date, { addSuffix: true });
      } catch {
        return 'Recently';
      }
    }, []);

    return (
      <Pressable onPress={onPress}>
        <Animated.View
          style={themedTailwind.style(
            'flex-row items-center px-4 py-3',
            !isLastItem && 'border-b border-gray-200 dark:border-gray-700',
            isActive && 'bg-blue-50 dark:bg-blue-900/20',
          )}>
          <View style={themedTailwind.style('flex-1')}>
            <Text
              style={themedTailwind.style(
                'text-base font-inter-420-20 text-gray-900 dark:text-white',
                isActive && 'font-inter-580-24',
              )}>
              {session.chat_session_id.slice(0, 8)}...
            </Text>
            <Text style={themedTailwind.style('text-sm text-gray-500 dark:text-gray-400 mt-1')}>
              {formatDate(session.updated_at)}
            </Text>
          </View>
          {isActive && <View style={themedTailwind.style('w-2 h-2 rounded-full bg-blue-600')} />}
        </Animated.View>
      </Pressable>
    );
  },
);

AISessionItem.displayName = 'AISessionItem';

