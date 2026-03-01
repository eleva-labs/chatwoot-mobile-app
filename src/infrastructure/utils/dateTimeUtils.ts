import {
  fromUnixTime,
  formatDistanceToNow,
  isSameDay,
  isSameYear,
  format,
  differenceInHours,
} from 'date-fns';
import i18n from '@infrastructure/i18n';
import { UnixTimestamp } from '@domain/types';

export const formatRelativeTime = (time: number) => {
  const unixTime = fromUnixTime(time);
  return formatDistanceToNow(unixTime, { addSuffix: true });
};

export const formatTimeToShortForm = (time: string, withAgo = false) => {
  const suffix = withAgo ? ' ago' : '';
  const timeMappings: { [key: string]: string } = {
    'less than a minute ago': 'now',
    'a minute ago': `1m${suffix}`,
    'an hour ago': `1h${suffix}`,
    'a day ago': `1d${suffix}`,
    'a month ago': `1mo${suffix}`,
    'a year ago': `1y${suffix}`,
  };
  // Check if the time string is one of the specific cases
  if (timeMappings[time]) {
    return timeMappings[time];
  }
  const convertToShortTime = time
    .replace(/about|over|almost|/g, '')
    .replace(' minute ago', `m${suffix}`)
    .replace(' minutes ago', `m${suffix}`)
    .replace(' hour ago', `h${suffix}`)
    .replace(' hours ago', `h${suffix}`)
    .replace(' day ago', `d${suffix}`)
    .replace(' days ago', `d${suffix}`)
    .replace(' month ago', `mo${suffix}`)
    .replace(' months ago', `mo${suffix}`)
    .replace(' year ago', `y${suffix}`)
    .replace(' years ago', `y${suffix}`);
  return convertToShortTime;
};

export const formatDate = (date: UnixTimestamp, dateFormat = 'MMM dd, yyyy') => {
  const dateObj = fromUnixTime(date);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (isSameDay(dateObj, today)) {
    return i18n.t('CONVERSATION.TODAY');
  }
  if (isSameDay(dateObj, yesterday)) {
    return i18n.t('CONVERSATION.YESTERDAY');
  }
  return format(dateObj, dateFormat);
};

/** @deprecated Use `messageTimestamp` instead. */
export const unixTimestampToReadableTime = (unixTimestamp: number) => {
  const date = new Date(unixTimestamp * 1000); // Convert Unix timestamp to milliseconds
  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const formattedHours = (hours % 12 || 12).toString().padStart(2, '0');

  return `${formattedHours}:${minutes} ${ampm}`;
};

export const messageStamp = ({
  time,
  dateFormat = 'h:mm a',
}: {
  time: number;
  dateFormat?: string;
}) => {
  const unixTime = fromUnixTime(time);
  return format(unixTime, dateFormat);
};

/**
 * Provides a formatted timestamp matching web's MessageMeta.vue format.
 * Uses 'LLL d, h:mm a' (e.g., "Feb 28, 2:30 PM") for same-year dates,
 * and 'LLL d y, h:mm a' (e.g., "Feb 28 2023, 2:30 PM") for different-year dates.
 */
export const messageTimestamp = (time: number, dateFormat = 'LLL d, h:mm a'): string => {
  const messageTime = fromUnixTime(time);
  const now = new Date();
  if (!isSameYear(messageTime, now)) {
    return format(messageTime, 'LLL d y, h:mm a');
  }
  return format(messageTime, dateFormat);
};

/**
 * Returns true if the given unix timestamp is more than 24 hours in the past.
 * Used for Instagram story expiration checks.
 */
export const isOlderThan24Hours = (unixTimestamp: number): boolean => {
  const currentTime = new Date();
  const messageTime = new Date(unixTimestamp * 1000);
  const hoursDifference = differenceInHours(currentTime, messageTime);
  return hoursDifference > 24;
};
