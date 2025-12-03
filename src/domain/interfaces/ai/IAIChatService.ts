import {
  AIChatBotsResponse,
  AIChatSessionsResponse,
  AIChatMessagesResponse,
  FetchSessionsOptions,
  FetchMessagesOptions,
  FetchStoreMessagesOptions,
  FetchStoreSessionsOptions,
} from './types';

export interface AIChatServiceContract {
  fetchBots(): Promise<AIChatBotsResponse>;
  fetchSessions(options: FetchSessionsOptions): Promise<AIChatSessionsResponse>;
  fetchSessionMessages(options: FetchMessagesOptions): Promise<AIChatMessagesResponse>;
  fetchStoreMessages(options: FetchStoreMessagesOptions): Promise<AIChatMessagesResponse>;
  fetchStoreSessions(options: FetchStoreSessionsOptions): Promise<AIChatSessionsResponse>;
}
