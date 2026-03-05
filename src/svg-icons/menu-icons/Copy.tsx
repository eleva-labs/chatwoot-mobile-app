import { Copy as LucideCopy } from 'lucide-react-native';
import { useThemeColors } from '@infrastructure/theme';

interface IconProps {
  size?: number;
  color?: string;
  stroke?: string;
  [key: string]: unknown;
}

/**
 * Copy - Proxies to Lucide Copy
 *
 * @migrated 2026-03-02 (Cycle 2 Batch 4)
 * @lucide https://lucide.dev/icons/copy
 */
export const Copy = ({ color, size = 24, ...props }: IconProps) => {
  const { colors } = useThemeColors();
  const iconColor = color || colors.slate[11];
  return <LucideCopy color={iconColor} size={size} {...props} />;
};

/**
 * CopyIcon - Proxies to Lucide Copy
 *
 * @migrated 2026-03-02 (Cycle 2 Batch 4)
 * @lucide https://lucide.dev/icons/copy
 * @deprecated Use Copy instead
 */
export const CopyIcon = ({ color, size = 24, ...props }: IconProps) => {
  const { colors } = useThemeColors();
  const iconColor = color || colors.slate[11];
  return <LucideCopy color={iconColor} size={size} {...props} />;
};
