import React, { useState, useCallback } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { tailwind } from '@/theme';
import { useScaleAnimation } from '@/utils';
import { useHaptic } from '@/utils';
import { Icon } from '@/components-next/common';
import { AIAssisst } from '@/svg-icons';
import { AIChatInterface } from './AIChatInterface';
import type { FloatingAIAssistantProps } from './types';

export const FloatingAIAssistant: React.FC<FloatingAIAssistantProps> = React.memo(
  ({ agentBotId }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const insets = useSafeAreaInsets();
    const haptic = useHaptic('selection');
    const { handlers, animatedStyle: scaleStyle } = useScaleAnimation();

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
        <View style={[styles.container, { paddingBottom: insets.bottom }]}>
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
        ]}
      >
        <Animated.View style={scaleStyle}>
          <Pressable
            onPress={handlePress}
            style={({ pressed }) => [
              styles.fab,
              tailwind.style('bg-blue-600 rounded-full shadow-lg'),
              pressed && tailwind.style('opacity-80'),
            ]}
            accessible
            accessibilityRole="button"
            accessibilityLabel="Open AI Assistant"
            accessibilityHint="Opens the AI assistant chat interface"
            {...handlers}
          >
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
    justifyContent: 'flex-end',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  chatContainer: {
    width: '100%',
    height: '90%',
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
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
