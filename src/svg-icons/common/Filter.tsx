import { ListFilter, ArrowUpDown } from 'lucide-react-native';
import { useThemeColors } from '@infrastructure/theme';

interface IconProps {
  size?: number;
  color?: string;
  [key: string]: unknown;
}

/**
 * FilterIcon - Proxies to Lucide ListFilter
 *
 * @migrated 2026-03-02 (Cycle 2 Batch 5)
 * @lucide https://lucide.dev/icons/list-filter
 * @note Original showed horizontal lines of decreasing length
 */
export const FilterIcon = ({ color, size = 24, ...props }: IconProps) => {
  const { colors } = useThemeColors();
  const iconColor = color || colors.slate[11];
  return <ListFilter color={iconColor} size={size} {...props} />;
};

/**
 * InboxFilterIcon - Proxies to Lucide ArrowUpDown
 *
 * @migrated 2026-03-02 (Cycle 2 Batch 5)
 * @lucide https://lucide.dev/icons/arrow-up-down
 * @note Original showed vertical arrows with sort indicators
 */
export const InboxFilterIcon = ({ color, size = 24, ...props }: IconProps) => {
  const { colors } = useThemeColors();
  const iconColor = color || colors.slate[11];
  return <ArrowUpDown color={iconColor} size={size} {...props} />;
};
