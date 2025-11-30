import { Locale } from './Locale';
import { FlowVersion } from './FlowVersion';
import { Screen } from './Screen';
import { QuestionId } from './QuestionId';
import type { SkipConfig, Answers } from '../common';
import { DomainError } from './Errors';

/**
 * OnboardingFlow Entity (Aggregate Root)
 *
 * Represents the entire onboarding flow configuration.
 * This is the main aggregate root for the onboarding domain.
 */
export class OnboardingFlow {
  constructor(
    public readonly id: string,
    public readonly version: FlowVersion,
    public readonly locale: Locale,
    public readonly screens: readonly Screen[],
    public readonly title?: string,
    public readonly skipConfig?: SkipConfig,
  ) {
    this.validate();
  }

  private validate(): void {
    if (this.screens.length === 0) {
      throw new DomainError('OnboardingFlow must have at least one screen');
    }

    // Validate unique screen IDs
    const screenIds = this.screens.map(s => s.id.toString());
    const uniqueIds = new Set(screenIds);
    if (screenIds.length !== uniqueIds.size) {
      throw new DomainError('OnboardingFlow contains duplicate screen IDs');
    }
  }

  /**
   * Get total number of steps
   */
  getTotalSteps(): number {
    return this.screens.length;
  }

  /**
   * Get screen by index
   */
  getScreen(index: number): Screen | null {
    return this.screens[index] ?? null;
  }

  /**
   * Find screen by question ID
   */
  findScreenById(id: QuestionId): Screen | null {
    return this.screens.find(s => s.id.equals(id)) ?? null;
  }

  /**
   * Get screen index by question ID
   */
  getScreenIndex(id: QuestionId): number {
    const index = this.screens.findIndex(s => s.id.equals(id));
    return index >= 0 ? index : -1;
  }

  /**
   * Check if entire flow can be skipped
   */
  isSkippable(): boolean {
    return this.skipConfig?.allow_skip_entire_flow ?? false;
  }

  /**
   * Calculate progress percentage (0-100)
   */
  calculateProgress(currentIndex: number): number {
    if (currentIndex < 0) return 0;
    if (currentIndex >= this.screens.length) return 100;
    return Math.round((currentIndex / this.screens.length) * 100);
  }

  /**
   * Get next visible screen based on conditional logic
   * This delegates to ConditionalLogicService for evaluation
   */
  getNextVisibleScreen(
    currentIndex: number,
    answers: Answers,
    shouldShowScreen: (screen: Screen, answers: Answers) => boolean,
  ): Screen | null {
    for (let i = currentIndex + 1; i < this.screens.length; i++) {
      const screen = this.screens[i];
      if (shouldShowScreen(screen, answers)) {
        return screen;
      }
    }
    return null;
  }

  /**
   * Get previous visible screen
   */
  getPreviousVisibleScreen(
    currentIndex: number,
    answers: Answers,
    shouldShowScreen: (screen: Screen, answers: Answers) => boolean,
  ): Screen | null {
    for (let i = currentIndex - 1; i >= 0; i--) {
      const screen = this.screens[i];
      if (shouldShowScreen(screen, answers)) {
        return screen;
      }
    }
    return null;
  }

  /**
   * Get all visible screens based on current answers
   */
  getVisibleScreens(
    answers: Answers,
    shouldShowScreen: (screen: Screen, answers: Answers) => boolean,
  ): Screen[] {
    return this.screens.filter(screen => shouldShowScreen(screen, answers));
  }

  /**
   * Create a copy with updated locale (immutability)
   */
  withLocale(locale: Locale): OnboardingFlow {
    return new OnboardingFlow(
      this.id,
      this.version,
      locale,
      this.screens,
      this.title,
      this.skipConfig,
    );
  }

  /**
   * Create a copy with updated screens (immutability)
   */
  withScreens(screens: Screen[]): OnboardingFlow {
    return new OnboardingFlow(
      this.id,
      this.version,
      this.locale,
      screens,
      this.title,
      this.skipConfig,
    );
  }
}
