/**
 * Audio playback manager — singleton module that manages a single AudioPlayer instance.
 *
 * Migrated from react-native-audio-recorder-player to expo-audio.
 * All time values passed to consumers remain in milliseconds.
 * Conversion between expo-audio's seconds and our milliseconds happens here.
 */

import { createAudioPlayer, AudioPlayer, AudioStatus } from 'expo-audio';

/**
 * Playback data passed to consumer callbacks.
 * Units: milliseconds (same as before migration).
 */
export type PlayBackData = {
  currentPosition: number; // ms
  duration: number; // ms
};

/**
 * Audio playback status enum.
 * Renamed from AudioStatus to AudioPlayerState to avoid collision with expo-audio's AudioStatus type.
 */
export enum AudioPlayerState {
  PLAYING = 'PLAYING',
  STARTED = 'STARTED',
  PAUSED = 'PAUSED',
  RESUMED = 'RESUMED',
  STOPPED = 'STOPPED',
}

export type Callback = (args: { status: AudioPlayerState; data?: PlayBackData }) => void;

type Path = string | undefined;

let audioPlayer: AudioPlayer | undefined;
let currentPath: Path;
let currentCallback: Callback = () => {};
let currentPosition = 0;
let statusSubscription: { remove: () => void } | undefined;

export const startPlayer = async (path: string, callback: Callback) => {
  if (currentPath === undefined) {
    currentPath = path;
    currentCallback = callback;
  } else if (currentPath !== path) {
    if (audioPlayer !== undefined) {
      await stopPlayer();
    }
    currentPath = path;
    currentCallback = callback;
  }

  const shouldBeResumed = currentPath === path && currentPosition > 0;

  if (shouldBeResumed) {
    audioPlayer?.play();
    currentCallback({ status: AudioPlayerState.RESUMED });
    return;
  }

  try {
    if (audioPlayer === undefined) {
      audioPlayer = createAudioPlayer({ uri: currentPath });
    } else {
      audioPlayer.replace({ uri: currentPath });
    }

    currentCallback({ status: AudioPlayerState.STARTED });

    statusSubscription?.remove();
    statusSubscription = audioPlayer.addListener('playbackStatusUpdate', (status: AudioStatus) => {
      if (status.didJustFinish) {
        currentCallback({
          status: AudioPlayerState.STOPPED,
          data: {
            currentPosition: status.currentTime * 1000,
            duration: status.duration * 1000,
          },
        });
        // Clean up without re-notifying consumer (stopPlayer would send a second STOPPED callback)
        audioPlayer?.pause();
        statusSubscription?.remove();
        statusSubscription = undefined;
        currentPosition = 0;
        audioPlayer?.remove();
        audioPlayer = undefined;
        currentPath = undefined;
        return;
      } else {
        currentPosition = status.currentTime * 1000;
        currentCallback({
          status: AudioPlayerState.PLAYING,
          data: {
            currentPosition: status.currentTime * 1000,
            duration: status.duration * 1000,
          },
        });
      }
    });

    audioPlayer.play();
  } catch {
    currentCallback({ status: AudioPlayerState.STOPPED });
    audioPlayer?.remove();
    audioPlayer = undefined;
    currentPath = undefined;
    statusSubscription?.remove();
    statusSubscription = undefined;
    currentPosition = 0;
  }
};

export const pausePlayer = async () => {
  audioPlayer?.pause();
  currentCallback({ status: AudioPlayerState.PAUSED });
};

export const resumePlayer = async () => {
  audioPlayer?.play();
  currentCallback({ status: AudioPlayerState.RESUMED });
};

export const seekTo = async (positionMs: number) => {
  await audioPlayer?.seekTo(positionMs / 1000);
  currentCallback({ status: AudioPlayerState.PLAYING });
};

export const stopPlayer = async () => {
  audioPlayer?.pause();
  statusSubscription?.remove();
  statusSubscription = undefined;
  currentPosition = 0;
  currentCallback({ status: AudioPlayerState.STOPPED });
  audioPlayer?.remove();
  audioPlayer = undefined;
  currentPath = undefined;
};
