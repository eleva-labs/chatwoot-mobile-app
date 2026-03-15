import React, { useState, useCallback } from 'react';
import Animated from 'react-native-reanimated';
import { LightBox, LightBoxProps } from '@alantoa/lightbox';
import { Image } from 'expo-image';
import { CircleOff } from 'lucide-react-native';
import { tailwind, textCaptionBook } from '@infrastructure/theme';
import i18n from '@infrastructure/i18n';

const AnimatedExpoImage = Animated.createAnimatedComponent(Image);

type ImageCellProps = {
  imageSrc: string;
};

type ImageContainerProps = Pick<ImageCellProps, 'imageSrc'> &
  Pick<LightBoxProps, 'width' | 'height'>;

const ImageLoadErrorPlaceholder = ({ width, height }: { width: number; height: number }) => {
  return (
    <Animated.View
      style={[
        tailwind.style('bg-slate-3 rounded-lg items-center justify-center'),
        { width, height },
      ]}>
      <CircleOff size={24} color={tailwind.color('text-slate-11')} strokeWidth={1.5} />
      <Animated.Text
        style={tailwind.style(`${textCaptionBook} tracking-[0.32px] text-slate-11 mt-2`)}>
        {i18n.t('CONVERSATION.IMAGE_LOAD_ERROR')}
      </Animated.Text>
    </Animated.View>
  );
};

export const ImageBubbleContainer = (props: ImageContainerProps) => {
  const { imageSrc, height: lightboxH, width: lightboxW } = props;
  const [hasError, setHasError] = useState(false);

  const handleError = useCallback(() => {
    setHasError(true);
  }, []);

  if (hasError) {
    return <ImageLoadErrorPlaceholder width={lightboxW ?? 300} height={lightboxH ?? 215} />;
  }

  return (
    <LightBox
      width={lightboxW}
      height={lightboxH}
      imgLayout={{ width: lightboxW, height: lightboxH }}
      tapToClose={true}>
      <AnimatedExpoImage
        source={{ uri: imageSrc }}
        contentFit="cover"
        onError={handleError}
        style={[tailwind.style('h-full w-full bg-slate-3 overflow-hidden')]}
      />
    </LightBox>
  );
};

export const ImageBubble = (props: ImageCellProps) => {
  const { imageSrc } = props;

  return (
    <React.Fragment>
      <ImageBubbleContainer {...{ imageSrc }} width={300} height={215} />
    </React.Fragment>
  );
};
