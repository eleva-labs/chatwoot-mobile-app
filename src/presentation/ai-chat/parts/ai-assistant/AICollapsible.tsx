/**
 * AICollapsible Component
 *
 * A reusable animated collapsible container for AI chat parts.
 * Used by AIReasoningPart and AIToolPart for expand/collapse functionality.
 *
 * Follows Vue's AiCollapsiblePart patterns:
 * - Toggle expand/collapse on header press
 * - Stays collapsed by default (user expands manually)
 * - Color accent support for different part types
 * - Animated chevron rotation
 */

import React, { useCallback, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';

import { ChevronUp } from 'lucide-react-native';
import { CaretRight } from '@/svg-icons/common/CaretRight';
import { useThemeColors } from '@infrastructure/theme';
import { useAIStyles, type AIAccentColor } from '@presentation/ai-chat/styles/ai-assistant';
import { useAIi18n } from '@presentation/ai-chat/hooks/ai-assistant/useAIi18n';

// ============================================================================
// Types
// ============================================================================

/** Re-export for backward compatibility */
export type CollapsibleAccentColor = AIAccentColor;

export interface AICollapsibleProps {
  /** Header text to display */
  title: string;
  /** Optional subtitle (e.g., timestamp, status) */
  subtitle?: string;
  /** Whether the collapsible starts expanded */
  defaultExpanded?: boolean;
  /** Whether streaming is active (affects icon/label styling) */
  isStreaming?: boolean;
  /** Accent color for the header (matches Vue's n-{color} system) */
  accentColor?: CollapsibleAccentColor;
  /** Children to render in the collapsible content */
  children: React.ReactNode;
  /** Optional icon to display before the title */
  icon?: React.ReactNode;
  /** Optional callback when expand state changes */
  onToggle?: (isExpanded: boolean) => void;
}

// ============================================================================
// Animation Config
// ============================================================================

const ANIMATION_CONFIG = {
  duration: 250,
  easing: Easing.bezier(0.4, 0, 0.2, 1),
};

// ============================================================================
// Component
// ============================================================================

export const AICollapsible: React.FC<AICollapsibleProps> = ({
  title,
  subtitle,
  defaultExpanded = false,
  isStreaming = false,
  accentColor = 'slate',
  children,
  icon,
  onToggle,
}) => {
  const { style, getCollapsible } = useAIStyles();
  const { t } = useAIi18n();
  const { colors: themeColors } = useThemeColors();
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const colors = getCollapsible(accentColor);

  // Note: Previously auto-expanded when streaming started. Removed so reasoning
  // bubbles stay collapsed by default — users can expand manually if interested.

  // Toggle handler
  const handleToggle = useCallback(() => {
    const newState = !isExpanded;
    setIsExpanded(newState);
    onToggle?.(newState);
  }, [isExpanded, onToggle]);

  // Animated style for content opacity + translateY
  const contentAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(isExpanded ? 1 : 0, ANIMATION_CONFIG),
      transform: [
        {
          translateY: withTiming(isExpanded ? 0 : -8, ANIMATION_CONFIG),
        },
      ],
    };
  });

  // Animated style for chevron rotation (90deg like Vue, not 180deg)
  const chevronAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          rotate: withTiming(isExpanded ? '90deg' : '0deg', ANIMATION_CONFIG),
        },
      ],
    };
  });

  // Pulse animation for icon when streaming (replaces ActivityIndicator)
  const iconPulseStyle = useAnimatedStyle(() => {
    if (!isStreaming) {
      return { opacity: 1 };
    }
    return {
      opacity: withRepeat(
        withSequence(withTiming(0.4, { duration: 1000 }), withTiming(1, { duration: 1000 })),
        -1,
        true,
      ),
    };
  });

  return (
    <View
      style={style(
        'rounded-xl border overflow-hidden w-full',
        'border-slate-6/50',
        colors.background,
      )}
      accessible
      accessibilityRole="button"
      accessibilityState={{ expanded: isExpanded }}
      accessibilityLabel={
        isExpanded
          ? t('AI_ASSISTANT.CHAT.COLLAPSIBLE.EXPANDED', { title })
          : t('AI_ASSISTANT.CHAT.COLLAPSIBLE.COLLAPSED', { title })
      }>
      {/* Header - matching Vue's button styles */}
      <Pressable
        onPress={handleToggle}
        style={({ pressed }) => [
          style('flex-row items-center gap-2 px-3 py-2'),
          pressed && style('opacity-70'),
        ]}>
        {/* Icon with pulse animation during streaming */}
        {icon && (
          <Animated.View
            style={[
              style('w-4 h-4 items-center justify-center', isStreaming && colors.iconActive),
              iconPulseStyle,
            ]}>
            {icon}
          </Animated.View>
        )}

        {/* Title with streaming active color */}
        <Text
          style={style(
            'text-sm font-inter-normal-20 flex-1',
            isStreaming ? colors.labelActive : colors.label,
          )}
          numberOfLines={1}>
          {title}
        </Text>

        {/* Subtitle */}
        {subtitle && (
          <Text style={style('text-xs font-inter-normal-20', colors.subtitle)} numberOfLines={1}>
            {subtitle}
          </Text>
        )}

        {/* Chevron (rotates 90deg like Vue) */}
        <Animated.View style={[chevronAnimatedStyle, style('w-4 h-4 items-center justify-center')]}>
          <CaretRight size={14} color={themeColors.slate[10]} strokeWidth={2} />
        </Animated.View>
      </Pressable>

      {/* Collapsible Content - with left border accent like Vue */}
      {isExpanded && (
        <Animated.View style={[contentAnimatedStyle, style('overflow-hidden')]}>
          <View style={style('px-3 pb-3')}>
            <View style={style('pl-6 border-l-2', colors.borderAccent)}>
              {children}
              {/* Collapse footer button */}
              <Pressable onPress={handleToggle} style={style('flex-row items-center gap-1 pt-2')}>
                <ChevronUp size={12} color={themeColors.slate[10]} strokeWidth={2} />
                <Text style={style('text-xs', colors.label)}>
                  {t('AI_ASSISTANT.CHAT.COLLAPSIBLE.COLLAPSE')}
                </Text>
              </Pressable>
            </View>
          </View>
        </Animated.View>
      )}
    </View>
  );
};

export default AICollapsible;
