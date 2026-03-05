# Conversation Store

## Overview

The conversation store manages conversation state, messages, and related metadata using Redux. This store handles all conversation-related operations including fetching, creating, updating, and deleting conversations and messages.

## Zod Schema Validation

All API responses are validated at runtime using Zod schemas to ensure type safety and catch contract changes early.

### Benefits

- **Runtime type safety**: Catch API contract changes before they cause runtime errors
- **Type-safe Redux state**: Auto-inferred TypeScript types from Zod schemas
- **Better error messages**: Detailed validation errors for malformed data
- **Foundation for domain entities**: Validated data can be safely transformed into domain entities

### Schemas

The following schemas are available in `conversationSchemas.ts`:

#### Entity Schemas
- **`AttachmentSchema`** - File attachments (images, videos, audio, files)
- **`SenderSchema`** - Message sender information
- **`MessageSchema`** - Individual message validation
- **`ConversationSchema`** - Conversation object validation

#### API Response Schemas
- **`ConversationListResponseSchema`** - List API response validation
- **`SingleConversationResponseSchema`** - Single conversation fetch response
- **`MessagesResponseSchema`** - Messages list response
- **`SendMessageResponseSchema`** - Send message response
- **`ToggleConversationStatusResponseSchema`** - Status toggle response
- **`AssigneeResponseSchema`** - Assignee update response
- **`AssignTeamResponseSchema`** - Team assignment response
- **`MarkMessagesUnreadResponseSchema`** - Mark unread response
- **`MarkMessageReadResponseSchema`** - Mark read response
- **`DeleteMessageResponseSchema`** - Delete message response

### Usage Example

```typescript
import { validateConversationList } from './conversationSchemas';

const response = await apiService.get('/conversations');
const validated = validateConversationList(response.data);
// validated is now type-safe and runtime-verified
```

### Error Handling

Validation errors are automatically logged to Sentry with full context:
- Validation error details (field path, expected type, received value)
- Raw API response data
- Method name where error occurred
- Tagged as `schema_validation` for easy filtering

Example error handling in service methods:

```typescript
try {
  const response = await apiService.get('/conversations');
  const validated = validateConversationList(response.data);
  return validated;
} catch (error) {
  if (error instanceof ZodError) {
    handleValidationError('getConversations', error, response.data);
    throw error;
  }
  throw error;
}
```

### Adding New Fields

When the Chatwoot API adds new fields:

1. **Update the schema** in `conversationSchemas.ts`
   ```typescript
   export const MessageSchema = z.object({
     // ... existing fields
     new_field: z.string().optional(), // Mark as optional if not guaranteed
   });
   ```

2. **Add tests** in `conversationSchemas.test.ts`
   ```typescript
   it('should validate message with new_field', () => {
     const message = {
       // ... required fields
       new_field: 'value',
     };
     expect(() => MessageSchema.parse(message)).not.toThrow();
   });
   ```

3. **Update TypeScript types** (auto-inferred from schemas)
   - Types are automatically inferred using `z.infer<typeof Schema>`
   - No manual type updates needed unless using separate type definitions

4. **Run tests** to ensure validation works
   ```bash
   pnpm test conversationSchemas
   ```

### Schema Guidelines

- **Required fields**: Fields that are always present in API responses
  ```typescript
  id: z.number()
  ```

- **Optional fields**: Fields that may be missing
  ```typescript
  updated_at: z.number().optional()
  ```

- **Nullable fields**: Fields that can be explicitly `null`
  ```typescript
  source_id: z.string().nullable()
  ```

- **Optional and nullable**: Fields that can be missing OR null
  ```typescript
  sender: SenderSchema.optional().nullable()
  ```

- **Enums**: Use `z.enum()` for fixed value sets
  ```typescript
  status: z.enum(['open', 'resolved', 'pending', 'snoozed'])
  ```

- **Records**: Use `z.record()` for dynamic key-value objects
  ```typescript
  custom_attributes: z.record(z.unknown())
  ```

## Service Methods

All service methods in `ConversationService` are wrapped with Zod validation:

- `getConversations()` - Fetch conversation list
- `fetchConversation()` - Fetch single conversation
- `fetchPreviousMessages()` - Fetch older messages
- `sendMessage()` - Send a new message
- `toggleConversationStatus()` - Change conversation status
- `assignConversation()` - Assign to agent
- `assignTeam()` - Assign to team
- `markMessagesUnread()` - Mark as unread
- `markMessageRead()` - Mark as read
- `deleteMessage()` - Delete a message
- `bulkAction()` - Bulk operations (no validation - returns void/status code only)
- `muteConversation()` - Mute conversation (no validation needed - void response)
- `unmuteConversation()` - Unmute conversation (no validation needed - void response)
- `addOrUpdateConversationLabels()` - Update labels (no validation needed - void response)
- `toggleTyping()` - Toggle typing indicator (no validation needed - void response)
- `togglePriority()` - Toggle priority (no validation needed - void response)

## Testing

Run conversation store tests:

```bash
# Run all conversation tests
pnpm test conversation

# Run only schema tests
pnpm test conversationSchemas

# Run with coverage
pnpm test conversationSchemas --coverage
```

Expected coverage: >90% for `conversationSchemas.ts`

## Debugging Validation Errors

When a validation error occurs:

1. **Check console logs** for detailed error information
   ```
   [ValidationError] fetchConversation: {
     errors: [...],
     rawData: { ... }
   }
   ```

2. **Check Sentry dashboard** for production errors
   - Filter by tag: `type: schema_validation`
   - View raw API response in error context

3. **Common validation errors**:
   - **Required field missing**: API didn't return expected field
   - **Type mismatch**: API returned different type (e.g., string instead of number)
   - **Invalid enum value**: API returned value not in allowed set
   - **Unexpected structure**: API response structure changed

4. **Fix validation errors**:
   - If API is correct: Update schema to match new API contract
   - If API is wrong: Report bug to backend team
   - If field is sometimes missing: Mark as `.optional()`

## Migration Notes

This store has been enhanced with Zod validation as part of Phase 1 of the Modern Architecture Standardization initiative (Workstream C, Cycle C1).

Previous behavior:
- API responses were typed but not validated at runtime
- Type errors could occur silently with malformed data

Current behavior:
- All API responses are validated before processing
- Validation errors are caught, logged to Sentry, and thrown
- Type safety is guaranteed at both compile-time and runtime
