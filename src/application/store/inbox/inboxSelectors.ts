import type { RootState } from '@application/store';
import { createSelector } from '@reduxjs/toolkit';
import { inboxAdapter } from './inboxSlice';
import { selectFilters } from '@application/store/conversation/conversationFilterSlice';

export const selectInboxesState = (state: RootState) => state.inboxes;

export const { selectAll: selectAllInboxes } =
  inboxAdapter.getSelectors<RootState>(selectInboxesState);

export const selectInboxById = (state: RootState, inboxId: number) =>
  selectAllInboxes(state).find(inbox => inbox.id === inboxId);

/**
 * Returns true when the account has more than 1 inbox.
 * Used by chat header (always show if multiple inboxes exist).
 */
export const selectHasMultipleInboxes = createSelector(
  [selectAllInboxes],
  inboxes => inboxes.length > 1,
);

/**
 * Returns true when:
 * 1. Account has > 1 inbox, AND
 * 2. User has NOT filtered to a specific inbox
 *
 * Used by conversation list items (hide indicator when a specific
 * inbox is already filtered because it's redundant).
 */
export const selectShouldShowInboxIndicatorInList = createSelector(
  [selectAllInboxes, selectFilters],
  (inboxes, filters) => {
    const hasMultiple = inboxes.length > 1;
    const isFilteredToSpecificInbox = filters.inbox_id !== '0';
    return hasMultiple && !isFilteredToSpecificInbox;
  },
);
