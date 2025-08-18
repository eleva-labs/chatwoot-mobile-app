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

      pipeThrough(transform) {
        const reader = this.getReader();
        const writer = transform.writable.getWriter();

        const pump = async () => {
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              await writer.close();
              break;
            }
            await writer.write(value);
          }
        };

        pump().catch(() => {
          // Handle errors silently for now
        });

        return transform.readable;
      }

      pipeTo(destination) {
        const reader = this.getReader();
        const writer = destination.getWriter();

        const pump = async () => {
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              await writer.close();
              break;
            }
            await writer.write(value);
          }
        };

        return pump();
      }

      tee() {
        const reader = this.getReader();
        let buffer = [];
        let finished = false;
        let readers = [null, null];

        const createTeeStream = (index) => {
          return new ReadableStream({
            start(controller) {
              readers[index] = controller;
              if (buffer.length > 0) {
                buffer.forEach(chunk => {
                  if (chunk.done) {
                    controller.close();
                  } else {
                    controller.enqueue(chunk.value);
                  }
                });
              }
              if (finished) {
                controller.close();
              }
            }
          });
        };

        // Start reading from source
        const pump = async () => {
          while (true) {
            const chunk = await reader.read();
            buffer.push(chunk);
            
            if (readers[0]) {
              if (chunk.done) {
                readers[0].close();
              } else {
                readers[0].enqueue(chunk.value);
              }
            }
            
            if (readers[1]) {
              if (chunk.done) {
                readers[1].close();
              } else {
                readers[1].enqueue(chunk.value);
              }
            }
            
            if (chunk.done) {
              finished = true;
              break;
            }
          }
        };

        pump().catch(() => {
          // Handle errors silently for now
        });

        return [createTeeStream(0), createTeeStream(1)];
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
