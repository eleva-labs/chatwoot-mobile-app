import React, { useMemo } from 'react';
import { SafeAreaView, View, Text, Pressable, ScrollView } from 'react-native';
import { tailwind } from '@/theme';

interface ErrorBoundaryScreenProps {
  error?: unknown;
  onRetry?: () => void;
}

export function ErrorBoundaryScreen({ error, onRetry }: ErrorBoundaryScreenProps) {
  const errorMessage = useMemo(() => {
    if (!error) return undefined;
    if (error instanceof Error) return error.message;
    try {
      return typeof error === 'string' ? error : JSON.stringify(error);
    } catch {
      return String(error);
    }
  }, [error]);

  function handleRestart() {
    if (onRetry) onRetry();
  }

  return (
    <SafeAreaView style={tailwind.style('flex-1 bg-solid-1')}>
      <View style={tailwind.style('flex-1 items-center justify-center px-6')}>
        <Text style={tailwind.style('text-xl font-inter-580-24 text-slate-12 mb-2')}>
          Something went wrong
        </Text>
        <Text style={tailwind.style('text-slate-11 text-center mb-4')}>
          An unexpected error occurred. You can try restarting the app.
        </Text>
        {errorMessage ? (
          <ScrollView
            style={tailwind.style('max-h-40 w-full mb-4')}
            contentContainerStyle={tailwind.style('p-3')}>
            <Text selectable style={tailwind.style('text-xs text-ruby-11')}>
              {errorMessage}
            </Text>
          </ScrollView>
        ) : null}
        <View style={tailwind.style('flex-row gap-3')}>
          <Pressable
            accessibilityRole="button"
            onPress={handleRestart}
            style={tailwind.style('bg-iris-9 rounded-lg px-4 py-2')}>
            <Text style={tailwind.style('text-white font-inter-medium-24')}>Restart app</Text>
          </Pressable>
          {onRetry ? (
            <Pressable
              accessibilityRole="button"
              onPress={onRetry}
              style={tailwind.style('bg-slate-3 rounded-lg px-4 py-2')}>
              <Text style={tailwind.style('text-slate-12')}>Try again</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </SafeAreaView>
  );
}
export default ErrorBoundaryScreen;
