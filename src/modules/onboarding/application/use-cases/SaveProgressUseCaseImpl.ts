import { injectable, inject } from 'tsyringe';
import type { IStorageRepository } from '../../domain/repositories/IStorageRepository';
import type { Answers } from '../../domain/common';
import { Result } from '../../domain/entities/Result';
import { DI_TOKENS } from '../../di/tokens';
import type { ISaveProgressUseCase } from '../../domain/use-cases/ISaveProgressUseCase';

/**
 * Save Progress Use Case
 *
 * Saves onboarding progress locally so users can resume later.
 */
@injectable()
export class SaveProgressUseCaseImpl implements ISaveProgressUseCase {
  private readonly PROGRESS_KEY_PREFIX = 'onboarding_progress_';

  constructor(
    @inject(DI_TOKENS.IStorageRepository) private readonly storageRepository: IStorageRepository,
  ) {}

  async execute(
    flowId: string,
    currentStep: number,
    answers: Answers,
  ): Promise<Result<void, Error>> {
    try {
      const progressKey = `${this.PROGRESS_KEY_PREFIX}${flowId}`;
      const progressData = {
        flowId,
        currentStep,
        answers,
        savedAt: Date.now(),
      };

      return this.storageRepository.save(progressKey, progressData);
    } catch (error) {
      return Result.fail(error instanceof Error ? error : new Error('Failed to save progress'));
    }
  }

  async loadProgress(
    flowId: string,
  ): Promise<Result<{ flowId: string; currentStep: number; answers: Answers } | null, Error>> {
    try {
      const progressKey = `${this.PROGRESS_KEY_PREFIX}${flowId}`;
      const result = await this.storageRepository.get<{
        flowId: string;
        currentStep: number;
        answers: Answers;
        savedAt: number;
      }>(progressKey);

      if (result.isFailure) {
        return Result.fail(result.getError());
      }

      const progress = result.getValue();
      if (!progress) {
        return Result.ok(null);
      }

      return Result.ok({
        flowId: progress.flowId,
        currentStep: progress.currentStep,
        answers: progress.answers,
      });
    } catch (error) {
      return Result.fail(error instanceof Error ? error : new Error('Failed to load progress'));
    }
  }

  async clearProgress(flowId: string): Promise<Result<void, Error>> {
    try {
      const progressKey = `${this.PROGRESS_KEY_PREFIX}${flowId}`;
      return this.storageRepository.remove(progressKey);
    } catch (error) {
      return Result.fail(error instanceof Error ? error : new Error('Failed to clear progress'));
    }
  }
}
