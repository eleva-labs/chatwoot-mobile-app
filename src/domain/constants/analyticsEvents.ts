// Generic analytics event type - can represent any event with unknown properties
export type AnalyticsEvent = Record<string, unknown>;

// Specific event types for type safety and documentation
export type FlowStartedEvent = AnalyticsEvent;
export type QuestionAnsweredEvent = AnalyticsEvent;
export type ScreenChangedEvent = AnalyticsEvent;
export type FlowCompletedEvent = AnalyticsEvent;
export type FlowSkippedEvent = AnalyticsEvent;
export type ErrorEvent = AnalyticsEvent;

export const CONVERSATION_EVENTS = Object.freeze({
  SENT_MESSAGE: 'Sent a message',
  SENT_PRIVATE_NOTE: 'Sent a private note',
  INSERTED_A_CANNED_RESPONSE: 'Inserted a canned response',
  SELECTED_ATTACHMENT: 'Select an attachment',
  USED_MENTIONS: 'Used mentions',
  ASSIGNEE_CHANGED: 'Conversation assignee changed',
  TEAM_CHANGED: 'Conversation team changed',
  RESOLVE_CONVERSATION_STATUS: 'Conversation resolved',
  TOGGLE_STATUS: 'Changed conversation status',
  MUTE_CONVERSATION: 'Conversation muted',
  UN_MUTE_CONVERSATION: 'Conversation unmuted',
  UNASSIGN_CONVERSATION: 'Unassign conversation',
  CHANGE_TEAM: 'Changed team',
  REFRESH_CONVERSATIONS: 'Refreshed conversations',
  CLEAR_FILTERS: 'Clear conversation filters',
  APPLY_FILTER: 'Conversation filter applied',
  SELF_ASSIGN_CONVERSATION: 'Self assigned conversation',
  MARK_AS_UNREAD: 'Mark as unread',
  MARK_AS_READ: 'Mark as read',
  ENABLE_PUSH_NOTIFICATION: 'Enabled push notification',
  CONVERSATION_SHARE: 'Shared conversation url',
  PRIORITY_CHANGED: 'Changed conversation priority',
  PARTICIPANT_CHANGED: 'Changed conversation participant',
});

export const ACCOUNT_EVENTS = Object.freeze({
  CHANGE_ACCOUNT: 'Changed account',
  ADDED_A_CUSTOM_ATTRIBUTE: 'Added a custom attribute',
  ADDED_AN_INBOX: 'Added an inbox',
  CHANGE_LANGUAGE: 'Changed language',
  OPEN_SUPPORT: 'Opened help support',
  CHANGE_URL: 'Changed URL',
  ENABLE_PUSH_NOTIFICATION: 'Enabled push notification',
  FORGOT_PASSWORD: 'Requested forgot password',
});

export const LABEL_EVENTS = Object.freeze({
  CREATE: 'Created a label',
  UPDATE: 'Updated a label',
  DELETED: 'Deleted a label',
  APPLY_LABEL: 'Applied a label',
});

export const PROFILE_EVENTS = Object.freeze({
  TOGGLE_AVAILABILITY_STATUS: 'Changed availability status',
  CHANGE_PREFERENCES: 'Changed notification preferences',
});

export const ONBOARDING_EVENTS = Object.freeze({
  FLOW_STARTED: 'Onboarding flow started',
  FLOW_COMPLETED: 'Onboarding flow completed',
  FLOW_SKIPPED: 'Onboarding flow skipped',
  QUESTION_ANSWERED: 'Onboarding question answered',
  SCREEN_CHANGED: 'Onboarding screen changed',
  STEP_COMPLETED: 'Onboarding step completed',
  ERROR_OCCURRED: 'Onboarding error occurred',
  BACK_BUTTON_PRESSED: 'Onboarding back button pressed',
  FLOW_ABANDONED: 'Onboarding flow abandoned',
  RETRY_ATTEMPTED: 'Onboarding retry attempted',
});
