/**
 * Type declarations for ImageBubble components
 * React Native will automatically load the correct platform-specific file
 * (.ios.tsx or .android.tsx) at runtime.
 */

import React from 'react';

type ImageCellProps = {
  imageSrc: string;
};

type ImageContainerProps = Pick<ImageCellProps, 'imageSrc'> & {
  width?: number;
  height?: number;
};

export declare const ImageBubbleContainer: React.FC<ImageContainerProps>;
export declare const ImageBubble: React.FC<ImageCellProps>;
