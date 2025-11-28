import React, { useState, useCallback, useRef } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { LinearTransition } from 'react-native-reanimated';
import { useThemedStyles } from '@/hooks';
import { Icon } from '@/components-next/common';
import { SendIcon } from '@/svg-icons';
import type { AIInputFieldProps } from './types';

export const AIInputField: React.FC<AIInputFieldProps> = ({ onSend, isLoading, onCancel }) => {
  const [text, setText] = useState('');
  const inputRef = useRef<TextInput>(null);
  const insets = useSafeAreaInsets();
  const themedTailwind = useThemedStyles();

  const handleSend = useCallback(() => {
    if (text.trim() && !isLoading) {
      onSend(text.trim());
      setText('');
      inputRef.current?.blur();
    }
  }, [text, isLoading, onSend]);

  const handleCancel = useCallback(() => {
    if (onCancel) {
      onCancel();
    }
  }, [onCancel]);

  return (
    <Animated.View
      layout={LinearTransition.springify().damping(20).stiffness(120)}
      style={[
        themedTailwind.style(
          'px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900',
        ),
        { paddingBottom: Math.max(insets.bottom + 32, 40) },
      ]}>
      <View
        style={themedTailwind.style(
          'flex-row items-end bg-gray-100 dark:bg-gray-800 rounded-2xl px-3 py-2',
        )}>
        <TextInput
          ref={inputRef}
          value={text}
          onChangeText={setText}
          placeholder="Type a message..."
          placeholderTextColor={themedTailwind.color('text-gray-400')}
          style={themedTailwind.style(
            'flex-1 text-base font-inter-normal-20 text-gray-900 dark:text-gray-100',
            'min-h-[40px] max-h-[100px]',
          )}
          multiline
          maxLength={5000}
          editable={!isLoading}
          onSubmitEditing={handleSend}
          returnKeyType="send"
          textAlignVertical="center"
          accessible
          accessibilityLabel="AI assistant message input"
        />
        {isLoading && onCancel ? (
          <Pressable
            onPress={handleCancel}
            style={({ pressed }) =>
              themedTailwind.style('ml-2 p-2 rounded-full', pressed && 'opacity-70')
            }
            accessible
            accessibilityRole="button"
            accessibilityLabel="Cancel AI response">
            <Text style={themedTailwind.style('text-red-600 dark:text-red-400 text-sm')}>
              Cancel
            </Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={handleSend}
            disabled={!text.trim() || isLoading}
            style={({ pressed }) =>
              themedTailwind.style(
                'ml-2 p-2 rounded-full',
                (!text.trim() || isLoading) && 'opacity-50',
                pressed && 'opacity-70',
              )
            }
            accessible
            accessibilityRole="button"
            accessibilityLabel="Send message"
            accessibilityState={{ disabled: !text.trim() || isLoading }}>
            <View
              style={themedTailwind.style(
                'w-6 h-6 bg-blue-600 rounded-full items-center justify-center',
              )}>
              <Icon icon={<SendIcon />} size={16} />
            </View>
          </Pressable>
        )}
      </View>
    </Animated.View>
  );
};
