import { describe, it, expect } from '@jest/globals';
import {
  MessageSchema,
  ConversationSchema,
  validateConversationList,
  validateSingleConversation,
  validateMessages,
  AttachmentSchema,
  SenderSchema,
} from '../conversationSchemas';

describe('conversationSchemas', () => {
  describe('AttachmentSchema', () => {
    it('should validate a valid attachment', () => {
      const validAttachment = {
        id: 1,
        message_id: 100,
        file_type: 'image' as const,
        account_id: 1,
        extension: 'jpg',
        data_url: 'https://example.com/image.jpg',
        thumb_url: 'https://example.com/thumb.jpg',
        file_size: 1024,
      };

      expect(() => AttachmentSchema.parse(validAttachment)).not.toThrow();
    });

    it('should allow null extension', () => {
      const attachment = {
        id: 1,
        message_id: 100,
        file_type: 'file' as const,
        account_id: 1,
        extension: null,
        data_url: 'https://example.com/file',
      };

      expect(() => AttachmentSchema.parse(attachment)).not.toThrow();
    });

    it('should reject invalid file_type', () => {
      const invalidAttachment = {
        id: 1,
        message_id: 100,
        file_type: 'invalid_type',
        account_id: 1,
        extension: null,
        data_url: 'https://example.com/file',
      };

      expect(() => AttachmentSchema.parse(invalidAttachment)).toThrow();
    });
  });

  describe('SenderSchema', () => {
    it('should validate a valid sender', () => {
      const validSender = {
        id: 1,
        name: 'John Doe',
        avatar_url: 'https://example.com/avatar.jpg',
        type: 'agent' as const,
        email: 'john@example.com',
        thumbnail: 'https://example.com/thumb.jpg',
      };

      expect(() => SenderSchema.parse(validSender)).not.toThrow();
    });

    it('should allow minimal sender data', () => {
      const minimalSender = {
        id: 1,
        name: 'Jane Doe',
      };

      expect(() => SenderSchema.parse(minimalSender)).not.toThrow();
    });

    it('should allow null optional fields', () => {
      const sender = {
        id: 1,
        name: 'Test User',
        avatar_url: null,
        email: null,
        thumbnail: null,
      };

      expect(() => SenderSchema.parse(sender)).not.toThrow();
    });
  });

  describe('MessageSchema', () => {
    it('should validate a valid message', () => {
      const validMessage = {
        id: 1,
        content: 'Hello world',
        account_id: 1,
        inbox_id: 1,
        conversation_id: 1,
        message_type: 'incoming' as const,
        created_at: 1234567890,
        private: false,
      };

      expect(() => MessageSchema.parse(validMessage)).not.toThrow();
    });

    it('should reject invalid message_type', () => {
      const invalidMessage = {
        id: 1,
        content: 'Hello',
        account_id: 1,
        inbox_id: 1,
        conversation_id: 1,
        message_type: 'invalid_type',
        created_at: 1234567890,
        private: false,
      };

      expect(() => MessageSchema.parse(invalidMessage)).toThrow();
    });

    it('should allow optional fields to be missing', () => {
      const minimalMessage = {
        id: 1,
        content: null,
        account_id: 1,
        inbox_id: 1,
        conversation_id: 1,
        message_type: 'incoming' as const,
        created_at: 1234567890,
        private: false,
      };

      expect(() => MessageSchema.parse(minimalMessage)).not.toThrow();
    });

    it('should validate message with attachments', () => {
      const messageWithAttachments = {
        id: 1,
        content: 'Check this out',
        account_id: 1,
        inbox_id: 1,
        conversation_id: 1,
        message_type: 'outgoing' as const,
        created_at: 1234567890,
        private: false,
        attachments: [
          {
            id: 1,
            message_id: 1,
            file_type: 'image' as const,
            account_id: 1,
            extension: 'jpg',
            data_url: 'https://example.com/image.jpg',
          },
        ],
      };

      expect(() => MessageSchema.parse(messageWithAttachments)).not.toThrow();
    });

    it('should validate message with sender', () => {
      const messageWithSender = {
        id: 1,
        content: 'Hello',
        account_id: 1,
        inbox_id: 1,
        conversation_id: 1,
        message_type: 'incoming' as const,
        created_at: 1234567890,
        private: false,
        sender: {
          id: 2,
          name: 'John Doe',
          type: 'contact' as const,
        },
      };

      expect(() => MessageSchema.parse(messageWithSender)).not.toThrow();
    });

    it('should allow null sender', () => {
      const message = {
        id: 1,
        content: 'Hello',
        account_id: 1,
        inbox_id: 1,
        conversation_id: 1,
        message_type: 'activity' as const,
        created_at: 1234567890,
        private: false,
        sender: null,
      };

      expect(() => MessageSchema.parse(message)).not.toThrow();
    });
  });

  describe('ConversationSchema', () => {
    it('should validate a valid conversation', () => {
      const validConversation = {
        id: 1,
        messages: [],
        account_id: 1,
        inbox_id: 1,
        status: 'open' as const,
        can_reply: true,
        timestamp: 1234567890,
      };

      expect(() => ConversationSchema.parse(validConversation)).not.toThrow();
    });

    it('should reject invalid status', () => {
      const invalidConversation = {
        id: 1,
        messages: [],
        account_id: 1,
        inbox_id: 1,
        status: 'invalid_status',
        can_reply: true,
        timestamp: 1234567890,
      };

      expect(() => ConversationSchema.parse(invalidConversation)).toThrow();
    });

    it('should validate conversation with messages', () => {
      const conversationWithMessages = {
        id: 1,
        messages: [
          {
            id: 1,
            content: 'Hello',
            account_id: 1,
            inbox_id: 1,
            conversation_id: 1,
            message_type: 'incoming' as const,
            created_at: 1234567890,
            private: false,
          },
        ],
        account_id: 1,
        inbox_id: 1,
        status: 'open' as const,
        can_reply: true,
        timestamp: 1234567890,
      };

      expect(() => ConversationSchema.parse(conversationWithMessages)).not.toThrow();
    });

    it('should allow optional priority field', () => {
      const conversation = {
        id: 1,
        messages: [],
        account_id: 1,
        inbox_id: 1,
        status: 'pending' as const,
        can_reply: true,
        timestamp: 1234567890,
        priority: 'high' as const,
      };

      expect(() => ConversationSchema.parse(conversation)).not.toThrow();
    });

    it('should allow null priority field', () => {
      const conversation = {
        id: 1,
        messages: [],
        account_id: 1,
        inbox_id: 1,
        status: 'resolved' as const,
        can_reply: false,
        timestamp: 1234567890,
        priority: null,
      };

      expect(() => ConversationSchema.parse(conversation)).not.toThrow();
    });

    it('should reject invalid priority value', () => {
      const conversation = {
        id: 1,
        messages: [],
        account_id: 1,
        inbox_id: 1,
        status: 'open' as const,
        can_reply: true,
        timestamp: 1234567890,
        priority: 'invalid_priority',
      };

      expect(() => ConversationSchema.parse(conversation)).toThrow();
    });
  });

  describe('validateConversationList', () => {
    it('should validate API response structure', () => {
      const apiResponse = {
        data: {
          meta: {
            mine_count: 5,
            unassigned_count: 2,
            assigned_count: 3,
            all_count: 10,
          },
          payload: [
            {
              id: 1,
              messages: [],
              account_id: 1,
              inbox_id: 1,
              status: 'open' as const,
              can_reply: true,
              timestamp: 1234567890,
            },
          ],
        },
      };

      expect(() => validateConversationList(apiResponse)).not.toThrow();
    });

    it('should reject malformed API response', () => {
      const malformedResponse = {
        data: {
          meta: {
            mine_count: 5,
          },
          // Missing payload
        },
      };

      expect(() => validateConversationList(malformedResponse)).toThrow();
    });

    it('should validate empty conversation list', () => {
      const emptyResponse = {
        data: {
          meta: {
            mine_count: 0,
            unassigned_count: 0,
            all_count: 0,
          },
          payload: [],
        },
      };

      expect(() => validateConversationList(emptyResponse)).not.toThrow();
    });
  });

  describe('validateSingleConversation', () => {
    it('should validate single conversation response', () => {
      const response = {
        data: {
          id: 1,
          messages: [
            {
              id: 1,
              content: 'Hello',
              account_id: 1,
              inbox_id: 1,
              conversation_id: 1,
              message_type: 'incoming' as const,
              created_at: 1234567890,
              private: false,
            },
          ],
          account_id: 1,
          inbox_id: 1,
          status: 'open' as const,
          can_reply: true,
          timestamp: 1234567890,
        },
      };

      expect(() => validateSingleConversation(response)).not.toThrow();
    });

    it('should reject missing data field', () => {
      const invalidResponse = {
        conversation: {
          id: 1,
          messages: [],
          account_id: 1,
          inbox_id: 1,
          status: 'open',
          can_reply: true,
          timestamp: 1234567890,
        },
      };

      expect(() => validateSingleConversation(invalidResponse)).toThrow();
    });
  });

  describe('validateMessages', () => {
    it('should validate messages response', () => {
      const response = {
        meta: {
          contact_last_seen_at: 1234567890,
          agent_last_seen_at: 1234567891,
        },
        payload: [
          {
            id: 1,
            content: 'Hello',
            account_id: 1,
            inbox_id: 1,
            conversation_id: 1,
            message_type: 'incoming' as const,
            created_at: 1234567890,
            private: false,
          },
        ],
      };

      expect(() => validateMessages(response)).not.toThrow();
    });

    it('should allow null last seen timestamps', () => {
      const response = {
        meta: {
          contact_last_seen_at: null,
          agent_last_seen_at: null,
        },
        payload: [],
      };

      expect(() => validateMessages(response)).not.toThrow();
    });

    it('should reject malformed messages response', () => {
      const invalidResponse = {
        meta: {
          contact_last_seen_at: 1234567890,
        },
        // Missing payload
      };

      expect(() => validateMessages(invalidResponse)).toThrow();
    });
  });
});
