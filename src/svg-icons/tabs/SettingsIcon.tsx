import { Settings } from 'lucide-react-native';
import { useThemeColors } from '@infrastructure/theme';

interface IconProps {
  size?: number;
  color?: string;
  [key: string]: unknown;
}

/**
 * SettingsIcon - Proxies to Lucide Settings
 *
 * @migrated 2026-03-02 (Cycle 2 Batch 4)
 * @lucide https://lucide.dev/icons/settings
 */
export const SettingsIcon = ({ color, size = 24, ...props }: IconProps) => {
  const { colors } = useThemeColors();
  const iconColor = color || colors.slate[11];
  return <Settings color={iconColor} size={size} {...props} />;
};

/**
 * SettingsIconOutline - Proxies to Lucide Settings
 *
 * @migrated 2026-03-02 (Cycle 2 Batch 4)
 * @lucide https://lucide.dev/icons/settings
 * @deprecated Use SettingsIcon instead
 */
export const SettingsIconOutline = ({ color, size = 24, ...props }: IconProps) => {
  const { colors } = useThemeColors();
  const iconColor = color || colors.slate[11];
  return <Settings color={iconColor} size={size} {...props} />;
};

/**
 * SettingsIconFilled - Proxies to Lucide Settings
 *
 * @migrated 2026-03-02 (Cycle 2 Batch 4)
 * @lucide https://lucide.dev/icons/settings
 * @note Lucide doesn't have a filled variant, using stroke-only for consistency
 */
export const SettingsIconFilled = ({ color, size = 24, ...props }: IconProps) => {
  const { colors } = useThemeColors();
  const iconColor = color || colors.slate[11];
  return <Settings color={iconColor} size={size} {...props} />;
};
