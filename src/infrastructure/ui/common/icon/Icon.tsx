/* eslint-disable @typescript-eslint/ban-ts-comment */
import React from 'react';
import { View, ViewStyle } from 'react-native';

import { tailwind } from '@infrastructure/theme';
import { RenderPropType } from '@domain/types';

export interface IconComponentProps {
  /**
   * Svg Icon
   */
  icon: RenderPropType;
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
export const Icon: React.FC<Partial<IconComponentProps>> = props => {
  const { icon, style, size, color } = props;
  const iconAspectRatio = 1;
  const sizer = typeof size === 'number' ? `w-[${size}px]` : typeof size === 'string' ? size : '';

  // Resolve default icon color: explicit prop > slate-11 > fallback hex
  const resolvedColor =
    color === null ? undefined : (color ?? tailwind.color('text-slate-11') ?? '#6B7280');

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
    <View style={[tailwind.style(sizer), style, { aspectRatio: iconAspectRatio }]}>
      {/* @ts-ignore */}
      {renderedIcon}
    </View>
  );
};
