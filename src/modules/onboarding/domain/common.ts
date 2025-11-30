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
 * Conditional logic operators
 */
export type ConditionalOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'greater_than'
  | 'less_than'
  | 'is_empty'
  | 'is_not_empty';

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
 */
export interface ConditionalLogic {
  question_id: string;
  operator: ConditionalOperator;
  value: unknown;
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
  mode?: 'date' | 'time' | 'datetime';
  min_date?: string;
  max_date?: string;
  display_format?: string;
  style?: 'stars' | 'hearts' | 'thumbs';
  max_rating?: number;
  allow_half?: boolean;
  size?: 'small' | 'medium' | 'large';
  min?: number;
  max?: number;
  step?: number;
  show_value?: boolean;
  unit?: string;
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
 * Select option with optional custom input
 */
export interface SelectOption {
  id: string;
  label: string;
  value: string | number;
  allow_custom_input?: boolean;
  custom_input_placeholder?: string;
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
