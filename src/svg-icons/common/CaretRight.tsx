import { ChevronRight } from 'lucide-react-native';
import { useThemeColors } from '@infrastructure/theme';

interface IconProps {
  size?: number;
  color?: string;
  [key: string]: unknown;
}

/**
 * CaretRight - Proxies to Lucide ChevronRight icon
 *
 * @migrated 2026-03-01 (Cycle 2 - rollback to proxy pattern)
 * @lucide https://lucide.dev/icons/chevron-right
 */
export const CaretRight = ({ color, size = 24, ...props }: IconProps) => {
  const { colors } = useThemeColors();
  const iconColor = color || colors.slate[12];
  return <ChevronRight color={iconColor} size={size} {...props} />;
};
