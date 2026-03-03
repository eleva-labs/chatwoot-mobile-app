import { Check } from 'lucide-react-native';
import { useThemeColors } from '@infrastructure/theme';

interface IconProps {
  size?: number;
  color?: string;
  [key: string]: unknown;
}

/**
 * CheckIcon - Proxies to Lucide Check
 *
 * @migrated 2026-03-02 (Cycle 2 Batch 5)
 * @lucide https://lucide.dev/icons/check
 */
export const CheckIcon = ({ color, size = 20, ...props }: IconProps) => {
  const { colors } = useThemeColors();
  const iconColor = color || colors.teal[9];
  return <Check color={iconColor} size={size} {...props} />;
};
