import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthStore } from '../../../../core/stores/auth.store';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  private readonly authStore = inject(AuthStore);

  readonly loginForm = new FormGroup({
    username: new FormControl('', [Validators.required, Validators.minLength(3)]),
    password: new FormControl('', [Validators.required, Validators.minLength(6)])
  });

  showPassword = false;
  loading = signal(false);
  shaking = signal(false);

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.shaking.set(true);
      setTimeout(() => this.shaking.set(false), 500);
      return;
    }
    this.loading.set(true);
    this.authStore.login(this.loginForm.value as any).subscribe({
      error: () => {
        this.loading.set(false);
        this.shaking.set(true);
        setTimeout(() => this.shaking.set(false), 500);
      }
    });
  }
}
