import React, { useState, useCallback, useRef } from 'react';
import { View, TextInput, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { fetch as expoFetch } from 'expo/fetch';
import { generateAPIUrl } from '../../../utils';

import { tailwind } from '@/theme';
import { Icon } from '@/components-next/common';
import { CloseIcon, SendIcon } from '@/svg-icons';
import { useHaptic } from '@/utils';

type AIChatModalProps = {
  visible: boolean;
  onClose: () => void;
  conversationContext?: string;
};

type MessagePart = {
  type: string;
  text?: string;
  result?: unknown;
};

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  parts?: MessagePart[];
};

type MessageItemProps = {
  message: ChatMessage;
  index: number;
};

const MessageItem = ({ message }: MessageItemProps) => {
  const isUser = message.role === 'user';

  return (
    <Animated.View
      entering={FadeIn.delay(100)}
      style={tailwind.style('mb-4 px-4', isUser ? 'items-end' : 'items-start')}
    >
      <View
        style={tailwind.style(
          'max-w-[80%] px-4 py-3 rounded-2xl',
          isUser ? 'bg-blue-600 rounded-br-md' : 'bg-gray-100 rounded-bl-md',
        )}
      >
        {message.parts?.map((part: MessagePart, i: number) => {
          switch (part.type) {
            case 'text':
              return (
                <Animated.Text
                  key={`${message.id}-${i}`}
                  style={tailwind.style(
                    'text-base font-inter-normal-20 leading-6',
                    isUser ? 'text-white' : 'text-gray-900',
                  )}
                >
                  {part.text}
                </Animated.Text>
              );
            case 'tool-weather':
            case 'tool-convertFahrenheitToCelsius':
              return (
                <View key={`${message.id}-${i}`} style={tailwind.style('mt-2')}>
                  <Animated.Text
                    style={tailwind.style(
                      'text-sm font-inter-medium-24 mb-2',
                      isUser ? 'text-blue-100' : 'text-gray-700',
                    )}
                  >
                    {part.type === 'tool-weather' ? '🌤️ Weather:' : '🌡️ Temperature:'}
                  </Animated.Text>
                  <Animated.Text
                    style={tailwind.style(
                      'text-sm font-inter-normal-20',
                      isUser ? 'text-white' : 'text-gray-800',
                    )}
                  >
                    {JSON.stringify(part.result, null, 2)}
                  </Animated.Text>
                </View>
              );
            default:
              return null;
          }
        })}
      </View>
    </Animated.View>
  );
};

export const AIChatModal = ({ visible, onClose, conversationContext }: AIChatModalProps) => {
  const [input, setInput] = useState('');
  const haptic = useHaptic('selection');
  const inputRef = useRef<TextInput>(null);

  const { messages, error, sendMessage } = useChat({
    transport: new DefaultChatTransport({
      fetch: expoFetch as unknown as typeof globalThis.fetch,
      api: generateAPIUrl('/api/ai-chat'),
    }),
    onError: error => {
      console.error('AI Chat Error:', error);
    },
  });

  const handleSend = useCallback(() => {
    if (!input.trim()) return;

    haptic?.();
    sendMessage({ text: input.trim() });
    setInput('');
  }, [input, sendMessage, haptic]);

  const handleClose = useCallback(() => {
    haptic?.();
    onClose();
  }, [onClose, haptic]);

  const renderMessage = useCallback(
    ({ item, index }: { item: ChatMessage; index: number }) => (
      <MessageItem message={item} index={index} />
    ),
    [],
  );

  if (!visible) return null;

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(200)}
      style={tailwind.style('absolute inset-0 bg-black/50 z-50')}
    >
      <Animated.View
        entering={SlideInDown.springify().damping(15).stiffness(150)}
        exiting={SlideOutDown.springify().damping(15).stiffness(150)}
        style={tailwind.style('flex-1 mt-20 bg-white rounded-t-3xl overflow-hidden')}
      >
        <SafeAreaView edges={['top']} style={tailwind.style('flex-1')}>
          {/* Header */}
          <View
            style={tailwind.style(
              'flex-row items-center justify-between px-6 py-4 border-b border-gray-200',
            )}
          >
            <View>
              <Animated.Text style={tailwind.style('text-lg font-inter-semibold-20 text-gray-900')}>
                AI Assistant
              </Animated.Text>
              <Animated.Text style={tailwind.style('text-sm font-inter-normal-20 text-gray-600')}>
                How can I help you today?
              </Animated.Text>
            </View>

            <Pressable onPress={handleClose} style={tailwind.style('p-2')}>
              <Icon icon={<CloseIcon />} size={24} />
            </Pressable>
          </View>

          {/* Messages */}
          <View style={tailwind.style('flex-1')}>
            {messages.length === 0 ? (
              <View style={tailwind.style('flex-1 items-center justify-center px-6')}>
                <Animated.Text
                  entering={FadeIn.delay(300)}
                  style={tailwind.style('text-center text-gray-500 font-inter-normal-20 leading-6')}
                >
                  👋 Hi! I'm your AI assistant.{'\n\n'}I can help you with:
                  {'\n'}• Weather information
                  {'\n'}• Temperature conversions
                  {'\n'}• General questions
                </Animated.Text>
              </View>
            ) : (
              <FlashList
                data={messages}
                renderItem={renderMessage}
                estimatedItemSize={100}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={tailwind.style('py-4')}
              />
            )}
          </View>

          {/* Input */}
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={tailwind.style('px-4 pb-4 pt-2 border-t border-gray-200')}
          >
            <View style={tailwind.style('flex-row items-end space-x-3')}>
              <TextInput
                ref={inputRef}
                value={input}
                onChangeText={setInput}
                placeholder="Ask me about the weather..."
                placeholderTextColor={tailwind.color('text-gray-400')}
                multiline
                maxLength={500}
                style={tailwind.style(
                  'flex-1 min-h-[44px] max-h-[120px] px-4 py-3 bg-gray-50 rounded-2xl text-base font-inter-normal-20 text-gray-900',
                )}
                onSubmitEditing={handleSend}
                blurOnSubmit={false}
              />

              <Pressable
                onPress={handleSend}
                disabled={!input.trim()}
                style={tailwind.style(
                  'w-11 h-11 bg-blue-600 rounded-full items-center justify-center',
                  !input.trim() && 'opacity-50',
                )}
              >
                <Icon icon={<SendIcon />} size={20} />
              </Pressable>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Animated.View>
    </Animated.View>
  );
};
