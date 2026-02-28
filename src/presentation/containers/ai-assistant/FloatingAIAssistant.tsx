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
import { AIChatInterface } from './AIChatInterface';
import type { FloatingAIAssistantProps } from './types';
import { useAIStyles } from '@/presentation/styles/ai-assistant';
import { useAIi18n } from '@/presentation/hooks/ai-assistant/useAIi18n';

const DEFAULT_BOTTOM_INSET = 80;

export const FloatingAIAssistant: React.FC<FloatingAIAssistantProps> = React.memo(
  ({
    agentBotId,
    bottomInset = DEFAULT_BOTTOM_INSET,
    fabIcon,
    enableScaleAnimation = true,
    enableHaptic = true,
  }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const insets = useSafeAreaInsets();
    const haptic = useHaptic('selection');
    const { handlers, animatedStyle: scaleStyle } = useScaleAnimation();
    const { style, tokens } = useAIStyles();
    const { t } = useAIi18n();

    // Animation values using Reanimated (useSharedValue for performance)
    const opacity = useSharedValue(0);
    const translateY = useSharedValue(100);
    const fabScale = useSharedValue(1);

    const handlePress = useCallback(() => {
      if (enableHaptic) {
        haptic?.();
      }
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
    }, [haptic, enableHaptic, opacity, translateY, fabScale]);

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
            { paddingTop: insets.top, paddingBottom: bottomInset },
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
            bottom: bottomInset + insets.bottom,
            right: 16,
          },
          fabAnimatedStyle,
        ]}>
        <Animated.View style={enableScaleAnimation ? scaleStyle : undefined}>
          <Pressable
            onPress={handlePress}
            style={({ pressed }) => [
              styles.fab,
              style('rounded-full', tokens.fab.background, tokens.fab.shadow),
              pressed && style('opacity-80'),
            ]}
            accessible
            accessibilityRole="button"
            accessibilityLabel={t('AI_ASSISTANT.CHAT.ACCESSIBILITY.OPEN')}
            accessibilityHint={t('AI_ASSISTANT.CHAT.ACCESSIBILITY.OPEN_HINT')}
            {...(enableScaleAnimation ? handlers : {})}>
            {fabIcon ?? <Icon icon={<AIAssisst color="white" strokeOpacity={1} />} size={24} />}
          </Pressable>
        </Animated.View>
      </Animated.View>
    );
  },
  // Memo comparison function
  (prevProps, nextProps) => {
    return (
      prevProps.agentBotId === nextProps.agentBotId &&
      prevProps.bottomInset === nextProps.bottomInset &&
      prevProps.fabIcon === nextProps.fabIcon &&
      prevProps.enableScaleAnimation === nextProps.enableScaleAnimation &&
      prevProps.enableHaptic === nextProps.enableHaptic
    );
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
