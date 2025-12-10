/**
 * Logging Utility
 * Centralized logging for application operations
 */

type LogLevel = "info" | "warn" | "error" | "debug";

interface LogContext {
  userId?: string;
  profileId?: string;
  operation?: string;
  [key: string]: unknown;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === "development";

  /**
   * Log info message
   */
  info(message: string, context?: LogContext): void {
    this.log("info", message, context);
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: LogContext): void {
    this.log("warn", message, context);
  }

  /**
   * Log error message
   */
  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const errorContext: LogContext = {
      ...context,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    };
    this.log("error", message, errorContext);
  }

  /**
   * Log debug message (only in development)
   */
  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      this.log("debug", message, context);
    }
  }

  /**
   * Internal log method
   */
  private log(level: LogLevel, message: string, context?: LogContext): void {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...context,
    };

    // In production, you might want to send to a logging service
    // For now, we'll use console with structured logging
    switch (level) {
      case "error":
        console.error(`[${timestamp}] [ERROR]`, message, context || "");
        break;
      case "warn":
        console.warn(`[${timestamp}] [WARN]`, message, context || "");
        break;
      case "debug":
        console.debug(`[${timestamp}] [DEBUG]`, message, context || "");
        break;
      default:
        console.log(`[${timestamp}] [INFO]`, message, context || "");
    }

    // In production, you could send to external service:
    // if (process.env.NODE_ENV === 'production') {
    //   sendToLoggingService(logEntry);
    // }
  }

  /**
   * Log worker profile operation
   */
  logWorkerProfileOperation(
    operation: string,
    userId: string,
    profileId?: string,
    details?: Record<string, unknown>
  ): void {
    this.info(`Worker profile ${operation}`, {
      userId,
      profileId,
      operation,
      ...details,
    });
  }

  /**
   * Log worker profile error
   */
  logWorkerProfileError(
    operation: string,
    error: Error | unknown,
    userId?: string,
    profileId?: string,
    details?: Record<string, unknown>
  ): void {
    this.error(`Worker profile ${operation} failed`, error, {
      userId,
      profileId,
      operation,
      ...details,
    });
  }
}

// Export singleton instance
export const logger = new Logger();

