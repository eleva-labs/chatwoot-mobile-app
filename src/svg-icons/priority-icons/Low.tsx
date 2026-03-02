import Svg, { Mask, G, Rect } from 'react-native-svg';
import { useThemeColors } from '@infrastructure/theme';

interface IconProps {
  size?: number;
  color?: string;
  [key: string]: unknown;
}

/**
 * LowIcon - Custom priority indicator (1 bar)
 *
 * @migrated 2026-03-02 (Cycle 2 MEGA BATCH - theme support added)
 * @custom Unique 1-bar design - no Lucide equivalent
 */
export const LowIcon = ({ color, size = 20, ...props }: IconProps) => {
  const { colors } = useThemeColors();
  const activeColor = color || colors.blue[9];
  const inactiveColor = colors.slate[6];

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Mask
        id="mask0_low"
        maskType="alpha"
        maskUnits="userSpaceOnUse"
        x="0"
        y="0"
        width="24"
        height="24">
        <Rect width="24" height="24" fill={activeColor} />
      </Mask>
      <G mask="url(#mask0_low)">
        <Rect x="4" y="12" width="4" height="8" rx="2" fill={activeColor} />
        <Rect x="10" y="8" width="4" height="12" rx="2" fill={inactiveColor} />
        <Rect x="16" y="4" width="4" height="16" rx="2" fill={inactiveColor} />
      </G>
    </Svg>
  );
};
