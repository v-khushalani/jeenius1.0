/**
 * Environment-aware logger utility
 * Logs to console only in development, always logs errors
 */

type LogLevel = 'log' | 'warn' | 'error' | 'info' | 'debug';

class Logger {
  private isDevelopment = import.meta.env.DEV;

  log(...args: any[]) {
    if (this.isDevelopment) {
      console.log(...args);
    }
  }

  info(...args: any[]) {
    if (this.isDevelopment) {
      console.info(...args);
    }
  }

  warn(...args: any[]) {
    if (this.isDevelopment) {
      console.warn(...args);
    }
  }

  error(...args: any[]) {
    // Always log errors, even in production
    console.error(...args);
  }

  debug(...args: any[]) {
    if (this.isDevelopment) {
      console.debug(...args);
    }
  }

  group(label: string) {
    if (this.isDevelopment) {
      console.group(label);
    }
  }

  groupEnd() {
    if (this.isDevelopment) {
      console.groupEnd();
    }
  }

  table(data: any) {
    if (this.isDevelopment) {
      console.table(data);
    }
  }
}

export const logger = new Logger();
