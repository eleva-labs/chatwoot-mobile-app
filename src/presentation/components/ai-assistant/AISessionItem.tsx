import React, { useMemo } from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated from 'react-native-reanimated';
import type { AIChatSession } from '@/store/ai-chat/aiChatTypes';
import { useAIStyles } from '@/presentation/styles/ai-assistant';
import { useAIi18n } from '@/presentation/hooks/ai-assistant/useAIi18n';
import { formatSessionTitle } from '@/presentation/utils/ai-assistant/aiChatFormatUtils';

interface SessionItemProps {
  session: AIChatSession;
  isActive: boolean;
  isLastItem: boolean;
  onPress: () => void;
}

export const AISessionItem: React.FC<SessionItemProps> = React.memo(
  ({ session, isActive, isLastItem, onPress }) => {
    const { style, tokens } = useAIStyles();
    const { t } = useAIi18n();
    const sessionTokens = tokens.session;

    const title = useMemo(() => formatSessionTitle(session.updated_at, {
      today: t('AI_ASSISTANT.CHAT.SESSION_ITEM.TODAY'),
      yesterday: t('AI_ASSISTANT.CHAT.SESSION_ITEM.YESTERDAY'),
      recently: t('AI_ASSISTANT.CHAT.SESSIONS.RECENTLY'),
    }), [session.updated_at, t]);

    return (
      <Pressable onPress={onPress}>
        {({ pressed }) => (
          <Animated.View
            style={[
              style(
                'flex-row items-center px-4 py-3',
                !isLastItem && `border-b ${sessionTokens.border}`,
                isActive && sessionTokens.activeBackground,
              ),
              pressed && style('opacity-70'),
            ]}>
            <View style={style('flex-1')}>
              <Text
                style={style(
                  'text-base font-inter-420-20',
                  isActive ? sessionTokens.activeText : sessionTokens.title,
                  isActive && 'font-inter-580-24',
                )}>
                {title}
              </Text>
            </View>
            {isActive && (
              <View style={style('w-2 h-2 rounded-full', sessionTokens.activeIndicator)} />
            )}
          </Animated.View>
        )}
      </Pressable>
    );
  },
);

AISessionItem.displayName = 'AISessionItem';
