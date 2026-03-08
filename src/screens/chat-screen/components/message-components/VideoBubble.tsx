import React, { useEffect, useState } from 'react';
import { Platform, Pressable } from 'react-native';
import Animated, { Easing, FadeIn, FadeOut } from 'react-native-reanimated';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEvent } from 'expo';
import { Image } from 'expo-image';
import { tailwind } from '@infrastructure/theme';
import { Spinner } from '@infrastructure/ui/spinner';

type VideoBubbleProps = {
  videoSrc: string;
};

type VideoPlayerProps = Pick<VideoBubbleProps, 'videoSrc'> & {
  playerEnabled?: boolean;
};

export const VideoBubblePlayer = (props: VideoPlayerProps) => {
  const { videoSrc, playerEnabled = true } = props;
  const viewRef = React.useRef<InstanceType<typeof VideoView>>(null);
  const [playVideo, setPlayVideo] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const player = useVideoPlayer(videoSrc, player => {
    player.loop = false;
    player.muted = true;
  });

  const { status } = useEvent(player, 'statusChange', { status: player.status });
  const { isPlaying } = useEvent(player, 'playingChange', { isPlaying: player.playing });

  const videoLoading = status === 'loading';

  const handlePlayPress = () => {
    player.muted = false;
    player.play();
    setPlayVideo(true);
    viewRef.current?.enterFullscreen();
  };

  // Reset when video finishes playing
  useEffect(() => {
    if (
      status === 'readyToPlay' &&
      !isPlaying &&
      player.currentTime > 0 &&
      player.duration > 0 &&
      player.currentTime >= player.duration - 0.5
    ) {
      player.currentTime = 0;
      player.muted = true;
      setPlayVideo(false);
    }
  }, [isPlaying, status, player]);

  const handleFullscreenEnter = () => {
    setIsFullscreen(true);
  };

  const handleFullscreenExit = () => {
    player.pause();
    player.currentTime = 0;
    player.muted = true;
    setPlayVideo(false);
    setIsFullscreen(false);
  };

  return (
    <React.Fragment>
      <VideoView
        ref={viewRef}
        style={tailwind.style('w-full ios:h-full aspect-video')}
        player={player}
        contentFit={Platform.OS === 'android' ? 'contain' : 'cover'}
        nativeControls={isFullscreen}
        fullscreenOptions={{ enable: true }}
        onFullscreenEnter={handleFullscreenEnter}
        onFullscreenExit={handleFullscreenExit}
      />
      {videoLoading ? (
        <Animated.View style={tailwind.style('absolute inset-0 flex items-center justify-center')}>
          <Spinner size={20} />
        </Animated.View>
      ) : null}
      {!playVideo && playerEnabled ? (
        <Animated.View
          entering={FadeIn.duration(300).easing(Easing.ease)}
          exiting={FadeOut.duration(300).easing(Easing.ease)}
          style={tailwind.style('absolute inset-0 flex items-center justify-center')}>
          <Pressable
            onPress={handlePlayPress}
            style={tailwind.style('h-full w-full flex items-center justify-center')}>
            <Image
              source={require('../../../../assets/local/PlayIcon.png')} // eslint-disable-line @typescript-eslint/no-require-imports
              style={tailwind.style('h-12 w-12 z-10')}
            />
          </Pressable>
        </Animated.View>
      ) : null}
    </React.Fragment>
  );
};

export const VideoBubble = (props: VideoBubbleProps) => {
  const { videoSrc } = props;

  return (
    <React.Fragment>
      <VideoBubblePlayer
        {...{
          videoSrc,
        }}
      />
      {/* TODO: Fix this */}
      {/* <Animated.View
        pointerEvents={'none'}
        entering={FadeIn.duration(300).easing(Easing.ease)}
        exiting={FadeOut.duration(300).easing(Easing.ease)}>
        <ImageBackground
          source={require('../../../../assets/local/ImageCellTimeStampOverlay.png')}
          style={tailwind.style(
            'absolute bottom-0 right-0 h-15 w-33 z-20 ',
            shouldRenderAvatar
              ? isOutgoing
                ? 'rounded-br-none'
                : isIncoming
                  ? 'rounded-bl-none'
                  : ''
              : '',
          )}>
          <Animated.View style={tailwind.style('flex flex-row absolute right-3 bottom-[5px]')}>
            <Text
              style={tailwind.style(
                'text-xs font-inter-420-20 tracking-[0.32px] leading-[14px] text-whiteA-A12 pr-1',
              )}>
              {messageTimestamp(timeStamp)}
            </Text>
            <DeliveryStatus
              isPrivate={isPrivate}
              status={status}
              messageType={messageType}
              channel={channel}
              errorMessage={errorMessage || ''}
              sourceId={sourceId}
            />
          </Animated.View>
        </ImageBackground>
      </Animated.View> */}
    </React.Fragment>
  );
};
