# [Feature Name] - Design Document

**IMPORTANT**: This document MUST be created in `/docs/ignored/design/<feature_name>_design.md`

**Session ID**: <uuid-or-timestamp>
**Created**: YYYY-MM-DD HH:MM:SS
**Author**: Claude Code (Anthropic)
**Status**: Draft | Under Review | Approved
**Related Request**: <user request summary>
**Project**: Chatwoot Mobile App (React Native + Expo + TypeScript)

---

## Executive Summary

<!-- 2-3 paragraphs summarizing the design, problem being solved, and proposed solution -->

### Key Benefits
- Benefit 1: [Description of value delivered]
- Benefit 2: [Description of improvement]
- Benefit 3: [Description of impact]

### Effort Estimate
- **Duration**: X days
- **Complexity**: Low | Medium | High
- **Risk**: Low | Medium | High

---

## Current State Analysis

### Overview
<!-- Describe current implementation, how it works today, and what problems exist -->

### Code Examples

**Current Redux State Implementation**:
```typescript
// File: src/store/inbox/inboxSlice.ts:15
import { createSlice } from '@reduxjs/toolkit';

const inboxSlice = createSlice({
  name: 'inbox',
  initialState: {
    inboxes: [],
    loading: false,
    error: null,
  },
  reducers: {
    setInboxes: (state, action) => {
      state.inboxes = action.payload;
    },
  },
});

export default inboxSlice;
```

**Current React Native Component**:
```typescript
// File: src/screens/inbox/InboxList.tsx:20
import React from 'react';
import { View, Text } from 'react-native';
import { useAppSelector } from '@/store/hooks';
import { tailwind } from '@/theme/tailwind';

export const InboxList = () => {
  const inboxes = useAppSelector(state => state.inbox.inboxes);

  return (
    <View style={tailwind('flex-1 bg-white')}>
      {/* Current UI */}
    </View>
  );
};
```

### Problems Identified
1. **Problem 1**: [Description of limitation or issue]
   - **Impact**: [How it affects users/system]
   - **Evidence**: [Reference to code or user feedback]

2. **Problem 2**: [Description]
   - **Impact**: [Effect on system/users]
   - **Evidence**: [Supporting data]

### Files Affected
- `src/store/inbox/inboxSlice.ts:15` - [Current role/purpose]
- `src/store/inbox/inboxActions.ts:10` - [Current logic]
- `src/store/inbox/inboxService.ts:25` - [API service methods]
- `src/screens/inbox/InboxList.tsx:5` - [Screen component]

---

## Proposed Solution

### High-Level Approach
<!-- Describe the solution approach in 2-3 paragraphs: what will be built, how it will work, why this approach -->

### Architecture Changes
- **Change 1**: [Description of architectural change]
- **Change 2**: [Description of pattern or structure change]
- **Change 3**: [Description of data flow change]

### Code Examples

**Proposed Redux State Implementation**:
```typescript
// src/store/inbox/inboxSlice.ts - AFTER changes
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { fetchInboxes, updateInboxPriority } from './inboxActions';

export type InboxPriority = 'low' | 'medium' | 'high';

interface InboxState {
  inboxes: Inbox[];
  loading: boolean;
  error: string | null;
}

const inboxSlice = createSlice({
  name: 'inbox',
  initialState: {
    inboxes: [],
    loading: false,
    error: null,
  } as InboxState,
  reducers: {
    setInboxes: (state, action: PayloadAction<Inbox[]>) => {
      state.inboxes = action.payload;
    },
    updateInbox: (state, action: PayloadAction<Inbox>) => {
      const index = state.inboxes.findIndex(i => i.id === action.payload.id);
      if (index !== -1) {
        state.inboxes[index] = action.payload;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchInboxes.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchInboxes.fulfilled, (state, action) => {
        state.inboxes = action.payload;
        state.loading = false;
      })
      .addCase(updateInboxPriority.fulfilled, (state, action) => {
        const index = state.inboxes.findIndex(i => i.id === action.payload.id);
        if (index !== -1) {
          state.inboxes[index] = action.payload;
        }
      });
  },
});

export default inboxSlice;
```

**Proposed React Native Component**:
```typescript
// src/components-next/InboxPrioritySelector/InboxPrioritySelector.tsx - NEW
import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useAppDispatch } from '@/store/hooks';
import { updateInboxPriority } from '@/store/inbox/inboxActions';
import { tailwind } from '@/theme/tailwind';
import I18n from '@/i18n';

interface Props {
  inboxId: number;
  currentPriority: InboxPriority;
}

export const InboxPrioritySelector: React.FC<Props> = ({ inboxId, currentPriority }) => {
  const dispatch = useAppDispatch();
  const [priority, setPriority] = useState<InboxPriority>(currentPriority);

  const priorities: InboxPriority[] = ['low', 'medium', 'high'];

  const handleUpdate = async (value: InboxPriority) => {
    setPriority(value);
    await dispatch(updateInboxPriority({ id: inboxId, priority: value }));
  };

  return (
    <View style={tailwind('flex flex-col gap-2')}>
      <Text style={tailwind('text-sm font-medium text-gray-900')}>
        {I18n.t('INBOX.PRIORITY')}
      </Text>
      <Picker
        selectedValue={priority}
        onValueChange={handleUpdate}
        style={tailwind('border border-gray-300 rounded-lg')}
      >
        {priorities.map(p => (
          <Picker.Item
            key={p}
            label={I18n.t(`INBOX.PRIORITY_${p.toUpperCase()}`)}
            value={p}
          />
        ))}
      </Picker>
    </View>
  );
};
```

### Design Patterns
- **Pattern 1**: Redux Toolkit Slices - Encapsulates state management with reducers and actions
- **Pattern 2**: Redux Thunk Actions - Handles async API calls with createAsyncThunk
- **Pattern 3**: Service Layer - Separates API logic from Redux actions
- **Pattern 4**: Selector Pattern - Memoized state access via createSelector
- **Pattern 5**: Redux Listeners - Event-driven reactions using createListenerMiddleware

---

## Technical Design

### Redux State Management

**Files to Create**:
- `src/store/inbox/inboxTypes.ts` (NEW) - TypeScript interfaces
- `src/store/inbox/inboxSlice.ts` (MODIFY) - Add priority support
- `src/store/inbox/inboxActions.ts` (MODIFY) - Add updateInboxPriority action
- `src/store/inbox/inboxService.ts` (MODIFY) - Add priority API call
- `src/store/inbox/inboxSelectors.ts` (NEW) - Memoized selectors

**Type Definitions**:
```typescript
// src/store/inbox/inboxTypes.ts
export type InboxPriority = 'low' | 'medium' | 'high';

export interface Inbox {
  id: number;
  name: string;
  channelType: string;
  priority?: InboxPriority; // NEW
  avatarUrl?: string;
  phoneNumber?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InboxState {
  inboxes: Inbox[];
  loading: boolean;
  error: string | null;
}
```

**Slice Updates**:
```typescript
// src/store/inbox/inboxSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { fetchInboxes, updateInboxPriority } from './inboxActions';
import { InboxState, Inbox } from './inboxTypes';

const initialState: InboxState = {
  inboxes: [],
  loading: false,
  error: null,
};

const inboxSlice = createSlice({
  name: 'inbox',
  initialState,
  reducers: {
    updateInbox: (state, action: PayloadAction<Inbox>) => {
      const index = state.inboxes.findIndex(i => i.id === action.payload.id);
      if (index !== -1) {
        state.inboxes[index] = action.payload;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(updateInboxPriority.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateInboxPriority.fulfilled, (state, action) => {
        const index = state.inboxes.findIndex(i => i.id === action.payload.id);
        if (index !== -1) {
          state.inboxes[index] = action.payload;
        }
        state.loading = false;
      })
      .addCase(updateInboxPriority.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to update priority';
        state.loading = false;
      });
  },
});

export const { updateInbox } = inboxSlice.actions;
export default inboxSlice;
```

---

### Redux Actions (Async Thunks)

**Files to Modify**:
- `src/store/inbox/inboxActions.ts` - Add updateInboxPriority action

**Action Implementation**:
```typescript
// src/store/inbox/inboxActions.ts
import { createAsyncThunk } from '@reduxjs/toolkit';
import InboxService from './inboxService';
import { Inbox, InboxPriority } from './inboxTypes';

export const updateInboxPriority = createAsyncThunk<
  Inbox,
  { id: number; priority: InboxPriority },
  { rejectValue: string }
>(
  'inbox/updatePriority',
  async ({ id, priority }, { rejectWithValue }) => {
    try {
      const response = await InboxService.updatePriority(id, priority);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update priority');
    }
  }
);
```

---

### Service Layer (API Calls)

**Files to Modify**:
- `src/store/inbox/inboxService.ts` - Add updatePriority method

**Service Implementation**:
```typescript
// src/store/inbox/inboxService.ts
import { apiService } from '@/services/APIService';
import camelCaseKeys from '@/utils/camelCaseKeys';
import { Inbox, InboxPriority } from './inboxTypes';

class InboxService {
  static async fetchInboxes(): Promise<Inbox[]> {
    const response = await apiService.get('/inboxes');
    return camelCaseKeys(response.data.payload);
  }

  static async updatePriority(id: number, priority: InboxPriority): Promise<Inbox> {
    const response = await apiService.patch(`/inboxes/${id}`, { priority });
    return camelCaseKeys(response.data);
  }
}

export default InboxService;
```

---

### Redux Selectors (Memoized)

**Files to Create**:
- `src/store/inbox/inboxSelectors.ts` (NEW)

**Selector Implementation**:
```typescript
// src/store/inbox/inboxSelectors.ts
import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '@/store';
import { InboxPriority } from './inboxTypes';

export const selectInboxes = (state: RootState) => state.inbox.inboxes;
export const selectInboxLoading = (state: RootState) => state.inbox.loading;
export const selectInboxError = (state: RootState) => state.inbox.error;

export const selectInboxById = (id: number) =>
  createSelector([selectInboxes], (inboxes) =>
    inboxes.find(inbox => inbox.id === id)
  );

export const selectInboxesByPriority = (priority: InboxPriority) =>
  createSelector([selectInboxes], (inboxes) =>
    inboxes.filter(inbox => inbox.priority === priority)
  );

export const selectHighPriorityInboxes = createSelector(
  [selectInboxes],
  (inboxes) => inboxes.filter(inbox => inbox.priority === 'high')
);
```

---

### Redux Listeners (Event-Driven)

**Files to Create/Modify**:
- `src/store/inbox/inboxListener.ts` (NEW)

**Listener Implementation**:
```typescript
// src/store/inbox/inboxListener.ts
import { createListenerMiddleware } from '@reduxjs/toolkit';
import { updateInboxPriority } from './inboxActions';
import { showToast } from '@/utils/toastUtils';
import I18n from '@/i18n';

export const inboxListener = createListenerMiddleware();

// React to successful priority updates
inboxListener.startListening({
  actionCreator: updateInboxPriority.fulfilled,
  effect: (action, listenerApi) => {
    showToast({
      message: I18n.t('INBOX.PRIORITY_UPDATED'),
      type: 'success',
    });

    // Optional: Trigger analytics event
    // Analytics.track('inbox_priority_changed', { ... });
  },
});

// Handle priority update failures
inboxListener.startListening({
  actionCreator: updateInboxPriority.rejected,
  effect: (action, listenerApi) => {
    showToast({
      message: action.payload || I18n.t('INBOX.PRIORITY_UPDATE_FAILED'),
      type: 'error',
    });
  },
});
```

---

### UI Components

**Files to Create**:
- `src/components-next/InboxPrioritySelector/InboxPrioritySelector.tsx` (NEW)
- `src/components-next/InboxPrioritySelector/index.ts` (NEW)

**Files to Modify**:
- `src/screens/inbox/InboxDetails.tsx` - Integrate priority selector

**Component Implementation**:
```typescript
// src/components-next/InboxPrioritySelector/InboxPrioritySelector.tsx
import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useAppDispatch } from '@/store/hooks';
import { updateInboxPriority } from '@/store/inbox/inboxActions';
import { InboxPriority } from '@/store/inbox/inboxTypes';
import { tailwind } from '@/theme/tailwind';
import I18n from '@/i18n';

interface InboxPrioritySelectorProps {
  inboxId: number;
  currentPriority: InboxPriority;
}

export const InboxPrioritySelector: React.FC<InboxPrioritySelectorProps> = ({
  inboxId,
  currentPriority,
}) => {
  const dispatch = useAppDispatch();
  const [priority, setPriority] = useState<InboxPriority>(currentPriority);

  const priorities: InboxPriority[] = ['low', 'medium', 'high'];

  const handleUpdate = async (value: InboxPriority) => {
    setPriority(value);
    await dispatch(updateInboxPriority({ id: inboxId, priority: value }));
  };

  return (
    <View style={tailwind('flex flex-col gap-2 p-4')}>
      <Text style={tailwind('text-sm font-medium text-gray-900 dark:text-gray-100')}>
        {I18n.t('INBOX.PRIORITY')}
      </Text>
      <Picker
        selectedValue={priority}
        onValueChange={handleUpdate}
        style={tailwind('border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800')}
      >
        {priorities.map(p => (
          <Picker.Item
            key={p}
            label={I18n.t(`INBOX.PRIORITY_${p.toUpperCase()}`)}
            value={p}
          />
        ))}
      </Picker>
    </View>
  );
};
```

**Screen Integration**:
```typescript
// src/screens/inbox/InboxDetails.tsx
import React from 'react';
import { View } from 'react-native';
import { useAppSelector } from '@/store/hooks';
import { selectInboxById } from '@/store/inbox/inboxSelectors';
import { InboxPrioritySelector } from '@/components-next/InboxPrioritySelector';
import { tailwind } from '@/theme/tailwind';

export const InboxDetails: React.FC<{ route }> = ({ route }) => {
  const { inboxId } = route.params;
  const inbox = useAppSelector(state => selectInboxById(inboxId)(state));

  if (!inbox) return null;

  return (
    <View style={tailwind('flex-1 bg-white dark:bg-gray-900')}>
      {/* Existing inbox details */}

      {/* NEW: Priority Selector */}
      <InboxPrioritySelector
        inboxId={inbox.id}
        currentPriority={inbox.priority || 'medium'}
      />

      {/* Rest of component */}
    </View>
  );
};
```

---

### i18n Translations

**Files to Modify**:
- `src/i18n/en.json` - English translations
- `src/i18n/es.json` - Spanish translations

**Translation Updates**:
```json
// src/i18n/en.json
{
  "INBOX": {
    "PRIORITY": "Priority",
    "PRIORITY_LOW": "Low",
    "PRIORITY_MEDIUM": "Medium",
    "PRIORITY_HIGH": "High",
    "PRIORITY_UPDATED": "Priority updated successfully",
    "PRIORITY_UPDATE_FAILED": "Failed to update priority"
  }
}
```

```json
// src/i18n/es.json
{
  "INBOX": {
    "PRIORITY": "Prioridad",
    "PRIORITY_LOW": "Baja",
    "PRIORITY_MEDIUM": "Media",
    "PRIORITY_HIGH": "Alta",
    "PRIORITY_UPDATED": "Prioridad actualizada exitosamente",
    "PRIORITY_UPDATE_FAILED": "Error al actualizar la prioridad"
  }
}
```

---

## Impact Analysis

### Files Affected

#### Redux State Management (5 files, 2 new)
1. `src/store/inbox/inboxTypes.ts` - NEW TypeScript interfaces
2. `src/store/inbox/inboxSlice.ts` - Add priority support in state
3. `src/store/inbox/inboxActions.ts` - Add updateInboxPriority async thunk
4. `src/store/inbox/inboxService.ts` - Add updatePriority API method
5. `src/store/inbox/inboxSelectors.ts` - NEW memoized selectors
6. `src/store/inbox/inboxListener.ts` - NEW event listener for priority updates

#### UI Components (2 files, 1 new)
1. `src/components-next/InboxPrioritySelector/InboxPrioritySelector.tsx` - NEW component
2. `src/components-next/InboxPrioritySelector/index.ts` - NEW barrel export
3. `src/screens/inbox/InboxDetails.tsx` - Integrate priority selector

#### i18n (2 files)
1. `src/i18n/en.json` - Add priority translations
2. `src/i18n/es.json` - Add priority translations (Spanish)

#### Tests (4 new files)
1. `src/store/inbox/specs/inboxSlice.spec.ts` - Test priority state updates
2. `src/store/inbox/specs/inboxActions.spec.ts` - Test updateInboxPriority thunk
3. `src/store/inbox/specs/inboxService.spec.ts` - Test API service methods
4. `src/components-next/InboxPrioritySelector/specs/InboxPrioritySelector.spec.tsx` - NEW component tests

**Total Files**: 6 Redux files (3 new), 3 UI files (2 new), 2 i18n files, 4 test files (1 new) = **15 files**

---

### Breaking Changes

**Redux State Breaking Changes**: No

**Backward Compatibility**:
- New `priority` field is optional in TypeScript interfaces
- Existing Redux selectors continue to work without changes
- Default priority value handled in component if undefined
- All existing Redux actions remain unchanged

---

### State Migration

**Redux Persist Migration**: Not required for this change
- **Type**: Additive change (new optional field)
- **Risk**: Low (backward compatible)
- **Reversible**: Yes (can remove field without breaking existing state)
- **Impact**: Existing persisted state continues to work

**Notes**:
- If priority field is critical, increment Redux Persist version in `src/store/index.ts`
- Current migration version: 2
- Consider migration if schema changes are breaking

---

### API Integration Changes

#### Backend API Expectations

The mobile app will call existing Chatwoot backend API endpoints:

**Expected Request** (Mobile → Backend):
```typescript
// PATCH /api/v1/accounts/:account_id/inboxes/:id
{
  "priority": "high"
}
```

**Expected Response** (Backend → Mobile):
```json
{
  "id": 1,
  "name": "Inbox Name",
  "channel_type": "Channel::WebWidget",
  "priority": "high",
  "created_at": "2025-01-01T00:00:00Z",
  "updated_at": "2025-01-06T12:00:00Z"
}
```

**camelCase Transformation**:
```typescript
// After camelCaseKeys transformation in mobile app
{
  "id": 1,
  "name": "Inbox Name",
  "channelType": "Channel::WebWidget",
  "priority": "high",
  "createdAt": "2025-01-01T00:00:00Z",
  "updatedAt": "2025-01-06T12:00:00Z"
}
```

#### API Service Layer

The mobile app's `apiService` singleton automatically:
- Adds authentication headers from Redux state
- Injects account ID into URLs
- Transforms snake_case responses to camelCase
- Handles 401 errors (auto-logout)
- Shows error toasts for failed requests

**No additional API configuration needed**

---

## Testing Strategy

### Redux State Tests (Jest)

**Slice Tests** (`src/store/inbox/specs/inboxSlice.spec.ts`):
```typescript
import inboxSlice from '../inboxSlice';
import { updateInboxPriority } from '../inboxActions';

describe('inboxSlice', () => {
  it('should handle initial state', () => {
    expect(inboxSlice.reducer(undefined, { type: 'unknown' })).toEqual({
      inboxes: [],
      loading: false,
      error: null,
    });
  });

  it('should handle updateInboxPriority.pending', () => {
    const action = { type: updateInboxPriority.pending.type };
    const state = inboxSlice.reducer(undefined, action);
    expect(state.loading).toBe(true);
  });

  it('should handle updateInboxPriority.fulfilled', () => {
    const inbox = { id: 1, name: 'Test Inbox', priority: 'high' };
    const action = { type: updateInboxPriority.fulfilled.type, payload: inbox };
    const state = inboxSlice.reducer({ inboxes: [inbox], loading: true, error: null }, action);
    expect(state.inboxes[0].priority).toBe('high');
    expect(state.loading).toBe(false);
  });

  it('should handle updateInboxPriority.rejected', () => {
    const action = {
      type: updateInboxPriority.rejected.type,
      error: { message: 'Update failed' },
    };
    const state = inboxSlice.reducer(undefined, action);
    expect(state.error).toBe('Update failed');
    expect(state.loading).toBe(false);
  });
});
```

**Action Tests** (`src/store/inbox/specs/inboxActions.spec.ts`):
```typescript
import { updateInboxPriority } from '../inboxActions';
import InboxService from '../inboxService';

jest.mock('../inboxService');

describe('inboxActions', () => {
  describe('updateInboxPriority', () => {
    it('should update inbox priority successfully', async () => {
      const mockInbox = { id: 1, name: 'Test', priority: 'high' };
      (InboxService.updatePriority as jest.Mock).mockResolvedValue(mockInbox);

      const dispatch = jest.fn();
      const thunk = updateInboxPriority({ id: 1, priority: 'high' });
      await thunk(dispatch, () => ({}), undefined);

      expect(InboxService.updatePriority).toHaveBeenCalledWith(1, 'high');
    });

    it('should handle update priority failure', async () => {
      (InboxService.updatePriority as jest.Mock).mockRejectedValue(new Error('API error'));

      const dispatch = jest.fn();
      const thunk = updateInboxPriority({ id: 1, priority: 'high' });
      await thunk(dispatch, () => ({}), undefined);

      // Verify error handling
    });
  });
});
```

**Service Tests** (`src/store/inbox/specs/inboxService.spec.ts`):
```typescript
import InboxService from '../inboxService';
import { apiService } from '@/services/APIService';

jest.mock('@/services/APIService');

describe('InboxService', () => {
  describe('updatePriority', () => {
    it('should call API with correct params', async () => {
      const mockResponse = { data: { id: 1, priority: 'high' } };
      (apiService.patch as jest.Mock).mockResolvedValue(mockResponse);

      await InboxService.updatePriority(1, 'high');

      expect(apiService.patch).toHaveBeenCalledWith('/inboxes/1', { priority: 'high' });
    });

    it('should transform response to camelCase', async () => {
      const mockResponse = {
        data: { id: 1, channel_type: 'web', created_at: '2025-01-01' },
      };
      (apiService.patch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await InboxService.updatePriority(1, 'high');

      expect(result).toHaveProperty('channelType');
      expect(result).toHaveProperty('createdAt');
    });
  });
});
```

### Component Tests (Jest + React Native Testing Library)

**Component Tests** (`src/components-next/InboxPrioritySelector/specs/InboxPrioritySelector.spec.tsx`):
```typescript
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { InboxPrioritySelector } from '../InboxPrioritySelector';

const mockStore = configureStore([]);

describe('InboxPrioritySelector', () => {
  let store: any;

  beforeEach(() => {
    store = mockStore({
      inbox: { inboxes: [], loading: false, error: null },
    });
    store.dispatch = jest.fn();
  });

  it('renders priority selector with current priority', () => {
    const { getByText } = render(
      <Provider store={store}>
        <InboxPrioritySelector inboxId={1} currentPriority="medium" />
      </Provider>
    );

    expect(getByText('Priority')).toBeTruthy();
  });

  it('dispatches updateInboxPriority on selection change', async () => {
    const { getByTestId } = render(
      <Provider store={store}>
        <InboxPrioritySelector inboxId={1} currentPriority="medium" />
      </Provider>
    );

    const picker = getByTestId('priority-picker');
    fireEvent(picker, 'valueChange', 'high');

    expect(store.dispatch).toHaveBeenCalled();
  });
});
```

### Coverage Goals
- Redux State: ≥85% for slices, actions, services
- Components: ≥80% for new UI components
- Selectors: ≥90% for memoized selectors

---

## Risk Assessment

### Technical Risks

**Risk 1**: Redux state inconsistency after updates
- **Probability**: Low
- **Impact**: Medium (UI shows stale data)
- **Mitigation**: Use Redux Toolkit immer for safe mutations, comprehensive state tests

**Risk 2**: API integration failure with backend
- **Probability**: Medium
- **Impact**: High (feature won't work)
- **Mitigation**: Mock API responses in tests, verify backend endpoint exists, test with staging backend

**Risk 3**: Platform-specific rendering issues (iOS vs Android)
- **Probability**: Medium
- **Impact**: Low (cosmetic issues only)
- **Mitigation**: Test on both iOS and Android devices, use platform-agnostic Tailwind styles

**Risk 4**: AsyncStorage persistence failure
- **Probability**: Low
- **Impact**: Low (state resets on app restart)
- **Mitigation**: Redux Persist handles gracefully, optional field won't break existing state

### Business Risks

**Risk 1**: Users confused by new priority field
- **Probability**: Low
- **Impact**: Low
- **Mitigation**: Clear labels with i18n, tooltips if needed, optional field

---

## Deployment Plan

### Pre-Deployment Checklist
- [ ] All Jest tests passing (`pnpm test`)
- [ ] Code review approved
- [ ] TypeScript compilation successful (`tsc --noEmit`)
- [ ] ESLint passing (`pnpm run lint`)
- [ ] i18n verified (en + es translations)
- [ ] Tested on iOS device/simulator
- [ ] Tested on Android device/emulator
- [ ] Backend API endpoint verified in staging
- [ ] Documentation updated

### Deployment Steps (EAS Build)

**Development Build**:
```bash
# 1. Merge feature branch to development
git checkout development
git merge feature/inbox-priority

# 2. Build for development
pnpm run build:android:dev
pnpm run build:ios:dev

# 3. Test on devices via Expo Go or dev client

# 4. Monitor for errors in Expo dashboard
```

**Production Build**:
```bash
# 1. Merge to main branch
git checkout main
git merge development

# 2. Push to trigger CI/CD
git push origin main

# 3. Monitor EAS Build
eas build:list

# 4. Submit to app stores (automatic on main merge)
# Android: Google Play Console
# iOS: App Store Connect

# 5. Monitor for crashes via Sentry/Firebase Crashlytics
```

### Rollback Plan
```bash
# If issues found after deployment

# Option 1: Revert commit
git revert <commit-hash>
git push origin main

# Option 2: Rollback to previous build
# In Google Play Console: deactivate current release, activate previous
# In App Store Connect: remove current build from review, resubmit previous

# Option 3: Feature flag (if implemented)
# Disable priority feature via remote config without new build
```

### Post-Deployment Monitoring
- Monitor Redux state in production via logging
- Check error rates in Sentry/Firebase Crashlytics
- Monitor API error rates for priority updates
- Collect user feedback on new feature

---

## Open Questions

1. **Q**: Should we allow filtering stores by priority in the API?
   - **Impact**: Would require additional endpoint parameter
   - **Recommendation**: Yes, add `?priority=high` filter to index endpoint

2. **Q**: Should priority changes create audit log entries?
   - **Impact**: Additional database writes
   - **Recommendation**: Yes if audit trail is critical, otherwise use Rails logger

---

## Next Steps

1. [ ] Get design approval from stakeholders
2. [ ] Verify backend API endpoint exists and supports priority field
3. [ ] Create feature branch: `feature/inbox-priority` (from `development`)
4. [ ] Create execution tracking document from DEVELOPMENT_EXECUTION_TEMPLATE.md
5. [ ] Begin implementation following development_process.md
6. [ ] Test on both iOS and Android
7. [ ] Schedule code review after implementation
8. [ ] Submit for QA testing

**Estimated Timeline**: 2-3 days
- Redux state implementation: 0.5 days
- Component implementation: 0.5 days
- API integration: 0.5 days
- Testing (Jest + manual): 0.5 days
- Code review & fixes: 0.5-1 day

---

## Related Documentation

- **Architecture**: [docs/ARCHITECTURE.md](../../ARCHITECTURE.md)
- **Development Guidelines**: [CLAUDE.md](../../CLAUDE.md)
- **Development Process**: [../development/development_process.md](../development/development_process.md)
- **Research Report**: [Link to research document]

---

**Last Updated**: YYYY-MM-DD HH:MM:SS
**Updated By**: Claude Code (Anthropic)
**Status**: Draft
