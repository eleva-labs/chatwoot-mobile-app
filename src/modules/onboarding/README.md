# Onboarding Module

A self-contained, server-driven onboarding kit for Expo/React Native. `OnboardingModule` is the primary export: it assembles repositories, validation, offline queueing, theming, and events internally so consumers only provide configuration and callbacks.

## Server JSON Contract

```json
{
  "onboarding_flow": {
    "id": "enterprise-welcome-v2",
    "version": "2.1.0",
    "locale": "en",
    "title": "Welcome to Enterprise",
    "skip_config": {
      "allow_skip_entire_flow": true,
      "skip_entire_flow_button": "Skip onboarding",
      "skip_confirmation": {
        "title": "Skip onboarding?",
        "message": "You can continue later from settings",
        "confirm_text": "Skip",
        "cancel_text": "Keep going"
      },
      "track_skip_reasons": true
    },
    "screens": [
      {
        "id": "name",
        "type": "text",
        "title": "Your full name",
        "description": "We use this to personalize replies",
        "placeholder": "e.g. Jamie Doe",
        "validation": {
          "required": true,
          "min_length": 3,
          "error_message": "Please enter your name"
        },
        "ui_config": {
          "layout": "list",
          "show_value": true
        }
      },
      {
        "id": "role",
        "type": "single_select",
        "title": "Your role",
        "options": [
          { "id": "support", "label": "Support", "value": "support" },
          { "id": "sales", "label": "Sales", "value": "sales" },
          {
            "id": "ops",
            "label": "Operations",
            "value": "ops",
            "allow_custom_input": true,
            "custom_input_placeholder": "Describe your team"
          }
        ],
        "validation": {
          "required": true,
          "skip_button_text": "Skip role"
        },
        "conditional_logic": {
          "question_id": "name",
          "operator": "is_not_empty",
          "value": ""
        }
      },
      {
        "id": "interests",
        "type": "multi_select",
        "title": "Select interest areas",
        "options": [
          { "id": "product", "label": "Product", "value": "product" },
          { "id": "docs", "label": "Documentation", "value": "docs" },
          { "id": "integrations", "label": "Integrations", "value": "integrations" }
        ],
        "validation": {
          "max_selection": 2,
          "error_message": "Choose up to two areas"
        }
      },
      {
        "id": "availability",
        "type": "date",
        "title": "Preferred kickoff date",
        "ui_config": {
          "mode": "datetime",
          "min_date": "2025-01-01",
          "max_date": "2025-12-31"
        }
      },
      {
        "id": "confidence",
        "type": "rating",
        "title": "Your confidence level",
        "ui_config": {
          "style": "stars",
          "max_rating": 5,
          "allow_half": true
        },
        "default_value": 4
      },
      {
        "id": "budget",
        "type": "slider",
        "title": "Target monthly spend ($)",
        "ui_config": {
          "min": 500,
          "max": 5000,
          "step": 250,
          "show_value": true,
          "unit": "USD"
        }
      },
      {
        "id": "identity",
        "type": "file_upload",
        "title": "Upload ID (optional)",
        "ui_config": {
          "accept": ["image/jpeg", "application/pdf"],
          "max_size_mb": 5,
          "show_camera_option": true
        },
        "validation": {
          "required": false
        }
      }
    ]
  }
}
```

- The JSON mirrors `OnboardingFlowDTO` → `OnboardingFlow`. Fields such as `screens`, `skip_config`, `validation`, `ui_config`, and `conditional_logic` must match the Zod schema.
- Every screen type above (`text`, `single_select`, `multi_select`, `date`, `rating`, `slider`, `file_upload`) is supported out of the box.
- Optional fields like `default_value`, `placeholder`, and `options` allow rich UI control and conditional branching.

## Complete JSON Configuration Reference

This section provides comprehensive examples of all features and capabilities of the onboarding module.

### Question Types Overview

| Type | Description | Use Cases |
|------|-------------|-----------|
| `text` | Single-line or multiline text input | Names, emails, descriptions, feedback |
| `single_select` | Select one option from a list | Gender, role, preferences |
| `multi_select` | Select multiple options from a list | Interests, features, permissions |
| `date` | Date, time, or datetime picker | Birthdate, appointment, availability |
| `rating` | Star, heart, or thumb rating | Satisfaction, confidence, experience |
| `slider` | Numeric slider with min/max | Budget, quantity, percentage |
| `file_upload` | File/image upload | Profile photo, documents, ID |

### 1. Text Input - All Variations

#### Single-Line Text
```json
{
  "id": "email",
  "type": "text",
  "title": "What's your email address?",
  "placeholder": "you@example.com",
  "validation": {
    "required": true,
    "pattern": "^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$",
    "error_message": "Please enter a valid email address"
  }
}
```

#### Multiline Text with Character Counter
```json
{
  "id": "store_description",
  "type": "text",
  "title": "Tell us about your store",
  "description": "Describe what products or services you offer",
  "placeholder": "We sell...",
  "validation": {
    "required": true,
    "min_length": 20,
    "max_length": 500,
    "error_message": "Please provide at least 20 characters"
  },
  "ui_config": {
    "multiline": true,
    "rows": 6,
    "show_character_count": true,
    "character_count_warning_threshold": 0.85
  }
}
```

**Character Counter Behavior:**
- **Gray** (0-84%): Normal state
- **Orange** (85-99%): Warning threshold reached
- **Red** (100%): Maximum length reached

#### Text with Length Constraints
```json
{
  "id": "short_bio",
  "type": "text",
  "title": "Write a brief bio",
  "validation": {
    "required": true,
    "min_length": 10,
    "max_length": 150
  },
  "ui_config": {
    "multiline": true,
    "rows": 3,
    "show_character_count": true,
    "character_count_warning_threshold": 0.9
  }
}
```

### 2. Single Select - All Variations

#### Basic Single Select
```json
{
  "id": "business_size",
  "type": "single_select",
  "title": "What's your business size?",
  "options": [
    { "id": "solo", "label": "Just me", "value": "solo" },
    { "id": "small", "label": "2-10 employees", "value": "small" },
    { "id": "medium", "label": "11-50 employees", "value": "medium" },
    { "id": "large", "label": "51+ employees", "value": "large" }
  ],
  "validation": {
    "required": true
  }
}
```

#### Single Select with Custom Input (Other Option)
```json
{
  "id": "industry",
  "type": "single_select",
  "title": "What industry are you in?",
  "options": [
    { "id": "retail", "label": "Retail", "value": "retail" },
    { "id": "saas", "label": "SaaS", "value": "saas" },
    { "id": "healthcare", "label": "Healthcare", "value": "healthcare" },
    {
      "id": "other",
      "label": "Other",
      "value": "other",
      "allow_custom_input": true,
      "custom_input_placeholder": "Please specify your industry"
    }
  ],
  "validation": {
    "required": true
  }
}
```

#### Single Select with Conditional Options
```json
{
  "id": "store_type",
  "type": "single_select",
  "title": "What type of store do you have?",
  "options": [
    { "id": "appointment", "label": "Appointment/Service-based", "value": "appointment" },
    { "id": "product", "label": "Product/E-commerce", "value": "product" },
    { "id": "hybrid", "label": "Hybrid (Both)", "value": "hybrid" }
  ],
  "validation": {
    "required": true
  }
}
```

### 3. Multi Select - All Variations

#### Basic Multi Select
```json
{
  "id": "communication_channels",
  "type": "multi_select",
  "title": "Which channels do you use?",
  "description": "Select all that apply",
  "options": [
    { "id": "email", "label": "Email", "value": "email" },
    { "id": "phone", "label": "Phone", "value": "phone" },
    { "id": "chat", "label": "Live Chat", "value": "chat" },
    { "id": "social", "label": "Social Media", "value": "social" }
  ]
}
```

#### Multi Select with Max Selection
```json
{
  "id": "top_priorities",
  "type": "multi_select",
  "title": "What are your top 3 priorities?",
  "options": [
    { "id": "growth", "label": "Customer Growth", "value": "growth" },
    { "id": "retention", "label": "Customer Retention", "value": "retention" },
    { "id": "automation", "label": "Automation", "value": "automation" },
    { "id": "analytics", "label": "Analytics & Insights", "value": "analytics" },
    { "id": "support", "label": "Customer Support", "value": "support" }
  ],
  "validation": {
    "required": true,
    "max_selection": 3,
    "error_message": "Please select up to 3 priorities"
  }
}
```

#### Multi Select with Conditional Options (Dynamic Options)
```json
{
  "id": "ai_assistant_features",
  "type": "multi_select",
  "title": "What should your AI assistant help with?",
  "description": "Select all features you'd like to enable",
  "options": [
    { "id": "faq", "label": "Answer customer questions (FAQ)", "value": "faq" },
    { "id": "product_info", "label": "Provide product information", "value": "product_info" },
    {
      "id": "appointment_booking",
      "label": "Book appointments/consultations",
      "value": "appointment_booking",
      "conditional_show": {
        "operator": "in",
        "question_id": "store_type",
        "value": ["appointment", "hybrid"]
      }
    },
    {
      "id": "order_processing",
      "label": "Process product orders",
      "value": "order_processing",
      "conditional_show": {
        "operator": "in",
        "question_id": "store_type",
        "value": ["product", "hybrid"]
      }
    },
    {
      "id": "order_tracking",
      "label": "Track order status",
      "value": "order_tracking",
      "conditional_show": {
        "operator": "equals",
        "question_id": "store_type",
        "value": "product"
      }
    }
  ],
  "validation": {
    "required": true
  }
}
```

### 4. Date Picker - All Variations

#### Date Only
```json
{
  "id": "birthdate",
  "type": "date",
  "title": "What's your date of birth?",
  "ui_config": {
    "mode": "date",
    "max_date": "2010-01-01",
    "display_format": "MMMM DD, YYYY"
  },
  "validation": {
    "required": true
  }
}
```

#### Date with Range Constraints
```json
{
  "id": "launch_date",
  "type": "date",
  "title": "When do you want to launch?",
  "ui_config": {
    "mode": "date",
    "min_date": "2025-01-01",
    "max_date": "2025-12-31",
    "display_format": "MM/DD/YYYY"
  }
}
```

#### DateTime Picker
```json
{
  "id": "appointment_time",
  "type": "date",
  "title": "Select your preferred appointment time",
  "ui_config": {
    "mode": "datetime",
    "min_date": "2025-12-01T09:00:00",
    "max_date": "2025-12-31T17:00:00"
  },
  "validation": {
    "required": true
  }
}
```

#### Time Only
```json
{
  "id": "preferred_contact_time",
  "type": "date",
  "title": "Best time to reach you?",
  "ui_config": {
    "mode": "time"
  }
}
```

### 5. Rating - All Variations

#### Star Rating
```json
{
  "id": "satisfaction",
  "type": "rating",
  "title": "How satisfied are you with our service?",
  "ui_config": {
    "style": "stars",
    "max_rating": 5,
    "size": "large"
  },
  "validation": {
    "required": true,
    "min_rating": 1,
    "error_message": "Please provide a rating"
  }
}
```

#### Heart Rating
```json
{
  "id": "love_level",
  "type": "rating",
  "title": "How much do you love our product?",
  "ui_config": {
    "style": "hearts",
    "max_rating": 5,
    "size": "medium"
  },
  "default_value": 0
}
```

#### Thumbs Rating
```json
{
  "id": "recommendation",
  "type": "rating",
  "title": "Would you recommend us?",
  "ui_config": {
    "style": "thumbs",
    "max_rating": 2,
    "size": "large"
  }
}
```

#### Rating with Half Values
```json
{
  "id": "product_rating",
  "type": "rating",
  "title": "Rate our product",
  "ui_config": {
    "style": "stars",
    "max_rating": 5,
    "allow_half": true,
    "size": "medium"
  },
  "default_value": 3.5
}
```

### 6. Slider - All Variations

#### Budget Slider
```json
{
  "id": "monthly_budget",
  "type": "slider",
  "title": "What's your monthly budget?",
  "ui_config": {
    "min": 0,
    "max": 10000,
    "step": 500,
    "show_value": true,
    "unit": "USD"
  },
  "default_value": 2500,
  "validation": {
    "required": true
  }
}
```

#### Percentage Slider
```json
{
  "id": "discount_preference",
  "type": "slider",
  "title": "Minimum discount to consider?",
  "ui_config": {
    "min": 0,
    "max": 100,
    "step": 5,
    "show_value": true,
    "unit": "%"
  },
  "default_value": 20
}
```

#### Quantity Slider
```json
{
  "id": "team_size",
  "type": "slider",
  "title": "How many team members?",
  "ui_config": {
    "min": 1,
    "max": 50,
    "step": 1,
    "show_value": true,
    "unit": "people"
  },
  "default_value": 5
}
```

### 7. File Upload

```json
{
  "id": "profile_photo",
  "type": "file_upload",
  "title": "Upload your profile photo",
  "description": "This helps personalize your experience",
  "ui_config": {
    "accept": ["image/jpeg", "image/png"],
    "max_size_mb": 5,
    "crop_aspect_ratio": "1:1",
    "show_camera_option": true
  },
  "validation": {
    "required": false
  }
}
```

### 8. Conditional Logic - All Patterns

#### Simple Condition (equals)
```json
{
  "id": "company_name",
  "type": "text",
  "title": "What's your company name?",
  "conditional_logic": {
    "operator": "equals",
    "question_id": "business_size",
    "value": "large"
  }
}
```

#### Multiple Values (IN operator)
```json
{
  "id": "team_management",
  "type": "single_select",
  "title": "How do you manage your team?",
  "options": [
    { "id": "manual", "label": "Manual scheduling", "value": "manual" },
    { "id": "software", "label": "Scheduling software", "value": "software" }
  ],
  "conditional_logic": {
    "operator": "in",
    "question_id": "business_size",
    "value": ["small", "medium", "large"]
  }
}
```

#### AND Logic (All conditions must be true)
```json
{
  "id": "enterprise_features",
  "type": "multi_select",
  "title": "Select enterprise features",
  "options": [
    { "id": "sso", "label": "Single Sign-On", "value": "sso" },
    { "id": "audit", "label": "Audit Logs", "value": "audit" }
  ],
  "conditional_logic": {
    "operator": "and",
    "conditions": [
      {
        "operator": "equals",
        "question_id": "business_size",
        "value": "large"
      },
      {
        "operator": "in",
        "question_id": "industry",
        "value": ["saas", "healthcare"]
      }
    ]
  }
}
```

#### OR Logic (Any condition can be true)
```json
{
  "id": "discount_eligibility",
  "type": "text",
  "title": "Enter your discount code",
  "conditional_logic": {
    "operator": "or",
    "conditions": [
      {
        "operator": "equals",
        "question_id": "business_size",
        "value": "solo"
      },
      {
        "operator": "equals",
        "question_id": "industry",
        "value": "nonprofit"
      }
    ]
  }
}
```

#### Nested AND/OR Logic (Complex)
```json
{
  "id": "premium_consultation",
  "type": "date",
  "title": "Schedule premium consultation",
  "conditional_logic": {
    "operator": "and",
    "conditions": [
      {
        "operator": "or",
        "conditions": [
          {
            "operator": "equals",
            "question_id": "business_size",
            "value": "large"
          },
          {
            "operator": "greater_than",
            "question_id": "monthly_budget",
            "value": 5000
          }
        ]
      },
      {
        "operator": "contains",
        "question_id": "top_priorities",
        "value": "growth"
      }
    ]
  }
}
```

#### Contains Operator (For arrays/multi-select)
```json
{
  "id": "email_marketing",
  "type": "single_select",
  "title": "Choose your email platform",
  "options": [
    { "id": "mailchimp", "label": "Mailchimp", "value": "mailchimp" },
    { "id": "sendgrid", "label": "SendGrid", "value": "sendgrid" }
  ],
  "conditional_logic": {
    "operator": "contains",
    "question_id": "communication_channels",
    "value": "email"
  }
}
```

#### Not Empty Operator
```json
{
  "id": "follow_up",
  "type": "text",
  "title": "Any additional comments?",
  "conditional_logic": {
    "operator": "is_not_empty",
    "question_id": "email"
  }
}
```

### 9. Complete Real-World Example

Here's a complete store onboarding flow demonstrating multiple features:

```json
{
  "onboarding_flow": {
    "id": "store-onboarding-v3",
    "version": "3.0.0",
    "locale": "en",
    "title": "Store Setup Wizard",
    "skip_config": {
      "allow_skip_entire_flow": false,
      "track_skip_reasons": true
    },
    "screens": [
      {
        "id": "store_name",
        "type": "text",
        "title": "What's your store name?",
        "placeholder": "My Awesome Store",
        "validation": {
          "required": true,
          "min_length": 3,
          "max_length": 50,
          "error_message": "Store name must be 3-50 characters"
        }
      },
      {
        "id": "store_type",
        "type": "single_select",
        "title": "What type of store do you have?",
        "options": [
          { "id": "appointment", "label": "Appointment/Service-based", "value": "appointment" },
          { "id": "product", "label": "Product/E-commerce", "value": "product" },
          { "id": "hybrid", "label": "Hybrid (Both)", "value": "hybrid" }
        ],
        "validation": {
          "required": true
        },
        "conditional_logic": {
          "operator": "is_not_empty",
          "question_id": "store_name"
        }
      },
      {
        "id": "store_description",
        "type": "text",
        "title": "Tell us about your store",
        "description": "Describe what you offer to help us personalize your experience",
        "placeholder": "We offer...",
        "validation": {
          "required": true,
          "min_length": 20,
          "max_length": 500
        },
        "ui_config": {
          "multiline": true,
          "rows": 6,
          "show_character_count": true,
          "character_count_warning_threshold": 0.85
        },
        "conditional_logic": {
          "operator": "is_not_empty",
          "question_id": "store_type"
        }
      },
      {
        "id": "business_size",
        "type": "single_select",
        "title": "How big is your business?",
        "options": [
          { "id": "solo", "label": "Just me", "value": "solo" },
          { "id": "small", "label": "2-10 employees", "value": "small" },
          { "id": "medium", "label": "11-50 employees", "value": "medium" },
          { "id": "large", "label": "51+ employees", "value": "large" }
        ],
        "validation": {
          "required": true
        }
      },
      {
        "id": "monthly_budget",
        "type": "slider",
        "title": "What's your monthly budget for automation?",
        "ui_config": {
          "min": 0,
          "max": 5000,
          "step": 250,
          "show_value": true,
          "unit": "USD"
        },
        "default_value": 1000,
        "conditional_logic": {
          "operator": "in",
          "question_id": "business_size",
          "value": ["small", "medium", "large"]
        }
      },
      {
        "id": "communication_channels",
        "type": "multi_select",
        "title": "Which channels do you use to communicate with customers?",
        "description": "Select all that apply",
        "options": [
          { "id": "email", "label": "Email", "value": "email" },
          { "id": "phone", "label": "Phone", "value": "phone" },
          { "id": "chat", "label": "Live Chat", "value": "chat" },
          { "id": "whatsapp", "label": "WhatsApp", "value": "whatsapp" },
          { "id": "social", "label": "Social Media", "value": "social" }
        ],
        "validation": {
          "required": true
        }
      },
      {
        "id": "ai_features",
        "type": "multi_select",
        "title": "What should your AI assistant help with?",
        "description": "These features will be configured based on your store type",
        "options": [
          { "id": "faq", "label": "Answer customer questions", "value": "faq" },
          { "id": "product_info", "label": "Provide product information", "value": "product_info" },
          {
            "id": "appointment_booking",
            "label": "Book appointments",
            "value": "appointment_booking",
            "conditional_show": {
              "operator": "in",
              "question_id": "store_type",
              "value": ["appointment", "hybrid"]
            }
          },
          {
            "id": "order_processing",
            "label": "Process orders",
            "value": "order_processing",
            "conditional_show": {
              "operator": "in",
              "question_id": "store_type",
              "value": ["product", "hybrid"]
            }
          },
          {
            "id": "order_tracking",
            "label": "Track orders",
            "value": "order_tracking",
            "conditional_show": {
              "operator": "equals",
              "question_id": "store_type",
              "value": "product"
            }
          }
        ],
        "validation": {
          "required": true,
          "max_selection": 3,
          "error_message": "Please select up to 3 features"
        }
      },
      {
        "id": "launch_date",
        "type": "date",
        "title": "When do you want to go live?",
        "ui_config": {
          "mode": "date",
          "min_date": "2025-12-01",
          "max_date": "2026-12-31",
          "display_format": "MMMM DD, YYYY"
        },
        "validation": {
          "required": true
        }
      },
      {
        "id": "satisfaction",
        "type": "rating",
        "title": "How excited are you about AI automation?",
        "ui_config": {
          "style": "stars",
          "max_rating": 5,
          "size": "large"
        },
        "default_value": 4,
        "validation": {
          "required": true
        }
      }
    ]
  }
}
```

### 10. Validation Options Reference

| Property | Type | Description | Example |
|----------|------|-------------|---------|
| `required` | boolean | Field must have a value | `"required": true` |
| `min_length` | number | Minimum string length | `"min_length": 3` |
| `max_length` | number | Maximum string length | `"max_length": 100` |
| `pattern` | string | Regex pattern to match | `"pattern": "^[A-Z].*"` |
| `error_message` | string | Custom error message | `"error_message": "Invalid"` |
| `skippable` | boolean | Allow skip button | `"skippable": true` |
| `skip_button_text` | string | Skip button label | `"skip_button_text": "Skip"` |
| `min_rating` | number | Minimum rating value | `"min_rating": 1` |
| `max_selection` | number | Max items in multi-select | `"max_selection": 3` |
| `async_validation` | object | Server-side validation | See below |

**Async Validation Example:**
```json
{
  "validation": {
    "async_validation": {
      "endpoint": "/api/validate/username",
      "debounce_ms": 500
    }
  }
}
```

### 11. UI Config Options by Type

#### Text Input
| Property | Type | Description | Default |
|----------|------|-------------|---------|
| `multiline` | boolean | Enable multiline | `false` |
| `rows` | number | Visible rows (1-20) | `4` |
| `show_character_count` | boolean | Show counter | `false` |
| `character_count_warning_threshold` | number | Warning at % (0-1) | `0.9` |

#### Single/Multi Select
| Property | Type | Description | Default |
|----------|------|-------------|---------|
| `layout` | "grid" \| "list" | Display layout | `"list"` |
| `columns` | number | Grid columns | `2` |

#### Date Picker
| Property | Type | Description | Default |
|----------|------|-------------|---------|
| `mode` | "date" \| "time" \| "datetime" | Picker mode | `"date"` |
| `min_date` | string | Minimum date (ISO) | - |
| `max_date` | string | Maximum date (ISO) | - |
| `display_format` | string | Format string | `"MM/DD/YYYY"` |

#### Rating
| Property | Type | Description | Default |
|----------|------|-------------|---------|
| `style` | "stars" \| "hearts" \| "thumbs" | Icon style | `"stars"` |
| `max_rating` | number | Maximum rating | `5` |
| `allow_half` | boolean | Allow half values | `false` |
| `size` | "small" \| "medium" \| "large" | Icon size | `"medium"` |

#### Slider
| Property | Type | Description | Default |
|----------|------|-------------|---------|
| `min` | number | Minimum value | `0` |
| `max` | number | Maximum value | `100` |
| `step` | number | Increment step | `1` |
| `show_value` | boolean | Display value | `true` |
| `unit` | string | Value unit label | - |

#### File Upload
| Property | Type | Description | Default |
|----------|------|-------------|---------|
| `accept` | string[] | MIME types | `["image/*"]` |
| `max_size_mb` | number | Max file size | `10` |
| `crop_aspect_ratio` | string | Crop ratio (e.g., "1:1") | - |
| `show_camera_option` | boolean | Show camera button | `true` |

### 12. Conditional Operators Reference

| Operator | Description | Value Type | Example |
|----------|-------------|------------|---------|
| `equals` | Exact match | any | `{"operator": "equals", "question_id": "role", "value": "admin"}` |
| `not_equals` | Not equal to | any | `{"operator": "not_equals", "question_id": "status", "value": "inactive"}` |
| `contains` | Array contains value | any | `{"operator": "contains", "question_id": "tags", "value": "premium"}` |
| `not_contains` | Array doesn't contain | any | `{"operator": "not_contains", "question_id": "tags", "value": "free"}` |
| `greater_than` | Numeric comparison | number | `{"operator": "greater_than", "question_id": "age", "value": 18}` |
| `less_than` | Numeric comparison | number | `{"operator": "less_than", "question_id": "budget", "value": 1000}` |
| `is_empty` | No value provided | - | `{"operator": "is_empty", "question_id": "notes"}` |
| `is_not_empty` | Has any value | - | `{"operator": "is_not_empty", "question_id": "email"}` |
| `in` | Value in array | array | `{"operator": "in", "question_id": "plan", "value": ["pro", "enterprise"]}` |
| `not_in` | Value not in array | array | `{"operator": "not_in", "question_id": "country", "value": ["US", "CA"]}` |
| `and` | All conditions true | conditions[] | `{"operator": "and", "conditions": [...]}` |
| `or` | Any condition true | conditions[] | `{"operator": "or", "conditions": [...]}` |

## Usage Variants (All Possibilities)

### 1. `OnboardingModule` (Recommended)

```tsx
import { OnboardingModule } from '@/modules/onboarding';

<OnboardingModule
  locale="en"
  autoLoad
  onEvent={{
    onFlowStarted: event => analytics.track('started', event),
    onFlowCompleted: event => navigate('Dashboard'),
    onError: err => showToast(err.message),
  }}
  onComplete={() => navigate('Dashboard')}
/>;
```

- Ideal for most apps: locale, events, completion/skip callbacks, and built-in offline handling are provided automatically.
- The module also accepts `initialAnswers`, `disableAutoSubmit`, and theming overrides via both props and `OnboardingThemeProvider`.

### 2. Factory & Dependency Overrides

```tsx
import { OnboardingModule } from '@/modules/onboarding';

<OnboardingModule
  factoryOptions={{
    enableOfflineQueue: false, // opt out if AsyncStorage is unavailable
    storageRepository: new CustomStorage(),
    onboardingRepository: new CustomOnboardingApi(),
  }}
  onComplete={handleCompletion}
/>;
```

- Replace repositories (API client, storage) when you need custom networking or persistence behavior.
- Toggle `enableOfflineQueue` to disable the queue (or pass a custom queue implementation via `createOnboardingDependencies`).
- Use `getDefaultOnboardingDependencies()` to share the same instances across screens and `resetDefaultOnboardingDependencies()` between tests.

### 3. Hooks & Custom UI

```tsx
import { useMemo, useEffect } from 'react';
import {
  createOnboardingDependencies,
  useOnboarding,
  useValidation,
  useNetworkState,
} from '@/modules/onboarding';

const deps = useMemo(() => createOnboardingDependencies(), []);
const onboarding = useOnboarding(
  deps.fetchFlowUseCase,
  deps.submitAnswersUseCase,
  deps.saveProgressUseCase,
  { locale: 'en' },
);
const validation = useValidation(deps.validateAnswerUseCase);
const networkState = useNetworkState();

useEffect(() => {
  if (networkState.isConnected && deps.processOfflineQueueUseCase) {
    deps.processOfflineQueueUseCase.execute();
  }
}, [networkState.isConnected]);
```

- Drop down to hooks when you need a custom renderer (e.g., deck-style cards or inline questions) while still benefiting from validation, saving, and queueing.
- `useOnboarding` exposes `flow`, `currentScreen`, `answers`, `progress`, `loading`, `error`, `setAnswer`, `goToNext`, `submitAnswers`, etc.
- Combine with `useValidation` for per-question checks and `deps.offlineQueue` for inspecting queued entries.

### 4. Theming & Events

```tsx
import { OnboardingModule, OnboardingThemeProvider } from '@/modules/onboarding';

const theme = {
  colors: { primary: '#6366F1', background: '#0F172A', text: '#E0E7FF' },
  spacing: { large: 20 },
};

<OnboardingThemeProvider theme={theme}>
  <OnboardingModule
    locale="en"
    onEvent={{
      onQuestionAnswered: event => analytics.track('answered', event),
    }}
  />
</OnboardingThemeProvider>;
```

- Themes are merged with defaults (light/dark) so you can override colors, fonts, spacing, shadows, borders, and more.
- Events cover `onFlowStarted`, `onScreenChanged`, `onQuestionAnswered`, `onQuestionSkipped`, `onFlowCompleted`, `onFlowSkipped`, and `onError`.

### 5. Offline Resilience / Network Notes

- Submissions that fail with `NetworkError` are queued in `AsyncStorage` and retried automatically when connectivity returns. The queue retries each item up to 3 times before discarding it.
- Provide `factoryOptions.enableOfflineQueue = false` to disable queueing or supply a custom `OfflineQueue` implementation through `createOnboardingDependencies`.
- The same offline queue can be monitored manually via `deps.offlineQueue.getQueue()` when building custom dashboards or retries.
- Every use case returns `Result<T, Error>` so you can `result.match(success, failure)` to surface errors explicitly.

## TypeScript Helpers & Errors

- Exported types: `QuestionType`, `ValidationRule`, `ConditionalLogic`, `UIConfig`, `ScreenDTO`, `Answers`, `AnswerValue`, and more for inflight typing.
- Error classes: `DomainError`, `ValidationError`, `NetworkError`, `NotFoundError`, `StorageError` (used throughout the module and surfaced via the `Result` pattern).

## Testing & Docs

- Use `createOnboardingDependencies()` with `InMemoryStorageRepository` or mocked `IOnboardingRepository` for unit testing.
- Call `resetDefaultOnboardingDependencies()` between tests to avoid shared state.
- For full architectural guidance consult:
- `/on_boarding_process.md`
- `/docs/ignored/onboarding_document_analysis.md`
