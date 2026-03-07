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
    es: {
      onboarding_flow: {
        id: 'store-onboarding-v1',
        version: '1.0.0',
        locale: 'es',
        title: 'Configuración de Tienda',
        skip_config: {
          allow_skip_entire_flow: false,
          track_skip_reasons: true,
        },
        screens: [
          {
            id: 'store_type',
            type: 'single_select',
            title: '¿Qué tipo de tienda tienes?',
            description: 'Esto nos ayuda a personalizar tu asistente de IA',
            options: [
              {
                id: 'appointment',
                label: 'Citas/Servicios',
                value: 'appointment',
              },
              {
                id: 'product',
                label: 'Productos/Comercio electrónico',
                value: 'product',
              },
              {
                id: 'hybrid',
                label: 'Híbrida (Ambas)',
                value: 'hybrid',
              },
            ],
            validation: {
              required: true,
              error_message: 'Por favor selecciona el tipo de tienda',
            },
            ui_config: {
              layout: 'list',
            },
          },
          {
            id: 'store_info',
            type: 'text',
            title: 'Cuéntanos sobre tu tienda y qué ofreces',
            description: 'Describe tu tienda y los productos o servicios que ofreces',
            placeholder:
              'ej. Black Gold Coffee - Granos de café especiales, suscripciones y equipos para preparar café',
            validation: {
              required: true,
              min_length: 10,
              max_length: 500,
              error_message: 'Por favor proporciona información sobre tu tienda y ofertas',
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
            title: '¿Qué debería hacer tu asistente de IA?',
            description: 'Selecciona todas las funciones que apliquen',
            options: [
              {
                id: 'answer_faq',
                label: 'Responder preguntas de clientes (FAQ)',
                value: 'answer_faq',
              },
              {
                id: 'appointment_setting',
                label: 'Reservar citas/consultas',
                value: 'appointment_setting',
                conditional_show: {
                  operator: 'in',
                  question_id: 'store_type',
                  value: ['appointment', 'hybrid'],
                },
              },
              {
                id: 'process_orders',
                label: 'Procesar pedidos de productos',
                value: 'process_orders',
                conditional_show: {
                  operator: 'in',
                  question_id: 'store_type',
                  value: ['product', 'hybrid'],
                },
              },
              {
                id: 'qualify_leads',
                label: 'Calificar leads y recopilar información',
                value: 'qualify_leads',
              },
            ],
            validation: {
              required: true,
              error_message: 'Por favor selecciona qué debería hacer tu asistente de IA',
            },
            ui_config: {
              layout: 'list',
            },
          },
          {
            id: 'communication_tone',
            type: 'multi_select',
            title:
              '¿Cómo debería comunicarse tu asistente de IA con tus clientes en cuanto al tono?',
            description:
              'Selecciona los tonos de comunicación que mejor se adapten a tu marca (puedes seleccionar varios)',
            options: [
              {
                id: 'friendly',
                label: 'Amigable',
                value: 'friendly',
              },
              {
                id: 'professional',
                label: 'Profesional',
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
                label: 'Conversacional',
                value: 'conversational',
              },
              {
                id: 'empathetic',
                label: 'Empático',
                value: 'empathetic',
              },
            ],
            validation: {
              required: false,
              skippable: true,
              skip_button_text: 'Omitir',
              error_message: 'Por favor selecciona al menos un tono de comunicación',
            },
            ui_config: {
              layout: 'list',
            },
          },
          {
            id: 'customer_questions',
            type: 'text',
            title: '¿Qué preguntas suelen hacer tus clientes?',
            description: 'Lista preguntas comunes que hacen tus clientes (opcional)',
            placeholder:
              'ej. ¿Cuáles son sus tiempos de envío? ¿Ofrecen reembolsos? ¿Qué métodos de pago aceptan?',
            validation: {
              required: false,
              skippable: true,
              skip_button_text: 'Omitir',
              min_length: 10,
              max_length: 500,
              error_message: 'Por favor proporciona al menos 10 caracteres si respondes',
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
            title: '¿En qué escenario debería el asistente de IA contactarte?',
            description:
              'Describe cuándo el asistente de IA debería escalar contigo o contactarte directamente',
            placeholder:
              'ej. Cuando los clientes solicitan reembolsos, tienen problemas de pago o necesitan soporte técnico complejo',
            validation: {
              required: true,
              min_length: 10,
              max_length: 500,
              error_message: 'Por favor describe cuándo el asistente de IA debería contactarte',
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
    pt: {
      onboarding_flow: {
        id: 'store-onboarding-v1',
        version: '1.0.0',
        locale: 'pt',
        title: 'Configuração da Loja',
        skip_config: {
          allow_skip_entire_flow: false,
          track_skip_reasons: true,
        },
        screens: [
          {
            id: 'store_type',
            type: 'single_select',
            title: 'Que tipo de loja você tem?',
            description: 'Isso nos ajuda a personalizar seu assistente de IA',
            options: [
              {
                id: 'appointment',
                label: 'Agendamento/Baseado em serviços',
                value: 'appointment',
              },
              {
                id: 'product',
                label: 'Produtos/E-commerce',
                value: 'product',
              },
              {
                id: 'hybrid',
                label: 'Híbrida (Ambos)',
                value: 'hybrid',
              },
            ],
            validation: {
              required: true,
              error_message: 'Por favor selecione o tipo de loja',
            },
            ui_config: {
              layout: 'list',
            },
          },
          {
            id: 'store_info',
            type: 'text',
            title: 'Conte-nos sobre sua loja e o que você oferece?',
            description: 'Descreva sua loja e os produtos ou serviços que você oferece',
            placeholder:
              'ex. Black Gold Coffee - Grãos de café especiais, assinaturas e equipamentos para preparar café',
            validation: {
              required: true,
              min_length: 10,
              max_length: 500,
              error_message: 'Por favor forneça informações sobre sua loja e ofertas',
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
            title: 'O que seu assistente de IA deve fazer?',
            description: 'Selecione todas as funções que se aplicam',
            options: [
              {
                id: 'answer_faq',
                label: 'Responder perguntas de clientes (FAQ)',
                value: 'answer_faq',
              },
              {
                id: 'appointment_setting',
                label: 'Agendar consultas/agendamentos',
                value: 'appointment_setting',
                conditional_show: {
                  operator: 'in',
                  question_id: 'store_type',
                  value: ['appointment', 'hybrid'],
                },
              },
              {
                id: 'process_orders',
                label: 'Processar pedidos de produtos',
                value: 'process_orders',
                conditional_show: {
                  operator: 'in',
                  question_id: 'store_type',
                  value: ['product', 'hybrid'],
                },
              },
              {
                id: 'qualify_leads',
                label: 'Qualificar leads e coletar informações',
                value: 'qualify_leads',
              },
            ],
            validation: {
              required: true,
              error_message: 'Por favor selecione o que seu assistente de IA deve fazer',
            },
            ui_config: {
              layout: 'list',
            },
          },
          {
            id: 'communication_tone',
            type: 'multi_select',
            title:
              'Como seu assistente de IA deve se comunicar com seus clientes em termos de tom?',
            description:
              'Selecione os tons de comunicação que melhor se adequam à sua marca (você pode selecionar vários)',
            options: [
              {
                id: 'friendly',
                label: 'Amigável',
                value: 'friendly',
              },
              {
                id: 'professional',
                label: 'Profissional',
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
                label: 'Conversacional',
                value: 'conversational',
              },
              {
                id: 'empathetic',
                label: 'Empático',
                value: 'empathetic',
              },
            ],
            validation: {
              required: false,
              skippable: true,
              skip_button_text: 'Pular',
              error_message: 'Por favor selecione pelo menos um tom de comunicação',
            },
            ui_config: {
              layout: 'list',
            },
          },
          {
            id: 'customer_questions',
            type: 'text',
            title: 'Quais perguntas seus clientes geralmente fazem?',
            description: 'Liste perguntas comuns que seus clientes fazem (opcional)',
            placeholder:
              'ex. Quais são seus prazos de entrega? Você oferece reembolsos? Quais métodos de pagamento você aceita?',
            validation: {
              required: false,
              skippable: true,
              skip_button_text: 'Pular',
              min_length: 10,
              max_length: 500,
              error_message: 'Por favor forneça pelo menos 10 caracteres se responder',
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
            title: 'Em qual cenário o assistente de IA deve entrar em contato com você?',
            description:
              'Descreva quando o assistente de IA deve escalar para você ou entrar em contato diretamente',
            placeholder:
              'ex. Quando clientes solicitam reembolsos, têm problemas de pagamento ou precisam de suporte técnico complexo',
            validation: {
              required: true,
              min_length: 10,
              max_length: 500,
              error_message:
                'Por favor descreva quando o assistente de IA deve entrar em contato com você',
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

        if (__DEV__) console.log(`No flow found for locale ${localeStr}, falling back to English`);
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
      if (__DEV__) console.log('[MockOnboardingRepository] Submitting answers:', {
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
      if (__DEV__) console.log('[MockOnboardingRepository] Validating field:', {
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
