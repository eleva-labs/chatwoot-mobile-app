/**
 * Logger Utility
 *
 * Simple logger for the onboarding module.
 * Can be extended to integrate with external logging services.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  private enabled: boolean = __DEV__;

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  private log(level: LogLevel, message: string, ...args: unknown[]): void {
    if (!this.enabled) return;

    const prefix = `[Onboarding:${level.toUpperCase()}]`;
    const timestamp = new Date().toISOString();

    switch (level) {
      case 'debug':
        console.debug(prefix, timestamp, message, ...args);
        break;
      case 'info':
        console.info(prefix, timestamp, message, ...args);
        break;
      case 'warn':
        console.warn(prefix, timestamp, message, ...args);
        break;
      case 'error':
        console.error(prefix, timestamp, message, ...args);
        break;
    }
  }

  debug(message: string, ...args: unknown[]): void {
    this.log('debug', message, ...args);
  }

  info(message: string, ...args: unknown[]): void {
    this.log('info', message, ...args);
  }

  warn(message: string, ...args: unknown[]): void {
    this.log('warn', message, ...args);
  }

  error(message: string, ...args: unknown[]): void {
    this.log('error', message, ...args);
  }
}

export const logger = new Logger();
