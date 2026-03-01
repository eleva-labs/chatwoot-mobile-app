import { apiService } from '@/services/APIService';
import type {
  ConversationPayload,
  MessagesPayload,
  MessagesAPIResponse,
  MessageBuilderPayload,
  SendMessageAPIResponse,
  ConversationListAPIResponse,
  ConversationAPIResponse,
  ToggleConversationStatusPayload,
  ToggleConversationStatusResponse,
  BulkActionPayload,
  AssigneePayload,
  AssigneeAPIResponse,
  MarkMessagesUnreadPayload,
  MarkMessagesUnreadAPIResponse,
  MarkMessageReadPayload,
  MarkMessageReadAPIResponse,
  MuteOrUnmuteConversationPayload,
  ConversationLabelPayload,
  AssignTeamPayload,
  AssignTeamAPIResponse,
  DeleteMessagePayload,
  DeleteMessageAPIResponse,
  TypingPayload,
  ConversationListResponse,
  MessagesResponse,
  ConversationResponse,
  MarkMessageReadOrUnreadResponse,
  ToggleConversationStatusAPIResponse,
  TogglePriorityPayload,
} from './conversationTypes';

import {
  transformConversation,
  transformConversationListMeta,
  transformMessage,
  transformConversationMeta,
} from '@infrastructure/utils/camelCaseKeys';
import type { AxiosRequestConfig } from 'axios';
import { ZodError } from 'zod';
import {
  validateConversationList,
  validateSingleConversation,
  validateMessages,
  validateSendMessage,
  validateToggleConversationStatus,
  validateAssignee,
  validateAssignTeam,
  validateMarkMessagesUnread,
  validateMarkMessageRead,
  validateDeleteMessage,
} from './conversationSchemas';
import { handleValidationError } from './validationHelpers';

export class ConversationService {
  static async getConversations(payload: ConversationPayload): Promise<ConversationListResponse> {
    const { status, assigneeType, page, sortBy, inboxId = 0 } = payload;

    const params = {
      inbox_id: inboxId || null,
      assignee_type: assigneeType,
      status: status,
      page: page,
      sort_by: sortBy,
    };

    const response = await apiService.get<ConversationListAPIResponse>('conversations', {
      params,
    });

    try {
      // Validate response
      const validated = validateConversationList(response.data);

      const {
        data: { payload: conversations, meta },
      } = validated;
      const transformedResponse: ConversationListResponse = {
        conversations: conversations.map(transformConversation),
        meta: transformConversationListMeta(meta),
      };
      return transformedResponse;
    } catch (error) {
      if (error instanceof ZodError) {
        handleValidationError('getConversations', error, response.data);
        throw error;
      }
      throw error;
    }
  }

  static async fetchConversation(conversationId: number): Promise<ConversationResponse> {
    const response = await apiService.get<ConversationAPIResponse>(
      `conversations/${conversationId}`,
    );

    try {
      // Validate response
      const validated = validateSingleConversation(response.data);

      const { data: conversation } = validated;
      return {
        conversation: transformConversation(conversation),
      };
    } catch (error) {
      if (error instanceof ZodError) {
        handleValidationError('fetchConversation', error, response.data);
        throw error;
      }
      throw error;
    }
  }

  static async fetchPreviousMessages(payload: MessagesPayload): Promise<MessagesResponse> {
    const { conversationId, beforeId } = payload;

    const response = await apiService.get<MessagesAPIResponse>(
      `conversations/${conversationId}/messages`,
      {
        params: {
          before: beforeId,
        },
      },
    );

    try {
      // Validate response
      const validated = validateMessages(response.data);

      const { meta, payload: messages } = validated;
      return {
        meta: transformConversationMeta(meta),
        messages: messages.map(transformMessage),
        conversationId,
      };
    } catch (error) {
      if (error instanceof ZodError) {
        handleValidationError('fetchPreviousMessages', error, response.data);
        throw error;
      }
      throw error;
    }
  }

  static async sendMessage(
    conversationId: number,
    payload: MessageBuilderPayload,
    config: AxiosRequestConfig,
  ): Promise<SendMessageAPIResponse> {
    const response = await apiService.post<SendMessageAPIResponse>(
      `conversations/${conversationId}/messages`,
      payload,
      config,
    );

    try {
      // Validate response
      validateSendMessage(response.data);

      return response.data;
    } catch (error) {
      if (error instanceof ZodError) {
        handleValidationError('sendMessage', error, response.data);
        throw error;
      }
      throw error;
    }
  }

  static async toggleConversationStatus({
    conversationId,
    payload,
  }: ToggleConversationStatusPayload): Promise<ToggleConversationStatusResponse> {
    const response = await apiService.post<ToggleConversationStatusAPIResponse>(
      `conversations/${conversationId}/toggle_status`,
      payload,
    );

    try {
      // Validate response
      validateToggleConversationStatus(response.data);

      const {
        payload: { current_status: currentStatus, snoozed_until: snoozedUntil },
      } = response.data;
      return {
        conversationId,
        currentStatus,
        snoozedUntil,
      };
    } catch (error) {
      if (error instanceof ZodError) {
        handleValidationError('toggleConversationStatus', error, response.data);
        throw error;
      }
      throw error;
    }
  }
  // Note: bulkAction returns void (status code only), no response body to validate
  // If API changes to return data, add validation with BulkActionResponseSchema
  static async bulkAction(payload: BulkActionPayload): Promise<void> {
    await apiService.post('bulk_actions', payload);
  }
  static async assignConversation(payload: AssigneePayload): Promise<AssigneeAPIResponse> {
    const { conversationId, assigneeId, teamId } = payload;
    const params = {
      assignee_id: assigneeId,
      team_id: teamId,
    };

    const response = await apiService.post<AssigneeAPIResponse>(
      `conversations/${conversationId}/assignments`,
      params,
    );

    try {
      // Validate response
      validateAssignee(response.data);

      return response.data;
    } catch (error) {
      if (error instanceof ZodError) {
        handleValidationError('assignConversation', error, response.data);
        throw error;
      }
      throw error;
    }
  }

  static async assignTeam(payload: AssignTeamPayload): Promise<AssignTeamAPIResponse> {
    const { conversationId, teamId } = payload;

    const response = await apiService.post<AssignTeamAPIResponse>(
      `conversations/${conversationId}/assignments?team_id=${teamId}`,
    );

    try {
      // Validate response
      validateAssignTeam(response.data);

      return response.data;
    } catch (error) {
      if (error instanceof ZodError) {
        handleValidationError('assignTeam', error, response.data);
        throw error;
      }
      throw error;
    }
  }

  static async markMessagesUnread(
    payload: MarkMessagesUnreadPayload,
  ): Promise<MarkMessageReadOrUnreadResponse> {
    const { conversationId } = payload;

    const response = await apiService.post<MarkMessagesUnreadAPIResponse>(
      `conversations/${conversationId}/unread`,
    );

    try {
      // Validate response
      validateMarkMessagesUnread(response.data);

      const { id, unread_count: unreadCount, agent_last_seen_at: agentLastSeenAt } = response.data;
      return {
        conversationId: id,
        unreadCount,
        agentLastSeenAt,
      };
    } catch (error) {
      if (error instanceof ZodError) {
        handleValidationError('markMessagesUnread', error, response.data);
        throw error;
      }
      throw error;
    }
  }

  static async markMessageRead(
    payload: MarkMessageReadPayload,
  ): Promise<MarkMessageReadOrUnreadResponse> {
    const { conversationId } = payload;

    const response = await apiService.post<MarkMessageReadAPIResponse>(
      `conversations/${conversationId}/update_last_seen`,
    );

    try {
      // Validate response
      validateMarkMessageRead(response.data);

      const { id, unread_count: unreadCount, agent_last_seen_at: agentLastSeenAt } = response.data;
      return {
        conversationId: id,
        unreadCount,
        agentLastSeenAt,
      };
    } catch (error) {
      if (error instanceof ZodError) {
        handleValidationError('markMessageRead', error, response.data);
        throw error;
      }
      throw error;
    }
  }

  static async muteConversation(payload: MuteOrUnmuteConversationPayload): Promise<void> {
    const { conversationId } = payload;
    await apiService.post(`conversations/${conversationId}/mute`);
  }

  static async unmuteConversation(payload: MuteOrUnmuteConversationPayload): Promise<void> {
    const { conversationId } = payload;
    await apiService.post(`conversations/${conversationId}/unmute`);
  }

  static async addOrUpdateConversationLabels(payload: ConversationLabelPayload): Promise<void> {
    const { conversationId, labels } = payload;
    await apiService.post(`conversations/${conversationId}/labels`, { labels });
  }

  static async deleteMessage(payload: DeleteMessagePayload): Promise<DeleteMessageAPIResponse> {
    const { conversationId, messageId } = payload;

    const response = await apiService.delete<DeleteMessageAPIResponse>(
      `conversations/${conversationId}/messages/${messageId}`,
    );

    try {
      // Validate response
      validateDeleteMessage(response.data);

      return response.data;
    } catch (error) {
      if (error instanceof ZodError) {
        handleValidationError('deleteMessage', error, response.data);
        throw error;
      }
      throw error;
    }
  }

  static async toggleTyping(payload: TypingPayload): Promise<void> {
    const { conversationId, typingStatus, isPrivate } = payload;
    await apiService.post(`conversations/${conversationId}/toggle_typing_status`, {
      typing_status: typingStatus,
      is_private: isPrivate,
    });
  }

  static async togglePriority(payload: TogglePriorityPayload): Promise<void> {
    const { conversationId, priority } = payload;
    await apiService.post(`conversations/${conversationId}/toggle_priority`, { priority });
  }
}
