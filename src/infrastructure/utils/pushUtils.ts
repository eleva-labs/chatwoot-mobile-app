import * as Notifications from 'expo-notifications';
import { NOTIFICATION_TYPES } from '@domain/constants';
import { Notification } from '@domain/types/Notification';

export const clearAllDeliveredNotifications = async () => {
  await Notifications.dismissAllNotificationsAsync();
};

export const updateBadgeCount = async ({ count = 0 }) => {
  if (count >= 0) {
    await Notifications.setBadgeCountAsync(count);
  }
};

export const findConversationLinkFromPush = ({
  notification,
  installationUrl,
}: {
  notification: Notification;
  installationUrl: string;
}) => {
  const { notificationType } = notification;

  if (NOTIFICATION_TYPES.includes(notificationType)) {
    const { primaryActor, primaryActorId, primaryActorType } = notification;
    let conversationId = null;
    if (primaryActorType === 'Conversation') {
      conversationId = primaryActor.id;
    } else if (primaryActorType === 'Message') {
      conversationId = primaryActor.conversationId;
    }
    if (conversationId) {
      const conversationLink = `${installationUrl}/app/accounts/1/conversations/${conversationId}/${primaryActorId}/${primaryActorType}`;
      return conversationLink;
    }
  }
  return;
};

interface FCMMessage {
  data?: {
    payload?: string;
    notification?: string;
  };
}

export const findNotificationFromFCM = ({ message }: { message: FCMMessage }) => {
  let notification = null;
  // FCM HTTP v1
  if (message?.data?.payload) {
    const parsedPayload = JSON.parse(message.data.payload);
    notification = parsedPayload.data.notification;
  }
  // FCM legacy. It will be deprecated soon
  else if (message.data?.notification) {
    notification = JSON.parse(message.data.notification);
  }
  return notification;
};
