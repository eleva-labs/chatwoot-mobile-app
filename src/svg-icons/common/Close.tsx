import React from 'react';
import Svg, { Path } from 'react-native-svg';

import { IconProps } from '@domain/types';

export const CloseIcon = ({ stroke = 'currentColor', color }: IconProps): JSX.Element => {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" color={color}>
      <Path
        d="M18 6L6 18M6 6L18 18"
        stroke={stroke}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};
