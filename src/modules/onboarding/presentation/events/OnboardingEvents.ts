/**
 * Onboarding Events
 *
 * Event types emitted by the onboarding module.
 * These events can be used for analytics, logging, or custom logic.
 */

import type { Answers } from '../../domain/common';

/**
 * Event emitted when onboarding flow starts
 */
export interface OnFlowStartedEvent {
  flowId: string;
  flowVersion: string;
  locale: string;
  totalScreens: number;
}

/**
 * Event emitted when a question is answered
 */
export interface OnQuestionAnsweredEvent {
  questionId: string;
  questionType: string;
  value: unknown;
  flowId: string;
  currentStep: number;
  totalSteps: number;
}

/**
 * Event emitted when a question is skipped
 */
export interface OnQuestionSkippedEvent {
  questionId: string;
  questionType: string;
  flowId: string;
  currentStep: number;
  reason?: string;
}

/**
 * Event emitted when screen changes
 */
export interface OnScreenChangedEvent {
  fromStep: number;
  toStep: number;
  questionId: string;
  flowId: string;
}

/**
 * Event emitted when onboarding flow is completed
 */
export interface OnFlowCompletedEvent {
  flowId: string;
  totalSteps: number;
  answers: Answers;
  completedAt: Date;
}

/**
 * Event emitted when entire flow is skipped
 */
export interface OnFlowSkippedEvent {
  flowId: string;
  currentStep: number;
  reason?: string;
}

/**
 * Event emitted when an error occurs
 */
export interface OnErrorEvent {
  error: Error;
  context: string;
  flowId?: string;
}

/**
 * Event callbacks interface
 */
export interface OnboardingEventCallbacks {
  onFlowStarted?: (event: OnFlowStartedEvent) => void;
  onQuestionAnswered?: (event: OnQuestionAnsweredEvent) => void;
  onQuestionSkipped?: (event: OnQuestionSkippedEvent) => void;
  onScreenChanged?: (event: OnScreenChangedEvent) => void;
  onFlowCompleted?: (event: OnFlowCompletedEvent) => void;
  onFlowSkipped?: (event: OnFlowSkippedEvent) => void;
  onError?: (event: OnErrorEvent) => void;
}
