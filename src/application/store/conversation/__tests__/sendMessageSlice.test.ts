import { describe, it, expect } from '@jest/globals';
import type { Asset } from 'react-native-image-picker';
import type { RootState } from '@application/store';
import { aMessage } from '@/__tests__/helpers/builders';
import reducer, {
  setMessageContent,
  togglePrivateMessage,
  updateAttachments,
  deleteAttachment,
  resetAttachments,
  setQuoteMessage,
  resetSentMessage,
  selectMessageContent,
  selectIsPrivateMessage,
  selectAttachments,
  selectQuoteMessage,
} from '../sendMessageSlice';

type SendMessageState = ReturnType<typeof reducer>;

const createMockRootState = (sendMessageState: SendMessageState) =>
  ({ sendMessage: sendMessageState }) as unknown as RootState;

const mockAsset = (overrides: Partial<Asset> = {}): Asset => ({
  uri: 'file:///photo.jpg',
  fileName: 'photo.jpg',
  type: 'image/jpeg',
  ...overrides,
});

describe('sendMessageSlice', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initial state', () => {
    it('returns correct initial state', () => {
      const state = reducer(undefined, { type: 'unknown' });

      expect(state).toEqual({
        messageContent: '',
        isPrivateMessage: false,
        attachments: [],
        quoteMessage: null,
      });
    });
  });

  describe('setMessageContent', () => {
    it('sets message content string', () => {
      const state = reducer(undefined, setMessageContent('Hello, world!'));

      expect(state.messageContent).toBe('Hello, world!');
    });

    it('should set message content to empty string', () => {
      let state = reducer(undefined, setMessageContent('Hello'));
      state = reducer(state, setMessageContent(''));

      expect(state.messageContent).toBe('');
    });
  });

  describe('togglePrivateMessage', () => {
    it('sets isPrivateMessage to provided boolean', () => {
      const state = reducer(undefined, togglePrivateMessage(true));

      expect(state.isPrivateMessage).toBe(true);
    });

    it('should set isPrivateMessage to false when given false', () => {
      let state = reducer(undefined, togglePrivateMessage(true));
      state = reducer(state, togglePrivateMessage(false));

      expect(state.isPrivateMessage).toBe(false);
    });
  });

  describe('updateAttachments', () => {
    it('appends new attachments to existing array', () => {
      const firstAsset = mockAsset({ fileName: 'first.jpg' });
      const secondAsset = mockAsset({ fileName: 'second.png', type: 'image/png' });

      let state = reducer(undefined, updateAttachments([firstAsset]));
      state = reducer(state, updateAttachments([secondAsset]));

      expect(state.attachments).toHaveLength(2);
      expect(state.attachments[0].fileName).toBe('first.jpg');
      expect(state.attachments[1].fileName).toBe('second.png');
    });
  });

  describe('deleteAttachment', () => {
    it('removes attachment at given index', () => {
      const assets: Asset[] = [
        mockAsset({ fileName: 'a.jpg' }),
        mockAsset({ fileName: 'b.jpg' }),
        mockAsset({ fileName: 'c.jpg' }),
      ];

      let state = reducer(undefined, updateAttachments(assets));
      state = reducer(state, deleteAttachment(1));

      expect(state.attachments).toHaveLength(2);
      expect(state.attachments[0].fileName).toBe('a.jpg');
      expect(state.attachments[1].fileName).toBe('c.jpg');
    });

    it('should remove first attachment when index is 0', () => {
      const assets: Asset[] = [mockAsset({ fileName: 'a.jpg' }), mockAsset({ fileName: 'b.jpg' })];

      let state = reducer(undefined, updateAttachments(assets));
      state = reducer(state, deleteAttachment(0));

      expect(state.attachments).toHaveLength(1);
      expect(state.attachments[0].fileName).toBe('b.jpg');
    });

    it('should remove last attachment when index is last element', () => {
      const assets: Asset[] = [mockAsset({ fileName: 'a.jpg' }), mockAsset({ fileName: 'b.jpg' })];

      let state = reducer(undefined, updateAttachments(assets));
      state = reducer(state, deleteAttachment(1));

      expect(state.attachments).toHaveLength(1);
      expect(state.attachments[0].fileName).toBe('a.jpg');
    });

    it('should result in empty array when deleting the only attachment', () => {
      let state = reducer(undefined, updateAttachments([mockAsset({ fileName: 'only.jpg' })]));
      state = reducer(state, deleteAttachment(0));

      expect(state.attachments).toEqual([]);
    });
  });

  describe('resetAttachments', () => {
    it('clears attachments array to empty', () => {
      let state = reducer(undefined, updateAttachments([mockAsset()]));
      state = reducer(state, resetAttachments());

      expect(state.attachments).toEqual([]);
    });
  });

  describe('setQuoteMessage', () => {
    it('sets quote message object', () => {
      const message = aMessage().withId(42).withContent('Quoted text').build();
      const state = reducer(undefined, setQuoteMessage(message));

      expect(state.quoteMessage).toEqual(message);
    });

    it('sets quote message to null', () => {
      const message = aMessage().build();
      let state = reducer(undefined, setQuoteMessage(message));
      state = reducer(state, setQuoteMessage(null));

      expect(state.quoteMessage).toBeNull();
    });
  });

  describe('resetSentMessage', () => {
    it('resets attachments, quoteMessage, and messageContent but preserves isPrivateMessage', () => {
      let state = reducer(undefined, setMessageContent('Some text'));
      state = reducer(state, updateAttachments([mockAsset()]));
      state = reducer(state, setQuoteMessage(aMessage().build()));
      state = reducer(state, togglePrivateMessage(true));
      state = reducer(state, resetSentMessage());

      expect(state.messageContent).toBe('');
      expect(state.attachments).toEqual([]);
      expect(state.quoteMessage).toBeNull();
      // isPrivateMessage should NOT be reset by resetSentMessage
      expect(state.isPrivateMessage).toBe(true);
    });
  });

  describe('selectors', () => {
    it('selectMessageContent returns message content from state', () => {
      const state = reducer(undefined, setMessageContent('Hello'));
      const rootState = createMockRootState(state);

      expect(selectMessageContent(rootState)).toBe('Hello');
    });

    it('selectIsPrivateMessage returns private flag', () => {
      const state = reducer(undefined, togglePrivateMessage(true));
      const rootState = createMockRootState(state);

      expect(selectIsPrivateMessage(rootState)).toBe(true);
    });

    it('selectAttachments returns attachments array', () => {
      const asset = mockAsset();
      const state = reducer(undefined, updateAttachments([asset]));
      const rootState = createMockRootState(state);

      expect(selectAttachments(rootState)).toEqual([asset]);
    });

    it('selectQuoteMessage returns quote message', () => {
      const message = aMessage().withId(99).build();
      const state = reducer(undefined, setQuoteMessage(message));
      const rootState = createMockRootState(state);

      expect(selectQuoteMessage(rootState)).toEqual(message);
    });
  });
});
