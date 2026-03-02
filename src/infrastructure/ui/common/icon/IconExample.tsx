/**
 * Icon System Usage Examples
 *
 * This file demonstrates the different ways to use the enhanced Icon system.
 * Remove this file after reviewing the examples.
 */

import React from 'react';
import { View, Text } from 'react-native';
import { Icon, NamedIcon } from './index';
import { BotIcon } from '@/svg-icons';

/**
 * TypeScript Examples
 */

// Using in a component prop
import type { IconName, IconVariant } from './index'; // For legacy comparison

export const IconExamples = () => {
  return (
    <View style={{ padding: 20, gap: 20 }}>
      <View>
        <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 8 }}>
          String-based API (Recommended)
        </Text>

        {/* Basic usage with name */}
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
          <Icon name="bot" />
          <Icon name="send" />
          <Icon name="attach-file" />
        </View>

        {/* With variants */}
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
          <Icon name="conversation" variant="default" />
          <Icon name="conversation" variant="filled" />
          <Icon name="conversation" variant="outline" />
        </View>

        {/* With size and color */}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Icon name="warning" size={32} color="#FF0000" />
          <Icon name="bot" size={24} color="#0066FF" />
          <Icon name="check" size={16} color="#00CC00" />
        </View>
      </View>

      <View>
        <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 8 }}>
          Using NamedIcon directly
        </Text>

        <View style={{ flexDirection: 'row', gap: 8 }}>
          <NamedIcon name="bot" size={24} />
          <NamedIcon name="send" size={24} />
          <NamedIcon name="attach-file" size={24} />
        </View>
      </View>

      <View>
        <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 8 }}>
          Legacy JSX-based API (Still works)
        </Text>

        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Icon icon={<BotIcon />} size={24} />
        </View>
      </View>

      <View>
        <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 8 }}>
          Icons with Variants
        </Text>

        {/* Inbox variants */}
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
          <NamedIcon name="inbox" variant="default" />
          <NamedIcon name="inbox" variant="filled" />
          <NamedIcon name="inbox" variant="outline" />
        </View>

        {/* Settings variants */}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <NamedIcon name="settings" variant="default" />
          <NamedIcon name="settings" variant="filled" />
          <NamedIcon name="settings" variant="outline" />
        </View>
      </View>
    </View>
  );
};

// Example variables (for demonstration only)
// const myIcon: IconName = 'bot'; // Autocomplete works here!
// const variant: IconVariant = 'filled';
interface MyComponentProps {
  iconName: IconName;
  iconVariant?: IconVariant;
}

export const MyComponent: React.FC<MyComponentProps> = ({ iconName, iconVariant = 'default' }) => {
  return <Icon name={iconName} variant={iconVariant} size={24} />;
};

// Usage:
// <MyComponent iconName="bot" />
// <MyComponent iconName="conversation" iconVariant="filled" />
