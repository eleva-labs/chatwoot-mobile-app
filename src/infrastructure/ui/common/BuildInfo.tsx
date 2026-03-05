import React from 'react';
import * as Application from 'expo-application';
import Animated from 'react-native-reanimated';
import { useThemedStyles } from '@infrastructure/hooks';

export const BuildInfo: React.FC = () => {
  const themedTailwind = useThemedStyles();
  const appVersion = Application.nativeApplicationVersion;
  const buildNumber = Application.nativeBuildVersion;
  const bundleId = Application.applicationId;
  const isProd = bundleId === 'com.chatscommerce.app';

  const versionText = `Version: ${appVersion}${isProd ? '' : ' (dev)'}`;
  const text = buildNumber ? `${versionText}  •  Build Number: ${buildNumber}` : versionText;

  return (
    <Animated.Text style={themedTailwind.style('text-sm text-slate-11')}>{text}</Animated.Text>
  );
};
