import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthStore } from '../../../../core/stores/auth.store';
import { passwordMatchValidator } from '../../../../shared/utils/validators';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent {
  private readonly authStore = inject(AuthStore);

  readonly registerForm = new FormGroup({
    username: new FormControl('', [Validators.required, Validators.minLength(3)]),
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(6)]),
    confirmPassword: new FormControl('', [Validators.required]),
    firstName: new FormControl('', [Validators.required]),
    lastName: new FormControl('', [Validators.required]),
    phone: new FormControl('')
  }, { validators: passwordMatchValidator });

  showPassword = false;
  loading = signal(false);
  shaking = signal(false);

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.shaking.set(true);
      setTimeout(() => this.shaking.set(false), 500);
      return;
    }
    this.loading.set(true);
    const { confirmPassword, ...data } = this.registerForm.value as any;
    this.authStore.register(data).subscribe({
      error: () => {
        this.loading.set(false);
        this.shaking.set(true);
        setTimeout(() => this.shaking.set(false), 500);
      }
    });
  }
}
