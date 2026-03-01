import { Platform } from 'react-native';
import notifee, { AndroidImportance, AndroidVisibility, AndroidStyle } from '@notifee/react-native';

type NotificationData = Record<string, string | number | object>;

export const displayRichNotification = async (notification: {
  title: string;
  body: string;
  data?: Record<string, unknown>;
  imageUrl?: string;
}) => {
  // Convert data to the expected type
  const safeData: NotificationData | undefined = notification.data
    ? (Object.fromEntries(
        Object.entries(notification.data).filter(
          ([, v]) => typeof v === 'string' || typeof v === 'number' || typeof v === 'object',
        ),
      ) as NotificationData)
    : undefined;

  if (Platform.OS === 'ios') {
    await notifee.displayNotification({
      title: notification.title,
      body: notification.body,
      data: safeData,
      ios: {
        sound: 'default',
        attachments: notification.imageUrl
          ? [
              {
                url: notification.imageUrl,
                thumbnailHidden: false,
              },
            ]
          : undefined,
        foregroundPresentationOptions: {
          sound: true,
          banner: true,
          list: true,
        },
      },
    });
  } else {
    // Android
    const channelId = await notifee.createChannel({
      id: 'chatwoot-messages',
      name: 'Chat Messages',
      importance: AndroidImportance.HIGH,
      visibility: AndroidVisibility.PUBLIC,
    });

    await notifee.displayNotification({
      title: notification.title,
      body: notification.body,
      data: safeData,
      android: {
        channelId,
        importance: AndroidImportance.HIGH,
        pressAction: {
          id: 'default',
        },
        largeIcon: notification.imageUrl,
        style: notification.imageUrl
          ? {
              type: AndroidStyle.BIGPICTURE,
              picture: notification.imageUrl,
            }
          : undefined,
      },
    });
  }
};
