import type { ConditionalLogic, Answers } from '../common';
import { Screen } from '../entities/Screen';

/**
 * Conditional Logic Service
 *
 * Evaluates conditional logic to determine if a screen should be shown.
 * Pure domain logic with no external dependencies.
 */
export class ConditionalLogicService {
  /**
   * Evaluate a conditional logic rule
   */
  static evaluate(condition: ConditionalLogic, answers: Answers): boolean {
    const answerValue: unknown = answers[condition.question_id];

    switch (condition.operator) {
      case 'equals':
        return answerValue === condition.value;

      case 'not_equals':
        return answerValue !== condition.value;

      case 'contains':
        if (Array.isArray(answerValue)) {
          return answerValue.some(item => item === condition.value);
        }
        if (typeof answerValue === 'string') {
          return answerValue.includes(String(condition.value));
        }
        return false;

      case 'not_contains':
        return !this.evaluate({ ...condition, operator: 'contains' }, answers);

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
        return !this.evaluate({ ...condition, operator: 'is_empty' }, answers);

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
}
