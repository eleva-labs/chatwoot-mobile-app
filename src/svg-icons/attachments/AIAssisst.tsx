import { Sparkles } from 'lucide-react-native';
import { useThemeColors } from '@infrastructure/theme';

interface IconProps {
  size?: number;
  color?: string;
  [key: string]: unknown;
}

/**
 * AIAssisst - Proxies to Lucide Sparkles
 *
 * @migrated 2026-03-02 (Cycle 2 Batch 6)
 * @lucide https://lucide.dev/icons/sparkles
 */
export const AIAssisst = ({ color, size = 24, ...props }: IconProps) => {
  const { colors } = useThemeColors();
  const iconColor = color || colors.iris[9];
  return <Sparkles color={iconColor} size={size} {...props} />;
};
