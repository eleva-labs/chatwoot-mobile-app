import { Mail as LucideMail } from 'lucide-react-native';
import { useThemeColors } from '@infrastructure/theme';

interface IconProps {
  size?: number;
  color?: string;
  stroke?: string;
  strokeWidth?: number;
  [key: string]: unknown;
}

/**
 * MailIcon - Proxies to Lucide Mail
 *
 * @migrated 2026-03-02 (Cycle 2 Batch 6)
 * @lucide https://lucide.dev/icons/mail
 */
export const MailIcon = ({ color, size = 24, strokeWidth = 1.5, ...props }: IconProps) => {
  const { colors } = useThemeColors();
  const iconColor = color || colors.blue[9];
  return <LucideMail color={iconColor} size={size} strokeWidth={strokeWidth} {...props} />;
};
