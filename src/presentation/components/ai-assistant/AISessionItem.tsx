import React, { useCallback } from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated from 'react-native-reanimated';
import type { AIChatSession } from '@/infrastructure/dto/ai-assistant';
import { formatDistanceToNow } from 'date-fns';
import { useAIStyles } from '@/presentation/styles/ai-assistant';

interface SessionItemProps {
  session: AIChatSession;
  isActive: boolean;
  isLastItem: boolean;
  onPress: () => void;
}

export const AISessionItem: React.FC<SessionItemProps> = React.memo(
  ({ session, isActive, isLastItem, onPress }) => {
    const { style, tokens } = useAIStyles();
    const sessionTokens = tokens.session;

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
          style={style(
            'flex-row items-center px-4 py-3',
            !isLastItem && `border-b ${sessionTokens.border}`,
            isActive && sessionTokens.activeBackground,
          )}
        >
          <View style={style('flex-1')}>
            <Text
              style={style(
                'text-base font-inter-420-20',
                isActive ? sessionTokens.activeText : sessionTokens.title,
                isActive && 'font-inter-580-24',
              )}
            >
              {session.chat_session_id.slice(0, 8)}...
            </Text>
            <Text style={style('text-sm mt-1', sessionTokens.subtitle)}>
              {formatDate(session.updated_at)}
            </Text>
          </View>
          {isActive && (
            <View style={style('w-2 h-2 rounded-full', sessionTokens.activeIndicator)} />
          )}
        </Animated.View>
      </Pressable>
    );
  },
);

AISessionItem.displayName = 'AISessionItem';
