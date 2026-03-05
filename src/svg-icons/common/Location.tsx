import { MapPin, Map } from 'lucide-react-native';
import { useThemeColors } from '@infrastructure/theme';

interface IconProps {
  size?: number;
  color?: string;
  [key: string]: unknown;
}

/**
 * LocationIcon - Proxies to Lucide MapPin
 *
 * @migrated 2026-03-02 (Cycle 2 Phase 1+2)
 * @lucide https://lucide.dev/icons/map-pin
 * @usage 3 files
 */
export const LocationIcon = ({ color, size = 24, ...props }: IconProps) => {
  const { colors } = useThemeColors();
  const iconColor = color || colors.ruby[9];
  return <MapPin color={iconColor} size={size} {...props} />;
};

/**
 * MapIcon - Proxies to Lucide Map
 *
 * @migrated 2026-03-02 (Cycle 2 Phase 1+2)
 * @lucide https://lucide.dev/icons/map
 * @usage 1 file
 */
export const MapIcon = ({ color, size = 24, ...props }: IconProps) => {
  const { colors } = useThemeColors();
  const iconColor = color || colors.blue[9];
  return <Map color={iconColor} size={size} {...props} />;
};
