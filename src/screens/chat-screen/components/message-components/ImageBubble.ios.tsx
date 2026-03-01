import React, { useState, useCallback } from 'react';
import { Image } from 'expo-image';
import Animated from 'react-native-reanimated';
import { Galeria } from '@nandorojo/galeria';
import { CircleOff } from 'lucide-react-native';
import { tailwind } from '@/theme';
import i18n from '@/i18n';

type ImageCellProps = {
  imageSrc: string;
};

type ImageContainerProps = Pick<ImageCellProps, 'imageSrc'> & {
  width?: number;
  height?: number;
};

const ImageLoadErrorPlaceholder = ({ width, height }: { width: number; height: number }) => {
  return (
    <Animated.View
      style={[
        tailwind.style('bg-slate-3 rounded-lg items-center justify-center'),
        { width, height },
      ]}>
      <CircleOff size={24} color={tailwind.color('text-slate-11')} strokeWidth={1.5} />
      <Animated.Text
        style={tailwind.style('text-xs font-inter-420-20 tracking-[0.32px] text-slate-11 mt-2')}>
        {i18n.t('CONVERSATION.IMAGE_LOAD_ERROR')}
      </Animated.Text>
    </Animated.View>
  );
};

export const ImageBubbleContainer = (props: ImageContainerProps) => {
  const { imageSrc, height = 215, width = 400 } = props;
  const [hasError, setHasError] = useState(false);

  const handleError = useCallback(() => {
    setHasError(true);
  }, []);

  if (hasError) {
    return <ImageLoadErrorPlaceholder width={width} height={height} />;
  }

  return (
    <Galeria urls={[imageSrc]}>
      <Galeria.Image>
        <Image
          source={{ uri: imageSrc }}
          contentFit="cover"
          onError={handleError}
          style={[
            tailwind.style('h-full w-full bg-slate-3 overflow-hidden'),
            { width: width, height: height },
          ]}
        />
      </Galeria.Image>
    </Galeria>
  );
};

export const ImageBubble = (props: ImageCellProps) => {
  const { imageSrc } = props;

  return (
    <React.Fragment>
      <ImageBubbleContainer {...{ imageSrc }} />
    </React.Fragment>
  );
};
