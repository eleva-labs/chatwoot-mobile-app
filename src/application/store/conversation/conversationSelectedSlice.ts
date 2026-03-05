// Conversation Selected Slice is used to manage the selected conversations on bulk actions

import { createSelector, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '@application/store';
import { Conversation } from '@domain/types';
import { conversationActions } from './conversationActions';

interface SelectedConversationState {
  selectedConversations: {
    [key: number]: Conversation;
  };
  selectedConversation: Conversation | null;
}

const initialState: SelectedConversationState = {
  selectedConversations: {},
  selectedConversation: null,
};

const conversationSelectedSlice = createSlice({
  name: 'conversationSelected',
  initialState,
  reducers: {
    toggleSelection: (state, action: PayloadAction<{ conversation: Conversation }>) => {
      const { conversation } = action.payload;
      const id = conversation.id;

      if (id in state.selectedConversations) {
        const { [id]: removed, ...rest } = state.selectedConversations;
        state.selectedConversations = rest;
      } else {
        state.selectedConversations[id] = conversation;
      }
    },
    clearSelection: state => {
      state.selectedConversations = {};
      state.selectedConversation = null;
    },
    selectAll: (state, action: PayloadAction<Conversation[]>) => {
      state.selectedConversations = action.payload.reduce(
        (acc, conversation) => {
          acc[conversation.id] = conversation;
          return acc;
        },
        {} as { [key: number]: Conversation },
      );
    },
    selectSingleConversation: (state, action: PayloadAction<Conversation>) => {
      state.selectedConversation = action.payload;
    },
  },
  extraReducers: builder => {
    // Sync selectedConversation when conversation updates
    builder
      .addCase(conversationActions.toggleConversationStatus.fulfilled, (state, { payload }) => {
        if (state.selectedConversation?.id === payload.conversationId) {
          state.selectedConversation.status = payload.currentStatus;
          state.selectedConversation.snoozedUntil = payload.snoozedUntil;
        }
      })
      .addCase(conversationActions.assignConversation.fulfilled, (state, action) => {
        const { conversationId } = action.meta.arg;
        const assignee = action.payload;
        if (state.selectedConversation?.id === conversationId && state.selectedConversation.meta) {
          state.selectedConversation.meta.assignee = assignee;
        }
      })
      .addCase(conversationActions.togglePriority.fulfilled, (state, action) => {
        const { conversationId, priority } = action.meta.arg;
        if (state.selectedConversation?.id === conversationId) {
          state.selectedConversation.priority = priority;
        }
      });
  },
});

export const selectSelected = (state: RootState) =>
  state.selectedConversation.selectedConversations;

export const selectSelectedConversation = (state: RootState) =>
  state.selectedConversation.selectedConversation;

export const selectSelectedIds = createSelector([selectSelected], selected =>
  Object.keys(selected).map(Number),
);

export const selectSelectedConversations = createSelector([selectSelected], selected =>
  Object.values(selected),
);

export const selectIsConversationSelected = createSelector(
  [selectSelected, (_state: RootState, conversationId: number) => conversationId],
  (selected, conversationId) => conversationId in selected,
);

export const selectSelectedInboxes = createSelector([selectSelectedConversations], selected => [
  ...new Set(selected.map(conversation => conversation.inboxId)),
]);

export const { toggleSelection, clearSelection, selectAll, selectSingleConversation } =
  conversationSelectedSlice.actions;
export default conversationSelectedSlice.reducer;
