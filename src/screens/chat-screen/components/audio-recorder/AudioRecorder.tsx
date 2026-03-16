import React, { useEffect, useState } from 'react';
import { Alert, Dimensions, Platform, Pressable } from 'react-native';
import {
  useAudioRecorder,
  useAudioRecorderState,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  RecordingOptions,
  IOSOutputFormat,
  AudioQuality,
} from 'expo-audio';
import Animated from 'react-native-reanimated';
import isUndefined from 'lodash/isUndefined';
import * as Sentry from '@sentry/react-native';
import ReactNativeBlobUtil from 'react-native-blob-util';
import { ArrowUp } from 'lucide-react-native';
import { Trash } from '@/svg-icons/common/Trash';

import { snappySlideInDown, snappySlideOutDown } from '@infrastructure/animation';
import { TEXT_INPUT_CONTAINER_HEIGHT } from '@domain/constants';
import { useChatWindowContext } from '@infrastructure/context';
import { useThemedStyles } from '@infrastructure/hooks';
import i18n from '@infrastructure/i18n';
import { useThemeColors } from '@infrastructure/theme';
import { Icon } from '@infrastructure/ui';
import { useScaleAnimation } from '@infrastructure/utils';
import { PauseIcon, PlayIcon } from '../message-components';
import { useAppDispatch, useAppSelector } from '@application/store/hooks';
import {
  addNewCachePath,
  selectLocalRecordedAudioCacheFilePaths,
} from '@application/store/conversation/localRecordedAudioCacheSlice';
import { convertAacToWav } from '@infrastructure/utils/audioConverter';

const RecorderSegmentWidth = Dimensions.get('screen').width - 8 - 80 - 12;

const RECORDING_OPTIONS: RecordingOptions = {
  extension: '.m4a',
  sampleRate: 44100,
  numberOfChannels: 2,
  bitRate: 128000,
  isMeteringEnabled: false,
  android: {
    audioSource: 'mic',
    outputFormat: 'aac_adts',
    audioEncoder: 'aac',
    sampleRate: 16000, // Match current Android config
    extension: '.aac',
  },
  ios: {
    outputFormat: IOSOutputFormat.MPEG4AAC,
    audioQuality: AudioQuality.MAX,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
  web: {
    mimeType: 'audio/webm',
    bitsPerSecond: 128000,
  },
};

/**
 * The function `millisecondsToTimeString` converts a given number of milliseconds into a formatted
 * time string in the format "mm:ss".
 * @param {number} milliseconds - The `milliseconds` parameter is a number representing the duration in
 * milliseconds that you want to convert to a time string.
 * @returns The function `millisecondsToTimeString` returns a string in the format "mm:ss", where "mm"
 * represents the minutes and "ss" represents the seconds.
 */
const millisecondsToTimeString = (milliseconds: number | undefined) => {
  // Check if the input is not a valid number or is negative
  if ((milliseconds && isNaN(milliseconds)) || isUndefined(milliseconds)) {
    return '00:00';
  }

  // Convert milliseconds to seconds
  const totalSeconds = Math.floor(milliseconds / 1000);

  // Calculate the minutes and seconds
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  // Create the time string with leading zeros
  const minutesString = String(minutes).padStart(2, '0');
  const secondsString = String(seconds).padStart(2, '0');

  return `${minutesString}:${secondsString}`;
};

type MobileAudioFileType = { uri: string; fileName: string; type: string };

export const AudioRecorder = ({
  onRecordingComplete,
  audioFormat,
}: {
  onRecordingComplete: (audioFile: MobileAudioFileType | null) => void;
  audioFormat: 'audio/m4a' | 'audio/wav';
}) => {
  const localRecordedAudioCacheFilePaths = useAppSelector(selectLocalRecordedAudioCacheFilePaths);
  const dispatch = useAppDispatch();
  const [isSending, setIsSending] = useState(false);
  const { colors, semanticColors } = useThemeColors();
  const themedTailwind = useThemedStyles();
  const { animatedStyle, handlers } = useScaleAnimation();

  const { setIsVoiceRecorderOpen } = useChatWindowContext();

  const [isAudioRecording, setIsAudioRecording] = useState(false);

  const recorder = useAudioRecorder(RECORDING_OPTIONS);
  const recorderState = useAudioRecorderState(recorder, 500);

  useEffect(() => {
    const startRecording = async () => {
      const { granted } = await requestRecordingPermissionsAsync();
      if (!granted) {
        Alert.alert(i18n.t('AUDIO.PERMISSION_DENIED'), i18n.t('AUDIO.PERMISSION_DENIED_MESSAGE'));
        deleteRecorder();
        return;
      }
      await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      setIsAudioRecording(true);
    };

    startRecording().catch(error => {
      Alert.alert(
        i18n.t('AUDIO.PREPARE_ERROR'),
        error instanceof Error ? error.message : String(error),
      );
      deleteRecorder();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const deleteRecorder = async () => {
    try {
      await recorder.stop();
    } catch {
      // Recorder may not be in a recording state, ignore stop errors
    }
    setIsVoiceRecorderOpen(false);
  };

  const createAudioFile = async (uri: string) => {
    // expo-audio returns well-formed file:// URIs on both platforms
    const cleanPath = uri.replace(/^file:\/\//, '');
    let finalPath = cleanPath;
    const stats = await ReactNativeBlobUtil.fs.stat(finalPath);

    if (Platform.OS === 'android') {
      return {
        uri: `file://${finalPath}`,
        originalPath: finalPath,
        type: 'audio/aac',
        fileName: `audio-${localRecordedAudioCacheFilePaths.length}.aac`,
        name: `audio-${localRecordedAudioCacheFilePaths.length}.aac`,
        fileSize: stats.size,
      };
    }

    const finalExtension = audioFormat === 'audio/wav' ? 'wav' : 'm4a';

    if (audioFormat === 'audio/wav') {
      const conversionResult = await convertAacToWav(cleanPath);
      if (conversionResult instanceof Error) {
        throw conversionResult;
      }
      finalPath = conversionResult.replace('file://', '');
    }

    const audioFile = {
      uri: Platform.OS === 'ios' ? `file://${finalPath}` : finalPath,
      originalPath: finalPath,
      type: audioFormat,
      fileName: `audio-${localRecordedAudioCacheFilePaths.length}.${finalExtension}`,
      name: `audio-${localRecordedAudioCacheFilePaths.length}.${finalExtension}`,
      fileSize: stats.size,
    };

    return audioFile;
  };

  const sendRecordedMessage = async () => {
    if (isSending) return;
    setIsSending(true);
    try {
      await recorder.stop();
      const uri = recorder.uri;
      if (!uri) throw new Error('No recording URI');
      const audioFile = await createAudioFile(uri);
      dispatch(addNewCachePath(audioFile.originalPath));
      setIsVoiceRecorderOpen(false);
      onRecordingComplete(audioFile as MobileAudioFileType);
    } catch (error) {
      Sentry.captureException(error);
      Alert.alert(
        i18n.t('AUDIO.PREPARE_ERROR'),
        error instanceof Error ? error.message : String(error),
      );
    } finally {
      setIsSending(false);
    }
  };

  const toggleRecorder = () => {
    if (isAudioRecording) {
      recorder.pause();
    } else {
      recorder.record();
    }

    setIsAudioRecording(!isAudioRecording);
  };

  return (
    <Animated.View
      exiting={snappySlideOutDown()}
      entering={snappySlideInDown()}
      style={themedTailwind.style(
        'px-1 flex flex-row items-center overflow-hidden',
        `max-h-[${TEXT_INPUT_CONTAINER_HEIGHT}px]`,
      )}>
      <Pressable
        onPress={deleteRecorder}
        style={themedTailwind.style('h-10 w-10 flex items-center justify-center')}>
        <Trash size={28} color={colors.ruby[9]} />
      </Pressable>
      <Animated.View
        style={themedTailwind.style(
          'bg-slate-3 px-3 py-[7px] rounded-2xl min-h-9 flex flex-row items-center justify-between mx-1.5',
          `w-[${RecorderSegmentWidth}px]`,
        )}>
        <Pressable onPress={toggleRecorder} hitSlop={12}>
          {isAudioRecording ? (
            <Animated.View>
              <Icon icon={<PauseIcon fill={colors.slate[12]} />} />
            </Animated.View>
          ) : (
            <Animated.View>
              <Icon icon={<PlayIcon fill={colors.slate[12]} />} />
            </Animated.View>
          )}
        </Pressable>
        <Animated.Text
          style={themedTailwind.style(
            'text-xs leading-[14px] font-inter-420-20 tracking-[0.32px] text-slate-12',
          )}>
          {millisecondsToTimeString(recorderState.durationMillis)}
        </Animated.Text>
      </Animated.View>
      <Pressable disabled={isSending} onPress={sendRecordedMessage} {...handlers}>
        <Animated.View
          style={[
            themedTailwind.style('flex items-center justify-center h-12 w-12'),
            animatedStyle,
          ]}>
          <Animated.View
            style={themedTailwind.style(
              'flex items-center justify-center h-9 w-9 rounded-full bg-slate-12',
              isSending && 'opacity-50',
            )}>
            <ArrowUp size={21} strokeWidth={2} color={semanticColors.textInverse} />
          </Animated.View>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
};
