import { PlayCircle } from 'lucide-react-native';
import { useThemeColors } from '@infrastructure/theme';

interface IconProps {
  size?: number;
  color?: string;
  stroke?: string;
  strokeOpacity?: string;
  [key: string]: unknown;
}

/**
 * PlayerIcon - Proxies to Lucide PlayCircle
 *
 * @migrated 2026-03-02 (Cycle 2 Batch 6)
 * @lucide https://lucide.dev/icons/play-circle
 */
export const PlayerIcon = ({ color, size = 24, ...props }: IconProps) => {
  const { colors } = useThemeColors();
  const iconColor = color || colors.blue[9];
  return <PlayCircle color={iconColor} size={size} {...props} />;
};
