import React, { useState, useCallback, useRef } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { LinearTransition } from 'react-native-reanimated';
import { Icon } from '@/components-next/common';
import { SendIcon } from '@/svg-icons';
import { useAIStyles } from '@/presentation/styles/ai-assistant';
import type { AIInputFieldProps } from '@/presentation/containers/ai-assistant/types';

export const AIInputField: React.FC<AIInputFieldProps> = ({ onSend, isLoading, onCancel }) => {
  const [text, setText] = useState('');
  const inputRef = useRef<TextInput>(null);
  const insets = useSafeAreaInsets();
  const { style, tokens } = useAIStyles();
  const inputTokens = tokens.input;

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
        style('px-4 py-3 border-t', inputTokens.containerBackground, inputTokens.containerBorder),
        { paddingBottom: Math.max(insets.bottom + 32, 40) },
      ]}
    >
      <View style={style('flex-row items-end rounded-2xl px-3 py-2', inputTokens.inputBackground)}>
        <TextInput
          ref={inputRef}
          value={text}
          onChangeText={setText}
          placeholder="Type a message..."
          placeholderTextColor="#696e77" // slate-9 equivalent
          style={style(
            'flex-1 text-base font-inter-normal-20 min-h-[40px] max-h-[100px]',
            inputTokens.inputText,
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
            style={({ pressed }) => style('ml-2 p-2 rounded-full', pressed && 'opacity-70')}
            accessible
            accessibilityRole="button"
            accessibilityLabel="Cancel AI response"
          >
            <Text style={style('text-sm', inputTokens.cancelText)}>Cancel</Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={handleSend}
            disabled={!text.trim() || isLoading}
            style={({ pressed }) =>
              style(
                'ml-2 p-2 rounded-full',
                (!text.trim() || isLoading) && 'opacity-50',
                pressed && 'opacity-70',
              )
            }
            accessible
            accessibilityRole="button"
            accessibilityLabel="Send message"
            accessibilityState={{ disabled: !text.trim() || isLoading }}
          >
            <View
              style={style(
                'w-6 h-6 rounded-full items-center justify-center',
                inputTokens.sendButton,
              )}
            >
              <Icon icon={<SendIcon />} size={16} />
            </View>
          </Pressable>
        )}
      </View>
    </Animated.View>
  );
};
