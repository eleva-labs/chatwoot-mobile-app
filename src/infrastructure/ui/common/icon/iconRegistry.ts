import * as Icons from '@/svg-icons';
import type { ComponentType } from 'react';

/**
 * Icon names in kebab-case for better DX with autocomplete
 */
export type IconName =
  | 'add'
  | 'add-participant'
  | 'ai-assisst'
  | 'ai-on'
  | 'assign'
  | 'attach-file'
  | 'attachment'
  | 'audio'
  | 'bot'
  | 'call'
  | 'camera'
  | 'canned-response'
  | 'caret-bottom-small'
  | 'caret-right'
  | 'chat'
  | 'chatwoot'
  | 'check'
  | 'checked'
  | 'chevron-left'
  | 'clear'
  | 'close'
  | 'company'
  | 'conversation'
  | 'copy'
  | 'delete'
  | 'document-attachment'
  | 'double-check'
  | 'email'
  | 'empty-state'
  | 'error'
  | 'eye'
  | 'eye-slash'
  | 'facebook'
  | 'facebook-channel'
  | 'facebook-filled'
  | 'file'
  | 'file-error'
  | 'filter'
  | 'github'
  | 'grid'
  | 'high'
  | 'image-attachment'
  | 'inbox'
  | 'inbox-filter'
  | 'info'
  | 'instagram-filled'
  | 'key-round'
  | 'label-tag'
  | 'link'
  | 'linked'
  | 'linkedin'
  | 'loading'
  | 'location'
  | 'lock'
  | 'low'
  | 'macro'
  | 'macros'
  | 'mail'
  | 'mail-filled'
  | 'map'
  | 'mark-as-read'
  | 'mark-as-unread'
  | 'medium'
  | 'message-pending'
  | 'messenger-filled'
  | 'mute'
  | 'no-priority'
  | 'notification'
  | 'notification-assigned'
  | 'notification-mention'
  | 'notification-new-message'
  | 'notification-sla'
  | 'notification-snoozed'
  | 'open'
  | 'outgoing'
  | 'overflow'
  | 'pending'
  | 'person'
  | 'phone'
  | 'photos'
  | 'play'
  | 'player'
  | 'priority'
  | 'private-note'
  | 'resolved'
  | 'search'
  | 'self-assign'
  | 'send'
  | 'settings'
  | 'sla'
  | 'sla-missed'
  | 'sms-filled'
  | 'snoozed'
  | 'status'
  | 'switch'
  | 'team'
  | 'telegram'
  | 'telegram-filled'
  | 'theme'
  | 'tick'
  | 'translate'
  | 'trash'
  | 'unassigned'
  | 'unchecked'
  | 'urgent'
  | 'user'
  | 'video-call'
  | 'voice-note'
  | 'warning'
  | 'website'
  | 'website-filled'
  | 'whatsapp'
  | 'whatsapp-filled'
  | 'x'
  | 'x-filled';

/**
 * Icon variant - some icons have filled/outline variants
 */
export type IconVariant = 'default' | 'filled' | 'outline';

/**
 * Icon registry entry - maps variants to components
 */
export interface IconRegistryEntry {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  default: ComponentType<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  filled?: ComponentType<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  outline?: ComponentType<any>;
}

/**
 * Icon registry mapping icon names to components
 *
 * Note: Icons with Filled/Outline variants have separate entries for each variant.
 * Use the `variant` prop in NamedIcon to access them.
 */
export const iconRegistry: Record<IconName, IconRegistryEntry> = {
  add: { default: Icons.AddIcon },
  'add-participant': { default: Icons.AddParticipant },
  'ai-assisst': { default: Icons.AIAssisst },
  'ai-on': { default: Icons.AIOnIcon },
  assign: { default: Icons.AssignIcon },
  'attach-file': { default: Icons.AttachFileIcon },
  attachment: { default: Icons.AttachmentIcon },
  audio: { default: Icons.AudioIcon },
  bot: { default: Icons.BotIcon },
  call: { default: Icons.CallIcon },
  camera: { default: Icons.CameraIcon },
  'canned-response': { default: Icons.CannedResponseIcon },
  'caret-bottom-small': { default: Icons.CaretBottomSmall },
  'caret-right': { default: Icons.CaretRight },
  chat: { default: Icons.ChatIcon },
  chatwoot: { default: Icons.ChatwootIcon },
  check: { default: Icons.CheckIcon },
  checked: { default: Icons.CheckedIcon },
  'chevron-left': { default: Icons.ChevronLeft },
  clear: { default: Icons.ClearIcon },
  close: { default: Icons.CloseIcon },
  company: { default: Icons.CompanyIcon },
  conversation: {
    default: Icons.ConversationIcon,
    filled: Icons.ConversationIconFilled,
    outline: Icons.ConversationIconOutline,
  },
  copy: { default: Icons.CopyIcon },
  delete: { default: Icons.DeleteIcon },
  'document-attachment': { default: Icons.DocumentAttachmentIcon },
  'double-check': { default: Icons.DoubleCheckIcon },
  email: { default: Icons.EmailIcon },
  'empty-state': { default: Icons.EmptyStateIcon },
  error: { default: Icons.ErrorIcon },
  eye: { default: Icons.EyeIcon },
  'eye-slash': { default: Icons.EyeSlash },
  facebook: { default: Icons.FacebookIcon },
  'facebook-channel': { default: Icons.FacebookChannelIcon },
  'facebook-filled': { default: Icons.FacebookFilledIcon },
  file: { default: Icons.FileIcon },
  'file-error': { default: Icons.FileErrorIcon },
  filter: { default: Icons.FilterIcon },
  github: { default: Icons.GithubIcon },
  grid: { default: Icons.GridIcon },
  high: { default: Icons.HighIcon },
  'image-attachment': { default: Icons.ImageAttachmentIcon },
  inbox: {
    default: Icons.InboxIcon,
    filled: Icons.InboxIconFilled,
    outline: Icons.InboxIconOutline,
  },
  'inbox-filter': { default: Icons.InboxFilterIcon },
  info: { default: Icons.InfoIcon },
  'instagram-filled': { default: Icons.InstagramFilledIcon },
  'key-round': { default: Icons.KeyRoundIcon },
  'label-tag': { default: Icons.LabelTag },
  link: { default: Icons.LinkIcon },
  linked: { default: Icons.LinkedIcon },
  linkedin: { default: Icons.LinkedinIcon },
  loading: { default: Icons.LoadingIcon },
  location: { default: Icons.LocationIcon },
  lock: { default: Icons.LockIcon },
  low: { default: Icons.LowIcon },
  macro: { default: Icons.MacroIcon },
  macros: { default: Icons.MacrosIcon },
  mail: { default: Icons.MailIcon },
  'mail-filled': { default: Icons.MailFilledIcon },
  map: { default: Icons.MapIcon },
  'mark-as-read': { default: Icons.MarkAsRead },
  'mark-as-unread': { default: Icons.MarkAsUnRead },
  medium: { default: Icons.MediumIcon },
  'message-pending': { default: Icons.MessagePendingIcon },
  'messenger-filled': { default: Icons.MessengerFilledIcon },
  mute: { default: Icons.MuteIcon },
  'no-priority': { default: Icons.NoPriorityIcon },
  notification: { default: Icons.NotificationIcon },
  'notification-assigned': { default: Icons.NotificationAssignedIcon },
  'notification-mention': { default: Icons.NotificationMentionIcon },
  'notification-new-message': { default: Icons.NotificationNewMessageIcon },
  'notification-sla': { default: Icons.NotificationSLAIcon },
  'notification-snoozed': { default: Icons.NotificationSnoozedIcon },
  open: { default: Icons.OpenIcon },
  outgoing: { default: Icons.OutgoingIcon },
  overflow: { default: Icons.Overflow },
  pending: {
    default: Icons.PendingIcon,
    filled: Icons.PendingFilledIcon,
  },
  person: { default: Icons.PersonIcon },
  phone: { default: Icons.PhoneIcon },
  photos: { default: Icons.PhotosIcon },
  play: { default: Icons.PlayIcon },
  player: { default: Icons.PlayerIcon },
  priority: { default: Icons.PriorityIcon },
  'private-note': { default: Icons.PrivateNoteIcon },
  resolved: {
    default: Icons.ResolvedIcon,
    filled: Icons.ResolvedFilledIcon,
  },
  search: { default: Icons.SearchIcon },
  'self-assign': { default: Icons.SelfAssign },
  send: { default: Icons.SendIcon },
  settings: {
    default: Icons.SettingsIcon,
    filled: Icons.SettingsIconFilled,
    outline: Icons.SettingsIconOutline,
  },
  sla: { default: Icons.SLAIcon },
  'sla-missed': { default: Icons.SlaMissedIcon },
  'sms-filled': { default: Icons.SMSFilledIcon },
  snoozed: {
    default: Icons.SnoozedIcon,
    filled: Icons.SnoozedFilledIcon,
  },
  status: { default: Icons.StatusIcon },
  switch: { default: Icons.SwitchIcon },
  team: { default: Icons.TeamIcon },
  telegram: { default: Icons.TelegramIcon },
  'telegram-filled': { default: Icons.TelegramFilledIcon },
  theme: { default: Icons.ThemeIcon },
  tick: { default: Icons.TickIcon },
  translate: { default: Icons.TranslateIcon },
  trash: { default: Icons.Trash },
  unassigned: { default: Icons.UnassignedIcon },
  unchecked: { default: Icons.UncheckedIcon },
  urgent: { default: Icons.UrgentIcon },
  user: { default: Icons.UserIcon },
  'video-call': { default: Icons.VideoCall },
  'voice-note': { default: Icons.VoiceNote },
  warning: { default: Icons.WarningIcon },
  website: { default: Icons.WebsiteIcon },
  'website-filled': { default: Icons.WebsiteFilledIcon },
  whatsapp: { default: Icons.WhatsAppIcon },
  'whatsapp-filled': { default: Icons.WhatsAppFilledIcon },
  x: { default: Icons.XIcon },
  'x-filled': { default: Icons.XFilledIcon },
};
