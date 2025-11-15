import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useThemedStyles } from '@/hooks';
import type { UIMessage } from 'ai';

interface AIThoughtsViewProps {
  message: UIMessage;
  timestamp?: Date;
}

export const AIThoughtsView: React.FC<AIThoughtsViewProps> = ({ message, timestamp }) => {
  const themedTailwind = useThemedStyles();
  const [isExpanded, setIsExpanded] = useState(true);

  // Extract text content from message parts
  const textContent = React.useMemo(() => {
    try {
      if (message.parts && Array.isArray(message.parts) && message.parts.length > 0) {
        const extracted = message.parts
          .filter(part => {
            return part != null && typeof part === 'object' && part !== null && 'type' in part;
          })
          .map(part => {
            try {
              if (!part || typeof part !== 'object') {
                return '';
              }

              const partRecord = part as Record<string, unknown>;
              if (partRecord.type === 'text') {
                const text = typeof partRecord.text === 'string' ? partRecord.text : undefined;
                const content =
                  typeof partRecord.content === 'string' ? partRecord.content : undefined;
                const delta = typeof partRecord.delta === 'string' ? partRecord.delta : undefined;
                return text ?? content ?? delta ?? '';
              }
              return '';
            } catch (error) {
              console.error('[AIThoughtsView] Error extracting text from part:', error);
              return '';
            }
          })
          .filter(text => text !== '')
          .join('');

        if (extracted) {
          return extracted;
        }
      } else {
        const messageRecord = message as unknown as Record<string, unknown>;
        if (messageRecord.content && typeof messageRecord.content === 'string') {
          return messageRecord.content;
        }
      }
      return '';
    } catch (error) {
      console.error('[AIThoughtsView] Error extracting text content:', error);
      return '';
    }
  }, [message]);

  // Format timestamp
  const formattedTime = React.useMemo(() => {
    if (!timestamp) return '';
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }, [timestamp]);

  // Animated style for content
  // Use fixed max height when expanded to prevent layout recalculations during streaming
  // This reduces re-renders caused by text content growing
  const contentAnimatedStyle = useAnimatedStyle(() => {
    return {
      maxHeight: withTiming(isExpanded ? 320 : 0, { duration: 300 }),
      opacity: withTiming(isExpanded ? 1 : 0, { duration: 300 }),
    };
  });

  // Animated style for chevron
  const chevronAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: withTiming(isExpanded ? '180deg' : '0deg', { duration: 300 }) }],
    };
  });

  return (
    <View
      style={themedTailwind.style(
        'mx-4 mb-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50',
      )}>
      {/* Header */}
      <TouchableOpacity
        onPress={() => setIsExpanded(!isExpanded)}
        style={themedTailwind.style('flex-row items-center justify-between p-3')}
        activeOpacity={0.7}>
        <View style={themedTailwind.style('flex-row items-center flex-1')}>
          <Text
            style={themedTailwind.style(
              'text-sm font-inter-semibold-20 text-gray-700 dark:text-gray-300',
            )}>
            THOUGHTS...
          </Text>
          {formattedTime && (
            <Text
              style={themedTailwind.style(
                'ml-2 text-xs font-inter-normal-20 text-gray-500 dark:text-gray-400',
              )}>
              {formattedTime}
            </Text>
          )}
        </View>
        <Animated.View style={chevronAnimatedStyle}>
          <Text
            style={themedTailwind.style(
              'text-lg text-gray-600 dark:text-gray-400 font-inter-medium-24',
            )}>
            ▼
          </Text>
        </Animated.View>
      </TouchableOpacity>

      {/* Collapsible Content */}
      <Animated.View style={[contentAnimatedStyle, themedTailwind.style('overflow-hidden')]}>
        <View style={themedTailwind.style('px-3 pb-3')}>
          <ScrollView
            style={themedTailwind.style('max-h-80')}
            contentContainerStyle={themedTailwind.style('pr-1')}
            showsVerticalScrollIndicator={true}
            nestedScrollEnabled={true}>
            <Text
              style={themedTailwind.style(
                'text-sm font-inter-normal-20 text-gray-700 dark:text-gray-300 leading-5',
              )}>
              {textContent || '[No content]'}
            </Text>
          </ScrollView>
        </View>
      </Animated.View>
    </View>
  );
};
