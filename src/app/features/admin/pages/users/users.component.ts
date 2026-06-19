import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TabsModule } from 'primeng/tabs';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { SkeletonModule } from 'primeng/skeleton';
import { ConfirmationService, MessageService } from 'primeng/api';
import { AuthService } from '../../../../core/services/auth.service';
import type { UserResponse } from '../../../../core/models/auth';

@Component({
  selector: 'app-admin-users',
  imports: [
    FormsModule, ButtonModule, TableModule, TagModule,
    TabsModule, DialogModule, InputTextModule, SelectModule, ConfirmDialogModule, SkeletonModule,
  ],
  providers: [ConfirmationService],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss',
})
export class UsersComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);

  readonly agents = signal<UserResponse[]>([]);
  readonly clients = signal<UserResponse[]>([]);
  readonly loadingAgents = signal(true);
  readonly loadingClients = signal(true);

  readonly showCreateDialog = signal(false);
  readonly creating = signal(false);

  readonly formData = signal({
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
  });

  ngOnInit(): void {
    this.loadAgents();
    this.loadClients();
  }

  private loadAgents(): void {
    this.loadingAgents.set(true);
    this.authService.getUsersByRole('AGENT').subscribe({
      next: (users) => { this.agents.set(users); this.loadingAgents.set(false); },
      error: () => this.loadingAgents.set(false),
    });
  }

  private loadClients(): void {
    this.loadingClients.set(true);
    this.authService.getUsersByRole('CLIENT').subscribe({
      next: (users) => { this.clients.set(users); this.loadingClients.set(false); },
      error: () => this.loadingClients.set(false),
    });
  }

  openCreateDialog(): void {
    this.formData.set({ username: '', email: '', password: '', firstName: '', lastName: '', phone: '' });
    this.showCreateDialog.set(true);
  }

  confirmCreate(): void {
    const fd = this.formData();
    if (!fd.username || !fd.email || !fd.password || !fd.firstName || !fd.lastName) {
      this.confirmationService.confirm({
        header: 'Campos incompletos',
        message: 'Todos los campos marcados con * son obligatorios.',
        acceptVisible: false,
        rejectLabel: 'Entendido',
      });
      return;
    }

    this.creating.set(true);
    this.authService.adminRegister({
      username: fd.username,
      email: fd.email,
      password: fd.password,
      firstName: fd.firstName,
      lastName: fd.lastName,
      phone: fd.phone || undefined,
      role: 'AGENT',
    }).subscribe({
      next: () => {
        this.creating.set(false);
        this.showCreateDialog.set(false);
        this.messageService.add({
          severity: 'success',
          summary: 'Agente creado',
          detail: `El agente ${fd.firstName} ${fd.lastName} fue creado exitosamente.`,
          life: 4000,
        });
        this.loadAgents();
      },
      error: (err: any) => {
        this.creating.set(false);
        const msg = err.error?.message || err.message || '';
        this.confirmationService.confirm({
          header: 'Error al crear',
          message: msg || 'No pudimos crear el agente. Inténtalo de nuevo.',
          acceptVisible: false,
          rejectLabel: 'Entendido',
        });
      },
    });
  }

  getRoleLabel(role: string): string {
    const map: Record<string, string> = { CLIENT: 'Cliente', AGENT: 'Agente', ADMIN: 'Administrador' };
    return map[role] ?? role;
  }
}
