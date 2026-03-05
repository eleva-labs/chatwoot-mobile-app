import { Zap } from 'lucide-react-native';
import { useThemeColors } from '@infrastructure/theme';

interface IconProps {
  size?: number;
  color?: string;
  fill?: string;
  [key: string]: unknown;
}

/**
 * Macro - Proxies to Lucide Zap
 *
 * @migrated 2026-03-02 (Cycle 2 Batch 4)
 * @lucide https://lucide.dev/icons/zap
 * @note Using iris[9] as purple-like color (purple not in UnifiedColorScale)
 */
export const Macro = ({ color, size = 24, ...props }: IconProps) => {
  const { colors } = useThemeColors();
  const iconColor = color || colors.iris[9];
  return <Zap color={iconColor} size={size} {...props} />;
};

/**
 * MacroIcon - Proxies to Lucide Zap
 *
 * @migrated 2026-03-02 (Cycle 2 Batch 4)
 * @lucide https://lucide.dev/icons/zap
 * @deprecated Use Macro instead
 * @note Using iris[9] as purple-like color (purple not in UnifiedColorScale)
 */
export const MacroIcon = ({ color, size = 24, ...props }: IconProps) => {
  const { colors } = useThemeColors();
  const iconColor = color || colors.iris[9];
  return <Zap color={iconColor} size={size} {...props} />;
};
