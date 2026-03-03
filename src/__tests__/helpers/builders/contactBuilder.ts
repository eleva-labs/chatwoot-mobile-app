/**
 * Test Data Builder for Contact
 *
 * Creates valid Contact objects with sensible defaults.
 * Use fluent methods to customize fields for specific test scenarios.
 */

import type { Contact } from '@domain/types/Contact';
import type { AvailabilityStatus } from '@domain/types/common/AvailabilityStatus';

class ContactBuilder {
  private contact: Contact = {
    id: 1,
    name: 'Test Contact',
    email: 'test@example.com',
    phoneNumber: null,
    thumbnail: null,
    identifier: null,
    additionalAttributes: {},
    customAttributes: {},
    createdAt: 1700000000,
    lastActivityAt: null,
    type: 'contact',
  };

  withId(id: number): this {
    this.contact.id = id;
    return this;
  }

  withName(name: string | null): this {
    this.contact.name = name;
    return this;
  }

  withEmail(email: string | null): this {
    this.contact.email = email;
    return this;
  }

  withPhone(phoneNumber: string | null): this {
    this.contact.phoneNumber = phoneNumber;
    return this;
  }

  withThumbnail(thumbnail: string | null): this {
    this.contact.thumbnail = thumbnail;
    return this;
  }

  withIdentifier(identifier: string | null): this {
    this.contact.identifier = identifier;
    return this;
  }

  withAvailabilityStatus(status: AvailabilityStatus): this {
    this.contact.availabilityStatus = status;
    return this;
  }

  withAdditionalAttributes(attrs: Contact['additionalAttributes']): this {
    this.contact.additionalAttributes = attrs;
    return this;
  }

  withCustomAttributes(attrs: Record<string, string>): this {
    this.contact.customAttributes = attrs;
    return this;
  }

  withCreatedAt(createdAt: number): this {
    this.contact.createdAt = createdAt;
    return this;
  }

  withLastActivityAt(lastActivityAt: number | null): this {
    this.contact.lastActivityAt = lastActivityAt;
    return this;
  }

  build(): Contact {
    return { ...this.contact };
  }
}

export const aContact = () => new ContactBuilder();
