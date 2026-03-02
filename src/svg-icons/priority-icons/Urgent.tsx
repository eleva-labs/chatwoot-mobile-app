import Svg, { Mask, G, Rect, Path } from 'react-native-svg';
import { useThemeColors } from '@infrastructure/theme';

interface IconProps {
  size?: number;
  color?: string;
  [key: string]: unknown;
}

/**
 * UrgentIcon - Custom priority indicator (3 bars + exclamation)
 *
 * @migrated 2026-03-02 (Cycle 2 MEGA BATCH - theme support added)
 * @custom Unique bars + exclamation design - no Lucide equivalent
 */
export const UrgentIcon = ({ color, size = 20, ...props }: IconProps) => {
  const { colors } = useThemeColors();
  const iconColor = color || colors.ruby[11];

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Mask
        id="mask0_urgent"
        maskType="alpha"
        maskUnits="userSpaceOnUse"
        x="0"
        y="0"
        width="24"
        height="24">
        <Rect width="24" height="24" fill={iconColor} />
      </Mask>
      <G mask="url(#mask0_urgent)">
        <Rect x="4" y="12" width="4" height="8" rx="2" fill={iconColor} />
        <Rect x="10" y="8" width="4" height="12" rx="2" fill={iconColor} />
        <Path
          d="M18 20C17.45 20 16.9792 19.8042 16.5875 19.4125C16.1958 19.0208 16 18.55 16 18C16 17.45 16.1958 16.9792 16.5875 16.5875C16.9792 16.1958 17.45 16 18 16C18.55 16 19.0208 16.1958 19.4125 16.5875C19.8042 16.9792 20 17.45 20 18C20 18.55 19.8042 19.0208 19.4125 19.4125C19.0208 19.8042 18.55 20 18 20ZM18 14C17.45 14 16.9792 13.8042 16.5875 13.4125C16.1958 13.0208 16 12.55 16 12V4C16 3.45 16.1958 2.97917 16.5875 2.5875C16.9792 2.19583 17.45 2 18 2C18.55 2 19.0208 2.19583 19.4125 2.5875C19.8042 2.97917 20 3.45 20 4V12C20 12.55 19.8042 13.0208 19.4125 13.4125C19.0208 13.8042 18.55 14 18 14Z"
          fill={iconColor}
        />
      </G>
    </Svg>
  );
};
