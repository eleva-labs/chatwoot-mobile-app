import { Globe } from 'lucide-react-native';
import { useThemeColors } from '@infrastructure/theme';

interface IconProps {
  size?: number;
  color?: string;
  [key: string]: unknown;
}

/**
 * WebsiteIcon - Proxies to Lucide Globe
 *
 * @migrated 2026-03-02 (Cycle 2 Batch 6)
 * @lucide https://lucide.dev/icons/globe
 */
export const WebsiteIcon = ({ color, size = 24, ...props }: IconProps) => {
  const { colors } = useThemeColors();
  const iconColor = color || colors.iris[9];
  return <Globe color={iconColor} size={size} {...props} />;
};

/**
 * WebsiteFilledIcon - Proxies to Lucide Globe (muted variant)
 *
 * @migrated 2026-03-02 (Cycle 2 Batch 6)
 * @lucide https://lucide.dev/icons/globe
 */
export const WebsiteFilledIcon = ({ color, size = 24, ...props }: IconProps) => {
  const { colors } = useThemeColors();
  const iconColor = color || colors.slate[8];
  return <Globe color={iconColor} size={size} {...props} />;
};
