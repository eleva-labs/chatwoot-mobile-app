import { OnboardingFlow } from '../../domain/entities/OnboardingFlow';
import { Screen } from '../../domain/entities/Screen';
import { Locale } from '../../domain/entities/Locale';
import { FlowVersion } from '../../domain/entities/FlowVersion';
import { QuestionId } from '../../domain/entities/QuestionId';
import type { OnboardingFlowDTO, ScreenDTO } from '../dto/OnboardingFlowDTO';
import { DomainError } from '../../domain/entities/Errors';

/**
 * Onboarding Flow Mapper
 *
 * Maps DTOs (JSON from server) to domain entities.
 */
export class OnboardingFlowMapper {
  static toDomain(dto: OnboardingFlowDTO): OnboardingFlow {
    try {
      const flowData = dto.onboarding_flow;

      const locale = Locale.create(flowData.locale);
      const version = FlowVersion.create(flowData.version);

      const screens = flowData.screens.map(
        (screenDTO: ScreenDTO): Screen => this.screenToDomain(screenDTO),
      );

      return new OnboardingFlow(
        flowData.id,
        version,
        locale,
        screens,
        flowData.title,
        flowData.skip_config,
      );
    } catch (error) {
      throw new DomainError(
        `Failed to map onboarding flow DTO to domain: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  private static screenToDomain(dto: ScreenDTO): Screen {
    const questionId = QuestionId.create(dto.id);

    return new Screen(
      questionId,
      dto.type,
      dto.title,
      dto.description,
      dto.placeholder,
      dto.options,
      dto.validation,
      dto.conditional_logic,
      dto.ui_config,
      dto.default_value,
    );
  }
}
