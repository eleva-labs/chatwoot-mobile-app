import { QuestionId } from './QuestionId';
import type {
  QuestionType,
  ValidationRule,
  ConditionalLogic,
  UIConfig,
  SelectOption,
} from '../common';
import { DomainError } from './Errors';

/**
 * Screen Entity
 *
 * Represents a single question/screen in the onboarding flow.
 * This is the aggregate root for individual questions.
 */
export class Screen {
  constructor(
    public readonly id: QuestionId,
    public readonly type: QuestionType,
    public readonly title: string,
    public readonly description?: string,
    public readonly placeholder?: string,
    public readonly options?: SelectOption[],
    public readonly validation?: ValidationRule,
    public readonly conditionalLogic?: ConditionalLogic,
    public readonly uiConfig?: UIConfig,
    public readonly defaultValue?: unknown,
  ) {
    this.validate();
  }

  private validate(): void {
    // Validate that select types have options
    if (
      (this.type === 'single_select' || this.type === 'multi_select') &&
      (!this.options || this.options.length === 0)
    ) {
      throw new DomainError(`Screen ${this.id.toString()}: ${this.type} type requires options`);
    }

    // Validate that non-select types don't have options
    if (this.type !== 'single_select' && this.type !== 'multi_select' && this.options) {
      throw new DomainError(
        `Screen ${this.id.toString()}: ${this.type} type should not have options`,
      );
    }
  }

  /**
   * Check if this screen is required
   */
  isRequired(): boolean {
    return this.validation?.required ?? false;
  }

  /**
   * Check if this screen can be skipped
   */
  isSkippable(): boolean {
    return this.validation?.skippable ?? (false || !this.isRequired());
  }

  /**
   * Get skip button text or default
   */
  getSkipButtonText(): string {
    return this.validation?.skip_button_text || 'Skip';
  }

  /**
   * Check if screen should be shown based on conditional logic
   * This is a domain method that will be used by ConditionalLogicService
   */
  hasConditionalLogic(): boolean {
    return !!this.conditionalLogic;
  }

  /**
   * Create a copy of this screen with updated properties (immutability)
   */
  withUpdatedProperties(updates: Partial<Screen>): Screen {
    return new Screen(
      updates.id ?? this.id,
      updates.type ?? this.type,
      updates.title ?? this.title,
      updates.description ?? this.description,
      updates.placeholder ?? this.placeholder,
      updates.options ?? this.options,
      updates.validation ?? this.validation,
      updates.conditionalLogic ?? this.conditionalLogic,
      updates.uiConfig ?? this.uiConfig,
      updates.defaultValue ?? this.defaultValue,
    );
  }
}
