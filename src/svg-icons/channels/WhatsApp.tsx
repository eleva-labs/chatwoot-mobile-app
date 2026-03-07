import React from 'react';
import { Path, Svg } from 'react-native-svg';
import { useThemeColors } from '@infrastructure/theme';

interface IconProps {
  size?: number;
  color?: string;
  [key: string]: unknown;
}

export const WhatsAppIcon = ({ color, size = 24, ...props }: IconProps) => {
  const { colors } = useThemeColors();
  const iconColor = color || colors.slate[11];
  return (
    <Svg width={size} height={size} viewBox="0 0 14 14" fill="none" {...props}>
      <Path
        d="M7 .333A6.667 6.667 0 1 1 3.554 12.71l-2.02.594a.673.673 0 0 1-.836-.836l.593-2.021A6.667 6.667 0 0 1 7 .334M5.524 3.84a.46.46 0 0 0-.456-.05 1.86 1.86 0 0 0-1.072 1.258l-.004.02c-.026.101-.047.22-.042.35.016.455.194 1.743 1.543 3.091 1.347 1.348 2.634 1.527 3.09 1.543.13.005.249-.017.35-.042l.023-.006a1.85 1.85 0 0 0 1.254-1.067.47.47 0 0 0-.06-.469c-.355-.455-.832-.784-1.256-1.077l-.085-.058a.474.474 0 0 0-.649.105l-.4.61a.153.153 0 0 1-.203.05 5 5 0 0 1-.951-.703 4.4 4.4 0 0 1-.671-.915.15.15 0 0 1 .045-.194l.615-.457a.474.474 0 0 0 .081-.626l-.09-.133c-.28-.413-.607-.898-1.062-1.23"
        fill={iconColor}
      />
    </Svg>
  );
};

export const WhatsAppFilledIcon = WhatsAppIcon;

export const SMSFilledIcon = ({ color, size = 24, ...props }: IconProps) => {
  const { colors } = useThemeColors();
  const iconColor = color || colors.slate[11];
  return (
    <Svg width={size} height={size} viewBox="0 0 14 12" fill="none" {...props}>
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M.333 2a2 2 0 0 1 2-2h9.334a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-1.448a.67.67 0 0 0-.472.195L8.414 11.53a2 2 0 0 1-2.828 0l-1.333-1.334A.67.67 0 0 0 3.78 10H2.333a2 2 0 0 1-2-2zm3.334.667a.667.667 0 1 0 0 1.333h6.666a.667.667 0 1 0 0-1.333zm0 2.666a.667.667 0 1 0 0 1.334H7a.667.667 0 1 0 0-1.334z"
        fill={iconColor}
      />
    </Svg>
  );
};
