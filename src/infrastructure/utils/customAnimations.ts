import { withSpring } from 'react-native-reanimated';

import { spring } from '@infrastructure/animation';

export const photoIconExitAnimation = () => {
  'worklet';
  const animations = {
    opacity: withSpring(0, spring.soft),
    transform: [
      { translateX: withSpring(-10, spring.soft) },
      { scale: withSpring(0.9, spring.soft) },
    ],
  };
  const initialValues = {
    opacity: 1,
    transform: [{ translateX: 0 }, { scale: 1 }],
  };
  return {
    initialValues,
    animations,
  };
};

export const photoIconEnterAnimation = () => {
  'worklet';
  const animations = {
    opacity: withSpring(1, spring.soft),
    transform: [{ translateX: withSpring(0, spring.soft) }, { scale: withSpring(1, spring.soft) }],
  };
  const initialValues = {
    opacity: 0,
    transform: [{ translateX: -10 }, { scale: 0.9 }],
  };
  return {
    initialValues,
    animations,
  };
};

export const voiceNoteIconExitAnimation = () => {
  'worklet';
  const animations = {
    opacity: withSpring(0, spring.soft),
    transform: [{ scale: withSpring(0.9, spring.soft) }],
  };
  const initialValues = {
    opacity: 1,
    transform: [{ scale: 1 }],
  };
  return {
    initialValues,
    animations,
  };
};

export const voiceNoteIconEnterAnimation = () => {
  'worklet';
  const animations = {
    opacity: withSpring(1, spring.soft),
    transform: [{ scale: withSpring(1, spring.soft) }],
  };
  const initialValues = {
    opacity: 0,
    transform: [{ scale: 0.9 }],
  };
  return {
    initialValues,
    animations,
  };
};

export const sendIconExitAnimation = () => {
  'worklet';
  const animations = {
    opacity: withSpring(0, spring.soft),
    transform: [{ scale: withSpring(0.9, spring.soft) }],
  };
  const initialValues = {
    opacity: 1,
    transform: [{ scale: 1 }],
  };
  return {
    initialValues,
    animations,
  };
};

export const sendIconEnterAnimation = () => {
  'worklet';
  const animations = {
    opacity: withSpring(1, spring.soft),
    transform: [{ scale: withSpring(1, spring.soft) }],
  };
  const initialValues = {
    opacity: 0,
    transform: [{ scale: 0.9 }],
  };
  return {
    initialValues,
    animations,
  };
};
