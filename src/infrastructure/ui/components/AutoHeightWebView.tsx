import React, { useState, useCallback } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';

interface AutoHeightWebViewProps {
  source: { html: string } | { uri: string };
  style?: StyleProp<ViewStyle>;
  customStyle?: string;
  onSizeUpdated?: (size: { height: number; width: number }) => void;
  scrollEnabled?: boolean;
  originWhitelist?: string[];
  viewportContent?: string;
}

const heightMeasureScript = `
  (function() {
    function updateHeight() {
      const height = Math.max(
        document.body.scrollHeight,
        document.body.offsetHeight,
        document.documentElement.scrollHeight,
        document.documentElement.offsetHeight
      );
      const width = document.documentElement.scrollWidth || document.body.scrollWidth;
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'heightUpdate', height, width }));
    }

    let timeout;
    function debouncedUpdateHeight() {
      clearTimeout(timeout);
      timeout = setTimeout(updateHeight, 100);
    }

    // Initial measurement (immediate)
    updateHeight();
    // Re-measure after images load (debounced)
    const images = document.querySelectorAll('img');
    images.forEach(img => {
      if (!img.complete) {
        img.addEventListener('load', debouncedUpdateHeight);
      }
    });
    // Observe DOM changes (debounced)
    const observer = new MutationObserver(debouncedUpdateHeight);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  })();
  true;
`;

const AutoHeightWebView: React.FC<AutoHeightWebViewProps> = ({
  source,
  style,
  customStyle,
  onSizeUpdated,
  scrollEnabled = false,
  originWhitelist = ['*'],
  viewportContent,
  ...rest
}) => {
  const [webViewHeight, setWebViewHeight] = useState(1);

  const onMessage = useCallback(
    (event: WebViewMessageEvent) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);
        if (data.type === 'heightUpdate' && data.height) {
          setWebViewHeight(data.height);
          onSizeUpdated?.({ height: data.height, width: data.width || 0 });
        }
      } catch {
        // Ignore parse errors from other messages
      }
    },
    [onSizeUpdated],
  );

  // If source is html, inject custom styles and viewport
  const processedSource =
    'html' in source && (customStyle || viewportContent)
      ? {
          html: `<html><head><meta name="viewport" content="${viewportContent || 'width=device-width, initial-scale=1.0'}">${customStyle ? `<style>${customStyle}</style>` : ''}</head><body>${source.html}</body></html>`,
        }
      : source;

  return (
    <WebView
      style={[{ height: webViewHeight }, style]}
      source={processedSource}
      scrollEnabled={scrollEnabled}
      originWhitelist={originWhitelist}
      injectedJavaScript={heightMeasureScript}
      onMessage={onMessage}
      javaScriptEnabled
      {...rest}
    />
  );
};

export default AutoHeightWebView;
