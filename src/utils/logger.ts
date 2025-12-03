/**
 * Enhanced logger that stores logs in a buffer for later export
 * Useful for debugging when console output is truncated
 */

interface LogEntry {
  timestamp: string;
  level: 'log' | 'warn' | 'error' | 'debug' | 'info';
  message: string;
  data?: unknown;
}

class Logger {
  private buffer: LogEntry[] = [];
  private maxBufferSize: number = 10000; // Store up to 10,000 log entries
  private enabled: boolean = __DEV__;

  /**
   * Add a log entry to the buffer
   */
  private addToBuffer(level: LogEntry['level'], message: string, data?: unknown): void {
    if (!this.enabled) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data: data ? JSON.parse(JSON.stringify(data)) : undefined, // Deep clone to avoid reference issues
    };

    this.buffer.push(entry);

    // Keep buffer size manageable
    if (this.buffer.length > this.maxBufferSize) {
      this.buffer.shift(); // Remove oldest entries
    }
  }

  /**
   * Log with automatic buffer storage
   */
  log(message: string, ...args: unknown[]): void {
    console.log(message, ...args);
    this.addToBuffer('log', message, args.length > 0 ? args : undefined);
  }

  /**
   * Warn with automatic buffer storage
   */
  warn(message: string, ...args: unknown[]): void {
    console.warn(message, ...args);
    this.addToBuffer('warn', message, args.length > 0 ? args : undefined);
  }

  /**
   * Error with automatic buffer storage
   */
  error(message: string, ...args: unknown[]): void {
    console.error(message, ...args);
    this.addToBuffer('error', message, args.length > 0 ? args : undefined);
  }

  /**
   * Debug with automatic buffer storage
   */
  debug(message: string, ...args: unknown[]): void {
    if (__DEV__) {
      console.debug(message, ...args);
      this.addToBuffer('debug', message, args.length > 0 ? args : undefined);
    }
  }

  /**
   * Info with automatic buffer storage
   */
  info(message: string, ...args: unknown[]): void {
    console.info(message, ...args);
    this.addToBuffer('info', message, args.length > 0 ? args : undefined);
  }

  /**
   * Get all logs from buffer
   */
  getLogs(): LogEntry[] {
    return [...this.buffer];
  }

  /**
   * Get logs as formatted string
   */
  getLogsAsString(): string {
    return this.buffer
      .map(entry => {
        const dataStr = entry.data ? ` ${JSON.stringify(entry.data, null, 2)}` : '';
        return `[${entry.timestamp}] [${entry.level.toUpperCase()}] ${entry.message}${dataStr}`;
      })
      .join('\n');
  }

  /**
   * Get logs as JSON string
   */
  getLogsAsJSON(): string {
    return JSON.stringify(this.buffer, null, 2);
  }

  /**
   * Clear the log buffer
   */
  clear(): void {
    this.buffer = [];
    console.log('[Logger] Buffer cleared');
  }

  /**
   * Get buffer size
   */
  getBufferSize(): number {
    return this.buffer.length;
  }

  /**
   * Export logs to clipboard (React Native)
   */
  async exportToClipboard(): Promise<void> {
    try {
      const { Clipboard } = require('@react-native-clipboard/clipboard');
      const logsString = this.getLogsAsString();
      await Clipboard.setString(logsString);
      console.log(`[Logger] Exported ${this.buffer.length} log entries to clipboard`);
    } catch (error) {
      console.error('[Logger] Failed to export to clipboard:', error);
      // Fallback: log the export string
      console.log('[Logger] Logs export:', this.getLogsAsString());
    }
  }

  /**
   * Export logs to a file (React Native)
   * Returns the file path where logs were saved
   */
  async exportToFile(): Promise<string | null> {
    try {
      const RNFS = require('react-native-fs');
      const logsString = this.getLogsAsString();
      const fileName = `chatwoot-logs-${Date.now()}.txt`;
      const filePath = `${RNFS.CachesDirectoryPath}/${fileName}`;

      await RNFS.writeFile(filePath, logsString, 'utf8');
      console.log(`[Logger] Exported ${this.buffer.length} log entries to file: ${filePath}`);
      return filePath;
    } catch (error) {
      console.error('[Logger] Failed to export to file:', error);
      // Fallback: log the export string
      console.log('[Logger] Logs export (fallback):', this.getLogsAsString());
      return null;
    }
  }

  /**
   * Filter logs by level
   */
  getLogsByLevel(level: LogEntry['level']): LogEntry[] {
    return this.buffer.filter(entry => entry.level === level);
  }

  /**
   * Get recent logs (last N entries)
   */
  getRecentLogs(count: number): LogEntry[] {
    return this.buffer.slice(-count);
  }

  /**
   * Search logs by message pattern
   */
  searchLogs(pattern: string | RegExp): LogEntry[] {
    const regex = typeof pattern === 'string' ? new RegExp(pattern, 'i') : pattern;
    return this.buffer.filter(
      entry => regex.test(entry.message) || (entry.data && regex.test(JSON.stringify(entry.data))),
    );
  }
}

// Export singleton instance
export const logger = new Logger();

// Also export individual methods for convenience
export const log = logger.log.bind(logger);
export const warn = logger.warn.bind(logger);
export const error = logger.error.bind(logger);
export const debug = logger.debug.bind(logger);
export const info = logger.info.bind(logger);

// Expose logger globally for easy access from console/debugger
if (typeof global !== 'undefined') {
  (global as any).__logger = logger;
  (global as any).__getLogs = () => logger.getLogs();
  (global as any).__getLogsString = () => logger.getLogsAsString();
  (global as any).__getLogsJSON = () => logger.getLogsAsJSON();
  (global as any).__exportLogs = () => logger.exportToClipboard();
  (global as any).__exportLogsToFile = () => logger.exportToFile();
  (global as any).__clearLogs = () => logger.clear();
  (global as any).__searchLogs = (pattern: string | RegExp) => logger.searchLogs(pattern);

  // Helper: Print logs string directly to console (for easy copy-paste)
  (global as any).__printLogs = () => {
    const logsString = logger.getLogsAsString();
    console.log('=== FULL LOGS START ===');
    console.log(logsString);
    console.log('=== FULL LOGS END ===');
    return logsString;
  };
}
