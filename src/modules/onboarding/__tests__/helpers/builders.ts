/**
 * Test Data Builders for Onboarding Module
 *
 * These builders provide convenient factory functions for creating test data
 * following the Builder pattern for flexibility and readability.
 */

import { OnboardingFlow } from '../../domain/entities/OnboardingFlow';
import { Screen } from '../../domain/entities/Screen';
import { Answer } from '../../domain/entities/Answer';
import { QuestionId } from '../../domain/entities/QuestionId';
import { Locale } from '../../domain/entities/Locale';
import { FlowVersion } from '../../domain/entities/FlowVersion';
import type {
  QuestionType,
  ValidationRule,
  ConditionalLogic,
  SelectOption,
  AnswerValue,
} from '../../domain/common';

/**
 * Builder for Screen entities
 */
export class ScreenBuilder {
  private id: string = 'screen-1';
  private title: string = 'Test Question';
  private description?: string;
  private questionType: QuestionType = 'text';
  private required: boolean = false;
  private validation?: ValidationRule;
  private options?: SelectOption[];
  private skipConfig?: { enabled: boolean; buttonText?: string };
  private conditionalLogic?: ConditionalLogic;
  private order: number = 0;

  withId(id: string): this {
    this.id = id;
    return this;
  }

  withTitle(title: string): this {
    this.title = title;
    return this;
  }

  withDescription(description: string): this {
    this.description = description;
    return this;
  }

  withQuestionType(type: QuestionType): this {
    this.questionType = type;
    return this;
  }

  withRequired(required: boolean = true): this {
    this.required = required;
    return this;
  }

  withValidation(validation: ValidationRule): this {
    this.validation = validation;
    return this;
  }

  withOptions(options: string[] | SelectOption[]): this {
    // Convert string[] to SelectOption[] if needed
    this.options = options.map((opt, index) => {
      if (typeof opt === 'string') {
        return { id: `opt-${index}`, label: opt, value: opt };
      }
      return opt;
    });
    return this;
  }

  withSkipConfig(enabled: boolean, buttonText?: string): this {
    this.skipConfig = { enabled, buttonText };
    return this;
  }

  withConditionalLogic(logic: ConditionalLogic): this {
    this.conditionalLogic = logic;
    return this;
  }

  withOrder(order: number): this {
    this.order = order;
    return this;
  }

  build(): Screen {
    // Build validation rule with skip config if provided
    let finalValidation = this.validation;
    if (this.skipConfig) {
      finalValidation = {
        ...finalValidation,
        skippable: this.skipConfig.enabled,
        skip_button_text: this.skipConfig.buttonText,
      };
    }
    if (this.required && !finalValidation) {
      finalValidation = { required: true };
    } else if (this.required && finalValidation) {
      finalValidation = { ...finalValidation, required: true };
    }

    return new Screen(
      QuestionId.create(this.id),
      this.questionType,
      this.title,
      this.description,
      undefined, // placeholder
      this.options,
      finalValidation,
      this.conditionalLogic,
      undefined, // uiConfig
      undefined, // defaultValue
    );
  }
}

/**
 * Builder for OnboardingFlow aggregate
 */
export class OnboardingFlowBuilder {
  private id: string = 'flow-1';
  private title: string = 'Test Onboarding';
  private description?: string;
  private screens: Screen[] = [];
  private locale: string = 'en';
  private version: string = '1.0.0';
  private isSkippable: boolean = false;

  withId(id: string): this {
    this.id = id;
    return this;
  }

  withTitle(title: string): this {
    this.title = title;
    return this;
  }

  withDescription(description: string): this {
    this.description = description;
    return this;
  }

  withScreens(screens: Screen[]): this {
    this.screens = screens;
    return this;
  }

  withScreen(screen: Screen): this {
    this.screens.push(screen);
    return this;
  }

  withLocale(locale: string): this {
    this.locale = locale;
    return this;
  }

  withVersion(version: string): this {
    this.version = version;
    return this;
  }

  withIsSkippable(isSkippable: boolean): this {
    this.isSkippable = isSkippable;
    return this;
  }

  /**
   * Creates a default flow with 3 basic screens
   */
  withDefaultScreens(): this {
    this.screens = [
      new ScreenBuilder().withId('q1').withTitle('Name').withOrder(0).build(),
      new ScreenBuilder().withId('q2').withTitle('Email').withOrder(1).withRequired().build(),
      new ScreenBuilder()
        .withId('q3')
        .withTitle('Role')
        .withQuestionType('single_select')
        .withOptions(['Developer', 'Designer', 'Manager'])
        .withOrder(2)
        .build(),
    ];
    return this;
  }

  build(): OnboardingFlow {
    const skipConfig = this.isSkippable
      ? {
          allow_skip_entire_flow: true,
        }
      : undefined;

    return new OnboardingFlow(
      this.id,
      FlowVersion.create(this.version),
      Locale.create(this.locale),
      this.screens.length > 0 ? this.screens : [new ScreenBuilder().build()],
      this.title,
      skipConfig,
    );
  }
}

/**
 * Builder for Answer value objects
 */
export class AnswerBuilder {
  private questionId: string = 'q1';
  private value: AnswerValue = '';

  withQuestionId(questionId: string): this {
    this.questionId = questionId;
    return this;
  }

  withValue(value: AnswerValue): this {
    this.value = value;
    return this;
  }

  build(): Answer {
    return new Answer(QuestionId.create(this.questionId), this.value);
  }
}

/**
 * Convenient factory functions
 */
export const aScreen = () => new ScreenBuilder();
export const anOnboardingFlow = () => new OnboardingFlowBuilder();
export const anAnswer = () => new AnswerBuilder();

/**
 * Common test data
 */
export const testData = {
  screens: {
    textQuestion: () =>
      aScreen().withId('text-1').withTitle('Your name').withQuestionType('text').build(),

    requiredEmail: () =>
      aScreen()
        .withId('email-1')
        .withTitle('Email')
        .withQuestionType('text')
        .withRequired()
        .withValidation({
          pattern: '^[^@]+@[^@]+\\.[^@]+$',
          error_message: 'Invalid email',
        })
        .build(),

    singleSelect: () =>
      aScreen()
        .withId('role-1')
        .withTitle('Your role')
        .withQuestionType('single_select')
        .withOptions(['Developer', 'Designer', 'Manager'])
        .build(),

    multiSelect: () =>
      aScreen()
        .withId('interests-1')
        .withTitle('Interests')
        .withQuestionType('multi_select')
        .withOptions(['Coding', 'Design', 'Writing'])
        .withValidation({ max_selection: 2 })
        .build(),

    ratingQuestion: () =>
      aScreen()
        .withId('satisfaction-1')
        .withTitle('Rate your experience')
        .withQuestionType('rating')
        .withValidation({
          min_rating: 3,
          error_message: 'Please rate at least 3 stars',
        })
        .build(),

    conditionalQuestion: () =>
      aScreen()
        .withId('conditional-1')
        .withTitle('Conditional question')
        .withConditionalLogic({
          question_id: 'role-1',
          operator: 'equals',
          value: 'Developer',
        })
        .build(),

    skippableQuestion: () =>
      aScreen()
        .withId('optional-1')
        .withTitle('Optional question')
        .withSkipConfig(true, 'Skip this')
        .build(),
  },

  flows: {
    simple: () => anOnboardingFlow().withId('simple-flow').withDefaultScreens().build(),

    skippable: () =>
      anOnboardingFlow()
        .withId('skippable-flow')
        .withDefaultScreens()
        .withIsSkippable(true)
        .build(),

    withConditionalLogic: () =>
      anOnboardingFlow()
        .withId('conditional-flow')
        .withScreens([
          testData.screens.singleSelect(),
          testData.screens.conditionalQuestion(),
          testData.screens.textQuestion(),
        ])
        .build(),
  },

  answers: {
    textAnswer: () => anAnswer().withQuestionId('q1').withValue('John Doe').build(),
    emailAnswer: () => anAnswer().withQuestionId('email-1').withValue('john@example.com').build(),
    singleSelectAnswer: () => anAnswer().withQuestionId('role-1').withValue('Developer').build(),
    multiSelectAnswer: () =>
      anAnswer().withQuestionId('interests-1').withValue(['Coding', 'Design']).build(),
    ratingAnswer: () => anAnswer().withQuestionId('satisfaction-1').withValue(5).build(),
  },
};
