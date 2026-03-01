import React from 'react';
import { Path, Svg } from 'react-native-svg';

import { IconProps } from '@domain/types';

export const CheckIcon = ({ stroke = 'currentColor', color }: IconProps): JSX.Element => {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 20 20" fill="none" color={color}>
      <Path
        d="M16.6667 5L7.50004 14.1667L3.33337 10"
        stroke={stroke}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};
