import type { ConditionalLogic, Answers, SelectOption } from '../common';
import { Screen } from '../entities/Screen';

/**
 * Conditional Logic Service
 *
 * Evaluates conditional logic to determine if a screen should be shown.
 * Supports nested AND/OR operators and recursive evaluation.
 * Pure domain logic with no external dependencies.
 */
export class ConditionalLogicService {
  /**
   * Evaluate a conditional logic rule (supports nested conditions)
   */
  static evaluate(condition: ConditionalLogic, answers: Answers): boolean {
    // Handle logical operators (AND/OR) with nested conditions
    if (condition.operator === 'and' || condition.operator === 'or') {
      return this.evaluateLogicalOperator(condition, answers);
    }

    // Handle comparison operators
    return this.evaluateComparison(condition, answers);
  }

  /**
   * Evaluate logical operators (AND/OR) with recursive conditions
   */
  private static evaluateLogicalOperator(condition: ConditionalLogic, answers: Answers): boolean {
    if (!condition.conditions || condition.conditions.length === 0) {
      return true; // Empty conditions array defaults to true
    }

    if (condition.operator === 'and') {
      // All conditions must be true
      return condition.conditions.every(nestedCondition => this.evaluate(nestedCondition, answers));
    }

    if (condition.operator === 'or') {
      // At least one condition must be true
      return condition.conditions.some(nestedCondition => this.evaluate(nestedCondition, answers));
    }

    return false;
  }

  /**
   * Evaluate comparison operators
   */
  private static evaluateComparison(condition: ConditionalLogic, answers: Answers): boolean {
    if (!condition.question_id) {
      return false; // Comparison operators require question_id
    }

    const answerValue: unknown = answers[condition.question_id];

    switch (condition.operator) {
      case 'equals':
        return answerValue === condition.value;

      case 'not_equals':
        return answerValue !== condition.value;

      case 'in':
        if (Array.isArray(condition.value)) {
          return condition.value.includes(answerValue);
        }
        return false;

      case 'not_in':
        if (Array.isArray(condition.value)) {
          return !condition.value.includes(answerValue);
        }
        return true; // If not an array, treat as not_in

      case 'contains':
        if (Array.isArray(answerValue)) {
          return answerValue.some(item => item === condition.value);
        }
        if (typeof answerValue === 'string') {
          return answerValue.includes(String(condition.value));
        }
        return false;

      case 'not_contains':
        return !this.evaluateComparison({ ...condition, operator: 'contains' }, answers);

      case 'greater_than':
        if (typeof answerValue === 'number' && typeof condition.value === 'number') {
          return answerValue > condition.value;
        }
        return false;

      case 'less_than':
        if (typeof answerValue === 'number' && typeof condition.value === 'number') {
          return answerValue < condition.value;
        }
        return false;

      case 'is_empty':
        return (
          answerValue === null ||
          answerValue === undefined ||
          answerValue === '' ||
          (Array.isArray(answerValue) && answerValue.length === 0)
        );

      case 'is_not_empty':
        return !this.evaluateComparison({ ...condition, operator: 'is_empty' }, answers);

      default:
        return false;
    }
  }

  /**
   * Check if a screen should be shown based on its conditional logic
   */
  static shouldShowScreen(screen: Screen, answers: Answers): boolean {
    if (!screen.conditionalLogic) {
      return true; // No conditional logic means always show
    }

    return this.evaluate(screen.conditionalLogic, answers);
  }

  /**
   * Filter options based on conditional_show logic
   * Returns only options that should be visible based on current answers
   */
  static filterVisibleOptions(options: SelectOption[], answers: Answers): SelectOption[] {
    return options.filter(option => {
      if (!option.conditional_show) {
        return true; // No conditional logic means always show
      }

      return this.evaluate(option.conditional_show, answers);
    });
  }
}
