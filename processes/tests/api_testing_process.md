# API Integration Testing Process

**Version**: 3.0.0
**Last Updated**: 2025-11-12
**Status**: Active
**Document Type**: Process Guide
**Project**: Chatwoot Mobile App (React Native + Expo + TypeScript)

---

## Table of Contents

1. [Overview](#overview)
2. [Key Principles](#key-principles)
3. [Phase 1: Discovery](#phase-1-discovery---understand-current-api-state)
4. [Phase 2: Planning](#phase-2-planning---create-comprehensive-test-plan)
5. [Phase 3: Environment Setup](#phase-3-environment-setup)
6. [Phase 4: Execution](#phase-4-execution---run-tests-and-track-progress)
7. [Phase 5: Issue Resolution](#phase-5-issue-resolution)
8. [Phase 6: Documentation](#phase-6-documentation)
9. [Process Checklist](#process-checklist)
10. [Related Documentation](#related-documentation)

---

## Overview

### Purpose

Ensure comprehensive, systematic, and repeatable API integration testing that:
- Validates mobile app correctly consumes Chatwoot APIs
- Tests Redux actions/services handle API responses properly
- Catches integration bugs before production
- Documents API consumption patterns (request/response handling)
- Provides regression test coverage (via Jest)
- Verifies camelCase transformation and error handling

### Document Location

**IMPORTANT**: All test documents MUST be created in `/docs/ignored/tests/`

- **Discovery reports**: `/docs/ignored/tests/<feature>_api_discovery.md`
- **Test plans**: `/docs/ignored/tests/<feature>_test_plan.md`
- **Test results**: `/docs/ignored/tests/<feature>_test_results.md`
- These documents are NOT committed to the repository
- Templates remain in `/docs/processes/tests/` for reference

### Scope

**What is Covered**:
- Redux action API integration testing
- Redux service layer testing (API calls via Axios)
- Request/response transformation validation (camelCaseKeys)
- Error scenario testing (network failures, 401, 422, 500)
- Mock API responses for Jest tests
- ActionCable WebSocket integration testing

**What is NOT Covered**:
- API endpoint implementation (backend team responsibility)
- Load/performance testing
- Security penetration testing
- UI component testing (covered in unit testing process)
- State management logic (covered in Redux slice tests)

### Process Duration

- **Discovery**: 30-45 minutes (examine Redux actions/services)
- **Planning**: 1-2 hours (define test cases)
- **Environment Setup**: 10-15 minutes (Jest + mocks)
- **Execution**: Variable (2-6 hours per feature)
- **Issue Resolution**: Variable
- **Documentation**: 20-30 minutes

**Total**: Typically 3-8 hours per feature area

---

## Key Principles

1. **Systematic Approach**
   - Follow the 6-phase process consistently
   - Don't skip phases even if timeline is tight
   - Document everything as you go

2. **Test in Isolation**
   - Each test should be independent
   - Mock API responses using Jest mocks
   - Clear mocks between tests (`jest.clearAllMocks()`)

3. **Document First, Execute Second**
   - Create test plan before writing tests
   - Update tracking document in real-time
   - Capture actual API responses for mock data

4. **Fix Fast, Verify Immediately**
   - Fix blocking issues immediately
   - Re-run tests immediately after fix
   - Run full test suite for regression

5. **Quality Over Speed**
   - Test error cases, not just happy paths
   - Validate camelCase transformation
   - Test network failures and timeouts
   - Verify error handling (toast notifications, logout on 401)

### Process Summary

The API integration testing process consists of 6 main phases:

1. **Discovery** - Understand which APIs the mobile app consumes (Redux actions/services)
2. **Planning** - Create comprehensive test plan (API integration scenarios)
3. **Environment Setup** - Configure Jest with API mocks
4. **Execution** - Write and run integration tests (Jest + mocked Axios)
5. **Issue Resolution** - Fix integration bugs in mobile code
6. **Documentation** - Record results and maintain test suite

---

## Phase 1: Discovery - Understand API Consumption

### Objective
Understand which Chatwoot APIs the mobile app consumes and how they're integrated via Redux.

### Steps

#### 1.1 Identify Redux Actions

**Location**: `src/store/[feature]/[feature]Actions.ts`

```bash
# Find all Redux action files
find src/store -name "*Actions.ts" -type f

# Search for createAsyncThunk (API calls)
grep -r "createAsyncThunk" src/store/[feature]/[feature]Actions.ts
```

**What to look for:**
- Action creators using `createAsyncThunk`
- API endpoint URLs
- Request parameters (path, query, body)
- Response handling
- Error handling patterns

**Example:**
```typescript
// src/store/auth/authActions.ts
export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials: LoginCredentials, { rejectWithValue }) => {
    try {
      const response = await authService.login(credentials);
      return response;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);
```

#### 1.2 Examine Service Layer

**Location**: `src/store/[feature]/[feature]Service.ts`

**What to look for:**
- Static methods making API calls
- Axios usage via `apiService` singleton
- URL construction (account ID injection)
- Request payload formatting
- Response transformation (camelCaseKeys)

**Example:**
```typescript
// src/store/conversation/conversationService.ts
class ConversationService {
  static async fetchConversations(params: FetchParams) {
    const response = await apiService.get('/conversations', { params });
    return camelCaseKeys(response.data);
  }

  static async sendMessage(conversationId: number, message: MessagePayload) {
    const response = await apiService.post(
      `/conversations/${conversationId}/messages`,
      message
    );
    return camelCaseKeys(response.data);
  }
}
```

#### 1.3 Review API Service Configuration

**Location**: `src/services/APIService.ts`

**What to look for:**
- Base URL configuration
- Request interceptors (auth headers, account ID)
- Response interceptors (camelCase transformation)
- Error handling (401 → logout, toast notifications)
- Timeout configuration

#### 1.4 Check ActionCable Integration

**Location**: `src/utils/actionCable.ts`

**What to look for:**
- WebSocket connection setup
- Channel subscriptions
- Event handlers (`message.created`, `conversation.updated`)
- Data transformation (snake_case → camelCase)
- Redux dispatch integration

#### 1.5 Create Discovery Summary

**Deliverable**: `/docs/ignored/tests/<feature>_api_discovery.md`

**Template:**
```markdown
# API Integration Discovery: <Feature>

## Redux Actions Identified
- `fetchConversations` - GET /api/v1/accounts/:account_id/conversations
- `sendMessage` - POST /api/v1/accounts/:account_id/conversations/:id/messages
- `updateConversation` - PATCH /api/v1/accounts/:account_id/conversations/:id

## Service: src/store/conversation/conversationService.ts
- Methods: fetchConversations, sendMessage, updateConversation
- API calls via: apiService (Axios singleton)
- Account ID: Automatically injected by interceptor
- Response transform: camelCaseKeys applied

## Redux Slices Affected
- `conversationSlice` - stores conversation list
- `selectedConversationSlice` - stores active conversation
- `sendMessageSlice` - tracks message sending state

## Error Handling
- 401 Unauthorized → Auto logout via interceptor
- 422 Validation Error → Return validation errors
- 500 Server Error → Show toast notification
- Network Error → Show error toast

## ActionCable Events
- `message.created` → Add message to conversation
- `conversation.status_changed` → Update conversation status
- `conversation.typing_on` → Show typing indicator
```

---

## Phase 2: Planning - Create Comprehensive Test Plan

### Objective
Create a detailed test plan for Redux action/service API integration testing.

### Steps

#### 2.1 Define Test Scope

**In Scope:**
- Redux action success scenarios (fulfilled)
- Redux action error scenarios (rejected)
- Service layer API calls (mocked Axios)
- Response transformation (camelCaseKeys)
- Error handling (401, 422, 500, network errors)
- State updates after API responses
- Loading states (pending, fulfilled, rejected)

**Out of Scope:**
- API endpoint implementation (backend responsibility)
- Redux slice reducers (covered in unit tests)
- UI component behavior (covered in component tests)
- Performance/load testing

#### 2.2 Create Test Plan Document

**Template**: See `/docs/processes/tests/TEST_PLAN_TEMPLATE.md`

**Location**: `/docs/ignored/tests/<feature>_test_plan.md`

**Key Sections:**
1. **Redux Actions - Success Cases** - API calls that succeed
2. **Redux Actions - Error Cases** - API calls that fail
3. **Service Layer Tests** - Mock Axios calls
4. **Response Transformation** - camelCaseKeys validation
5. **Error Handling** - 401/422/500 responses
6. **ActionCable Integration** - WebSocket event handling

**Example Test Case:**
```markdown
### TC-001: Fetch Conversations - Success

**Redux Action**: `fetchConversations`
**Service Method**: `conversationService.fetchConversations()`
**API Endpoint**: `GET /api/v1/accounts/:account_id/conversations`
**Expected State**: `fulfilled`

**Test Steps:**
1. Mock `apiService.get()` to return mock conversations
2. Dispatch `fetchConversations()` action
3. Verify action resolves with fulfilled state
4. Verify response is camelCased
5. Verify Redux state updated correctly

**Mock Response:**
```json
{
  "data": {
    "payload": [
      { "id": 1, "status": "open", "created_at": "2025-01-01" }
    ],
    "meta": { "current_page": 1, "total_count": 1 }
  }
}
```

**Expected Transformed Response:**
```json
{
  "payload": [
    { "id": 1, "status": "open", "createdAt": "2025-01-01" }
  ],
  "meta": { "currentPage": 1, "totalCount": 1 }
}
```

**Validation:**
- [ ] Action returns fulfilled state
- [ ] Response is camelCased (createdAt, not created_at)
- [ ] Conversation added to Redux store
- [ ] Loading state transitions: idle → pending → fulfilled
```

#### 2.3 Estimate Test Effort

**Rough Estimates:**
- Simple feature (3-5 actions): 2-3 hours
- Complex feature (10+ actions): 4-6 hours
- ActionCable integration: +2 hours
- Error scenarios: +50% time

---

## Phase 3: Environment Setup

### Objective
Configure Jest testing environment with API mocks.

### Steps

#### 3.1 Verify Jest Configuration

**File**: `jest.config.js`

Ensure React Native preset is configured:
```javascript
module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!(@react-native|react-native|@react-navigation|@reduxjs)/)',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};
```

#### 3.2 Setup Mock Files

**File**: `src/services/__mocks__/APIService.ts`

Mock the apiService singleton:
```typescript
export const apiService = {
  get: jest.fn(),
  post: jest.fn(),
  patch: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
};

export default { apiService };
```

**File**: `src/utils/__mocks__/camelCaseKeys.ts`

Mock camelCase transformation (or use real implementation):
```typescript
const camelCaseKeys = jest.fn((obj) => obj); // Pass-through for tests
export default camelCaseKeys;
```

#### 3.3 Configure Test Setup

**File**: `jest.setup.js`

```javascript
// Mock AsyncStorage
import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';
jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

// Mock API Service
jest.mock('@/services/APIService');

// Clear all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});
```

#### 3.4 Verify Environment

```bash
# Run a simple test to verify setup
pnpm test -- --testPathPattern=auth

# Should run without errors
```

---

## Phase 4: Execution - Write and Run Integration Tests

### Objective
Write Jest tests for Redux action/service API integration and track results.

### Steps

#### 4.1 Create Test Results Document

**Template**: See `/docs/processes/tests/TEST_RESULTS_TEMPLATE.md`

**Location**: `/docs/ignored/tests/<feature>_test_results.md`

**Initial State**: All tests marked ⏳ Pending

#### 4.2 Write Integration Tests

**Location**: `src/store/[feature]/specs/[feature]Actions.spec.ts`

**Test Structure:**

```typescript
// src/store/conversation/specs/conversationActions.spec.ts
import { configureStore } from '@reduxjs/toolkit';
import { apiService } from '@/services/APIService';
import { fetchConversations } from '../conversationActions';
import conversationSlice from '../conversationSlice';

// Mock API service
jest.mock('@/services/APIService');
const mockedApiService = apiService as jest.Mocked<typeof apiService>;

describe('conversationActions', () => {
  let store: any;

  beforeEach(() => {
    // Create fresh store for each test
    store = configureStore({
      reducer: {
        conversation: conversationSlice.reducer,
      },
    });
    jest.clearAllMocks();
  });

  describe('fetchConversations', () => {
    it('should fetch conversations successfully', async () => {
      // Mock API response (snake_case from backend)
      const mockResponse = {
        data: {
          payload: [
            { id: 1, status: 'open', created_at: '2025-01-01' },
          ],
          meta: { current_page: 1, total_count: 1 },
        },
      };

      mockedApiService.get.mockResolvedValueOnce(mockResponse);

      // Dispatch action
      const result = await store.dispatch(fetchConversations());

      // Verify action fulfilled
      expect(result.type).toBe('conversation/fetchConversations/fulfilled');

      // Verify API called correctly
      expect(mockedApiService.get).toHaveBeenCalledWith('/conversations', expect.any(Object));

      // Verify response transformed to camelCase
      expect(result.payload.payload[0]).toHaveProperty('createdAt');
      expect(result.payload.payload[0]).not.toHaveProperty('created_at');
    });

    it('should handle 401 error (unauthorized)', async () => {
      // Mock 401 error
      const mockError = {
        response: {
          status: 401,
          data: { error: 'Unauthorized' },
        },
      };

      mockedApiService.get.mockRejectedValueOnce(mockError);

      // Dispatch action
      const result = await store.dispatch(fetchConversations());

      // Verify action rejected
      expect(result.type).toBe('conversation/fetchConversations/rejected');
      expect(result.payload).toEqual(mockError);
    });

    it('should handle network error', async () => {
      // Mock network error
      const networkError = new Error('Network Error');
      mockedApiService.get.mockRejectedValueOnce(networkError);

      // Dispatch action
      const result = await store.dispatch(fetchConversations());

      // Verify action rejected
      expect(result.type).toBe('conversation/fetchConversations/rejected');
    });
  });
});
```

#### 4.3 Run Tests and Capture Results

```bash
# Run all action tests
pnpm test -- src/store/*/specs/*Actions.spec.ts

# Run specific feature tests
pnpm test -- src/store/conversation/specs/conversationActions.spec.ts

# Run with coverage
pnpm test -- src/store/conversation/specs --coverage
```

#### 4.4 Handle Test Failures

**When a test fails:**
1. Document the failure in test results
2. Investigate root cause (Redux action, service, mock setup)
3. Fix the issue
4. Re-run the test
5. Update test results document

**Issue Documentation Template:**
```markdown
### Issue #1: camelCase Transformation Not Working

**Severity**: 🔴 Critical
**Status**: Open
**Discovered In**: TC-001: fetchConversations - Success

**Description**: API response fields not transformed to camelCase

**Expected Behavior**: Response should have `createdAt` field
**Actual Behavior**: Response has `created_at` field

**Root Cause**: camelCaseKeys not called in service method

**Fix**: Add camelCaseKeys transformation in conversationService.ts:172
```

#### 4.5 Track Progress

Update progress tracking in test results document:
```markdown
## Progress Overview

Redux Actions - Success:  [✅✅✅] 3/3 (100%)
Redux Actions - Errors:   [✅✅❌░] 2/4 (50%)
Service Layer:            [░░░] 0/3 (0%)

Overall: ███░░░░░░░ 5/10 (50%)
```

#### 4.6 Test ActionCable Integration (If Applicable)

```typescript
// src/utils/specs/actionCable.spec.ts
import { setupActionCable } from '../actionCable';
import { store } from '@/store';

jest.mock('@/store', () => ({
  store: { dispatch: jest.fn() },
}));

describe('ActionCable Integration', () => {
  it('should dispatch action on message.created event', () => {
    // Mock WebSocket message
    const mockMessage = {
      identifier: JSON.stringify({ channel: 'RoomChannel' }),
      message: {
        event: 'message.created',
        data: { id: 1, content: 'Test', created_at: '2025-01-01' },
      },
    };

    // Trigger event handler
    // ... test WebSocket event dispatch

    // Verify Redux action dispatched
    expect(store.dispatch).toHaveBeenCalled();
  });
});
```

---

## Phase 5: Issue Resolution

### Objective
Fix integration bugs discovered during testing and verify fixes.

### Steps

#### 5.1 Prioritize Issues

**Critical (Fix Immediately)**:
- camelCase transformation failures
- Authentication/authorization failures (401 handling)
- Complete Redux action failures
- Data corruption risks
- Crash-causing errors

**Major (Fix Before Release)**:
- Error handling not working (422, 500)
- Missing error states in UI
- Incorrect state updates
- Network error handling

**Minor (Can Defer)**:
- Minor response field inconsistencies
- Non-critical loading states

#### 5.2 Fix Issues

**Process:**
1. **Identify Root Cause**
   - Redux action logic error?
   - Service method missing camelCaseKeys?
   - Mock setup incorrect?
   - Type definition mismatch?

2. **Implement Fix**
   - Update Redux action: `src/store/[feature]/[feature]Actions.ts`
   - Update service method: `src/store/[feature]/[feature]Service.ts`
   - Update types: `src/store/[feature]/[feature]Types.ts`
   - Update test mocks if needed

3. **Re-run Failed Test**
   ```bash
   pnpm test -- src/store/conversation/specs/conversationActions.spec.ts
   ```

4. **Run Full Test Suite** (regression check)
   ```bash
   pnpm test
   ```

5. **Update Issue Status** (mark resolved, document root cause)

6. **Update Test Results** (mark test as pass)

**Example Fix:**
```typescript
// Before (missing camelCase transformation)
static async fetchConversations() {
  const response = await apiService.get('/conversations');
  return response.data; // ❌ Returns snake_case
}

// After (with camelCase transformation)
static async fetchConversations() {
  const response = await apiService.get('/conversations');
  return camelCaseKeys(response.data); // ✅ Returns camelCase
}
```

---

## Phase 6: Documentation

### Objective
Create final documentation and ensure regression prevention.

### Steps

#### 6.1 Finalize Test Results

Update summary statistics and overall result:
```markdown
## Test Summary

| Metric | Value |
|--------|-------|
| **Total Test Cases** | 12 |
| **Passed** | 12 (100%) |
| **Failed** | 0 (0%) |

### Overall Result: ✅ PASS

**Criteria**:
- [x] All critical tests passed
- [x] Pass rate ≥ 95%
- [x] No blocking issues
- [x] All high-severity bugs fixed
- [x] camelCase transformation working
- [x] Error handling tested
```

#### 6.2 Verify Test Coverage

Run tests with coverage report:
```bash
# Run with coverage
pnpm test -- src/store/conversation/specs --coverage

# View coverage report
open coverage/lcov-report/index.html
```

**Coverage Targets:**
- Redux actions: ≥ 80%
- Service methods: ≥ 80%
- Error scenarios: 100%

#### 6.3 Create Testing Artifacts

**Save for Future Reference:**
- Test plan document
- Test results document
- Jest integration tests
- Mock data examples

**Location**: `/docs/ignored/tests/<feature>/`

**Example File Structure:**
```
/docs/ignored/tests/conversation/
├── conversation_api_discovery.md
├── conversation_test_plan.md
├── conversation_test_results.md
└── mock_data/
    ├── conversations_response.json
    ├── message_response.json
    └── error_responses.json
```

---

## Process Checklist

### Phase 1: Discovery
- [ ] Identified Redux actions (`src/store/[feature]/[feature]Actions.ts`)
- [ ] Examined service layer methods
- [ ] Reviewed API service configuration
- [ ] Checked ActionCable integration (if applicable)
- [ ] Created discovery summary document

### Phase 2: Planning
- [ ] Defined test scope (actions, services, errors)
- [ ] Created test plan using template
- [ ] Categorized tests (success, error, transformation)
- [ ] Estimated test effort

### Phase 3: Environment Setup
- [ ] Verified Jest configuration
- [ ] Created mock files for API service
- [ ] Configured test setup (jest.setup.js)
- [ ] Verified environment with sample test

### Phase 4: Execution
- [ ] Created test results document
- [ ] Wrote integration tests for Redux actions
- [ ] Wrote service layer tests
- [ ] Tested camelCase transformation
- [ ] Tested error handling (401, 422, 500)
- [ ] Tested ActionCable (if applicable)
- [ ] Updated progress tracking

### Phase 5: Issue Resolution
- [ ] Prioritized issues by severity
- [ ] Fixed critical issues (camelCase, auth)
- [ ] Fixed major issues (error handling)
- [ ] Re-ran failed tests
- [ ] Ran full test suite for regression
- [ ] Documented all fixes

### Phase 6: Documentation
- [ ] Finalized test results
- [ ] Verified test coverage (≥ 80%)
- [ ] Saved testing artifacts
- [ ] Documented mock data examples

---

## Related Documentation

### Process Documentation
- [Development Process](/processes/development/development_process.md) - Full development workflow
- [Code Review Process](/processes/code_review/code_review_process.md) - Code review procedures
- [Unit Testing Process](/processes/tests/unit_testing_process.md) - Unit testing guide

### Technical Documentation
- [CLAUDE.md](/CLAUDE.md) - Commands, guidelines, and conventions
- [README_CHATSCOMMERCE.md](/README_CHATSCOMMERCE.md) - Setup and environment

### Templates
- [Test Plan Template](/processes/tests/TEST_PLAN_TEMPLATE.md) - Test plan template
- [Test Results Template](/processes/tests/TEST_RESULTS_TEMPLATE.md) - Test results template

### External Resources
- [Jest Documentation](https://jestjs.io/) - Jest testing framework
- [Redux Toolkit Testing](https://redux-toolkit.js.org/usage/usage-guide#testing) - Testing Redux actions
- [Testing Library](https://testing-library.com/docs/react-native-testing-library/intro/) - React Native testing
- [Mock Service Worker](https://mswjs.io/) - Alternative API mocking approach

---

## Changelog

### Version 3.0.0 (2025-11-12)

**Status**: Active

**Changes:**
- **MAJOR**: Completely reframed for Chatwoot Mobile App (React Native + Expo + TypeScript)
- **MAJOR**: Changed focus from "building APIs" to "consuming APIs"
- Renamed document to "API Integration Testing Process"
- Updated all phases for mobile API integration testing:
  - Phase 1: Discovery - Examine Redux actions/services (not Rails routes)
  - Phase 2: Planning - Test Redux action integration (not API endpoints)
  - Phase 3: Environment - Configure Jest with mocks (not Rails server)
  - Phase 4: Execution - Write Jest tests (not cURL commands)
  - Phase 5: Issue Resolution - Fix mobile code (not backend code)
  - Phase 6: Documentation - Jest tests and coverage (not RSpec specs)
- Replaced all Rails-specific content (controllers, Jbuilder, RSpec) with mobile equivalents (Redux actions, camelCaseKeys, Jest)
- Added comprehensive Jest test examples for Redux actions
- Added camelCase transformation testing
- Added error handling testing (401, 422, 500, network)
- Added ActionCable integration testing
- Updated all commands to pnpm
- Updated all file paths to mobile structure
- Updated all external resource links

**Migration Notes:**
- Previous version (2.0.0) focused on Rails API implementation testing
- This version (3.0.0) focuses on mobile API consumption testing
- Document now addresses integration between mobile app and Chatwoot backend APIs

### Version 2.0.0 (2025-10-06)

**Status**: Superseded by 3.0.0

**Changes:**
- Adapted for Chatwoot (Rails + Vue.js) from Python/FastAPI
- Updated all references from FastAPI to Rails controllers
- Added Jbuilder view inspection (camelCase validation)
- Added RSpec request specs as regression test strategy

### Version 1.0.0 (2025-10-04)

**Status**: Archived

**Changes:**
- Initial version (Python/FastAPI)

---

## Document Metadata

**Document Owner**: Development Team

**Last Reviewed**: 2025-11-12

**Next Review Due**: 2026-02-12

**Technology Stack**: React Native 0.76.9 | Expo SDK 52 | TypeScript 5.1.3 | Jest | Redux Toolkit

**Contact**: Development team channel for questions

---

**End of Document**
