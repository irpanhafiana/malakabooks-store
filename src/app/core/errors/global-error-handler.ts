import { ErrorHandler, Injectable, inject } from '@angular/core';
import { LoggerService } from '../services/logger.service';
import { AlertService } from '../services/alert.service';

@Injectable({
  providedIn: 'root'
})
export class GlobalErrorHandler implements ErrorHandler {
  private readonly logger = inject(LoggerService);
  private readonly alertService = inject(AlertService);

  handleError(error: unknown): void {
    // Sentry integration hook with PII scrubbing (token, auth headers, passwords stripped)
    this.captureExceptionToSentry(error);
    
    this.logger.error('GlobalErrorHandler', 'Unhandled error caught', error);

    // Notify user gracefully
    try {
      this.alertService.error('Terjadi kesalahan yang tidak terduga pada sistem. Silakan coba lagi nanti.');
    } catch {
      // Prevent recursive error loops if alert service fails
    }
  }

  private captureExceptionToSentry(error: unknown): void {
    const win = typeof window !== 'undefined' ? (window as unknown as { Sentry?: { captureException: (e: unknown) => void } }) : null;
    if (win?.Sentry && typeof win.Sentry.captureException === 'function') {
      const sanitizedError = this.sanitizeErrorForPii(error);
      win.Sentry.captureException(sanitizedError);
    }
  }

  private sanitizeErrorForPii(error: unknown): unknown {
    if (!error || typeof error !== 'object') return error;
    try {
      const scrubbed = { ...(error as Record<string, unknown>) };
      const sensitiveKeys = ['token', 'accessToken', 'refreshToken', 'password', 'authorization', 'secret'];
      for (const key of Object.keys(scrubbed)) {
        if (sensitiveKeys.some(s => key.toLowerCase().includes(s))) {
          scrubbed[key] = '[SCRUBBED]';
        }
      }
      return scrubbed;
    } catch {
      return error;
    }
  }
}

