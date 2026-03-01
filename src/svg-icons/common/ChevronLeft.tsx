import React from 'react';
import Svg, { Path } from 'react-native-svg';

import { IconProps } from '@domain/types';

export const ChevronLeft = ({ stroke = 'currentColor', color }: IconProps): JSX.Element => {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" color={color}>
      <Path
        d="M16 20L7 11.5L16 3"
        stroke={stroke}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};
