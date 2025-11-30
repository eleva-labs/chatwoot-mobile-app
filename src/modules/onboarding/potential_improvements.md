# Potential Improvements to Onboarding Module

This document outlines potential enhancements to the onboarding module's JSON structure and capabilities to support more complex onboarding flows, such as the store onboarding requirements.

## Context

The current onboarding module supports a solid foundation of question types and conditional logic. However, real-world onboarding flows (like store onboarding) require more advanced features that are currently missing. This document identifies these gaps and proposes solutions.

## Current Limitations

### What Works Well
- ✅ Single question per screen
- ✅ Basic conditional logic (show/hide based on one condition)
- ✅ Static validation rules
- ✅ Standard question types (text, single_select, multi_select, date, rating, slider, file_upload)
- ✅ Skippable questions
- ✅ Custom input options for select fields

### What's Missing
- ❌ Multiple fields on a single screen (compound questions)
- ❌ Repeatable/dynamic arrays of fields
- ❌ Advanced conditional logic (AND/OR operators, multiple conditions)
- ❌ Field-level conditional options (options appearing/disappearing)
- ❌ Auto-generated/computed default values
- ❌ Character limit categories (short/medium/long text)
- ❌ Context-aware defaults based on previous answers
- ❌ Visual grouping of related fields

## Proposed Improvements

### 1. Multi-Field Questions (Compound Screens) ⭐ HIGH PRIORITY

**Problem**: Currently, each screen can only have one question. Real-world forms often need multiple related fields on the same screen.

**Example Use Case**: Store onboarding Question 1 needs:
- Store Name (text)
- Store Type (single_select)
- What do you offer (text)
- Store description (text, optional)

**Proposed JSON Structure**:
```json
{
  "id": "store_info",
  "type": "compound",
  "title": "Tell us about your store",
  "description": "Help us understand your business",
  "fields": [
    {
      "id": "store_name",
      "type": "text",
      "title": "Store Name",
      "placeholder": "e.g. Black Gold Coffee",
      "validation": {
        "required": true,
        "min_length": 2,
        "max_length": 100,
        "error_message": "Please enter your store name"
      },
      "ui_config": {
        "layout": "list"
      }
    },
    {
      "id": "store_type",
      "type": "single_select",
      "title": "Store Type",
      "options": [
        { "id": "appointment", "label": "Appointment/Service-based", "value": "appointment" },
        { "id": "product", "label": "Product/E-commerce", "value": "product" },
        { "id": "hybrid", "label": "Hybrid", "value": "hybrid" }
      ],
      "validation": {
        "required": true
      }
    },
    {
      "id": "offerings",
      "type": "text",
      "title": "What do you offer?",
      "placeholder": "e.g. Specialty coffee beans, subscriptions, brewing equipment",
      "validation": {
        "required": true,
        "min_length": 10,
        "max_length": 500
      },
      "ui_config": {
        "multiline": true,
        "rows": 3
      }
    },
    {
      "id": "store_description",
      "type": "text",
      "title": "Store description",
      "description": "Optional: A brief description of your store",
      "placeholder": "Premium specialty coffee roastery offering single-origin beans",
      "validation": {
        "required": false,
        "max_length": 2000
      },
      "ui_config": {
        "multiline": true,
        "rows": 4
      }
    }
  ],
  "validation": {
    "required": true
  }
}
```

**Implementation Considerations**:
- Add `"compound"` to `QuestionType` enum
- Update `Screen` entity to support `fields` array
- Modify `QuestionRenderer` to render multiple inputs
- Update validation to validate all fields in compound screen
- Ensure progress calculation accounts for compound screens correctly

---

### 2. Repeatable/Dynamic Arrays ⭐ HIGH PRIORITY

**Problem**: Some questions need to collect multiple entries of the same structure (e.g., FAQ entries, qualification criteria).

**Example Use Case**: 
- FAQ entries: Add up to 10 question/answer pairs
- Qualification criteria: Multiple criteria with fields (criterion, minimum, disqualify condition)

**Proposed JSON Structure**:
```json
{
  "id": "faq_entries",
  "type": "repeatable",
  "title": "What questions do your customers usually ask?",
  "description": "Add common questions and answers (optional, up to 10)",
  "item_template": {
    "fields": [
      {
        "id": "question",
        "type": "text",
        "title": "Question",
        "placeholder": "e.g. What's your shipping time?",
        "validation": {
          "required": true,
          "min_length": 5,
          "max_length": 200
        }
      },
      {
        "id": "answer",
        "type": "text",
        "title": "Answer",
        "placeholder": "e.g. 2-3 business days Costa Rica, 5-7 days international",
        "validation": {
          "required": true,
          "min_length": 10,
          "max_length": 1000
        },
        "ui_config": {
          "multiline": true,
          "rows": 3
        }
      }
    ]
  },
  "validation": {
    "required": false,
    "min_items": 0,
    "max_items": 10
  },
  "ui_config": {
    "add_button_text": "Add FAQ entry",
    "remove_button_text": "Remove",
    "empty_state_message": "No FAQ entries added. Click 'Add FAQ entry' to add one."
  }
}
```

**Alternative Structure for Complex Repeatable Items**:
```json
{
  "id": "qualification_criteria",
  "type": "repeatable",
  "title": "Qualification criteria",
  "description": "Define criteria for qualifying leads (Appointment stores only)",
  "conditional_logic": {
    "question_id": "store_type",
    "operator": "in",
    "value": ["appointment", "hybrid"]
  },
  "item_template": {
    "type": "compound",
    "fields": [
      {
        "id": "criterion",
        "type": "text",
        "title": "Criterion",
        "placeholder": "e.g. Years of experience",
        "validation": { "required": true }
      },
      {
        "id": "minimum",
        "type": "text",
        "title": "Minimum requirement",
        "placeholder": "e.g. 3+ years in tech",
        "validation": { "required": true }
      },
      {
        "id": "disqualify_if",
        "type": "text",
        "title": "Disqualify if",
        "placeholder": "e.g. Less than 2 years",
        "validation": { "required": false }
      }
    ]
  },
  "validation": {
    "required": false,
    "max_items": 5
  }
}
```

**Implementation Considerations**:
- Add `"repeatable"` to `QuestionType` enum
- Create `RepeatableFieldRenderer` component
- Support adding/removing items dynamically
- Validate each item in the array
- Store answer as array of objects: `[{question: "...", answer: "..."}, ...]`

---

### 3. Advanced Conditional Logic with Dynamic Options ⭐ HIGH PRIORITY

**Problem**: The module has two related limitations with conditional logic:
1. **Screen-level**: Current conditional logic only supports a single condition. Complex flows need multiple conditions with AND/OR operators.
2. **Option-level**: Options in select fields are static. Some options should dynamically appear/disappear based on previous answers.

**Example Use Cases**:
- Show entire screens only if Store Type = Appointment OR Hybrid
- Show Q4 fields only if Store Type = Product AND Objectives contains "process_orders"
- Show "Book appointments" option only if store type is Appointment/Hybrid
- Show "Process product orders" option only if store type is Product/Hybrid

---

#### Part A: Screen-Level Advanced Conditional Logic (AND/OR Operators)

**Proposed JSON Structure - Simple OR Condition**:
```json
{
  "conditional_logic": {
    "operator": "or",
    "conditions": [
      {
        "question_id": "store_type",
        "operator": "equals",
        "value": "appointment"
      },
      {
        "question_id": "store_type",
        "operator": "equals",
        "value": "hybrid"
      }
    ]
  }
}
```

**Nested Conditions (AND + OR)**:
```json
{
  "conditional_logic": {
    "operator": "and",
    "conditions": [
      {
        "question_id": "store_type",
        "operator": "equals",
        "value": "product"
      },
      {
        "operator": "or",
        "conditions": [
          {
            "question_id": "objectives",
            "operator": "contains",
            "value": "process_orders"
          },
          {
            "question_id": "objectives",
            "operator": "contains",
            "value": "product_recommendations"
          }
        ]
      }
    ]
  }
}
```

**Additional Operators**:
```json
{
  "conditional_logic": {
    "question_id": "store_type",
    "operator": "in",
    "value": ["appointment", "hybrid"]
  }
}
```

---

#### Part B: Option-Level Conditional Visibility

**Proposed JSON Structure**:
```json
{
  "id": "ai_assistant_objective",
  "type": "multi_select",
  "title": "What should your AI assistant do?",
  "options": [
    {
      "id": "answer_questions",
      "label": "Answer customer questions (FAQ support)",
      "value": "answer_questions"
    },
    {
      "id": "qualify_leads",
      "label": "Qualify leads and collect information",
      "value": "qualify_leads"
    },
    {
      "id": "book_appointments",
      "label": "Book appointments/consultations",
      "value": "book_appointments",
      "conditional_show": {
        "question_id": "store_type",
        "operator": "in",
        "value": ["appointment", "hybrid"]
      }
    },
    {
      "id": "process_orders",
      "label": "Process product orders",
      "value": "process_orders",
      "conditional_show": {
        "operator": "or",
        "conditions": [
          {
            "question_id": "store_type",
            "operator": "equals",
            "value": "product"
          },
          {
            "question_id": "store_type",
            "operator": "equals",
            "value": "hybrid"
          }
        ]
      }
    }
  ],
  "validation": {
    "required": true,
    "min_selection": 1
  }
}
```

---

#### Implementation Considerations

**Domain Layer Changes**:
- Update `ConditionalLogic` interface to support nested structure with recursive conditions
- Add `in` and `not_in` operators to `ConditionalOperator` type
- Add `conditional_show` property to `SelectOption` interface

**Service Layer Changes**:
- Modify `ConditionalLogicService.evaluate()` to handle AND/OR operators
- Support recursive evaluation of nested conditions
- Create `OptionVisibilityService` to filter options based on conditional_show

**Presentation Layer Changes**:
- Update `SingleSelectChips` and `MultiSelectChips` to filter options dynamically
- Re-evaluate option visibility when dependent answers change
- Handle edge case: selected option becomes hidden (auto-deselect or keep selection)

**Validation Layer Changes**:
- Update Zod schema to validate nested conditional logic structure
- Update `selectOptionSchema` to include `conditional_show`

**Files to Modify**:
- `src/modules/onboarding/domain/common.ts` (ConditionalLogic, ConditionalOperator, SelectOption)
- `src/modules/onboarding/domain/services/ConditionalLogicService.ts` (recursive evaluation)
- `src/modules/onboarding/presentation/components/inputs/SingleSelectChips.tsx` (option filtering)
- `src/modules/onboarding/presentation/components/inputs/MultiSelectChips.tsx` (option filtering)
- `src/modules/onboarding/infrastructure/validation/schemas/OnboardingFlowSchema.ts` (Zod schemas)

---

### 5. Auto-Generated/Computed Default Values ⭐ MEDIUM PRIORITY

**Problem**: Some fields should have dynamic defaults based on other answers or computed values.

**Example Use Case**: 
- Store description auto-generated from store name + offerings
- Default customer info fields based on store type

**Proposed JSON Structure**:
```json
{
  "id": "store_description",
  "type": "text",
  "title": "Store description",
  "default_value": {
    "type": "computed",
    "template": "{{store_name}} - {{offerings}}",
    "fallback": "Premium specialty coffee roastery offering single-origin beans delivered fresh"
  },
  "validation": {
    "required": false
  }
}
```

**Contextual Defaults**:
```json
{
  "id": "required_customer_info",
  "type": "multi_select",
  "title": "Required customer information",
  "default_value": {
    "type": "contextual",
    "source": "store_type",
    "mapping": {
      "product": ["full_name", "email", "phone", "shipping_address"],
      "appointment": ["full_name", "email", "phone", "preferred_datetime"],
      "hybrid": ["full_name", "email", "phone", "shipping_address", "preferred_datetime"]
    }
  },
  "options": [...]
}
```

**Implementation Considerations**:
- Support `computed` and `contextual` default value types
- Create service to evaluate computed defaults
- Update `Screen` entity to handle dynamic defaults
- Re-compute when source values change

---

### 6. Visual Grouping of Related Fields ⭐ LOW PRIORITY

**Problem**: Compound screens with many fields can be overwhelming. Visual grouping helps organize related fields.

**Proposed JSON Structure**:
```json
{
  "id": "store_info",
  "type": "compound",
  "title": "Tell us about your store",
  "fields": [
    {
      "group": "Basic Information",
      "fields": [
        { "id": "store_name", "type": "text", ... },
        { "id": "store_type", "type": "single_select", ... }
      ]
    },
    {
      "group": "Details",
      "fields": [
        { "id": "offerings", "type": "text", ... },
        { "id": "store_description", "type": "text", ... }
      ]
    }
  ]x
}
```

**Implementation Considerations**:
- Add optional `group` property to field structure
- Render grouped fields with visual separators
- Maintain validation and conditional logic within groups

---

### 7. Enhanced Text Input Configuration ⭐⭐ CRITICAL PRIORITY

**Problem**: The text input system has multiple related limitations:
1. **Multiline Support**: Text input fields are currently limited to single-line by default, with a hacky workaround using `ui_config.layout === 'grid'`
2. **Line Configuration**: No way to specify the number of visible rows for multiline inputs
3. **Character Limits**: No semantic categories for different text types (short/medium/long)
4. **Character Counters**: No visual feedback for character limits and remaining characters
5. **UX Feedback**: No warning when approaching character limits

Many onboarding questions require longer text responses (store descriptions, detailed answers) that need proper multiline support with appropriate UI feedback.

**Current Implementation Issues**:
1. **TextInput component** (`presentation/components/inputs/TextInput.tsx`): Already supports `multiline` and `numberOfLines` props (lines 11-12, 25-26)
2. **QuestionRenderer** (`presentation/components/QuestionRenderer.tsx:45`): Uses hacky approach: `multiline={screen.uiConfig?.layout === 'grid'}` - This repurposes the `layout` property for an unintended use case
3. **numberOfLines prop**: Never passed from QuestionRenderer to TextInput, so line count cannot be configured
4. **UIConfig interface** (`domain/common.ts`): Missing proper multiline-specific properties and character counter options
5. **ValidationRule interface**: Has `max_length` but no semantic categories or character counter display options
6. **MockOnboardingRepository**: Contains questions that should be multiline but render as single-line inputs

**Architecture Analysis** (Clean Architecture + SOLID):

The module follows Clean Architecture with clear layer separation:
```
JSON (Server)
  → DTO Layer (OnboardingFlowDTO, ScreenDTO)
  → Mapper Layer (OnboardingFlowMapper)
  → Domain Layer (Screen entity, UIConfig interface)
  → Validation Layer (Zod schemas)
  → Presentation Layer (QuestionRenderer → TextInput)
```

---

#### Part A: Basic Multiline Support (CRITICAL - Phase 1)

**Required Changes** (Following SOLID principles):

1. **Domain Layer** - `domain/common.ts:61-84` (UIConfig interface):
   ```typescript
   export interface UIConfig {
     // ... existing properties ...

     // Text input specific (Phase 1 - Basic)
     multiline?: boolean;           // Enable multiline text input
     rows?: number;                 // Number of visible rows (default: 4)

     // Text input specific (Phase 2 - Enhanced)
     show_character_count?: boolean;             // Display character counter
     character_count_warning_threshold?: number; // Warning at % of max (0.0-1.0, default: 0.9)

     // ... rest of properties ...
   }
   ```

2. **Validation Layer** - `infrastructure/validation/schemas/OnboardingFlowSchema.ts:54-77` (uiConfigSchema):
   ```typescript
   export const uiConfigSchema = z.object({
     // ... existing properties ...

     // Text input specific
     multiline: z.boolean().optional(),
     rows: z.number().min(1).max(20).optional(),
     show_character_count: z.boolean().optional(),
     character_count_warning_threshold: z.number().min(0).max(1).optional(),

     // ... rest of properties ...
   });
   ```

3. **Presentation Layer** - `presentation/components/QuestionRenderer.tsx:38-47`:
   ```typescript
   case 'text':
     return (
       <TextInput
         value={String(value || '')}
         onChangeText={text => onChange(text)}
         placeholder={screen.placeholder}
         error={error}
         required={screen.isRequired()}
         multiline={screen.uiConfig?.multiline ?? false}
         numberOfLines={screen.uiConfig?.rows ?? 1}
         maxLength={screen.validation?.max_length}
         showCharacterCount={screen.uiConfig?.show_character_count ?? false}
         warningThreshold={screen.uiConfig?.character_count_warning_threshold ?? 0.9}
       />
     );
   ```

4. **Component Layer** - Update `TextInput.tsx` to support character counter:
   ```typescript
   interface TextInputProps {
     // ... existing props ...
     maxLength?: number;
     showCharacterCount?: boolean;
     warningThreshold?: number; // 0.0-1.0
   }

   export function TextInput({
     value,
     maxLength,
     showCharacterCount,
     warningThreshold = 0.9,
     // ... other props
   }: TextInputProps) {
     const remaining = maxLength ? maxLength - value.length : 0;
     const isWarning = maxLength && (value.length / maxLength) >= warningThreshold;

     return (
       <View>
         <RNTextInput
           value={value}
           maxLength={maxLength}
           // ... other props
         />
         {showCharacterCount && maxLength && (
           <Text style={{ color: isWarning ? 'orange' : 'gray' }}>
             {remaining} characters remaining
           </Text>
         )}
       </View>
     );
   }
   ```

5. **Infrastructure Layer** - Update `MockOnboardingRepository.ts` mock data examples:
   ```json
   {
     "id": "store_info",
     "type": "text",
     "title": "Tell us about your store and what do you offer?",
     "description": "Describe your store and the products or services you offer",
     "placeholder": "e.g. Black Gold Coffee - Specialty coffee beans, subscriptions, and brewing equipment",
     "validation": {
       "required": true,
       "min_length": 10,
       "max_length": 500,
       "error_message": "Please provide information about your store and offerings"
     },
     "ui_config": {
       "multiline": true,
       "rows": 4,
       "show_character_count": true
     }
   }
   ```


---

#### Benefits

**Phase 1 (Multiline Support)**:
- ✅ Intuitive and explicit multiline configuration
- ✅ Configurable number of visible rows
- ✅ Removes hacky `layout: 'grid'` workaround
- ✅ Follows Single Responsibility Principle (layout property used only for layout)
- ✅ Consistent with existing architecture patterns

**Phase 2 (Character Counters)**:
- ✅ Real-time character count feedback
- ✅ Visual warnings when approaching limits
- ✅ Better user guidance and error prevention

---

#### Implementation Steps

**Phase 1: Basic Multiline (CRITICAL)**:
1. Update `UIConfig` interface with `multiline` and `rows` in `domain/common.ts`
2. Update `uiConfigSchema` in Zod validation schema
3. Fix `QuestionRenderer` to use new properties instead of layout hack
4. Update `MockOnboardingRepository` with proper multiline examples
5. Add unit tests for multiline validation
6. Update README.md with multiline configuration examples

**Phase 2: Enhanced Features (OPTIONAL)**:
7. Add character counter display to `TextInput` component
8. Implement warning threshold logic
9. Update tests for character counter functionality

---

#### Testing Considerations

- Test single-line behavior when `multiline` is false
- Test various `rows` values (1, 3, 5, 10)
- Ensure validation works correctly for multiline text (min_length, max_length)
- Test with long text that exceeds configured rows
- Verify character counter displays correctly
- Test warning threshold triggers at correct percentage
- Verify accessibility attributes work correctly

---

#### Files to Modify

**Phase 1**:
- `src/modules/onboarding/domain/common.ts` (UIConfig interface)
- `src/modules/onboarding/infrastructure/validation/schemas/OnboardingFlowSchema.ts` (Zod schema)
- `src/modules/onboarding/presentation/components/QuestionRenderer.tsx` (text case rendering)
- `src/modules/onboarding/infrastructure/api/MockOnboardingRepository.ts` (mock data examples)
- `src/modules/onboarding/README.md` (documentation)

**Phase 2**:
- `src/modules/onboarding/presentation/components/inputs/TextInput.tsx` (character counter UI)

---

#### Example Usage in JSON

**Short text (single line, Phase 1)**:
```json
{
  "id": "store_name",
  "type": "text",
  "title": "Store Name",
  "placeholder": "e.g. Black Gold Coffee",
  "validation": {
    "required": true,
    "max_length": 100
  },
  "ui_config": {
    "multiline": false
  }
}
```

**Medium text (3-4 lines, Phase 1)**:
```json
{
  "id": "offerings",
  "type": "text",
  "title": "What do you offer?",
  "placeholder": "e.g. Specialty coffee beans, subscriptions...",
  "validation": {
    "required": true,
    "max_length": 500
  },
  "ui_config": {
    "multiline": true,
    "rows": 3
  }
}
```

**Long text with character counter (5+ lines, Phase 1 + Phase 2)**:
```json
{
  "id": "store_description",
  "type": "text",
  "title": "Store description",
  "placeholder": "Detailed description of your store...",
  "validation": {
    "required": false,
    "max_length": 2000
  },
  "ui_config": {
    "multiline": true,
    "rows": 6,
    "show_character_count": true,
    "character_count_warning_threshold": 0.85
  }
}
```

---

## Priority Summary

### Critical Priority (Immediate Need)
**7. Enhanced Text Input Configuration (Phase 1)** - CRITICAL fix for current `layout: 'grid'` hack, enables proper multiline text input with configurable rows

### High Priority (Core Features)
1. **Multi-Field Questions (Compound Screens)** - Essential for complex forms
2. **Repeatable/Dynamic Arrays** - Needed for FAQs, criteria, etc.
3. **Advanced Conditional Logic with Dynamic Options** - Screen-level AND/OR logic + option-level conditional visibility

### Medium Priority (Enhanced UX)
4. **Auto-Generated/Computed Defaults** - Reduces friction with contextual defaults
5. **Enhanced Text Input Configuration (Phase 2)** - Character counters with warning thresholds

### Low Priority (Nice to Have)
6. **Visual Grouping** - Organizational improvement for compound screens

## Implementation Strategy

### Phase 0: Critical Fix (IMMEDIATE)
**7. Enhanced Text Input Configuration (Phase 1)** - Fix the current `layout: 'grid'` hack and add proper multiline configuration with configurable rows. This is the foundation for better text input UX.

### Phase 1: Foundation (High Priority)
1. **Multi-Field Questions (Compound Screens)** - Enable multiple related fields on a single screen
2. **Repeatable/Dynamic Arrays** - Support for adding/removing sets of fields dynamically
3. **Advanced Conditional Logic with Dynamic Options** - Implement:
   - Part A: Screen-level AND/OR operators with nested conditions
   - Part B: Option-level conditional visibility based on previous answers

### Phase 2: Enhancement (Medium Priority)
4. **Auto-Generated/Computed Defaults** - Contextual and computed default values based on previous answers
5. **Enhanced Text Input Configuration (Phase 2)** - Add character counters with warning thresholds (builds on Phase 0)

### Phase 3: Polish (Low Priority)
6. **Visual Grouping** - Group related fields within compound screens for better organization

## Breaking Changes Considerations

Some of these improvements may require:
- **Schema updates**: Update Zod schemas as needed
- **Flow version updates**: Bump version number when making breaking changes

## Testing Considerations

Each improvement should include:
- Unit tests for new validation logic
- Integration tests for conditional logic evaluation
- UI component tests for new renderers
- End-to-end tests for complete flows

## Related Documentation

- [README.md](./README.md) - Current module documentation
- [Store Onboarding Requirements](../../../chatscommerce-backend/docs/ignored/store-onboarding-questions.md) - Real-world use case

