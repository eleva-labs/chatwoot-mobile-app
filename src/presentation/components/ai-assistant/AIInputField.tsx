import React, { useState, useCallback, useRef } from 'react';
import { View, TextInput, Pressable } from 'react-native';
import Animated, { LinearTransition } from 'react-native-reanimated';
import { Mic, Send } from 'lucide-react-native';
import { useAIStyles } from '@/presentation/styles/ai-assistant';
import { useResolveColor } from '@/presentation/hooks/ai-assistant/useAITheme';
import type { AIInputFieldProps } from '@/presentation/containers/ai-assistant/types';
import { useAIi18n } from '@/presentation/hooks/ai-assistant/useAIi18n';

export const AIInputField: React.FC<AIInputFieldProps> = ({ onSend, isLoading, onCancel }) => {
  const [text, setText] = useState('');
  const inputRef = useRef<TextInput>(null);
  const { style, tokens } = useAIStyles();
  const { t } = useAIi18n();
  const resolveColor = useResolveColor();
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
        style('px-4 py-2 border-t', inputTokens.containerBackground, inputTokens.containerBorder),
      ]}>
      <View
        style={style(
          'flex-row items-end rounded-2xl px-3 py-1 border',
          inputTokens.inputBackground,
          isFocused ? 'border-iris-9' : 'border-slate-6',
        )}>
        <TextInput
          ref={inputRef}
          value={text}
          onChangeText={setText}
          placeholder={t('AI_ASSISTANT.CHAT.INPUT.PLACEHOLDER')}
          placeholderTextColor={resolveColor('text-slate-9', '#696e77')}
          style={[
            style(
              'flex-1 text-sm font-inter-normal-20 min-h-[32px] max-h-[128px]',
              inputTokens.inputText,
            ),
            { paddingTop: 6, paddingBottom: 6 },
          ]}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          multiline
          maxLength={5000}
          editable={!isLoading}
          onSubmitEditing={handleSend}
          returnKeyType="send"
          accessible
          accessibilityLabel={t('AI_ASSISTANT.CHAT.ACCESSIBILITY.INPUT')}
        />
        {isLoading && onCancel ? (
          <Pressable
            onPress={handleCancel}
            style={({ pressed }) => style('ml-2 p-1 rounded-full', pressed && 'opacity-70')}
            accessible
            accessibilityRole="button"
            accessibilityLabel={t('AI_ASSISTANT.CHAT.ACCESSIBILITY.STOP_GENERATING')}>
            <View style={style('w-7 h-7 rounded-full bg-slate-9 items-center justify-center')}>
              <View style={style('w-2.5 h-2.5 rounded-sm bg-white')} />
            </View>
          </Pressable>
        ) : (
          <View style={style('flex-row items-end')}>
            {/* Disabled voice/mic button */}
            <Pressable
              disabled
              style={style('ml-1 p-1 rounded-full opacity-50')}
              accessible
              accessibilityRole="button"
              accessibilityLabel="Voice input (coming soon)"
              accessibilityState={{ disabled: true }}>
              <View style={style('w-7 h-7 rounded-full items-center justify-center')}>
                <Mic size={16} color={resolveColor('text-slate-9', '#80838D')} strokeWidth={2} />
              </View>
            </Pressable>
            {/* Send button */}
            <Pressable
              onPress={handleSend}
              disabled={!text.trim() || isLoading}
              style={({ pressed }) =>
                style(
                  'ml-1 p-1 rounded-full',
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
                  'w-7 h-7 rounded-full items-center justify-center',
                  inputTokens.sendButton,
                )}>
                <Send size={15} color="white" strokeWidth={2} style={{ marginLeft: -1, marginTop: -0.5 }} />
              </View>
            </Pressable>
          </View>
        )}
      </View>
    </Animated.View>
  );
};
