import React from 'react';
import { Path, Svg } from 'react-native-svg';
import { useThemeColors } from '@infrastructure/theme';

interface IconProps {
  size?: number;
  color?: string;
  [key: string]: unknown;
}

export const TelegramIcon = ({ color, size = 24, ...props }: IconProps) => {
  const { colors } = useThemeColors();
  const iconColor = color || colors.slate[11];
  return (
    <Svg width={size} height={size} viewBox="0 0 14 12" fill="none" {...props}>
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12.185.287A1 1 0 0 1 13.56 1.37l-1.513 9.171c-.146.884-1.117 1.392-1.928.951a39 39 0 0 1-2.594-1.53c-.453-.296-1.841-1.245-1.67-1.921C6 7.464 8.332 5.292 9.666 4c.524-.507.285-.8-.334-.333C7.8 4.826 5.336 6.587 4.521 7.083c-.719.438-1.094.512-1.542.438a10.2 10.2 0 0 1-2.194-.604c-.836-.346-.795-1.496 0-1.83z"
        fill={iconColor}
      />
    </Svg>
  );
};

export const TelegramFilledIcon = TelegramIcon;
