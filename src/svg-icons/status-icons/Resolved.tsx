import { CheckCircle2, Circle } from 'lucide-react-native';
import { useThemeColors } from '@infrastructure/theme';

interface IconProps {
  size?: number;
  color?: string;
  [key: string]: unknown;
}

/**
 * ResolvedIcon - Proxies to Lucide CheckCircle2
 *
 * @migrated 2026-03-02 (Cycle 2 Phase 1+2)
 * @lucide https://lucide.dev/icons/check-circle-2
 * @usage 3 files
 */
export const ResolvedIcon = ({ color, size = 24, ...props }: IconProps) => {
  const { colors } = useThemeColors();
  const iconColor = color || colors.teal[9];
  return <CheckCircle2 color={iconColor} size={size} {...props} />;
};

/**
 * ResolvedFilledIcon - Proxies to Lucide Circle (filled variant)
 *
 * @migrated 2026-03-02 (Cycle 2 Phase 1+2)
 * @lucide https://lucide.dev/icons/circle
 * @usage 1 file
 */
export const ResolvedFilledIcon = ({ color, size = 24, ...props }: IconProps) => {
  const { colors } = useThemeColors();
  const iconColor = color || colors.teal[9];
  return <Circle color={iconColor} size={size} fill={iconColor} {...props} />;
};

/**
 * SLAIcon - Proxies to Lucide Circle (custom SLA indicator)
 *
 * @migrated 2026-03-02 (Cycle 2 Phase 1+2)
 * @lucide https://lucide.dev/icons/circle
 * @usage 1 file
 */
export const SLAIcon = ({ color, size = 24, ...props }: IconProps) => {
  const { colors } = useThemeColors();
  const iconColor = color || colors.blue[9];
  return <Circle color={iconColor} size={size} {...props} />;
};
