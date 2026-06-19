import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { lastValueFrom } from 'rxjs';
import { ClientTicketService } from '../../../../core/services/client-ticket.service';
import type { TicketCategory } from '../../../../core/models/ticket';

interface CategoryOption {
  label: string;
  value: TicketCategory;
}

@Component({
  selector: 'app-create-ticket',
  imports: [
    ReactiveFormsModule, ButtonModule, InputTextModule,
    SelectModule, TextareaModule, ConfirmDialogModule,
  ],
  providers: [ConfirmationService],
  templateUrl: './create-ticket.component.html',
  styleUrl: './create-ticket.component.scss',
})
export class CreateTicketComponent {
  private readonly fb = inject(FormBuilder);
  private readonly clientTicketService = inject(ClientTicketService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly router = inject(Router);

  readonly submitting = signal(false);
  readonly files = signal<File[]>([]);

  readonly categories: CategoryOption[] = [
    { label: 'Sin conexión', value: 'SIN_CONEXION' },
    { label: 'Velocidad lenta', value: 'VELOCIDAD_LENTA' },
    { label: 'Problemas con el router', value: 'PROBLEMAS_CON_EL_ROUTER' },
    { label: 'Instalación técnica', value: 'INSTALACION_TECNICA' },
    { label: 'Cambio de plan', value: 'CAMBIO_DE_PLAN' },
    { label: 'Facturación y pagos', value: 'FACTURACION_Y_PAGOS' },
    { label: 'Problemas de telefonía', value: 'PROBLEMAS_DE_TELEFONIA' },
    { label: 'Mantenimientos', value: 'MANTENIMIENTOS' },
  ];

  readonly priorities = [
    { label: 'Baja', value: 'LOW' },
    { label: 'Media', value: 'MEDIUM' },
    { label: 'Alta', value: 'HIGH' },
    { label: 'Crítica', value: 'CRITICAL' },
  ];

  form = this.fb.group({
    title: ['', [Validators.required, Validators.maxLength(200)]],
    category: ['', Validators.required],
    priority: ['MEDIUM', Validators.required],
    description: [''],
  });

  onSelectFiles(files: FileList | null): void {
    if (!files) return;
    const validFiles = Array.from(files).filter((f) => {
      const allowed = ['image/jpeg','image/png','image/gif','image/webp'];
      return allowed.includes(f.type) && f.size <= 10 * 1024 * 1024;
    });
    this.files.update((prev) => [...prev, ...validFiles]);
  }

  onRemoveFile(index: number): void {
    this.files.update((prev) => prev.filter((_, i) => i !== index));
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    this.submitting.set(true);
    const { title, description, priority, category } = this.form.value;

    this.clientTicketService.createTicket({
      title: title!,
      description: description ?? '',
      priority: priority!,
      category: category!,
    }).subscribe({
      next: async (ticket) => {
        let fileSuccessCount = 0;
        let fileErrorCount = 0;

        if (this.files().length > 0) {
          for (const file of this.files()) {
            try {
              await lastValueFrom(this.clientTicketService.addAttachment(ticket.id, file));
              fileSuccessCount++;
            } catch {
              fileErrorCount++;
            }
          }
        }

        if (fileErrorCount > 0) {
          this.messageService.add({
            severity: 'warn',
            summary: 'Archivos no adjuntados',
            detail: `${fileErrorCount} archivo(s) no se pudieron subir. Puedes agregarlos después desde el detalle del ticket.`,
          });
        }

        this.submitting.set(false);
        let msg = `Ticket #${ticket.id} creado con éxito.`;
        if (fileSuccessCount > 0) {
          msg += ` Se adjuntó ${fileSuccessCount} archivo(s).`;
        }
        this.confirmationService.confirm({
          header: 'Ticket Creado',
          message: msg,
          acceptVisible: false,
          rejectLabel: 'Ver Ticket',
          reject: () => this.router.navigate(['/client/tickets', ticket.id]),
        });
      },
      error: (err: any) => {
        this.submitting.set(false);
        const msg = err.error?.message || err.message || '';
        if (/tickets abiertos/i.test(msg)) {
          this.confirmationService.confirm({
            header: 'Límite alcanzado',
            message: msg,
            acceptVisible: false,
            rejectLabel: 'Entendido',
          });
        } else {
          this.confirmationService.confirm({
            header: 'Error',
            message: 'No pudimos crear tu ticket. Inténtalo de nuevo más tarde.',
            acceptVisible: false,
            rejectLabel: 'Entendido',
          });
        }
      },
    });
  }

  onCancel(): void {
    this.router.navigate(['/client/my-tickets']);
  }
}
