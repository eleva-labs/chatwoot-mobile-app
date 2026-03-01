import { Agent } from '@domain/types';

export interface AssignableAgentAPIResponse {
  payload: Agent[];
}

export interface AssignableAgentResponse {
  agents: Agent[];
  inboxIds: number[];
}

export interface AssignableAgentPayload {
  inboxIds: number[];
}
