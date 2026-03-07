import React from 'react';
import { Path, Svg } from 'react-native-svg';
import { useThemeColors } from '@infrastructure/theme';

interface IconProps {
  size?: number;
  color?: string;
  [key: string]: unknown;
}

export const ApiFilledIcon = ({ color, size = 24, ...props }: IconProps) => {
  const { colors } = useThemeColors();
  const iconColor = color || colors.slate[11];
  return (
    <Svg width={size} height={size} viewBox="0 0 15 12" fill="none" {...props}>
      <Path
        d="M4.468 11.5q-1.14 0-1.776-.636-.624-.636-.624-1.632v-.996q0-.504-.12-.792a.7.7 0 0 0-.348-.408q-.24-.132-.624-.132V5.488q.384 0 .624-.12a.7.7 0 0 0 .348-.408q.12-.3.12-.804V3.16q0-.996.624-1.62.636-.636 1.776-.636h.756v1.548q-.756-.036-1.104.204-.336.24-.336.792v.828q0 .852-.42 1.332-.408.48-.972.552v.072q.564.06.972.552.42.48.42 1.332v.84q0 .552.336.816.348.252 1.104.228v1.5zm6.855 0h-.756V10q.756.024 1.092-.228.348-.264.348-.816v-.84q0-.852.408-1.332.42-.492.984-.552V6.16q-.552-.072-.972-.552t-.42-1.332v-.828q0-.552-.348-.792-.336-.24-1.092-.204V.904h.756q1.152 0 1.776.636.624.624.624 1.62v.996q0 .504.108.804.12.288.36.408t.624.12v1.416q-.384 0-.624.132a.76.76 0 0 0-.36.408q-.108.288-.108.792v.996q0 .996-.624 1.632t-1.776.636"
        fill={iconColor}
      />
    </Svg>
  );
};
