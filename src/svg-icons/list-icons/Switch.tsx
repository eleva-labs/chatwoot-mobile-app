import { Repeat } from 'lucide-react-native';
import { useThemeColors } from '@infrastructure/theme';

interface IconProps {
  size?: number;
  color?: string;
  stroke?: string;
  [key: string]: unknown;
}

/**
 * Switch - Proxies to Lucide Repeat
 *
 * @migrated 2026-03-02 (Cycle 2 Batch 4)
 * @lucide https://lucide.dev/icons/repeat
 */
export const Switch = ({ color, size = 24, ...props }: IconProps) => {
  const { colors } = useThemeColors();
  const iconColor = color || colors.blue[9];
  return <Repeat color={iconColor} size={size} {...props} />;
};

/**
 * SwitchIcon - Proxies to Lucide Repeat
 *
 * @migrated 2026-03-02 (Cycle 2 Batch 4)
 * @lucide https://lucide.dev/icons/repeat
 * @deprecated Use Switch instead
 */
export const SwitchIcon = ({ color, size = 24, ...props }: IconProps) => {
  const { colors } = useThemeColors();
  const iconColor = color || colors.blue[9];
  return <Repeat color={iconColor} size={size} {...props} />;
};
