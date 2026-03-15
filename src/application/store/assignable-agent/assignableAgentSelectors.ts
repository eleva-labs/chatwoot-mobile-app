import type { RootState } from '@application/store';

import { createSelector } from '@reduxjs/toolkit';

export const selectAssignableAgentsState = (state: RootState) => state.assignableAgents;

export const isAssignableAgentFetching = createSelector(
  [selectAssignableAgentsState],
  state => state.uiFlags.isLoading,
);

export const selectAssignableAgents = createSelector(
  [selectAssignableAgentsState],
  state => state.records,
);

export const selectAssignableAgentsByInboxId = createSelector(
  [
    selectAssignableAgents,
    (_state: RootState, inboxIds: number | number[]) =>
      Array.isArray(inboxIds) ? inboxIds : [inboxIds],
    (_state: RootState, _inboxIds: number | number[], searchTerm: string) => searchTerm,
  ],
  (state, inboxIds, searchTerm) => {
    const allAgents = inboxIds.flatMap(id => state[id] || []);
    const agents = [...new Map(allAgents.map(a => [a.id, a])).values()];
    const agentsList = [
      {
        confirmed: true,
        name: 'None',
        id: 0,
        role: 'agent',
        accountId: 0,
      },
      ...agents,
    ];
    return searchTerm ? agentsList.filter(agent => agent?.name?.includes(searchTerm)) : agentsList;
  },
);

export const selectAssignableParticipantsByInboxId = createSelector(
  [selectAssignableAgents],
  state => {
    // Create a memoized function that we can reuse
    return (inboxIds: number | number[], searchTerm: string = '') => {
      const normalizedInboxIds = Array.isArray(inboxIds) ? inboxIds : [inboxIds];
      const allAgents = normalizedInboxIds.flatMap(id => state[id] || []);
      const agents = [...new Map(allAgents.map(a => [a.id, a])).values()];

      if (!searchTerm) {
        return agents;
      }
      return agents.filter(agent => agent?.name?.toLowerCase().includes(searchTerm.toLowerCase()));
    };
  },
);
