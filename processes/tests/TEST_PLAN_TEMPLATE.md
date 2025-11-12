# {Feature} API Integration Test Plan

**IMPORTANT**: This document MUST be created in `/docs/ignored/tests/<feature>_test_plan.md`

**Test Type**: Redux Action/Service Integration Tests
**Last Updated**: YYYY-MM-DD
**Author**: [Your Name]
**Status**: Draft | In Progress | Complete
**Project**: Chatwoot Mobile App (React Native + Expo + TypeScript)

---

## Table of Contents

1. [Overview](#overview)
2. [Test Environment](#test-environment)
3. [Test Categories](#test-categories)
4. [Detailed Test Cases](#detailed-test-cases)
5. [Test Data](#test-data)
6. [Dependencies](#dependencies)

---

## Overview

### Purpose

[Brief description of what this test plan covers]

### Scope

**Redux Actions Covered**:
- `fetch{Resource}` - GET /api/v1/accounts/:account_id/{resource}
- `fetch{Resource}ById` - GET /api/v1/accounts/:account_id/{resource}/:id
- `create{Resource}` - POST /api/v1/accounts/:account_id/{resource}
- `update{Resource}` - PATCH /api/v1/accounts/:account_id/{resource}/:id
- `delete{Resource}` - DELETE /api/v1/accounts/:account_id/{resource}/:id

**Total Test Cases**: XX

**Testing Approach**:
- Jest unit tests for Redux actions
- Mock API responses with Jest
- Test camelCase transformation
- Test error handling (401, 422, 500)

---

### Success Criteria

- [ ] All Redux actions resolve correctly on success
- [ ] All Redux actions reject correctly on failure
- [ ] Service methods call API endpoints correctly
- [ ] API responses are transformed to camelCase
- [ ] Error cases return appropriate error states (422, 404, 401, etc.)
- [ ] Redux state updates correctly after API calls
- [ ] Loading states transition correctly (idle → pending → fulfilled/rejected)
- [ ] Test coverage ≥ 80% for actions and services

---

## Test Environment

### Requirements

- Node.js 18+ installed
- pnpm installed
- Dependencies installed: `pnpm install`
- Jest configured: `jest.config.js`
- API service mocks: `src/services/__mocks__/APIService.ts`

### Setup Commands

```bash
# Install dependencies
pnpm install

# Verify Jest works
pnpm test -- --version

# Run tests for specific feature
pnpm test -- src/store/{feature}/specs

# Run with coverage
pnpm test -- src/store/{feature}/specs --coverage
```

### Mock Setup

```typescript
// src/services/__mocks__/APIService.ts
export const apiService = {
  get: jest.fn(),
  post: jest.fn(),
  patch: jest.fn(),
  delete: jest.fn(),
};
---

## Test Categories

### Category 1: Redux Actions - Success Cases

**Purpose**: Verify Redux actions handle successful API responses correctly

**Test Cases**: TC-001 to TC-005

**Expected Results**:
- Action returns fulfilled state
- Service method called with correct parameters
- Response transformed to camelCase
- Redux state updated correctly
- Loading state transitions: idle → pending → fulfilled

**Example Test**:
```typescript
it('should fetch {resource} successfully', async () => {
  const mockResponse = {
    data: {
      payload: [{ id: 1, name: 'Test', created_at: '2025-01-01' }],
      meta: { current_page: 1, total_count: 1 }
    }
  };

  mockedApiService.get.mockResolvedValueOnce(mockResponse);
  const result = await store.dispatch(fetch{Resource}());

  expect(result.type).toBe('{feature}/fetch{Resource}/fulfilled');
  expect(result.payload.payload[0]).toHaveProperty('createdAt');
});
```

---

### Category 2: Redux Actions - Error Cases

**Purpose**: Verify Redux actions handle API errors correctly

**Test Cases**: TC-006 to TC-010

**Expected Results**:
- Action returns rejected state on 401 error
- Action returns rejected state on 422 validation error
- Action returns rejected state on 500 server error
- Action returns rejected state on network error
- Redux state reflects error correctly
- Loading state transitions: idle → pending → rejected

---

### Category 3: Service Layer Tests

**Purpose**: Verify service methods call API correctly

**Test Cases**: TC-011 to TC-015

**Expected Results**:
- Service methods call apiService with correct URL
- Service methods pass correct parameters
- Service methods transform response to camelCase
- Service methods handle errors properly
- Service methods return typed responses

---

### Category 4: CamelCase Transformation

**Purpose**: Verify API responses are transformed correctly

**Test Cases**: TC-016 to TC-018

**Expected Results**:
- snake_case fields converted to camelCase
- Nested objects transformed recursively
- Arrays of objects transformed correctly
- Response structure preserved

---

### Category 5: State Updates

**Purpose**: Verify Redux state updates after API calls

**Test Cases**: TC-019 to TC-022

**Expected Results**:
- State updated correctly on action fulfilled
- State reflects error on action rejected
- Loading flags set correctly
- Previous state preserved on error
- Soft deletes work if applicable

---

### Category 6: Validation & Error Cases

**Purpose**: Verify proper error handling and validation

**Test Cases**: TC-021 to TC-026

**Expected Results**:
- Return 422 for invalid data
- Return 401 for missing authentication
- Return 403 for unauthorized access
- Return 404 for not found
- Error messages are clear and helpful

---

## Detailed Test Cases

### TC-001: List All Resources

**Endpoint**: `GET /api/v1/accounts/:account_id/{resource}`
**Method**: GET
**Authentication**: Required
**Expected HTTP Status**: 200 OK

**cURL Command**:
```bash
curl -X GET "http://localhost:3000/api/v1/accounts/${ACCOUNT_ID}/resources" \
  -H "api_access_token: ${API_TOKEN}" \
  -H "Content-Type: application/json"
```

**Expected Response**:
```json
{
  "payload": [
    {
      "id": 1,
      "name": "Resource 1",
      "description": "Description",
      "createdAt": "2025-01-01T00:00:00Z",
      "updatedAt": "2025-01-01T00:00:00Z"
    }
  ],
  "meta": {
    "currentPage": 1,
    "totalPages": 1,
    "totalCount": 1
  }
}
```

**Validation**:
- [ ] HTTP status is 200
- [ ] Response contains `payload` array
- [ ] Response contains `meta` object
- [ ] Fields use camelCase
- [ ] Capture `RESOURCE_ID` from first item

**Variables to Capture**:
- `RESOURCE_ID`: First resource ID for use in subsequent tests

---

### TC-002: List with Pagination

**Endpoint**: `GET /api/v1/accounts/:account_id/{resource}?page=1`
**Method**: GET
**Authentication**: Required
**Expected HTTP Status**: 200 OK

**cURL Command**:
```bash
curl -X GET "http://localhost:3000/api/v1/accounts/${ACCOUNT_ID}/resources?page=1" \
  -H "api_access_token: ${API_TOKEN}"
```

**Expected Response**:
- Paginated results
- `meta.currentPage` = 1
- `meta.totalPages` >= 1

**Validation**:
- [ ] Pagination metadata is correct
- [ ] Page parameter works
- [ ] Results are limited to page size

---

### TC-003: List with Filters

**Endpoint**: `GET /api/v1/accounts/:account_id/{resource}?status=active`
**Method**: GET
**Authentication**: Required
**Expected HTTP Status**: 200 OK

**cURL Command**:
```bash
curl -X GET "http://localhost:3000/api/v1/accounts/${ACCOUNT_ID}/resources?status=active" \
  -H "api_access_token: ${API_TOKEN}"
```

**Expected Response**:
- Only resources matching filter
- Filtered results count in `meta.totalCount`

**Validation**:
- [ ] Filter is applied correctly
- [ ] Only matching resources returned

---

### TC-004: Get Resource by ID

**Endpoint**: `GET /api/v1/accounts/:account_id/{resource}/:id`
**Method**: GET
**Authentication**: Required
**Expected HTTP Status**: 200 OK

**cURL Command**:
```bash
curl -X GET "http://localhost:3000/api/v1/accounts/${ACCOUNT_ID}/resources/${RESOURCE_ID}" \
  -H "api_access_token: ${API_TOKEN}"
```

**Expected Response**:
```json
{
  "id": 1,
  "name": "Resource Name",
  "description": "Description",
  "createdAt": "2025-01-01T00:00:00Z",
  "updatedAt": "2025-01-01T00:00:00Z"
}
```

**Validation**:
- [ ] HTTP status is 200
- [ ] Correct resource returned
- [ ] All expected fields present
- [ ] Fields use camelCase

---

### TC-005: Get Non-Existent Resource

**Endpoint**: `GET /api/v1/accounts/:account_id/{resource}/999999`
**Method**: GET
**Authentication**: Required
**Expected HTTP Status**: 404 Not Found

**cURL Command**:
```bash
curl -X GET "http://localhost:3000/api/v1/accounts/${ACCOUNT_ID}/resources/999999" \
  -H "api_access_token: ${API_TOKEN}"
```

**Expected Response**:
```json
{
  "error": "Resource not found"
}
```

**Validation**:
- [ ] HTTP status is 404
- [ ] Error message is clear

---

### TC-006: Get Without Authentication

**Endpoint**: `GET /api/v1/accounts/:account_id/{resource}/:id`
**Method**: GET
**Authentication**: None
**Expected HTTP Status**: 401 Unauthorized

**cURL Command**:
```bash
curl -X GET "http://localhost:3000/api/v1/accounts/${ACCOUNT_ID}/resources/${RESOURCE_ID}"
```

**Expected Response**:
```json
{
  "error": "Unauthorized"
}
```

**Validation**:
- [ ] HTTP status is 401
- [ ] Access denied without token

---

### TC-007: Get Resource from Different Account

**Endpoint**: `GET /api/v1/accounts/999/resources/:id`
**Method**: GET
**Authentication**: Required
**Expected HTTP Status**: 404 Not Found or 403 Forbidden

**cURL Command**:
```bash
curl -X GET "http://localhost:3000/api/v1/accounts/999/resources/${RESOURCE_ID}" \
  -H "api_access_token: ${API_TOKEN}"
```

**Validation**:
- [ ] Cannot access resources from other accounts
- [ ] Returns appropriate error status

---

### TC-008: Create Resource Successfully

**Endpoint**: `POST /api/v1/accounts/:account_id/{resource}`
**Method**: POST
**Authentication**: Required
**Expected HTTP Status**: 201 Created

**cURL Command**:
```bash
curl -X POST "http://localhost:3000/api/v1/accounts/${ACCOUNT_ID}/resources" \
  -H "api_access_token: ${API_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Resource",
    "description": "Test Description"
  }'
```

**Expected Response**:
```json
{
  "id": 2,
  "name": "Test Resource",
  "description": "Test Description",
  "createdAt": "2025-01-01T00:00:00Z",
  "updatedAt": "2025-01-01T00:00:00Z"
}
```

**Validation**:
- [ ] HTTP status is 201
- [ ] Resource created in database
- [ ] ID assigned automatically
- [ ] Timestamps populated
- [ ] Capture `NEW_RESOURCE_ID` for cleanup

**Variables to Capture**:
- `NEW_RESOURCE_ID`: For use in update/delete tests

---

### TC-009: Create with Missing Required Field

**Endpoint**: `POST /api/v1/accounts/:account_id/{resource}`
**Method**: POST
**Authentication**: Required
**Expected HTTP Status**: 422 Unprocessable Entity

**cURL Command**:
```bash
curl -X POST "http://localhost:3000/api/v1/accounts/${ACCOUNT_ID}/resources" \
  -H "api_access_token: ${API_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Missing required name field"
  }'
```

**Expected Response**:
```json
{
  "error": ["Name can't be blank"]
}
```

**Validation**:
- [ ] HTTP status is 422
- [ ] Error message identifies missing field
- [ ] Resource not created in database

---

### TC-010: Create with Invalid Data

**Endpoint**: `POST /api/v1/accounts/:account_id/{resource}`
**Method**: POST
**Authentication**: Required
**Expected HTTP Status**: 422 Unprocessable Entity

**cURL Command**:
```bash
curl -X POST "http://localhost:3000/api/v1/accounts/${ACCOUNT_ID}/resources" \
  -H "api_access_token: ${API_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "",
    "email": "invalid-email"
  }'
```

**Expected Response**:
```json
{
  "error": [
    "Name can't be blank",
    "Email is invalid"
  ]
}
```

**Validation**:
- [ ] HTTP status is 422
- [ ] All validation errors returned
- [ ] Resource not created

---

### TC-011: Update Resource Successfully

**Endpoint**: `PATCH /api/v1/accounts/:account_id/{resource}/:id`
**Method**: PATCH
**Authentication**: Required
**Expected HTTP Status**: 200 OK

**cURL Command**:
```bash
curl -X PATCH "http://localhost:3000/api/v1/accounts/${ACCOUNT_ID}/resources/${NEW_RESOURCE_ID}" \
  -H "api_access_token: ${API_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Name"
  }'
```

**Expected Response**:
```json
{
  "id": 2,
  "name": "Updated Name",
  "description": "Test Description",
  "createdAt": "2025-01-01T00:00:00Z",
  "updatedAt": "2025-01-01T00:05:00Z"
}
```

**Validation**:
- [ ] HTTP status is 200
- [ ] Name field updated
- [ ] Other fields unchanged
- [ ] `updatedAt` timestamp changed

---

### TC-012: Update with Invalid Data

**Endpoint**: `PATCH /api/v1/accounts/:account_id/{resource}/:id`
**Method**: PATCH
**Authentication**: Required
**Expected HTTP Status**: 422 Unprocessable Entity

**cURL Command**:
```bash
curl -X PATCH "http://localhost:3000/api/v1/accounts/${ACCOUNT_ID}/resources/${NEW_RESOURCE_ID}" \
  -H "api_access_token: ${API_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": ""
  }'
```

**Expected Response**:
```json
{
  "error": ["Name can't be blank"]
}
```

**Validation**:
- [ ] HTTP status is 422
- [ ] Validation error returned
- [ ] Resource not updated in database

---

### TC-013: Delete Resource Successfully

**Endpoint**: `DELETE /api/v1/accounts/:account_id/{resource}/:id`
**Method**: DELETE
**Authentication**: Required
**Expected HTTP Status**: 204 No Content

**cURL Command**:
```bash
curl -X DELETE "http://localhost:3000/api/v1/accounts/${ACCOUNT_ID}/resources/${NEW_RESOURCE_ID}" \
  -H "api_access_token: ${API_TOKEN}"
```

**Expected Response**: Empty (204 No Content)

**Validation**:
- [ ] HTTP status is 204
- [ ] No response body
- [ ] Resource removed from database (or soft-deleted)
- [ ] Cannot retrieve resource with GET after deletion

---

### TC-014: Delete Non-Existent Resource

**Endpoint**: `DELETE /api/v1/accounts/:account_id/{resource}/999999`
**Method**: DELETE
**Authentication**: Required
**Expected HTTP Status**: 404 Not Found

**cURL Command**:
```bash
curl -X DELETE "http://localhost:3000/api/v1/accounts/${ACCOUNT_ID}/resources/999999" \
  -H "api_access_token: ${API_TOKEN}"
```

**Validation**:
- [ ] HTTP status is 404
- [ ] Error message clear

---

## Test Data

### Seed Data Requirements

**Accounts**:
- At least 1 test account
- Account ID: 1

**Users**:
- At least 1 user per account
- User with valid API token

**Resources** (if testing requires existing data):
- At least 3-5 existing resources
- Mix of different statuses/types

### Data Cleanup

After testing, clean up test data:

```bash
# Rails console
rails console
> Resource.where(name: 'Test Resource').destroy_all
```

---

## Dependencies

### Internal Dependencies

- Rails server running
- PostgreSQL database accessible
- Redis running (for Sidekiq, sessions)
- Database migrations applied

### External Dependencies

- None

### Test Execution Order

1. **Setup**: Ensure server and database running
2. **Discovery**: Run TC-001 to TC-003 (capture IDs)
3. **Read**: Run TC-004 to TC-007 (use captured IDs)
4. **Create**: Run TC-008 to TC-010 (capture new IDs)
5. **Update**: Run TC-011 to TC-012 (use new IDs)
6. **Delete**: Run TC-013 to TC-014 (cleanup)

### Automated Testing Alternative

Instead of manual cURL testing, use RSpec request specs:

**Example Request Spec**:
```ruby
# spec/requests/api/v1/accounts/resources_spec.rb
RSpec.describe 'Api::V1::Accounts::Resources', type: :request do
  let(:account) { create(:account) }
  let(:user) { create(:user, account: account) }
  let(:token) { user.create_token.token }
  let(:headers) { { 'api_access_token' => token } }

  describe 'GET /api/v1/accounts/:account_id/resources' do
    it 'returns list of resources' do
      create_list(:resource, 3, account: account)

      get "/api/v1/accounts/#{account.id}/resources", headers: headers

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json['payload'].size).to eq(3)
    end
  end

  # ... more test cases
end
```

**Run Request Specs**:
```bash
bundle exec rspec spec/requests/api/v1/accounts/resources_spec.rb --format documentation
```

---

**End of Test Plan**
