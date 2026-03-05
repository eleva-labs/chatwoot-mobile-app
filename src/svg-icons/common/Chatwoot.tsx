import React from 'react';
import { Path, Svg } from 'react-native-svg';
import { useThemeColors } from '@infrastructure/theme';

interface IconProps {
  size?: number;
  color?: string;
  stroke?: string;
  strokeWidth?: number;
  [key: string]: unknown;
}

/**
 * ChatwootIcon - Custom brand logo SVG with theme support
 *
 * @migrated 2026-03-02 (Cycle 2 Batch 6 Final)
 * @custom-svg Brand logo - preserved custom SVG implementation
 */
export const ChatwootIcon = ({
  stroke,
  strokeWidth = 1.5,
  color,
  ...props
}: IconProps): JSX.Element => {
  const { colors } = useThemeColors();
  const iconStroke = stroke || colors.slate[11];

  return (
    <Svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" color={color} {...props}>
      <Path
        d="M21 20.5H11.9993C7.03775 20.5 3 16.462 3 11.4992C3 6.53803 7.03775 2.5 11.9994 2.5C16.9622 2.5 21 6.53803 21 11.4992V20.5Z"
        stroke={iconStroke}
        strokeWidth={strokeWidth}
      />
    </Svg>
  );
};
