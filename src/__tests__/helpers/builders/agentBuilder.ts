/**
 * Test Data Builder for Agent
 *
 * Creates valid Agent objects with sensible defaults.
 * Use fluent methods to customize fields for specific test scenarios.
 */

import type { Agent } from '@domain/types/Agent';
import type { AvailabilityStatus } from '@domain/types/common/AvailabilityStatus';
import type { UserRole } from '@domain/types/common/UserRole';

class AgentBuilder {
  private agent: Agent = {
    id: 1,
    accountId: 1,
    availabilityStatus: 'online',
    autoOffline: false,
    confirmed: true,
    email: 'agent@example.com',
    availableName: 'Test Agent',
    customAttributes: {},
    name: 'Test Agent',
    role: 'agent',
    thumbnail: null,
    type: 'user',
  };

  withId(id: number): this {
    this.agent.id = id;
    return this;
  }

  withName(name: string | null): this {
    this.agent.name = name;
    this.agent.availableName = name;
    return this;
  }

  withEmail(email: string): this {
    this.agent.email = email;
    return this;
  }

  withAvailability(status: AvailabilityStatus): this {
    this.agent.availabilityStatus = status;
    return this;
  }

  withThumbnail(thumbnail: string | null): this {
    this.agent.thumbnail = thumbnail;
    return this;
  }

  withRole(role: UserRole): this {
    this.agent.role = role;
    return this;
  }

  withAccountId(accountId: number | null): this {
    this.agent.accountId = accountId;
    return this;
  }

  withAutoOffline(autoOffline: boolean): this {
    this.agent.autoOffline = autoOffline;
    return this;
  }

  build(): Agent {
    return { ...this.agent };
  }
}

export const anAgent = () => new AgentBuilder();
