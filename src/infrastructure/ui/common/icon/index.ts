/**
 * Icon System
 *
 * Provides two ways to use icons:
 *
 * 1. **String-based (Recommended)**: Better DX with autocomplete
 *    ```tsx
 *    <Icon name="bot" size={24} />
 *    <Icon name="conversation" variant="filled" />
 *    <NamedIcon name="attach-file" color="#FF0000" />
 *    ```
 *
 * 2. **JSX-based (Legacy)**: Backward compatible
 *    ```tsx
 *    <Icon icon={<BotIcon />} size={24} />
 *    ```
 */

export { Icon } from './Icon';
export type { IconComponentProps } from './Icon';

export { NamedIcon } from './NamedIcon';
export type { NamedIconProps } from './NamedIcon';

export type { IconName, IconVariant, IconRegistryEntry } from './iconRegistry';
export { iconRegistry } from './iconRegistry';
