import { ChevronDown } from 'lucide-react-native';
import { useThemeColors } from '@infrastructure/theme';

interface IconProps {
  size?: number;
  color?: string;
  [key: string]: unknown;
}

/**
 * CaretBottomSmall - Proxies to Lucide ChevronDown
 *
 * @migrated 2026-03-02 (Cycle 2 Batch 5)
 * @lucide https://lucide.dev/icons/chevron-down
 */
export const CaretBottomSmall = ({ color, size = 16, ...props }: IconProps) => {
  const { colors } = useThemeColors();
  const iconColor = color || colors.slate[11];
  return <ChevronDown color={iconColor} size={size} {...props} />;
};
