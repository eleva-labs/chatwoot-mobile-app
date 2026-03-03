import { MailOpen } from 'lucide-react-native';
import { useThemeColors } from '@infrastructure/theme';

interface IconProps {
  size?: number;
  color?: string;
  [key: string]: unknown;
}

/**
 * MarkAsUnRead - Proxies to Lucide MailOpen
 *
 * @migrated 2026-03-02 (Cycle 2 Phase 1+2)
 * @lucide https://lucide.dev/icons/mail-open
 * @usage 4 files
 */
export const MarkAsUnRead = ({ color, size = 24, ...props }: IconProps) => {
  const { colors } = useThemeColors();
  const iconColor = color || colors.blue[9];
  return <MailOpen color={iconColor} size={size} {...props} />;
};
