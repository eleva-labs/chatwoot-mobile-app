import { Platform } from 'react-native';
import structuredClone from '@ungap/structured-clone';

if (Platform.OS !== 'web') {
  // Import polyfillGlobal synchronously
  const { polyfillGlobal } = require('react-native/Libraries/Utilities/PolyfillFunctions');

  // Import Web Streams polyfills synchronously
  const { ReadableStream, WritableStream, TransformStream } = require('web-streams-polyfill');

  // Import text encoding streams synchronously
  const { TextEncoderStream, TextDecoderStream } = require('@stardazed/streams-text-encoding');

  // Polyfill structuredClone
  if (!('structuredClone' in global)) {
    polyfillGlobal('structuredClone', () => structuredClone);
  }

  // Polyfill Web Streams API - CRITICAL: Must be done synchronously before any imports
  if (!('ReadableStream' in global)) {
    polyfillGlobal('ReadableStream', () => ReadableStream);
  }

  if (!('WritableStream' in global)) {
    polyfillGlobal('WritableStream', () => WritableStream);
  }

  if (!('TransformStream' in global)) {
    polyfillGlobal('TransformStream', () => TransformStream);
  }

  // Polyfill text encoding streams
  if (!('TextEncoderStream' in global)) {
    polyfillGlobal('TextEncoderStream', () => TextEncoderStream);
  }

  if (!('TextDecoderStream' in global)) {
    polyfillGlobal('TextDecoderStream', () => TextDecoderStream);
  }
}

export {};
