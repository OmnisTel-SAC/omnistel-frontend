import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LoggerService {
  error(context: string, ...args: unknown[]): void {
    console.error(`[${context}]`, ...args);
  }
}
