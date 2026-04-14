import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { AbstractControl, ReactiveFormsModule, ValidationErrors, ValidatorFn, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { AuthService } from '../../../core/services/auth.service';

const passwordMatchValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const newPassword = control.get('newPassword')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;

  return newPassword && confirmPassword && newPassword !== confirmPassword
    ? { passwordMismatch: true }
    : null;
};

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  template: `
    <div class="auth-container">
      <mat-card class="auth-card">
        <mat-card-header>
          <div class="header-content">
            <mat-icon class="logo-icon">password</mat-icon>
            <mat-card-title>Reset Password</mat-card-title>
            <mat-card-subtitle>Set a new password for your account</mat-card-subtitle>
          </div>
        </mat-card-header>

        <mat-card-content>
          <form [formGroup]="resetForm" (ngSubmit)="onSubmit()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Email</mat-label>
              <input matInput type="email" formControlName="email" placeholder="Enter your email">
              <mat-icon matPrefix>email</mat-icon>
              <mat-error *ngIf="resetForm.get('email')?.hasError('required')">
                Email is required
              </mat-error>
              <mat-error *ngIf="resetForm.get('email')?.hasError('email')">
                Please enter a valid email
              </mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Reset Token</mat-label>
              <input matInput formControlName="token" placeholder="Enter the 6-digit token">
              <mat-icon matPrefix>pin</mat-icon>
              <mat-error *ngIf="resetForm.get('token')?.hasError('required')">
                Reset token is required
              </mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>New Password</mat-label>
              <input matInput [type]="hidePassword() ? 'password' : 'text'" formControlName="newPassword" placeholder="Enter a new password">
              <mat-icon matPrefix>lock</mat-icon>
              <button mat-icon-button matSuffix type="button" (click)="hidePassword.set(!hidePassword())">
                <mat-icon>{{ hidePassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
              <mat-error *ngIf="resetForm.get('newPassword')?.hasError('required')">
                New password is required
              </mat-error>
              <mat-error *ngIf="resetForm.get('newPassword')?.hasError('minlength')">
                Password must be at least 6 characters
              </mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Confirm Password</mat-label>
              <input matInput [type]="hideConfirmPassword() ? 'password' : 'text'" formControlName="confirmPassword" placeholder="Confirm your password">
              <mat-icon matPrefix>lock_outline</mat-icon>
              <button mat-icon-button matSuffix type="button" (click)="hideConfirmPassword.set(!hideConfirmPassword())">
                <mat-icon>{{ hideConfirmPassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
              <mat-error *ngIf="resetForm.get('confirmPassword')?.hasError('required')">
                Please confirm your password
              </mat-error>
              <mat-error *ngIf="resetForm.hasError('passwordMismatch')">
                Passwords do not match
              </mat-error>
            </mat-form-field>

            <div class="error-message" *ngIf="errorMessage()">
              <mat-icon>error</mat-icon>
              <span>{{ errorMessage() }}</span>
            </div>

            <button mat-raised-button color="primary" type="submit" class="full-width submit-btn" [disabled]="resetForm.invalid || isLoading()">
              <mat-spinner diameter="20" *ngIf="isLoading()"></mat-spinner>
              <span *ngIf="!isLoading()">Reset Password</span>
            </button>
          </form>
        </mat-card-content>

        <mat-card-actions>
          <p class="footer-link">
            Return to <a routerLink="/login">sign in</a>
          </p>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .auth-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 55%, #2563eb 100%);
      padding: 24px;
    }

    .auth-card {
      width: 100%;
      max-width: 460px;
      padding: 24px;
    }

    .header-content {
      text-align: center;
      width: 100%;
      margin-bottom: 18px;
    }

    .logo-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #1d4ed8;
      margin-bottom: 10px;
    }

    mat-card-title {
      font-size: 24px;
      margin-bottom: 5px;
    }

    mat-card-subtitle {
      color: rgba(0, 0, 0, 0.6);
    }

    .full-width {
      width: 100%;
    }

    mat-form-field {
      margin-bottom: 10px;
    }

    .error-message {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #b91c1c;
      background: #fef2f2;
      padding: 12px;
      border-radius: 8px;
      margin-bottom: 12px;
    }

    .error-message mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .submit-btn {
      margin-top: 10px;
      height: 48px;
      font-size: 16px;
    }

    mat-card-actions {
      text-align: center;
      padding-top: 10px;
    }

    .footer-link {
      margin: 0;
      color: rgba(0, 0, 0, 0.6);
    }

    .footer-link a {
      color: #1d4ed8;
      text-decoration: none;
      font-weight: 500;
    }

    .footer-link a:hover {
      text-decoration: underline;
    }

    mat-spinner {
      display: inline-block;
    }
  `]
})
export class ResetPasswordComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  resetForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    token: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', Validators.required]
  }, { validators: passwordMatchValidator });

  hidePassword = signal(true);
  hideConfirmPassword = signal(true);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    const email = this.route.snapshot.queryParamMap.get('email');
    const token = this.route.snapshot.queryParamMap.get('token');

    if (email) {
      this.resetForm.patchValue({ email });
    }

    if (token) {
      this.resetForm.patchValue({ token });
    }
  }

  onSubmit(): void {
    if (this.resetForm.invalid) {
      return;
    }

    const { email, token, newPassword } = this.resetForm.value;

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.authService.resetPassword({
      email: email ?? '',
      token: token ?? '',
      newPassword: newPassword ?? ''
    }).subscribe({
      next: response => {
        this.isLoading.set(false);

        if (response.success) {
          this.snackBar.open(response.message, 'Close', { duration: 4000 });
          this.router.navigate(['/login']);
        } else {
          this.errorMessage.set(response.message);
        }
      },
      error: error => {
        this.isLoading.set(false);
        this.errorMessage.set(error.message || 'Unable to reset password. Please try again.');
      }
    });
  }
}