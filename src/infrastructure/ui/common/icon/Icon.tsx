import React from 'react';
import { View, ViewStyle } from 'react-native';

import { tailwind, useThemeColors } from '@infrastructure/theme';
import { RenderPropType } from '@domain/types';
import { NamedIcon } from './NamedIcon';
import type { IconName, IconVariant } from './iconRegistry';

export interface IconComponentProps {
  /**
   * Svg Icon (JSX element) - for backward compatibility
   * @deprecated Use `name` prop instead for better DX with autocomplete
   */
  icon?: RenderPropType;
  /**
   * Icon name in kebab-case (e.g., 'attach-file', 'bot', 'conversation')
   * Provides autocomplete and type safety
   */
  name?: IconName;
  /**
   * Icon variant - 'default', 'filled', or 'outline' (if available)
   * Only used when `name` prop is provided
   * @default 'default'
   */
  variant?: IconVariant;
  /**
   * Bounding Box style for Icon
   */
  style?: ViewStyle;
  /**
   * Icon Size
   */
  size?: 10 | 12 | 16 | 20 | 24 | 32 | number | string;
  /**
   * Override the default icon color. Pass `null` to skip color injection
   * (e.g. for multi-color SVG icons or icons that already have explicit colors).
   * Defaults to `tailwind.color('text-slate-11')` — a neutral gray that works
   * in both light and dark mode.
   */
  color?: string | null;
}

// Please take icons from https://icones.js.org/collection/fluent
//
// All SVG icons accept a `color` prop forwarded to <Svg color={color}>, which
// makes `currentColor` in stroke/fill resolve to a themed value instead of black.
// This Icon wrapper injects a default color (slate-11) via cloneElement.
// Pass color={null} to skip injection for multi-color icons.
//
// NEW: Use the `name` prop for string-based icons with autocomplete:
// <Icon name="bot" size={24} />
// <Icon name="conversation" variant="filled" />
export const Icon: React.FC<Partial<IconComponentProps>> = props => {
  const { icon, name, variant, style, size, color } = props;
  const { colors } = useThemeColors();

  // If name is provided, delegate to NamedIcon (new string-based API)
  if (name) {
    const numericSize = typeof size === 'number' ? size : 24;
    return (
      <NamedIcon name={name} variant={variant} size={numericSize} color={color || undefined} />
    );
  }

  // Otherwise, use existing icon JSX behavior (backward compatibility)
  const iconAspectRatio = 1;
  const sizer = typeof size === 'number' ? `w-[${size}px]` : typeof size === 'string' ? size : '';

  // Resolve default icon color: explicit prop > slate-11 theme token
  const resolvedColor = color === null ? undefined : (color ?? colors.slate[11]);

  // Inject `color` into the SVG icon element via cloneElement so that
  // `currentColor` in react-native-svg resolves to a themed value
  let renderedIcon = icon;
  if (resolvedColor && React.isValidElement(icon)) {
    const iconProps = (icon as React.ReactElement<{ color?: string }>).props;
    // Only inject color if the icon doesn't already have an explicit color prop
    if (!iconProps.color) {
      renderedIcon = React.cloneElement(icon as React.ReactElement<{ color?: string }>, {
        color: resolvedColor,
      });
    }
  }

  return (
    <View
      style={[
        tailwind.style(sizer, 'flex items-center justify-center'),
        style,
        { aspectRatio: iconAspectRatio },
      ]}>
      {/* @ts-ignore */}
      {renderedIcon}
    </View>
  );
};
