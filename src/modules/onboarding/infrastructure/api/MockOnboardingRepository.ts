import { injectable } from 'tsyringe';
import type { IOnboardingRepository } from '../../domain/repositories/IOnboardingRepository';
import { Locale } from '../../domain/entities/Locale';
import { OnboardingFlow } from '../../domain/entities/OnboardingFlow';
import { OnboardingFlowMapper } from '../../application/mappers/OnboardingFlowMapper';
import type { OnboardingFlowDTO } from '../../application/dto/OnboardingFlowDTO';
import type { Answers } from '../../domain/common';
import { Result } from '../../domain/entities/Result';
import { NotFoundError } from '../../domain/entities/Errors';

/**
 * Mock Onboarding Repository Implementation
 *
 * Returns mock data for testing the onboarding flow without a backend.
 * This will be replaced with AxiosOnboardingRepository when the backend is ready.
 */
@injectable()
export class MockOnboardingRepository implements IOnboardingRepository {
  // Mock delay to simulate network request
  private readonly MOCK_DELAY_MS = 800;

  private readonly mockFlows: Record<string, OnboardingFlowDTO> = {
    en: {
      onboarding_flow: {
        id: 'store-onboarding-v1',
        version: '1.0.0',
        locale: 'en',
        title: 'Store Onboarding',
        skip_config: {
          allow_skip_entire_flow: false,
          track_skip_reasons: true,
        },
        screens: [
          {
            id: 'store_type',
            type: 'single_select',
            title: 'What type of store do you have?',
            description: 'This helps us customize your AI assistant',
            options: [
              {
                id: 'appointment',
                label: 'Appointment/Service-based',
                value: 'appointment',
              },
              {
                id: 'product',
                label: 'Product/E-commerce',
                value: 'product',
              },
              {
                id: 'hybrid',
                label: 'Hybrid (Both)',
                value: 'hybrid',
              },
            ],
            validation: {
              required: true,
              error_message: 'Please select your store type',
            },
            ui_config: {
              layout: 'list',
            },
          },
          {
            id: 'store_info',
            type: 'text',
            title: 'Tell us about your store and what do you offer?',
            description: 'Describe your store and the products or services you offer',
            placeholder:
              'e.g. Black Gold Coffee - Specialty coffee beans, subscriptions, and brewing equipment',
            validation: {
              required: true,
              min_length: 10,
              max_length: 500,
              error_message: 'Please provide information about your store and offerings',
            },
            ui_config: {
              multiline: true,
              rows: 4,
              show_value: true,
              show_character_count: true,
              character_count_warning_threshold: 0.85,
            },
          },
          {
            id: 'ai_assistant_objective',
            type: 'multi_select',
            title: 'What should your AI assistant do?',
            description: 'Select all functions that apply',
            options: [
              {
                id: 'answer_faq',
                label: 'Answer customer questions (FAQ)',
                value: 'answer_faq',
              },
              {
                id: 'appointment_setting',
                label: 'Book appointments/consultations',
                value: 'appointment_setting',
                conditional_show: {
                  operator: 'in',
                  question_id: 'store_type',
                  value: ['appointment', 'hybrid'],
                },
              },
              {
                id: 'process_orders',
                label: 'Process product orders',
                value: 'process_orders',
                conditional_show: {
                  operator: 'in',
                  question_id: 'store_type',
                  value: ['product', 'hybrid'],
                },
              },
              {
                id: 'qualify_leads',
                label: 'Qualify leads and collect information',
                value: 'qualify_leads',
              },
            ],
            validation: {
              required: true,
              error_message: 'Please select what your AI assistant should do',
            },
            ui_config: {
              layout: 'list',
            },
          },
          {
            id: 'communication_tone',
            type: 'multi_select',
            title: 'How should your AI assistant communicate to your customers tonewise?',
            description:
              'Select the communication tones that best fit your brand (you can select multiple)',
            options: [
              {
                id: 'friendly',
                label: 'Friendly',
                value: 'friendly',
              },
              {
                id: 'professional',
                label: 'Professional',
                value: 'professional',
              },
              {
                id: 'casual',
                label: 'Casual',
                value: 'casual',
              },
              {
                id: 'formal',
                label: 'Formal',
                value: 'formal',
              },
              {
                id: 'conversational',
                label: 'Conversational',
                value: 'conversational',
              },
              {
                id: 'empathetic',
                label: 'Empathetic',
                value: 'empathetic',
              },
            ],
            validation: {
              required: false,
              skippable: true,
              skip_button_text: 'Skip',
              error_message: 'Please select at least one communication tone',
            },
            ui_config: {
              layout: 'list',
            },
          },
          {
            id: 'customer_questions',
            type: 'text',
            title: 'What questions do your customers usually ask?',
            description: 'List common questions your customers ask (optional)',
            placeholder:
              'e.g. What are your shipping times? Do you offer refunds? What payment methods do you accept?',
            validation: {
              required: false,
              skippable: true,
              skip_button_text: 'Skip',
              min_length: 10,
              max_length: 500,
              error_message: 'Please provide at least 10 characters if answering',
            },
            ui_config: {
              multiline: true,
              rows: 3,
              show_value: true,
            },
          },
          {
            id: 'escalation_scenarios',
            type: 'text',
            title: 'In which scenario should the AI assistant contact you?',
            description:
              'Describe when the AI assistant should escalate to you or contact you directly',
            placeholder:
              'e.g. When customers request refunds, have payment issues, or need complex technical support',
            validation: {
              required: true,
              min_length: 10,
              max_length: 500,
              error_message: 'Please describe when the AI assistant should contact you',
            },
            ui_config: {
              multiline: true,
              rows: 4,
              show_value: true,
              show_character_count: true,
            },
          },
        ],
      },
    },
  };

  async fetchFlow(locale: Locale): Promise<Result<OnboardingFlow, Error>> {
    try {
      // Simulate network delay
      await this.delay(this.MOCK_DELAY_MS);

      const localeStr = locale.toString();
      const flowDTO = this.mockFlows[localeStr];

      if (!flowDTO) {
        // Fallback to English if locale not found
        const fallbackFlow = this.mockFlows['en'];
        if (!fallbackFlow) {
          return Result.fail(
            new NotFoundError(`No onboarding flow available for locale: ${localeStr}`),
          );
        }

        console.log(`No flow found for locale ${localeStr}, falling back to English`);
        const flow = OnboardingFlowMapper.toDomain(fallbackFlow);
        return Result.ok(flow);
      }

      const flow = OnboardingFlowMapper.toDomain(flowDTO);
      return Result.ok(flow);
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error : new Error('Failed to fetch onboarding flow'),
      );
    }
  }

  async submitAnswers(flowId: string, answers: Answers): Promise<Result<void, Error>> {
    try {
      // Simulate network delay
      await this.delay(this.MOCK_DELAY_MS);

      // Mock successful submission
      console.log('[MockOnboardingRepository] Submitting answers:', {
        flowId,
        answers,
      });

      // In a real implementation, this would send data to the server
      return Result.ok(undefined);
    } catch (error) {
      return Result.fail(error instanceof Error ? error : new Error('Failed to submit answers'));
    }
  }

  async validateField(
    fieldId: string,
    value: unknown,
  ): Promise<Result<{ valid: boolean; message?: string }, Error>> {
    try {
      // Simulate network delay
      await this.delay(this.MOCK_DELAY_MS / 2);

      // Mock validation - always return valid for now
      console.log('[MockOnboardingRepository] Validating field:', {
        fieldId,
        value,
      });

      return Result.ok({ valid: true });
    } catch (error) {
      return Result.fail(error instanceof Error ? error : new Error('Failed to validate field'));
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
