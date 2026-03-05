import { KeyRound as LucideKeyRound } from 'lucide-react-native';
import { useThemeColors } from '@infrastructure/theme';

interface IconProps {
  size?: number;
  color?: string;
  [key: string]: unknown;
}

/**
 * KeyRoundIcon - Proxies to Lucide KeyRound
 *
 * @migrated 2026-03-02 (Cycle 2 Batch 5)
 * @lucide https://lucide.dev/icons/key-round
 */
export const KeyRoundIcon = ({ color, size = 40, ...props }: IconProps) => {
  const { colors } = useThemeColors();
  const iconColor = color || colors.slate[11];
  return <LucideKeyRound color={iconColor} size={size} {...props} />;
};
