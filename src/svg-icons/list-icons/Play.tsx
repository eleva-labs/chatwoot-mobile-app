import { PlayCircle } from 'lucide-react-native';
import { useThemeColors } from '@infrastructure/theme';

interface IconProps {
  size?: number;
  color?: string;
  [key: string]: unknown;
}

/**
 * PlayIcon - Proxies to Lucide PlayCircle
 *
 * @migrated 2026-03-02 (Cycle 2 Phase 1+2)
 * @lucide https://lucide.dev/icons/play-circle
 * @usage 7 files
 */
export const PlayIcon = ({ color, size = 24, ...props }: IconProps) => {
  const { colors } = useThemeColors();
  const iconColor = color || colors.blue[9];
  return <PlayCircle color={iconColor} size={size} {...props} />;
};
