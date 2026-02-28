import React, { useState, useCallback, useRef } from 'react';
import { View, TextInput, Pressable } from 'react-native';
import Animated, { LinearTransition } from 'react-native-reanimated';
import { Icon } from '@/components-next/common';
import { SendIcon } from '@/svg-icons';
import { tailwind } from '@/theme/tailwind';
import { useAIStyles } from '@/presentation/styles/ai-assistant';
import type { AIInputFieldProps } from '@/presentation/containers/ai-assistant/types';
import { useAIi18n } from '@/presentation/hooks/ai-assistant/useAIi18n';

export const AIInputField: React.FC<AIInputFieldProps> = ({ onSend, isLoading, onCancel }) => {
  const [text, setText] = useState('');
  const inputRef = useRef<TextInput>(null);
  const { style, tokens } = useAIStyles();
  const { t } = useAIi18n();
  const inputTokens = tokens.input;
  const [isFocused, setIsFocused] = useState(false);

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
        style('px-4 py-3 pb-4 border-t', inputTokens.containerBackground, inputTokens.containerBorder),
      ]}>
      <View
        style={style(
          'flex-row items-end rounded-2xl px-3 py-2 border',
          inputTokens.inputBackground,
          isFocused ? 'border-iris-9' : 'border-slate-6',
        )}>
        <TextInput
          ref={inputRef}
          value={text}
          onChangeText={setText}
          placeholder={t('AI_ASSISTANT.CHAT.INPUT.PLACEHOLDER')}
          placeholderTextColor={tailwind.color('text-slate-9') ?? '#696e77'}
          style={style(
            'flex-1 text-base font-inter-normal-20 min-h-[40px] max-h-[100px]',
            inputTokens.inputText,
          )}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          multiline
          maxLength={5000}
          editable={!isLoading}
          onSubmitEditing={handleSend}
          returnKeyType="send"
          textAlignVertical="center"
          accessible
          accessibilityLabel={t('AI_ASSISTANT.CHAT.ACCESSIBILITY.INPUT')}
        />
        {isLoading && onCancel ? (
          <Pressable
            onPress={handleCancel}
            style={({ pressed }) => style('ml-2 p-2 rounded-full', pressed && 'opacity-70')}
            accessible
            accessibilityRole="button"
            accessibilityLabel={t('AI_ASSISTANT.CHAT.ACCESSIBILITY.STOP_GENERATING')}>
            <View style={style('w-8 h-8 rounded-full bg-ruby-9 items-center justify-center')}>
              <View style={style('w-3 h-3 rounded-sm bg-white')} />
            </View>
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
            accessibilityLabel={t('AI_ASSISTANT.CHAT.ACCESSIBILITY.SEND')}
            accessibilityState={{ disabled: !text.trim() || isLoading }}>
            <View
              style={style(
                'w-8 h-8 rounded-full items-center justify-center',
                inputTokens.sendButton,
              )}>
              <Icon icon={<SendIcon />} size={18} />
            </View>
          </Pressable>
        )}
      </View>
    </Animated.View>
  );
};
