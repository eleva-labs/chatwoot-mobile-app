/**
 * AICollapsible Component
 *
 * A reusable animated collapsible container for AI chat parts.
 * Used by AIReasoningPart and AIToolPart for expand/collapse functionality.
 *
 * Follows Vue's AiCollapsiblePart patterns:
 * - Toggle expand/collapse on header press
 * - Auto-expand during streaming
 * - Color accent support for different part types
 * - Animated chevron rotation
 */

import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Pressable } from 'react-native';
import Animated, { useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';

import { useAIStyles, type AIAccentColor } from '@/presentation/styles/ai-assistant';

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
  /** Auto-expand when streaming is active */
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
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const colors = getCollapsible(accentColor);

  // Auto-expand when streaming starts (like Vue's watch on isStreaming)
  useEffect(() => {
    if (isStreaming && !isExpanded) {
      setIsExpanded(true);
      onToggle?.(true);
    }
  }, [isStreaming, isExpanded, onToggle]);

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

  return (
    <View
      style={style('rounded-xl border overflow-hidden w-full', colors.border, colors.background)}
      accessible
      accessibilityRole="button"
      accessibilityState={{ expanded: isExpanded }}
      accessibilityLabel={`${title}, ${isExpanded ? 'expanded' : 'collapsed'}`}>
      {/* Header - matching Vue's button styles */}
      <TouchableOpacity
        onPress={handleToggle}
        style={style('flex-row items-center gap-2 px-3 py-2')}
        activeOpacity={0.7}>
        {/* Icon with streaming animation color */}
        {icon && (
          <View
            style={style('w-4 h-4 items-center justify-center', isStreaming && colors.iconActive)}>
            {icon}
          </View>
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
        {/* TODO: Replace with Lucide ChevronRight icon when icon library is migrated */}
        <Animated.View style={chevronAnimatedStyle}>
          <Text style={style('text-sm', colors.chevron)}>▶</Text>
        </Animated.View>
      </TouchableOpacity>

      {/* Collapsible Content - with left border accent like Vue */}
      {isExpanded && (
        <Animated.View style={[contentAnimatedStyle, style('overflow-hidden')]}>
          <View style={style('px-3 pb-3')}>
            <View style={style('pl-4 border-l-2', colors.borderAccent)}>
              {children}
              {/* Collapse footer button */}
              <Pressable
                onPress={handleToggle}
                style={style('flex-row items-center gap-1 pt-2')}>
                <Text style={style('text-xs', colors.chevron)}>▲</Text>
                <Text style={style('text-xs', colors.label)}>Collapse</Text>
              </Pressable>
            </View>
          </View>
        </Animated.View>
      )}
    </View>
  );
};

export default AICollapsible;
