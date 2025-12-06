/**
 * Common types used across the onboarding module
 */

/**
 * Question types supported by the onboarding system
 */
export type QuestionType =
  | 'text'
  | 'single_select'
  | 'multi_select'
  | 'date'
  | 'rating'
  | 'slider'
  | 'file_upload';

/**
 * Conditional logic operators for comparing values
 */
export type ConditionalOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'greater_than'
  | 'less_than'
  | 'is_empty'
  | 'is_not_empty'
  | 'in' // Value is in array
  | 'not_in'; // Value is not in array

/**
 * Logical operators for combining conditions
 */
export type LogicalOperator = 'and' | 'or';

/**
 * Validation rule configuration
 */
export interface ValidationRule {
  required?: boolean;
  min_length?: number;
  max_length?: number;
  pattern?: string;
  error_message?: string;
  skippable?: boolean;
  skip_button_text?: string;
  min_rating?: number;
  max_selection?: number;
  async_validation?: {
    endpoint: string;
    debounce_ms?: number;
  };
}

/**
 * Conditional logic configuration
 *
 * Supports both simple and nested conditions:
 * - Simple: { question_id: "foo", operator: "equals", value: "bar" }
 * - Nested: { operator: "and", conditions: [...] }
 */
export interface ConditionalLogic {
  // For comparison conditions
  question_id?: string;
  operator: ConditionalOperator | LogicalOperator;
  value?: unknown;

  // For nested logical conditions (AND/OR)
  conditions?: ConditionalLogic[];
}

/**
 * UI configuration for questions
 */
export interface UIConfig {
  layout?: 'grid' | 'list';
  columns?: number;
  icon?: string;
  theme_color?: string;
  animation?: string;

  // Text input specific
  multiline?: boolean; // Enable multiline text input
  rows?: number; // Number of visible rows for multiline (default: 4)
  show_character_count?: boolean; // Display character counter
  character_count_warning_threshold?: number; // Warning at % of max (0.0-1.0, default: 0.9)

  // Date picker specific
  mode?: 'date' | 'time' | 'datetime';
  min_date?: string;
  max_date?: string;
  display_format?: string;

  // Rating specific
  style?: 'stars' | 'hearts' | 'thumbs';
  max_rating?: number;
  allow_half?: boolean;
  size?: 'small' | 'medium' | 'large';

  // Slider specific
  min?: number;
  max?: number;
  step?: number;
  show_value?: boolean;
  unit?: string;

  // File upload specific
  accept?: string[];
  max_size_mb?: number;
  crop_aspect_ratio?: string;
  show_camera_option?: boolean;
}

/**
 * Skip configuration
 */
export interface SkipConfig {
  allow_skip_entire_flow?: boolean;
  skip_entire_flow_button?: string;
  skip_confirmation?: {
    title: string;
    message: string;
    confirm_text: string;
    cancel_text: string;
  };
  track_skip_reasons?: boolean;
}

/**
 * Select option with optional custom input and conditional visibility
 */
export interface SelectOption {
  id: string;
  label: string;
  value: string | number;
  allow_custom_input?: boolean;
  custom_input_placeholder?: string;
  conditional_show?: ConditionalLogic; // Show option only if condition is met
}

/**
 * Answer value type (can be various types)
 */
export type AnswerValue = string | number | string[] | number[] | Date | null;

/**
 * Answers map - question ID to answer value
 */
export interface Answers {
  [questionId: string]: AnswerValue;
}
