import { apiService } from '@infrastructure/services/APIService';
import type {
  ConversationParticipantPayload,
  ConversationParticipantResponse,
  UpdateConversationParticipantPayload,
} from './conversationParticipantTypes';
import { transformAgent } from '@infrastructure/utils/camelCaseKeys';
import { Agent } from '@domain/types';

export class ConversationParticipantService {
  static async index(
    payload: ConversationParticipantPayload,
  ): Promise<ConversationParticipantResponse> {
    const { conversationId } = payload;
    const response = await apiService.get<Agent[]>(`conversations/${conversationId}/participants`);
    const transformedResponse = response.data.map(transformAgent);
    return {
      participants: transformedResponse,
      conversationId,
    };
  }

  static async update(
    payload: UpdateConversationParticipantPayload,
  ): Promise<ConversationParticipantResponse> {
    const { conversationId, userIds } = payload;
    const response = await apiService.put<Agent[]>(`conversations/${conversationId}/participants`, {
      user_ids: userIds,
    });
    const transformedResponse = response.data.map(transformAgent);
    return {
      participants: transformedResponse,
      conversationId,
    };
  }
}
