import { createSlice } from '@reduxjs/toolkit';
import { RootState } from '@application/store';
import { contactConversationActions } from './contactConversationActions';
import { Conversation } from '@domain/types';
interface ContactConversationState {
  records: { [key: number]: Conversation[] };
}

const initialState: ContactConversationState = {
  records: {},
};

const contactConversationSlice = createSlice({
  name: 'contactConversation',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder.addCase(
      contactConversationActions.getContactConversations.fulfilled,
      (state, action) => {
        const { contactId, conversations } = action.payload;
        state.records[contactId] = conversations;
      },
    );
  },
});

export const selectContactConversations = (state: RootState) => state.contactConversations.records;

export default contactConversationSlice.reducer;
