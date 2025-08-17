import { Platform } from 'react-native';

if (Platform.OS !== 'web') {
  const setupPolyfills = async () => {
    const { polyfillGlobal } = await import(
      'react-native/Libraries/Utilities/PolyfillFunctions'
    );

    // Basic structuredClone polyfill without external dependencies
    if (!('structuredClone' in global)) {
      polyfillGlobal('structuredClone', () => (obj) => JSON.parse(JSON.stringify(obj)));
    }

    // Basic TransformStream polyfill for AI SDK streaming
    if (!('TransformStream' in global)) {
      polyfillGlobal('TransformStream', () => {
        return class TransformStream {
          constructor(transformer = {}) {
            let controllerRef;
            
            this.readable = new ReadableStream({
              start(controller) {
                controllerRef = controller;
              }
            });
            
            this.writable = new WritableStream({
              write(chunk) {
                if (transformer.transform) {
                  transformer.transform(chunk, controllerRef);
                } else {
                  controllerRef?.enqueue(chunk);
                }
              },
              close() {
                if (transformer.flush) {
                  transformer.flush(controllerRef);
                }
                controllerRef?.close();
              }
            });
          }
        };
      });
    }
  };

  setupPolyfills();
}

export {};
