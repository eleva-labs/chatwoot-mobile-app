import { createSelector } from '@reduxjs/toolkit';
import {
  selectPubSubToken,
  selectUserId,
  selectCurrentUserAccountId,
} from '@application/store/auth/authSelectors';
import { selectWebSocketUrl } from '@application/store/settings/settingsSelectors';
import type { RealtimeConfig } from './realtimeTypes';

export const selectRealtimeConfig = createSelector(
  [selectPubSubToken, selectWebSocketUrl, selectCurrentUserAccountId, selectUserId],
  (pubSubToken, webSocketUrl, accountId, userId): RealtimeConfig | null => {
    if (!pubSubToken || !webSocketUrl || !accountId || !userId) {
      return null;
    }
    return { pubSubToken, webSocketUrl, accountId, userId };
  },
);
