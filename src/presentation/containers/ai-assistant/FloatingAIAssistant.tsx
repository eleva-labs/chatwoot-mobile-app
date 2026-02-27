import React, { useState, useCallback } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useScaleAnimation } from '@/utils';
import { useHaptic } from '@/utils';
import { Icon } from '@/components-next/common';
import { AIAssisst } from '@/svg-icons';
import { TAB_BAR_HEIGHT } from '@/constants';
import { AIChatInterface } from './AIChatInterface';
import type { FloatingAIAssistantProps } from './types';
import { useAIStyles } from '@/presentation/styles/ai-assistant';
import i18n from '@/i18n';

export const FloatingAIAssistant: React.FC<FloatingAIAssistantProps> = React.memo(
  ({ agentBotId }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const insets = useSafeAreaInsets();
    const haptic = useHaptic('selection');
    const { handlers, animatedStyle: scaleStyle } = useScaleAnimation();
    const { style, tokens } = useAIStyles();

    // Animation values using Reanimated (useSharedValue for performance)
    const opacity = useSharedValue(0);
    const translateY = useSharedValue(100);
    const fabScale = useSharedValue(1);

    const handlePress = useCallback(() => {
      haptic?.();
      setIsExpanded(prev => {
        const newValue = !prev;

        // Animate FAB
        fabScale.value = withSpring(newValue ? 0 : 1, {
          damping: 15,
          stiffness: 150,
        });

        // Animate chat interface
        opacity.value = withTiming(newValue ? 1 : 0, { duration: 200 });
        translateY.value = withSpring(newValue ? 0 : 100, {
          damping: 20,
          stiffness: 200,
        });

        return newValue;
      });
    }, [haptic, opacity, translateY, fabScale]);

    const fabAnimatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: fabScale.value }],
      opacity: fabScale.value === 0 ? 0 : 1,
    }));

    const chatInterfaceStyle = useAnimatedStyle(() => ({
      opacity: opacity.value,
      transform: [{ translateY: translateY.value }],
    }));

    const handleClose = useCallback(() => {
      setIsExpanded(false);
      opacity.value = withTiming(0, { duration: 200 });
      translateY.value = withSpring(100, {
        damping: 20,
        stiffness: 200,
      });
      fabScale.value = withSpring(1, {
        damping: 15,
        stiffness: 150,
      });
    }, [opacity, translateY, fabScale]);

    if (isExpanded) {
      return (
        <View
          style={[
            styles.container,
            style(tokens.session.background),
            { paddingTop: insets.top, paddingBottom: TAB_BAR_HEIGHT },
          ]}>
          <Animated.View style={[styles.chatContainer, chatInterfaceStyle]}>
            <AIChatInterface agentBotId={agentBotId} onClose={handleClose} />
          </Animated.View>
        </View>
      );
    }

    return (
      <Animated.View
        style={[
          styles.fabContainer,
          {
            bottom: 80 + insets.bottom, // Above tab bar
            right: 16,
          },
          fabAnimatedStyle,
        ]}>
        <Animated.View style={scaleStyle}>
          <Pressable
            onPress={handlePress}
            style={({ pressed }) => [
              styles.fab,
              style('rounded-full', tokens.fab.background, tokens.fab.shadow),
              pressed && style('opacity-80'),
            ]}
            accessible
            accessibilityRole="button"
            accessibilityLabel={i18n.t('AI_ASSISTANT.CHAT.ACCESSIBILITY.OPEN')}
            accessibilityHint={i18n.t('AI_ASSISTANT.CHAT.ACCESSIBILITY.OPEN_HINT')}
            {...handlers}>
            <Icon icon={<AIAssisst color="white" strokeOpacity={1} />} size={24} />
          </Pressable>
        </Animated.View>
      </Animated.View>
    );
  },
  // Memo comparison function
  (prevProps, nextProps) => {
    return prevProps.agentBotId === nextProps.agentBotId;
  },
);

FloatingAIAssistant.displayName = 'FloatingAIAssistant';

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  chatContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  fabContainer: {
    position: 'absolute',
    zIndex: 999,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
