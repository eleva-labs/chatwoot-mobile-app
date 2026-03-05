import { Info as LucideInfo } from 'lucide-react-native';
import { useThemeColors } from '@infrastructure/theme';

interface IconProps {
  size?: number;
  color?: string;
  fill?: string;
  [key: string]: unknown;
}

/**
 * Info - Proxies to Lucide Info
 *
 * @migrated 2026-03-02 (Cycle 2 Batch 4)
 * @lucide https://lucide.dev/icons/info
 */
export const Info = ({ color, size = 24, ...props }: IconProps) => {
  const { colors } = useThemeColors();
  const iconColor = color || colors.blue[9];
  return <LucideInfo color={iconColor} size={size} {...props} />;
};

/**
 * InfoIcon - Proxies to Lucide Info
 *
 * @migrated 2026-03-02 (Cycle 2 Batch 4)
 * @lucide https://lucide.dev/icons/info
 * @deprecated Use Info instead
 */
export const InfoIcon = ({ color, size = 24, ...props }: IconProps) => {
  const { colors } = useThemeColors();
  const iconColor = color || colors.blue[9];
  return <LucideInfo color={iconColor} size={size} {...props} />;
};
