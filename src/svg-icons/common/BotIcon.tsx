import { Bot } from 'lucide-react-native';
import { useThemeColors } from '@infrastructure/theme';

interface BotIconProps {
  size?: number;
  color?: string;
  [key: string]: unknown;
}

/**
 * BotIcon - Proxies to Lucide Bot
 *
 * @migrated 2026-03-02 (Cycle 2 Batch 5)
 * @lucide https://lucide.dev/icons/bot
 */
export const BotIcon = ({ color, size = 24, ...props }: BotIconProps) => {
  const { colors } = useThemeColors();
  const iconColor = color || colors.iris[9];
  return <Bot color={iconColor} size={size} {...props} />;
};
