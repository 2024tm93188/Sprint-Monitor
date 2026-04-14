import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
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
    <div class="login-container">
      <mat-card class="login-card">
        <mat-card-header>
          <div class="header-content">
            <mat-icon class="logo-icon">speed</mat-icon>
            <mat-card-title>Sprint Monitor</mat-card-title>
            <mat-card-subtitle>Sign in to continue</mat-card-subtitle>
          </div>
        </mat-card-header>

        <mat-card-content>
          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Email</mat-label>
              <input matInput type="email" formControlName="email" placeholder="Enter your email">
              <mat-icon matPrefix>email</mat-icon>
              <mat-error *ngIf="loginForm.get('email')?.hasError('required')">
                Email is required
              </mat-error>
              <mat-error *ngIf="loginForm.get('email')?.hasError('email')">
                Please enter a valid email
              </mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Password</mat-label>
              <input matInput [type]="hidePassword() ? 'password' : 'text'" 
                     formControlName="password" placeholder="Enter your password">
              <mat-icon matPrefix>lock</mat-icon>
              <button mat-icon-button matSuffix type="button" 
                      (click)="hidePassword.set(!hidePassword())">
                <mat-icon>{{hidePassword() ? 'visibility_off' : 'visibility'}}</mat-icon>
              </button>
              <mat-error *ngIf="loginForm.get('password')?.hasError('required')">
                Password is required
              </mat-error>
            </mat-form-field>

            <div class="helper-row">
              <a routerLink="/forgot-password" class="forgot-link">Forgot password?</a>
            </div>

            <div class="error-message" *ngIf="errorMessage()">
              <mat-icon>error</mat-icon>
              <span>{{ errorMessage() }}</span>
            </div>

            <button mat-raised-button color="primary" type="submit" 
                    class="full-width submit-btn"
                    [disabled]="loginForm.invalid || isLoading()">
              <mat-spinner diameter="20" *ngIf="isLoading()"></mat-spinner>
              <span *ngIf="!isLoading()">Sign In</span>
            </button>
          </form>
        </mat-card-content>

        <mat-card-actions>
          <p class="register-link">
            Don't have an account? 
            <a routerLink="/register">Register here</a>
          </p>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .login-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #1976d2 0%, #42a5f5 100%);
      padding: 20px;
    }

    .login-card {
      width: 100%;
      max-width: 400px;
      padding: 20px;
    }

    .header-content {
      text-align: center;
      width: 100%;
      margin-bottom: 20px;
    }

    .logo-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #1976d2;
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

    .helper-row {
      display: flex;
      justify-content: flex-end;
      margin: 0 0 10px;
    }

    .forgot-link {
      color: #1976d2;
      text-decoration: none;
      font-weight: 500;
      font-size: 13px;
    }

    .forgot-link:hover {
      text-decoration: underline;
    }

    .submit-btn {
      margin-top: 20px;
      height: 48px;
      font-size: 16px;
    }

    .error-message {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #f44336;
      background: #ffebee;
      padding: 12px;
      border-radius: 4px;
      margin-bottom: 10px;
    }

    .error-message mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    mat-card-actions {
      text-align: center;
      padding-top: 10px;
    }

    .register-link {
      margin: 0;
      color: rgba(0, 0, 0, 0.6);
    }

    .register-link a {
      color: #1976d2;
      text-decoration: none;
      font-weight: 500;
    }

    .register-link a:hover {
      text-decoration: underline;
    }

    mat-spinner {
      display: inline-block;
    }
  `]
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private snackBar = inject(MatSnackBar);

  loginForm: FormGroup;
  hidePassword = signal(true);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const { email, password } = this.loginForm.value;

    this.authService.login({ email, password }).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        if (response.success) {
          this.snackBar.open('Login successful!', 'Close', { duration: 3000 });
          
          // Navigate to return URL or home
          const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
          this.router.navigateByUrl(returnUrl);
        } else {
          this.errorMessage.set(response.message);
        }
      },
      error: (error) => {
        this.isLoading.set(false);
        this.errorMessage.set(error.message || 'Login failed. Please try again.');
      }
    });
  }
}
