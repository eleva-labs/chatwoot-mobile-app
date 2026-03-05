import { Mail } from 'lucide-react-native';
import { useThemeColors } from '@infrastructure/theme';

interface IconProps {
  size?: number;
  color?: string;
  [key: string]: unknown;
}

/**
 * MailFilledIcon - Proxies to Lucide Mail
 *
 * @migrated 2026-03-02 (Cycle 2 Batch 6)
 * @lucide https://lucide.dev/icons/mail
 */
export const MailFilledIcon = ({ color, size = 24, ...props }: IconProps) => {
  const { colors } = useThemeColors();
  const iconColor = color || colors.slate[8];
  return <Mail color={iconColor} size={size} {...props} />;
};
