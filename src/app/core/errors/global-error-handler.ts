import { ErrorHandler, Injectable, inject } from '@angular/core';
import { LoggerService } from '../services/logger.service';

@Injectable({
  providedIn: 'root'
})
export class GlobalErrorHandler implements ErrorHandler {
  private readonly logger = inject(LoggerService);

  handleError(error: unknown): void {
    // Di sini kita bisa mengintegrasikan Sentry:
    // Sentry.captureException(error);
    
    this.logger.error('GlobalErrorHandler', 'Unhandled error caught', error);
  }
}
