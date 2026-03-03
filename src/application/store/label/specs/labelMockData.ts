import type { Label } from '@domain/types';

export const label1: Label = {
  id: 1,
  title: 'bug',
  color: '#ff0000',
  description: 'This is a bug label',
  showOnSidebar: true,
};

export const mockLabelsResponse = {
  data: { payload: [label1] },
};
