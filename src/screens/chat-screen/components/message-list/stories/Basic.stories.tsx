import { Meta, StoryObj } from '@storybook/react';
import { KeyboardGestureArea, KeyboardProvider } from 'react-native-keyboard-controller';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { configureStore, createSlice } from '@reduxjs/toolkit';
import { tailwind } from '@infrastructure/theme';
import { MessagesList } from '../MessagesList';
import { ChatWindowProvider, RefsProvider } from '@infrastructure/context';
import { Provider } from 'react-redux';
import { TEXT_ONLY } from './mock-data/textOnly';
import { getAllGroupedMessages } from './mock-data/helper';

const ALL_MESSAGES_MOCKDATA = getAllGroupedMessages(TEXT_ONLY);

const mockSendMessageSlice = createSlice({
  name: 'sendMessage',
  initialState: {
    messageContent: '',
    isPrivateMessage: false,
    attachments: [],
    quoteMessage: null,
  },
  reducers: {},
});

const mockConversationSlice = createSlice({
  name: 'conversation',
  initialState: {
    ids: [29],
    entities: {
      29: {
        id: 29,
        status: 'open',
        messages: ALL_MESSAGES_MOCKDATA,
      },
    },
  },
  reducers: {},
});

const mockStore = configureStore({
  reducer: {
    sendMessage: mockSendMessageSlice.reducer,
    conversations: mockConversationSlice.reducer,
  },
});

const meta: Meta<typeof MessagesList> = {
  title: 'Messages List',
  component: MessagesList,
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof MessagesList>;

export const Basic: Story = {
  render: function AllVariantsComponent() {
    return (
      <Provider store={mockStore}>
        <BottomSheetModalProvider>
          <RefsProvider>
            <KeyboardProvider>
              <ChatWindowProvider conversationId={29}>
                <KeyboardGestureArea
                  style={tailwind.style('flex-1 bg-white')}
                  interpolator="ios"
                  textInputNativeID="chat-input">
                  <MessagesList
                    currentUserId={1}
                    isEmailInbox={false}
                    messages={ALL_MESSAGES_MOCKDATA}
                    isFlashListReady={false}
                    setFlashListReady={() => {}}
                    onEndReached={() => {}}
                  />
                </KeyboardGestureArea>
              </ChatWindowProvider>
            </KeyboardProvider>
          </RefsProvider>
        </BottomSheetModalProvider>
      </Provider>
    );
  },
};
