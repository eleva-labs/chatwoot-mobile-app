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
export class MockOnboardingRepository implements IOnboardingRepository {
  // Mock delay to simulate network request
  private readonly MOCK_DELAY_MS = 800;

  private readonly mockFlows: Record<string, OnboardingFlowDTO> = {
    en: {
      onboarding_flow: {
        id: 'v1_flow',
        version: '1.0.0',
        locale: 'en',
        title: 'Welcome to Chatwoot',
        screens: [
          {
            id: 'q1_name',
            type: 'text',
            title: 'What is your name?',
            description: "We'll use this to personalize your experience.",
            placeholder: 'e.g. John Doe',
            validation: {
              required: true,
              min_length: 2,
              error_message: 'Name must be at least 2 characters',
            },
          },
          {
            id: 'q2_role',
            type: 'single_select',
            title: 'What is your role?',
            description: 'Help us understand how you use Chatwoot',
            options: [
              { id: 'agent', label: 'Agent', value: 'agent' },
              { id: 'admin', label: 'Admin', value: 'admin' },
              { id: 'manager', label: 'Manager', value: 'manager' },
              { id: 'other', label: 'Other', value: 'other' },
            ],
            validation: {
              required: true,
            },
          },
          {
            id: 'q3_interests',
            type: 'multi_select',
            title: 'What are you interested in?',
            description: 'Select all that apply',
            options: [
              { id: 'support', label: 'Customer Support', value: 'support' },
              { id: 'sales', label: 'Sales', value: 'sales' },
              { id: 'marketing', label: 'Marketing', value: 'marketing' },
              { id: 'automation', label: 'Automation', value: 'automation' },
            ],
            validation: {
              required: false,
            },
          },
          {
            id: 'q4_satisfaction',
            type: 'rating',
            title: 'How would you rate your experience so far?',
            description: 'We value your feedback!',
            ui_config: {
              style: 'stars',
              max_rating: 5,
              allow_half: false,
              size: 'large',
            },
            validation: {
              required: true,
            },
          },
        ],
      },
    },
    es: {
      onboarding_flow: {
        id: 'v1_flow',
        version: '1.0.0',
        locale: 'es',
        title: 'Bienvenido a Chatwoot',
        screens: [
          {
            id: 'q1_name',
            type: 'text',
            title: '¿Cuál es tu nombre?',
            description: 'Lo usaremos para personalizar tu experiencia.',
            placeholder: 'ej. Juan Pérez',
            validation: {
              required: true,
              min_length: 2,
              error_message: 'El nombre debe tener al menos 2 caracteres',
            },
          },
          {
            id: 'q2_role',
            type: 'single_select',
            title: '¿Cuál es tu rol?',
            description: 'Ayúdanos a entender cómo usas Chatwoot',
            options: [
              { id: 'agent', label: 'Agente', value: 'agent' },
              { id: 'admin', label: 'Administrador', value: 'admin' },
              { id: 'manager', label: 'Gerente', value: 'manager' },
              { id: 'other', label: 'Otro', value: 'other' },
            ],
            validation: {
              required: true,
            },
          },
          {
            id: 'q3_interests',
            type: 'multi_select',
            title: '¿En qué estás interesado?',
            description: 'Selecciona todas las opciones que apliquen',
            options: [
              { id: 'support', label: 'Soporte al Cliente', value: 'support' },
              { id: 'sales', label: 'Ventas', value: 'sales' },
              { id: 'marketing', label: 'Marketing', value: 'marketing' },
              { id: 'automation', label: 'Automatización', value: 'automation' },
            ],
            validation: {
              required: false,
            },
          },
          {
            id: 'q4_satisfaction',
            type: 'rating',
            title: '¿Cómo calificarías tu experiencia hasta ahora?',
            description: '¡Valoramos tus comentarios!',
            ui_config: {
              style: 'stars',
              max_rating: 5,
              allow_half: false,
              size: 'large',
            },
            validation: {
              required: true,
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
