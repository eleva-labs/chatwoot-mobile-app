/**
 * Tests for Logger Utility
 *
 * Tests the logger functionality for the onboarding module.
 */

// Mock console methods BEFORE importing logger
// Use jest.fn() to ensure mocks are properly tracked

const mockConsoleDebug = jest.fn();
const mockConsoleInfo = jest.fn();
const mockConsoleWarn = jest.fn();
const mockConsoleError = jest.fn();

// Set up spies before importing logger
jest.spyOn(console, 'debug').mockImplementation(mockConsoleDebug);
jest.spyOn(console, 'info').mockImplementation(mockConsoleInfo);
jest.spyOn(console, 'warn').mockImplementation(mockConsoleWarn);
jest.spyOn(console, 'error').mockImplementation(mockConsoleError);

import { logger } from '../../../shared/utils/logger';

describe('Logger', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Always enable logger for tests (__DEV__ might be false in test environment)
    logger.setEnabled(true);
  });

  afterAll(() => {
    mockConsoleDebug.mockRestore();
    mockConsoleInfo.mockRestore();
    mockConsoleWarn.mockRestore();
    mockConsoleError.mockRestore();
  });

  describe('setEnabled()', () => {
    it('should disable logging when set to false', () => {
      logger.setEnabled(false);
      logger.info('Test message');

      expect(mockConsoleInfo).not.toHaveBeenCalled();
    });

    it('should enable logging when set to true', () => {
      logger.setEnabled(true);
      logger.info('Test message');

      expect(mockConsoleInfo).toHaveBeenCalled();
    });
  });

  describe('debug()', () => {
    it('should log debug message when enabled', () => {
      logger.setEnabled(true);
      logger.debug('Debug message');

      expect(mockConsoleDebug).toHaveBeenCalledWith(
        expect.stringContaining('[Onboarding:DEBUG]'),
        expect.any(String),
        'Debug message',
      );
    });

    it('should not log when disabled', () => {
      logger.setEnabled(false);
      logger.debug('Debug message');

      expect(mockConsoleDebug).not.toHaveBeenCalled();
    });

    it('should include additional arguments', () => {
      logger.setEnabled(true);
      logger.debug('Debug message', { key: 'value' }, 123);

      expect(mockConsoleDebug).toHaveBeenCalledWith(
        expect.stringContaining('[Onboarding:DEBUG]'),
        expect.any(String),
        'Debug message',
        { key: 'value' },
        123,
      );
    });
  });

  describe('info()', () => {
    it('should log info message when enabled', () => {
      logger.setEnabled(true);
      logger.info('Info message');

      expect(mockConsoleInfo).toHaveBeenCalledWith(
        expect.stringContaining('[Onboarding:INFO]'),
        expect.any(String),
        'Info message',
      );
    });

    it('should not log when disabled', () => {
      logger.setEnabled(false);
      logger.info('Info message');

      expect(mockConsoleInfo).not.toHaveBeenCalled();
    });

    it('should include additional arguments', () => {
      logger.setEnabled(true);
      logger.info('Info message', 'arg1', 'arg2');

      expect(mockConsoleInfo).toHaveBeenCalledWith(
        expect.stringContaining('[Onboarding:INFO]'),
        expect.any(String),
        'Info message',
        'arg1',
        'arg2',
      );
    });
  });

  describe('warn()', () => {
    it('should log warn message when enabled', () => {
      logger.setEnabled(true);
      jest.clearAllMocks();
      logger.warn('Warning message');

      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('[Onboarding:WARN]'),
        expect.any(String),
        'Warning message',
      );
    });

    it('should not log when disabled', () => {
      logger.setEnabled(false);
      logger.warn('Warning message');

      expect(mockConsoleWarn).not.toHaveBeenCalled();
    });

    it('should include additional arguments', () => {
      logger.setEnabled(true);
      jest.clearAllMocks();
      logger.warn('Warning message', { error: 'test' });

      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('[Onboarding:WARN]'),
        expect.any(String),
        'Warning message',
        { error: 'test' },
      );
    });
  });

  describe('error()', () => {
    it('should log error message when enabled', () => {
      logger.setEnabled(true);
      jest.clearAllMocks();
      logger.error('Error message');

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('[Onboarding:ERROR]'),
        expect.any(String),
        'Error message',
      );
    });

    it('should not log when disabled', () => {
      logger.setEnabled(false);
      logger.error('Error message');

      expect(mockConsoleError).not.toHaveBeenCalled();
    });

    it('should include additional arguments', () => {
      logger.setEnabled(true);
      jest.clearAllMocks();
      const error = new Error('Test error');
      logger.error('Error message', error);

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('[Onboarding:ERROR]'),
        expect.any(String),
        'Error message',
        error,
      );
    });
  });

  describe('log format', () => {
    it('should include timestamp in logs', () => {
      logger.setEnabled(true);
      logger.info('Test message');

      const callArgs = mockConsoleInfo.mock.calls[0];
      const timestamp = callArgs[1];

      // Check that timestamp is an ISO string
      expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('should include correct prefix for each log level', () => {
      logger.setEnabled(true);
      jest.clearAllMocks();

      logger.debug('debug');
      expect(console.debug).toHaveBeenCalledWith(
        expect.stringContaining('[Onboarding:DEBUG]'),
        expect.any(String),
        'debug',
      );

      logger.info('info');
      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining('[Onboarding:INFO]'),
        expect.any(String),
        'info',
      );

      logger.warn('warn');
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('[Onboarding:WARN]'),
        expect.any(String),
        'warn',
      );

      logger.error('error');
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('[Onboarding:ERROR]'),
        expect.any(String),
        'error',
      );
    });
  });
});
