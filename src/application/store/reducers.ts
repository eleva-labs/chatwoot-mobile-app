import { combineReducers } from 'redux';

import authSlice from '@application/store/auth/authSlice';
import settingsSlice from '@application/store/settings/settingsSlice';
import conversationFilterSlice from '@application/store/conversation/conversationFilterSlice';
import conversationSelectedSlice from '@application/store/conversation/conversationSelectedSlice';
import conversationHeaderSlice from '@application/store/conversation/conversationHeaderSlice';
import conversationActionSlice from '@application/store/conversation/conversationActionSlice';
import conversationSlice from '@application/store/conversation/conversationSlice';
import inboxSlice from '@application/store/inbox/inboxSlice';
import labelReducer from '@application/store/label/labelSlice';
import contactSlice from '@application/store/contact/contactSlice';
import assignableAgentSlice from '@application/store/assignable-agent/assignableAgentSlice';
import conversationTypingSlice from '@application/store/conversation/conversationTypingSlice';
import notificationSlice from '@application/store/notification/notificationSlice';
import notificationFilterSlice from '@application/store/notification/notificationFilterSlice';
import sendMessageSlice from '@application/store/conversation/sendMessageSlice';
import audioPlayerSlice from '@application/store/conversation/audioPlayerSlice';
import teamSlice from '@application/store/team/teamSlice';
import contactLabelSlice from '@application/store/contact/contactLabelSlice';
import contactConversationSlice from '@application/store/contact/contactConversationSlice';
import dashboardAppSlice from '@application/store/dashboard-app/dashboardAppSlice';
import customAttributeSlice from '@application/store/custom-attribute/customAttributeSlice';
import conversationParticipantSlice from '@application/store/conversation-participant/conversationParticipantSlice';
import localRecordedAudioCacheSlice from '@application/store/conversation/localRecordedAudioCacheSlice';

import cannedResponseSlice from '@application/store/canned-response/cannedResponseSlice';
import macroSlice from '@application/store/macro/macroSlice';
import aiChatSlice from '@application/store/ai-chat/aiChatSlice';

export const appReducer = combineReducers({
  auth: authSlice,
  settings: settingsSlice,
  conversationFilter: conversationFilterSlice,
  selectedConversation: conversationSelectedSlice,
  conversationHeader: conversationHeaderSlice,
  conversations: conversationSlice,
  conversationAction: conversationActionSlice,
  contacts: contactSlice,
  labels: labelReducer,
  inboxes: inboxSlice,
  assignableAgents: assignableAgentSlice,
  conversationTyping: conversationTypingSlice,
  notifications: notificationSlice,
  notificationFilter: notificationFilterSlice,
  sendMessage: sendMessageSlice,
  audioPlayer: audioPlayerSlice,
  teams: teamSlice,
  macros: macroSlice,
  contactLabels: contactLabelSlice,
  contactConversations: contactConversationSlice,
  dashboardApps: dashboardAppSlice,
  customAttributes: customAttributeSlice,
  conversationParticipants: conversationParticipantSlice,
  cannedResponses: cannedResponseSlice,
  localRecordedAudioCache: localRecordedAudioCacheSlice,
  aiChat: aiChatSlice,
});
