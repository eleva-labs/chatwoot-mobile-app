import { Agent } from '@domain/types';

export const agent: Agent = {
  id: 1,
  name: 'Test Agent',
};

export const mockInboxAgentsResponse = { data: { payload: [agent] } };
