import { Platform } from 'react-native';
import structuredClone from '@ungap/structured-clone';

// Immediate synchronous polyfills
console.log('🔧 Setting up AI SDK polyfills IMMEDIATELY...');

if (Platform.OS !== 'web') {
  // CRITICAL: Set up stream polyfills immediately (synchronously)
  if (!('ReadableStream' in global)) {
    global.ReadableStream = class ReadableStream {
      constructor(source = {}) {
        this._controller = null;
        this._reader = null;
        this._state = 'readable';
        
        if (source.start) {
          const controller = {
            enqueue: (chunk) => {
              if (this._reader && this._reader._resolve) {
                this._reader._resolve({ value: chunk, done: false });
                this._reader = null;
              }
            },
            close: () => {
              this._state = 'closed';
              if (this._reader && this._reader._resolve) {
                this._reader._resolve({ value: undefined, done: true });
                this._reader = null;
              }
            },
            error: (error) => {
              this._state = 'errored';
              if (this._reader && this._reader._reject) {
                this._reader._reject(error);
                this._reader = null;
              }
            }
          };
          this._controller = controller;
          source.start(controller);
        }
      }
      
      getReader() {
        return {
          read: () => {
            return new Promise((resolve, reject) => {
              if (this._state === 'closed') {
                resolve({ value: undefined, done: true });
              } else if (this._state === 'errored') {
                reject(new Error('Stream errored'));
              } else {
                this._reader = { _resolve: resolve, _reject: reject };
              }
            });
          }
        };
      }
    };
    console.log('✅ ReadableStream polyfilled IMMEDIATELY');
  }

  if (!('WritableStream' in global)) {
    global.WritableStream = class WritableStream {
      constructor(sink = {}) {
        this._sink = sink;
        this._state = 'writable';
      }
      
      getWriter() {
        return {
          write: async (chunk) => {
            if (this._sink.write) {
              await this._sink.write(chunk);
            }
          },
          close: async () => {
            if (this._sink.close) {
              await this._sink.close();
            }
            this._state = 'closed';
          }
        };
      }
    };
    console.log('✅ WritableStream polyfilled IMMEDIATELY');
  }

  if (!('TransformStream' in global)) {
    global.TransformStream = class TransformStream {
      constructor(transformer = {}) {
        let readableController;
        
        this.readable = new ReadableStream({
          start(controller) {
            readableController = controller;
          }
        });
        
        this.writable = new WritableStream({
          write(chunk) {
            if (transformer.transform) {
              transformer.transform(chunk, readableController);
            } else {
              readableController?.enqueue(chunk);
            }
          },
          close() {
            if (transformer.flush) {
              transformer.flush(readableController);
            }
            readableController?.close();
          }
        });
      }
    };
    console.log('✅ TransformStream polyfilled IMMEDIATELY');
  }

  // Official AI SDK polyfills from documentation (async)
  const setupPolyfills = async () => {
    const { polyfillGlobal } = await import(
      'react-native/Libraries/Utilities/PolyfillFunctions'
    );

    const { TextEncoderStream, TextDecoderStream } = await import(
      '@stardazed/streams-text-encoding'
    );

    if (!('structuredClone' in global)) {
      polyfillGlobal('structuredClone', () => structuredClone);
      console.log('✅ structuredClone polyfilled');
    }

    polyfillGlobal('TextEncoderStream', () => TextEncoderStream);
    console.log('✅ TextEncoderStream polyfilled');
    
    polyfillGlobal('TextDecoderStream', () => TextDecoderStream);
    console.log('✅ TextDecoderStream polyfilled');

    console.log('🎉 All AI SDK polyfills loaded successfully!');
  };

  setupPolyfills();
}

export {};
