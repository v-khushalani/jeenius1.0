interface LogEntry {
  action: string;
  details?: any;
  timestamp?: number;
}

import { logger } from '@/utils/logger';

class SecurityLogger {
  private logs: LogEntry[] = [];
  private readonly maxLogs = 1000;

  log(action: string, details?: any) {
    const entry: LogEntry = {
      action,
      details,
      timestamp: Date.now()
    };

    // Add to memory logs
    this.logs.unshift(entry);
    
    // Keep only recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      logger.info(`[SECURITY] ${action}:`, details);
    }

    // In production, you might want to send to a logging service
    // this.sendToLoggingService(entry);
  }

  getLogs(limit = 100) {
    return this.logs.slice(0, limit);
  }

  clearLogs() {
    this.logs = [];
  }

  // Method to send logs to external service (implement as needed)
  private sendToLoggingService(entry: LogEntry) {
    // Implement sending to your logging service
    // Examples: Sentry, LogRocket, custom API
  }
}

export const securityLogger = new SecurityLogger();
