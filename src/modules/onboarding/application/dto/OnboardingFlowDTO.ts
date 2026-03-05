/**
 * Data Transfer Objects (DTOs)
 *
 * These represent the JSON structure from the server.
 * They will be mapped to domain entities.
 */

import type {
  QuestionType,
  ValidationRule,
  ConditionalLogic,
  UIConfig,
  SkipConfig,
  SelectOption,
} from '../../domain/common';

export interface ScreenDTO {
  id: string;
  type: QuestionType;
  title: string;
  description?: string;
  placeholder?: string;
  options?: SelectOption[];
  validation?: ValidationRule;
  conditional_logic?: ConditionalLogic;
  ui_config?: UIConfig;
  default_value?: unknown;
}

export interface OnboardingFlowDTO {
  onboarding_flow: {
    id: string;
    version: string;
    locale: string;
    title?: string;
    skip_config?: SkipConfig;
    screens: ScreenDTO[];
  };
}
