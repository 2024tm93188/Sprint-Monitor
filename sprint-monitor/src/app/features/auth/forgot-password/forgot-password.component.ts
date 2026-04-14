import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
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
            <mat-icon class="logo-icon">lock_reset</mat-icon>
            <mat-card-title>Forgot Password</mat-card-title>
            <mat-card-subtitle>Request a one-time reset token</mat-card-subtitle>
          </div>
        </mat-card-header>

        <mat-card-content>
          <p class="instructions">
            Enter your account email. The app will generate a temporary reset token and show it here,
            because this academic build does not send email.
          </p>

          <form [formGroup]="forgotForm" (ngSubmit)="onSubmit()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Email</mat-label>
              <input matInput type="email" formControlName="email" placeholder="Enter your email">
              <mat-icon matPrefix>email</mat-icon>
              <mat-error *ngIf="forgotForm.get('email')?.hasError('required')">
                Email is required
              </mat-error>
              <mat-error *ngIf="forgotForm.get('email')?.hasError('email')">
                Please enter a valid email
              </mat-error>
            </mat-form-field>

            <div class="error-message" *ngIf="errorMessage()">
              <mat-icon>error</mat-icon>
              <span>{{ errorMessage() }}</span>
            </div>

            <div class="success-panel" *ngIf="resetToken()">
              <div class="success-header">
                <mat-icon>verified</mat-icon>
                <span>Reset token generated</span>
              </div>
              <div class="token-value">{{ resetToken() }}</div>
              <p class="token-help">Use this token on the reset password screen together with your email.</p>
            </div>

            <button mat-raised-button color="primary" type="submit" class="full-width submit-btn" [disabled]="forgotForm.invalid || isLoading()">
              <mat-spinner diameter="20" *ngIf="isLoading()"></mat-spinner>
              <span *ngIf="!isLoading()">Send Reset Token</span>
            </button>

            <button
              mat-stroked-button
              type="button"
              class="full-width secondary-btn"
              *ngIf="resetToken()"
              (click)="goToResetPassword()">
              Continue to Reset Password
            </button>
          </form>
        </mat-card-content>

        <mat-card-actions>
          <p class="footer-link">
            Remembered it? <a routerLink="/login">Back to sign in</a>
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

    .instructions {
      margin: 0 0 18px;
      color: rgba(0, 0, 0, 0.7);
      line-height: 1.5;
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

    .error-message mat-icon,
    .success-header mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .success-panel {
      background: linear-gradient(180deg, #eff6ff 0%, #ffffff 100%);
      border: 1px solid #bfdbfe;
      border-radius: 12px;
      padding: 14px;
      margin-bottom: 12px;
    }

    .success-header {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #1d4ed8;
      font-weight: 600;
      margin-bottom: 10px;
    }

    .token-value {
      font-size: 24px;
      letter-spacing: 0.25em;
      text-align: center;
      padding: 12px;
      border-radius: 10px;
      background: #eff6ff;
      color: #0f172a;
      font-weight: 700;
      margin-bottom: 8px;
    }

    .token-help {
      margin: 0;
      color: rgba(0, 0, 0, 0.65);
      font-size: 13px;
    }

    .submit-btn,
    .secondary-btn {
      margin-top: 10px;
      height: 48px;
      font-size: 16px;
    }

    .secondary-btn {
      border-color: #1d4ed8;
      color: #1d4ed8;
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
export class ForgotPasswordComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  forgotForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });

  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  resetToken = signal<string | null>(null);

  onSubmit(): void {
    if (this.forgotForm.invalid) {
      return;
    }

    const email = this.forgotForm.value.email ?? '';
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.resetToken.set(null);

    this.authService.forgotPassword({ email }).subscribe({
      next: response => {
        this.isLoading.set(false);

        if (response.success && response.resetToken) {
          this.resetToken.set(response.resetToken);
          this.snackBar.open('Reset token generated.', 'Close', { duration: 3000 });
        } else if (response.success) {
          this.snackBar.open('Reset token generated.', 'Close', { duration: 3000 });
        } else {
          this.errorMessage.set(response.message);
        }
      },
      error: error => {
        this.isLoading.set(false);
        this.errorMessage.set(error.message || 'Unable to generate reset token. Please try again.');
      }
    });
  }

  goToResetPassword(): void {
    const email = this.forgotForm.value.email ?? '';
    const token = this.resetToken();

    if (!token) {
      return;
    }

    this.router.navigate(['/reset-password'], {
      queryParams: { email, token }
    });
  }
}