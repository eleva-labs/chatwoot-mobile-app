import { z } from 'zod';

/**
 * Zod Schemas for JSON Configuration Validation
 *
 * These schemas validate the structure of JSON received from the server.
 */

// Validation Rule Schema
export const validationRuleSchema = z.object({
  required: z.boolean().optional(),
  min_length: z.number().optional(),
  max_length: z.number().optional(),
  pattern: z.string().optional(),
  error_message: z.string().optional(),
  skippable: z.boolean().optional(),
  skip_button_text: z.string().optional(),
  min_rating: z.number().optional(),
  max_selection: z.number().optional(),
  async_validation: z
    .object({
      endpoint: z.string(),
      debounce_ms: z.number().optional(),
    })
    .optional(),
});

// Conditional Logic Schema (supports recursive nested conditions)
export const conditionalLogicSchema: z.ZodType<{
  question_id?: string;
  operator: string;
  value?: unknown;
  conditions?: unknown[];
}> = z.lazy(() =>
  z.object({
    question_id: z.string().optional(),
    operator: z.enum([
      // Comparison operators
      'equals',
      'not_equals',
      'contains',
      'not_contains',
      'greater_than',
      'less_than',
      'is_empty',
      'is_not_empty',
      'in',
      'not_in',
      // Logical operators
      'and',
      'or',
    ]),
    value: z.unknown().optional(),
    conditions: z.array(conditionalLogicSchema).optional(),
  }),
);

// Select Option Schema (with conditional_show support)
export const selectOptionSchema = z.object({
  id: z.string(),
  label: z.string(),
  value: z.union([z.string(), z.number()]),
  allow_custom_input: z.boolean().optional(),
  custom_input_placeholder: z.string().optional(),
  conditional_show: conditionalLogicSchema.optional(),
});

// UI Config Schema
export const uiConfigSchema = z.object({
  layout: z.enum(['grid', 'list']).optional(),
  columns: z.number().optional(),
  icon: z.string().optional(),
  theme_color: z.string().optional(),
  animation: z.string().optional(),

  // Text input specific
  multiline: z.boolean().optional(),
  rows: z.number().min(1).max(20).optional(),
  show_character_count: z.boolean().optional(),
  character_count_warning_threshold: z.number().min(0).max(1).optional(),

  // Date picker specific
  mode: z.enum(['date', 'time', 'datetime']).optional(),
  min_date: z.string().optional(),
  max_date: z.string().optional(),
  display_format: z.string().optional(),

  // Rating specific
  style: z.enum(['stars', 'hearts', 'thumbs']).optional(),
  max_rating: z.number().optional(),
  allow_half: z.boolean().optional(),
  size: z.enum(['small', 'medium', 'large']).optional(),

  // Slider specific
  min: z.number().optional(),
  max: z.number().optional(),
  step: z.number().optional(),
  show_value: z.boolean().optional(),
  unit: z.string().optional(),

  // File upload specific
  accept: z.array(z.string()).optional(),
  max_size_mb: z.number().optional(),
  crop_aspect_ratio: z.string().optional(),
  show_camera_option: z.boolean().optional(),
});

// Screen Schema
export const screenSchema = z.object({
  id: z.string(),
  type: z.enum([
    'text',
    'single_select',
    'multi_select',
    'date',
    'rating',
    'slider',
    'file_upload',
  ]),
  title: z.string(),
  description: z.string().optional(),
  placeholder: z.string().optional(),
  options: z.array(selectOptionSchema).optional(),
  validation: validationRuleSchema.optional(),
  conditional_logic: conditionalLogicSchema.optional(),
  ui_config: uiConfigSchema.optional(),
  default_value: z.unknown().optional(),
});

// Skip Config Schema
export const skipConfigSchema = z.object({
  allow_skip_entire_flow: z.boolean().optional(),
  skip_entire_flow_button: z.string().optional(),
  skip_confirmation: z
    .object({
      title: z.string(),
      message: z.string(),
      confirm_text: z.string(),
      cancel_text: z.string(),
    })
    .optional(),
  track_skip_reasons: z.boolean().optional(),
});

// Onboarding Flow Schema
export const onboardingFlowSchema = z.object({
  onboarding_flow: z.object({
    id: z.string(),
    version: z.string(),
    locale: z.string(),
    title: z.string().optional(),
    skip_config: skipConfigSchema.optional(),
    screens: z.array(screenSchema),
  }),
});

// Type exports for TypeScript inference
export type SelectOptionSchema = z.infer<typeof selectOptionSchema>;
export type ValidationRuleSchema = z.infer<typeof validationRuleSchema>;
export type ConditionalLogicSchema = z.infer<typeof conditionalLogicSchema>;
export type UIConfigSchema = z.infer<typeof uiConfigSchema>;
export type ScreenSchema = z.infer<typeof screenSchema>;
export type SkipConfigSchema = z.infer<typeof skipConfigSchema>;
export type OnboardingFlowSchema = z.infer<typeof onboardingFlowSchema>;
