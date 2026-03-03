import { Check } from 'lucide-react-native';
import { useThemeColors } from '@infrastructure/theme';

interface IconProps {
  size?: number;
  color?: string;
  [key: string]: unknown;
}

/**
 * TickIcon - Proxies to Lucide Check icon
 *
 * @migrated 2026-03-01 (Cycle 2 - rollback to proxy pattern)
 * @lucide https://lucide.dev/icons/check
 */
export const TickIcon = ({ color, size = 24, ...props }: IconProps) => {
  const { colors } = useThemeColors();
  const iconColor = color || colors.slate[12];
  return <Check color={iconColor} size={size} {...props} />;
};
