import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { useThemeColors } from '@infrastructure/theme';

interface IconProps {
  size?: number;
  color?: string;
  stroke?: string;
  [key: string]: unknown;
}

/**
 * EmptyStateIcon - Custom illustration SVG with theme support
 *
 * @migrated 2026-03-02 (Cycle 2 Batch 6 Final)
 * @custom-svg Empty state illustration - preserved custom SVG implementation
 */
export const EmptyStateIcon = ({ stroke, color, ...props }: IconProps) => {
  const { colors } = useThemeColors();
  const iconStroke = stroke || colors.slate[11];

  return (
    <Svg width="74" height="44" viewBox="0 0 74 44" fill="none" color={color} {...props}>
      <Path
        d="M31 43H15.9988C7.72958 43 1 36.27 1 27.9987C1 19.7301 7.72958 13 15.9989 13C24.2704 13 31 19.7301 31 27.9987V43Z"
        stroke={iconStroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M50 43H30.9985C20.5241 43 12 34.4753 12 23.9983C12 13.5247 20.5241 5 30.9987 5C41.4759 5 50 13.5247 50 23.9983V43Z"
        stroke={iconStroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M31 43H52.0017C63.5786 43 73 33.5779 73 21.9981C73 10.4221 63.5786 1 52.0015 1C40.4214 1 31 10.4221 31 21.9981V43Z"
        stroke={iconStroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};
