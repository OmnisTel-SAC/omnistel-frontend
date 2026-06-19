import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'statusLabel' })
export class StatusLabelPipe implements PipeTransform {
  transform(value: string): string {
    const map: Record<string, string> = {
      OPEN: 'Abierto',
      ASSIGNED: 'Asignado',
      IN_PROGRESS: 'En Progreso',
      RESOLVED: 'Resuelto',
      CLOSED: 'Cerrado',
      REOPENED: 'Reabierto',
    };
    return map[value] ?? value;
  }
}
