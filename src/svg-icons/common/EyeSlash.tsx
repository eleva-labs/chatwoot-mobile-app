import { EyeOff } from 'lucide-react-native';
import { useThemeColors } from '@infrastructure/theme';

interface IconProps {
  size?: number;
  color?: string;
  [key: string]: unknown;
}

/**
 * EyeSlash - Proxies to Lucide EyeOff
 *
 * @migrated 2026-03-02 (Cycle 2 Batch 5)
 * @lucide https://lucide.dev/icons/eye-off
 */
export const EyeSlash = ({ color, size = 16, ...props }: IconProps) => {
  const { colors } = useThemeColors();
  const iconColor = color || colors.slate[11];
  return <EyeOff color={iconColor} size={size} {...props} />;
};
