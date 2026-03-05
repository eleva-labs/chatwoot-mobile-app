/**
 * Tests for OfflineQueue
 *
 * OfflineQueue manages offline submission queue with retry logic.
 * Supports enqueue, dequeue, retry tracking (max 3 attempts).
 */

import { OfflineQueueRepository } from '../../../infrastructure/repositories/OfflineQueueRepository';
import type { QueuedSubmission } from '../../../domain/repositories/IOfflineQueueRepository';
import { createMockStorageRepository } from '../../helpers/mocks';
import { anAnswer } from '../../helpers/builders';
import { freezeTime, unfreezeTime } from '../../helpers/testHelpers';
import type { Answers } from '../../../domain/common';

// Helper to convert Answer objects array to Answers map
function answersToMap(answers: ReturnType<typeof anAnswer>[]): Answers {
  const result: Answers = {};
  for (const answer of answers) {
    const answerObj = answer.build();
    result[answerObj.questionId.toString()] = answerObj.value;
  }
  return result;
}

describe('OfflineQueueRepository', () => {
  let queue: OfflineQueueRepository;
  let mockStorage: ReturnType<typeof createMockStorageRepository>;

  const createAnswers = (answerId: string): Answers => {
    return answersToMap([anAnswer().withQuestionId(answerId).withValue('test')]);
  };

  beforeEach(() => {
    mockStorage = createMockStorageRepository();
    queue = new OfflineQueueRepository(mockStorage);
    freezeTime(new Date('2024-01-01T12:00:00Z'));
  });

  afterEach(() => {
    unfreezeTime();
  });

  describe('enqueue()', () => {
    it('should add item to queue successfully', async () => {
      const answers = createAnswers('q1');

      const result = await queue.enqueue('flow-1', answers);

      expect(result.isSuccess).toBe(true);
      expect(mockStorage.saveCallCount).toBeGreaterThan(0);
    });

    it('should preserve enqueue order (FIFO)', async () => {
      await queue.enqueue('flow-1', createAnswers('q1'));
      await queue.enqueue('flow-2', createAnswers('q2'));
      await queue.enqueue('flow-3', createAnswers('q3'));

      const queueResult = await queue.getQueue();
      const flowIds = queueResult.getValue()?.map((item: QueuedSubmission) => item.flowId);

      expect(flowIds).toEqual(['flow-1', 'flow-2', 'flow-3']);
    });

    it('should initialize retry count to 0', async () => {
      await queue.enqueue('flow-1', createAnswers('q1'));

      const queueResult = await queue.getQueue();
      const queuedItem = queueResult.getValue()?.[0];

      expect(queuedItem?.retryCount).toBe(0);
    });

    it('should store timestamp', async () => {
      await queue.enqueue('flow-1', createAnswers('q1'));

      const queueResult = await queue.getQueue();
      const queuedItem = queueResult.getValue()?.[0];

      expect(queuedItem?.timestamp).toBeDefined();
      expect(typeof queuedItem?.timestamp).toBe('number');
    });

    it('should return failure when storage fails', async () => {
      mockStorage.setSaveError(new Error('Storage full'));

      const result = await queue.enqueue('flow-1', createAnswers('q1'));

      expect(result.isFailure).toBe(true);
    });
  });

  describe('dequeue()', () => {
    it('should remove item from queue', async () => {
      await queue.enqueue('flow-1', createAnswers('q1'));
      await queue.enqueue('flow-2', createAnswers('q2'));

      const queueResult = await queue.getQueue();
      const firstItem = queueResult.getValue()?.[0];
      if (!firstItem) {
        throw new Error('Queue should have items');
      }

      const result = await queue.dequeue(firstItem);

      expect(result.isSuccess).toBe(true);

      const remaining = await queue.getQueue();
      expect(remaining.getValue()).toHaveLength(1);
      expect(remaining.getValue()?.[0].flowId).toBe('flow-2');
    });

    it('should handle dequeue from single-item queue', async () => {
      await queue.enqueue('flow-1', createAnswers('q1'));

      const queueResult = await queue.getQueue();
      const item = queueResult.getValue()?.[0];
      if (!item) {
        throw new Error('Queue should have item');
      }

      const result = await queue.dequeue(item);
      const remaining = await queue.getQueue();

      expect(result.isSuccess).toBe(true);
      expect(remaining.getValue()).toHaveLength(0);
    });

    it('should maintain order for remaining items', async () => {
      await queue.enqueue('flow-1', createAnswers('q1'));
      await queue.enqueue('flow-2', createAnswers('q2'));
      await queue.enqueue('flow-3', createAnswers('q3'));

      const queueResult = await queue.getQueue();
      const firstItem = queueResult.getValue()?.[0];
      if (firstItem) {
        await queue.dequeue(firstItem); // Remove flow-1
      }

      const remaining = await queue.getQueue();
      const flowIds = remaining.getValue()?.map((item: QueuedSubmission) => item.flowId);

      expect(flowIds).toEqual(['flow-2', 'flow-3']);
    });

    it('should return failure when storage fails', async () => {
      await queue.enqueue('flow-1', createAnswers('q1'));
      const queueResult = await queue.getQueue();
      const item = queueResult.getValue()?.[0];
      if (!item) {
        throw new Error('Queue should have item');
      }

      mockStorage.setSaveError(new Error('Storage error'));

      const result = await queue.dequeue(item);

      expect(result.isFailure).toBe(true);
    });
  });

  describe('retry tracking', () => {
    it('should increment retry count on retry', async () => {
      await queue.enqueue('flow-1', createAnswers('q1'));

      const queueResult = await queue.getQueue();
      const item = queueResult.getValue()?.[0];
      if (!item) {
        throw new Error('Queue should have item');
      }

      // Retry item
      const result = await queue.incrementRetry(item);

      expect(result.isSuccess).toBe(true);

      const updatedQueue = await queue.getQueue();
      const retriedItem = updatedQueue
        .getValue()
        ?.find((i: QueuedSubmission) => i.flowId === item.flowId && i.timestamp === item.timestamp);

      expect(retriedItem?.retryCount).toBe(1);
    });

    it('should allow up to 3 retries', async () => {
      await queue.enqueue('flow-1', createAnswers('q1'));

      let queueResult = await queue.getQueue();
      let item = queueResult.getValue()?.[0];
      if (!item) {
        throw new Error('Queue should have item');
      }

      // Retry 3 times
      await queue.incrementRetry(item);
      queueResult = await queue.getQueue();
      item = queueResult.getValue()?.[0];
      if (!item) {
        throw new Error('Item should still exist');
      }

      await queue.incrementRetry(item);
      queueResult = await queue.getQueue();
      item = queueResult.getValue()?.[0];
      if (!item) {
        throw new Error('Item should still exist');
      }

      await queue.incrementRetry(item);

      const finalQueue = await queue.getQueue();
      const retriedItem = finalQueue.getValue()?.[0];

      expect(retriedItem?.retryCount).toBe(3);
    });

    it('should remove item after max retries exceeded', async () => {
      await queue.enqueue('flow-1', createAnswers('q1'));

      let queueResult = await queue.getQueue();
      let item = queueResult.getValue()?.[0];
      if (!item) {
        throw new Error('Queue should have item');
      }

      // Retry 4 times (max 3 allowed, so item should be removed after 4th)
      await queue.incrementRetry(item);
      queueResult = await queue.getQueue();
      item = queueResult.getValue()?.[0];
      if (!item) {
        throw new Error('Item should still exist');
      }

      await queue.incrementRetry(item);
      queueResult = await queue.getQueue();
      item = queueResult.getValue()?.[0];
      if (!item) {
        throw new Error('Item should still exist');
      }

      await queue.incrementRetry(item);
      queueResult = await queue.getQueue();
      item = queueResult.getValue()?.[0];
      if (!item) {
        throw new Error('Item should still exist');
      }

      await queue.incrementRetry(item); // 4th retry - should remove item

      const finalQueue = await queue.getQueue();
      expect(finalQueue.getValue()).toHaveLength(0);
    });

    it('should track retry count independently per item', async () => {
      await queue.enqueue('flow-1', createAnswers('q1'));
      await queue.enqueue('flow-2', createAnswers('q2'));

      let queueResult = await queue.getQueue();
      const item1 = queueResult.getValue()?.[0];
      const item2 = queueResult.getValue()?.[1];
      if (!item1 || !item2) {
        throw new Error('Queue should have items');
      }

      // Retry item1 twice
      await queue.incrementRetry(item1);
      queueResult = await queue.getQueue();
      const updatedItem1 = queueResult
        .getValue()
        ?.find(
          (i: QueuedSubmission) => i.flowId === item1.flowId && i.timestamp === item1.timestamp,
        );
      if (updatedItem1) {
        await queue.incrementRetry(updatedItem1);
      }

      const finalQueue = await queue.getQueue();
      const item1Retries = finalQueue
        .getValue()
        ?.find(
          (i: QueuedSubmission) => i.flowId === item1.flowId && i.timestamp === item1.timestamp,
        )?.retryCount;
      const item2Retries = finalQueue
        .getValue()
        ?.find(
          (i: QueuedSubmission) => i.flowId === item2.flowId && i.timestamp === item2.timestamp,
        )?.retryCount;

      expect(item1Retries).toBe(2);
      expect(item2Retries).toBe(0);
    });
  });

  describe('size()', () => {
    it('should return 0 for empty queue', async () => {
      const result = await queue.size();

      expect(result.isSuccess).toBe(true);
      expect(result.getValue()).toBe(0);
    });

    it('should return correct size when queue has items', async () => {
      await queue.enqueue('flow-1', createAnswers('q1'));

      const result = await queue.size();

      expect(result.getValue()).toBe(1);
    });

    it('should return 0 after all items dequeued', async () => {
      await queue.enqueue('flow-1', createAnswers('q1'));
      const queueResult = await queue.getQueue();
      const item = queueResult.getValue()?.[0];
      if (item) {
        await queue.dequeue(item);
      }

      const result = await queue.size();

      expect(result.getValue()).toBe(0);
    });

    it('should return failure when storage fails', async () => {
      mockStorage.setGetError(new Error('Storage error'));

      const result = await queue.size();

      expect(result.isFailure).toBe(true);
    });
  });

  describe('getQueue()', () => {
    it('should return empty array for empty queue', async () => {
      const result = await queue.getQueue();

      expect(result.isSuccess).toBe(true);
      expect(result.getValue()).toEqual([]);
    });

    it('should return all pending items', async () => {
      await queue.enqueue('flow-1', createAnswers('q1'));
      await queue.enqueue('flow-2', createAnswers('q2'));
      await queue.enqueue('flow-3', createAnswers('q3'));

      const result = await queue.getQueue();

      expect(result.getValue()).toHaveLength(3);
    });

    it('should return items in FIFO order', async () => {
      await queue.enqueue('flow-1', createAnswers('q1'));
      await queue.enqueue('flow-2', createAnswers('q2'));

      const result = await queue.getQueue();
      const flowIds = result.getValue()?.map((item: QueuedSubmission) => item.flowId);

      expect(flowIds).toEqual(['flow-1', 'flow-2']);
    });

    it('should not modify queue state', async () => {
      await queue.enqueue('flow-1', createAnswers('q1'));

      const before = await queue.getQueue();
      const after = await queue.getQueue();

      expect(before.getValue()).toHaveLength(1);
      expect(after.getValue()).toHaveLength(1);
    });
  });

  describe('clear()', () => {
    it('should remove all items from queue', async () => {
      await queue.enqueue('flow-1', createAnswers('q1'));
      await queue.enqueue('flow-2', createAnswers('q2'));
      await queue.enqueue('flow-3', createAnswers('q3'));

      const result = await queue.clear();

      expect(result.isSuccess).toBe(true);

      const pending = await queue.getQueue();
      expect(pending.getValue()).toHaveLength(0);
    });

    it('should succeed on empty queue', async () => {
      const result = await queue.clear();

      expect(result.isSuccess).toBe(true);
    });

    it('should return failure when storage fails', async () => {
      await queue.enqueue('flow-1', createAnswers('q1'));
      mockStorage.setRemoveError(new Error('Storage error'));

      const result = await queue.clear();

      expect(result.isFailure).toBe(true);
    });
  });

  describe('Persistence', () => {
    it('should persist queue across instances', async () => {
      await queue.enqueue('flow-1', createAnswers('q1'));
      await queue.enqueue('flow-2', createAnswers('q2'));

      // Create new queue instance with same storage
      const newQueue = new OfflineQueueRepository(mockStorage);
      const pending = await newQueue.getQueue();

      expect(pending.getValue()).toHaveLength(2);
    });

    it('should restore retry counts', async () => {
      await queue.enqueue('flow-1', createAnswers('q1'));
      const queueResult = await queue.getQueue();
      const item = queueResult.getValue()?.[0];
      if (!item) {
        throw new Error('Queue should have item');
      }

      await queue.incrementRetry(item);
      const updatedQueue = await queue.getQueue();
      const updatedItem = updatedQueue
        .getValue()
        ?.find((i: QueuedSubmission) => i.flowId === item.flowId && i.timestamp === item.timestamp);
      if (updatedItem) {
        await queue.incrementRetry(updatedItem);
      }

      // Create new queue instance
      const newQueue = new OfflineQueueRepository(mockStorage);
      const pending = await newQueue.getQueue();

      expect(pending.getValue()?.[0].retryCount).toBe(2);
    });
  });

  describe('Edge cases', () => {
    it('should handle rapid enqueue operations', async () => {
      const promises = Array.from({ length: 50 }, (_, i) =>
        queue.enqueue(`flow-${i}`, createAnswers(`q${i}`)),
      );

      const results = await Promise.all(promises);

      expect(results.every(r => r.isSuccess)).toBe(true);

      const pending = await queue.getQueue();
      expect(pending.getValue()).toHaveLength(50);
    });

    it('should handle very large queue', async () => {
      for (let i = 0; i < 1000; i++) {
        await queue.enqueue(`flow-${i}`, createAnswers(`q${i}`));
      }

      const pending = await queue.getQueue();
      expect(pending.getValue()).toHaveLength(1000);
    });

    it('should handle queue with complex data', async () => {
      const complexAnswers: Answers = {
        q1: 'text',
        q2: 42,
        q3: ['a', 'b', 'c'],
      };

      await queue.enqueue('flow-1', complexAnswers);
      const queueResult = await queue.getQueue();
      const item = queueResult.getValue()?.[0];

      expect(item?.answers).toBeDefined();
      expect(item?.answers.q1).toBe('text');
      expect(item?.answers.q2).toBe(42);
      expect(Array.isArray(item?.answers.q3)).toBe(true);
    });

    it('should handle incrementRetry of non-existent item gracefully', async () => {
      const nonExistentItem: QueuedSubmission = {
        flowId: 'non-existent',
        answers: {},
        timestamp: Date.now(),
        retryCount: 0,
      };

      const result = await queue.incrementRetry(nonExistentItem);

      expect(result.isSuccess).toBe(true); // Method succeeds but doesn't change queue
    });
  });

  describe('Time-based operations', () => {
    it('should record enqueue timestamp', async () => {
      const beforeTime = Date.now();
      await queue.enqueue('flow-1', createAnswers('q1'));
      const afterTime = Date.now();

      const pending = await queue.getQueue();
      const timestamp = pending.getValue()?.[0].timestamp;

      expect(timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(timestamp).toBeLessThanOrEqual(afterTime);
    });
  });

  describe('Error handling', () => {
    it('should handle getQueue failure in enqueue', async () => {
      mockStorage.setGetError(new Error('Storage read error'));

      const result = await queue.enqueue('flow-1', createAnswers('q1'));

      expect(result.isFailure).toBe(true);
      expect(result.getError().message).toContain('Storage read error');
    });

    it('should handle exception in enqueue catch block', async () => {
      // Make getQueue throw an exception
      jest.spyOn(queue, 'getQueue').mockImplementation(() => {
        throw 'String error';
      });

      const result = await queue.enqueue('flow-1', createAnswers('q1'));

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBeInstanceOf(Error);
    });

    it('should handle getQueue failure in getQueue method', async () => {
      mockStorage.setGetError(new Error('Storage error'));

      const result = await queue.getQueue();

      expect(result.isFailure).toBe(true);
      expect(result.getError().message).toContain('Storage error');
    });

    it('should handle exception in getQueue catch block', async () => {
      jest.spyOn(mockStorage, 'get').mockImplementation(() => {
        throw 'String error';
      });

      const result = await queue.getQueue();

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBeInstanceOf(Error);
    });

    it('should handle getQueue failure in dequeue', async () => {
      mockStorage.setGetError(new Error('Storage error'));

      const item: QueuedSubmission = {
        flowId: 'flow-1',
        answers: createAnswers('q1'),
        timestamp: Date.now(),
        retryCount: 0,
      };

      const result = await queue.dequeue(item);

      expect(result.isFailure).toBe(true);
    });

    it('should handle exception in dequeue catch block', async () => {
      jest.spyOn(queue, 'getQueue').mockImplementation(() => {
        throw 'String error';
      });

      const item: QueuedSubmission = {
        flowId: 'flow-1',
        answers: createAnswers('q1'),
        timestamp: Date.now(),
        retryCount: 0,
      };

      const result = await queue.dequeue(item);

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBeInstanceOf(Error);
    });

    it('should handle getQueue failure in incrementRetry', async () => {
      mockStorage.setGetError(new Error('Storage error'));

      const item: QueuedSubmission = {
        flowId: 'flow-1',
        answers: createAnswers('q1'),
        timestamp: Date.now(),
        retryCount: 0,
      };

      const result = await queue.incrementRetry(item);

      expect(result.isFailure).toBe(true);
    });

    it('should handle exception in incrementRetry catch block', async () => {
      jest.spyOn(queue, 'getQueue').mockImplementation(() => {
        throw 'String error';
      });

      const item: QueuedSubmission = {
        flowId: 'flow-1',
        answers: createAnswers('q1'),
        timestamp: Date.now(),
        retryCount: 0,
      };

      const result = await queue.incrementRetry(item);

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBeInstanceOf(Error);
    });

    it('should handle exception in clear catch block', async () => {
      jest.spyOn(mockStorage, 'remove').mockImplementation(() => {
        throw 'String error';
      });

      const result = await queue.clear();

      expect(result.isFailure).toBe(true);
      expect(result.getError()).toBeInstanceOf(Error);
    });
  });
});
