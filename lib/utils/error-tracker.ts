/**
 * Error Tracking Utility
 * Centralized error tracking and monitoring
 */

import { logger } from "./logger";

interface ErrorContext {
  userId?: string;
  profileId?: string;
  operation?: string;
  endpoint?: string;
  statusCode?: number;
  errorCode?: string;
  [key: string]: unknown;
}

class ErrorTracker {
  /**
   * Track error for monitoring/alerting
   */
  trackError(
    error: Error | unknown,
    context?: ErrorContext
  ): void {
    const errorMessage =
      error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    // Log error with context
    logger.error("Error tracked", error, context);

    // In production, you might want to send to error tracking service:
    // - Sentry
    // - LogRocket
    // - Datadog
    // - Custom error tracking API

    // Example: Send to external service
    if (process.env.NODE_ENV === "production") {
      this.sendToErrorTrackingService({
        message: errorMessage,
        stack: errorStack,
        ...context,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Track API error
   */
  trackApiError(
    error: Error | unknown,
    endpoint: string,
    statusCode?: number,
    userId?: string
  ): void {
    this.trackError(error, {
      endpoint,
      statusCode,
      userId,
      type: "api_error",
    });
  }

  /**
   * Track worker profile error
   */
  trackWorkerProfileError(
    error: Error | unknown,
    operation: string,
    userId?: string,
    profileId?: string
  ): void {
    this.trackError(error, {
      operation,
      userId,
      profileId,
      type: "worker_profile_error",
    });
  }

  /**
   * Track validation error
   */
  trackValidationError(
    error: Error | unknown,
    field?: string,
    userId?: string
  ): void {
    this.trackError(error, {
      field,
      userId,
      type: "validation_error",
    });
  }

  /**
   * Track rate limit exceeded
   */
  trackRateLimitExceeded(
    identifier: string,
    endpoint?: string
  ): void {
    logger.warn("Rate limit exceeded", {
      identifier,
      endpoint,
      type: "rate_limit",
    });

    // Track for monitoring
    if (process.env.NODE_ENV === "production") {
      this.sendToErrorTrackingService({
        message: "Rate limit exceeded",
        identifier,
        endpoint,
        type: "rate_limit",
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Send error to external tracking service
   * This is a placeholder - implement based on your error tracking service
   */
  private sendToErrorTrackingService(data: Record<string, unknown>): void {
    // Example implementation:
    // if (process.env.SENTRY_DSN) {
    //   Sentry.captureException(new Error(data.message as string), {
    //     extra: data,
    //   });
    // }

    // Or send to custom API:
    // fetch(process.env.ERROR_TRACKING_API_URL, {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify(data),
    // }).catch(() => {
    //   // Fail silently if error tracking service is down
    // });

    // For now, just log in production
    if (process.env.NODE_ENV === "production") {
      console.error("[ERROR_TRACKING]", JSON.stringify(data));
    }
  }
}

// Export singleton instance
export const errorTracker = new ErrorTracker();

