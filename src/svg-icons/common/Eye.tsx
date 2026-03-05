import { Eye as LucideEye } from 'lucide-react-native';
import { useThemeColors } from '@infrastructure/theme';

interface IconProps {
  size?: number;
  color?: string;
  [key: string]: unknown;
}

/**
 * EyeIcon - Proxies to Lucide Eye
 *
 * @migrated 2026-03-02 (Cycle 2 Batch 5)
 * @lucide https://lucide.dev/icons/eye
 */
export const EyeIcon = ({ color, size = 17, ...props }: IconProps) => {
  const { colors } = useThemeColors();
  const iconColor = color || colors.slate[11];
  return <LucideEye color={iconColor} size={size} {...props} />;
};
