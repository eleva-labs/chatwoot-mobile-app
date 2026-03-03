import { Sparkles } from 'lucide-react-native';
import { useThemeColors } from '@infrastructure/theme';

interface AIOnIconProps {
  size?: number;
  color?: string;
  [key: string]: unknown;
}

/**
 * AIOnIcon - Proxies to Lucide Sparkles
 *
 * @migrated 2026-03-02 (Cycle 2 Batch 5)
 * @lucide https://lucide.dev/icons/sparkles
 * @note Original used brand color #732fff, now uses iris[9] from Radix
 */
export const AIOnIcon = ({ color, size = 16, ...props }: AIOnIconProps) => {
  const { colors } = useThemeColors();
  const iconColor = color || colors.iris[9];
  return <Sparkles color={iconColor} size={size} {...props} />;
};
