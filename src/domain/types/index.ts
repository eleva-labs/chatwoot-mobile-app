import { AllStatusTypes, AssigneeTypes, SortTypes } from './common';

export * from './Agent';
export * from './AgentBot';
export * from './Attachment';
export * from './common';
export * from './Contact';
export * from './Conversation';
export * from './Message';
export * from './Team';
export * from './Account';
export * from './Macro';

/**
 * The types of Filter for Conversation List
 */

export type ConversationFilterOptions = 'assignee_type' | 'status' | 'sort_by' | 'inbox_id';

// Defining the specific options for each filter type
export type AssigneeFilterOptions = Record<AssigneeTypes, string>;
export type StatusFilterOptions = Record<AllStatusTypes, string>;
export type SortFilterOptions = Record<SortTypes, string>;

export type FilterOption<T extends ConversationFilterOptions> = {
  type: T;
  options: T extends 'assignee_type'
    ? AssigneeFilterOptions
    : T extends 'status'
      ? StatusFilterOptions
      : T extends 'sort_by'
        ? SortFilterOptions
        : T extends 'inbox_id'
          ? Record<number, string>
          : never;
  defaultFilter: string;
};

export type LabelType = { labelText: string; labelColor: string };

// Re-export UI types from infrastructure for backward compatibility
// TODO: Update consumers to import directly from @infrastructure/types/ui-types
export type {
  IconProps,
  GenericListType,
  AttributeListType,
  RenderPropType,
} from '@infrastructure/types/ui-types';
