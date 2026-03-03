import { ChevronLeft as LucideChevronLeft } from 'lucide-react-native';
import { useThemeColors } from '@infrastructure/theme';

interface IconProps {
  size?: number;
  color?: string;
  [key: string]: unknown;
}

/**
 * ChevronLeft - Proxies to Lucide ChevronLeft icon
 *
 * @migrated 2026-03-01 (Cycle 2 - rollback to proxy pattern)
 * @lucide https://lucide.dev/icons/chevron-left
 */
export const ChevronLeft = ({ color, size = 24, ...props }: IconProps) => {
  const { colors } = useThemeColors();
  const iconColor = color || colors.slate[12];
  return <LucideChevronLeft color={iconColor} size={size} {...props} />;
};
