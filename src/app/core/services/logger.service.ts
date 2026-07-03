import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LoggerService {
  error(context: string, message?: unknown, ...params: unknown[]): void {
    console.error(`[${context}]`, message, ...params);
  }

  warn(context: string, message?: unknown, ...params: unknown[]): void {
    console.warn(`[${context}]`, message, ...params);
  }

  log(context: string, message?: unknown, ...params: unknown[]): void {
    if (!environment.production) {
      console.log(`[${context}]`, message, ...params);
    }
  }
}
