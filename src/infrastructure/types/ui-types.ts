import { PathProps } from 'react-native-svg';
import type { JSX } from 'react';

export type IconProps = PathProps & {
  /**
   * Color prop forwarded to the root <Svg> element.
   * When set, `currentColor` in stroke/fill attributes resolves to this value
   * instead of falling back to black in React Native.
   */
  color?: string;
};

export interface GenericListType {
  key?: string;
  title?: string;
  icon?: React.ReactNode;
  subtitle?: string;
  subtitleType?: 'dark' | 'light';
  hasChevron?: boolean;
  disabled?: boolean;
  link?: string;
  onPressListItem?: (key?: string) => void;
  actions?: {
    actionName: string;
    actionParams: string[];
  }[];
}

export interface AttributeListType {
  key?: string;
  title?: string;
  icon?: React.ReactNode;
  subtitle?: string;
  subtitleType?: 'dark' | 'light';
  hasChevron?: boolean;
  disabled?: boolean;
  type: 'text' | 'date' | 'checkbox' | 'link';
}

export type RenderPropType<T = unknown> =
  | React.ReactNode
  | ((args: T) => JSX.Element | React.ReactNode);
