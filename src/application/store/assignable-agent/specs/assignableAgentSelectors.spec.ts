import { selectAssignableAgentsByInboxId } from '../assignableAgentSelectors';
import { RootState } from '@application/store';
import { agent } from './assignableAgentMockData';

describe('inboxAgentSelectors', () => {
  const state = {
    assignableAgents: {
      records: {
        1: [agent],
        2: [agent],
        3: [agent],
      },
      uiFlags: { isLoading: false },
    },
  } as Partial<RootState> as RootState;

  it('selects all inbox agents for single inbox', () => {
    expect(selectAssignableAgentsByInboxId(state, [1], '')).toEqual([agent]);
  });

  it('selects all inbox agents for multiple inboxes (deduplicates by id)', () => {
    expect(selectAssignableAgentsByInboxId(state, [2, 3], '')).toEqual([agent]);
  });
});
