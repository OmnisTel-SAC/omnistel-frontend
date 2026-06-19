import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'priorityLabel' })
export class PriorityPipe implements PipeTransform {
  transform(value: string): string {
    const map: Record<string, string> = {
      LOW: 'Baja',
      MEDIUM: 'Media',
      HIGH: 'Alta',
      CRITICAL: 'Crítica',
    };
    return map[value?.toUpperCase()] ?? value;
  }
}
