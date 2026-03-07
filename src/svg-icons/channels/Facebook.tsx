import React from 'react';
import { Path, Svg } from 'react-native-svg';
import { useThemeColors } from '@infrastructure/theme';

interface IconProps {
  size?: number;
  color?: string;
  [key: string]: unknown;
}

export const InstagramFilledIcon = ({ color, size = 24, ...props }: IconProps) => {
  const { colors } = useThemeColors();
  const iconColor = color || colors.slate[11];
  return (
    <Svg width={size} height={size} viewBox="0 0 12 12" fill="none" {...props}>
      <Path
        d="M8.667 0A3.333 3.333 0 0 1 12 3.333v5.334A3.333 3.333 0 0 1 8.667 12H3.333A3.333 3.333 0 0 1 0 8.667V3.333A3.333 3.333 0 0 1 3.333 0zM6 3.333a2.667 2.667 0 1 0 0 5.334 2.667 2.667 0 0 0 0-5.334m0 1.334a1.333 1.333 0 1 1 0 2.666 1.333 1.333 0 0 1 0-2.666m3-2.334a.667.667 0 1 0 0 1.334.667.667 0 0 0 0-1.334"
        fill={iconColor}
      />
    </Svg>
  );
};

export const MessengerFilledIcon = ({ color, size = 24, ...props }: IconProps) => {
  const { colors } = useThemeColors();
  const iconColor = color || colors.slate[11];
  return (
    <Svg width={size} height={size} viewBox="0 0 14 14" fill="none" {...props}>
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M.333 7a6.667 6.667 0 1 1 3.221 5.709l-2.033.597a.667.667 0 0 1-.827-.827l.598-2.033A6.64 6.64 0 0 1 .333 7M5.53 5.53c.26-.26.682-.26.942 0L8 7.057 9.529 5.53a.667.667 0 1 1 .942.943l-2 2a.667.667 0 0 1-.942 0L6 6.943 4.471 8.472a.667.667 0 1 1-.942-.943z"
        fill={iconColor}
      />
    </Svg>
  );
};

export const FacebookIcon = MessengerFilledIcon;
export const FacebookFilledIcon = MessengerFilledIcon;
