import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject, throwError, of } from 'rxjs';
import { tap, catchError, map, switchMap } from 'rxjs/operators';

import {
  User,
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  RefreshTokenRequest,
  ChangePasswordRequest,
  UpdateProfileRequest,
  JwtPayload
} from '../models/auth.model';
import { environment } from '../../../environments/environment';

const TOKEN_KEY = 'sprint_monitor_token';
const REFRESH_TOKEN_KEY = 'sprint_monitor_refresh_token';
const USER_KEY = 'sprint_monitor_user';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private readonly apiUrl = environment.apiUrl;

  // Reactive state using signals
  private currentUserSignal = signal<User | null>(this.loadUserFromStorage());
  private isAuthenticatedSignal = signal<boolean>(this.hasValidToken());
  private isLoadingSignal = signal<boolean>(false);

  // Public computed signals
  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly isAuthenticated = this.isAuthenticatedSignal.asReadonly();
  readonly isLoading = this.isLoadingSignal.asReadonly();

  readonly userRole = computed(() => this.currentUserSignal()?.role ?? null);
  readonly userName = computed(() => this.currentUserSignal()?.fullName ?? '');
  readonly userEmail = computed(() => this.currentUserSignal()?.email ?? '');

  constructor() {
    // Check token validity on startup
    this.validateStoredToken();
  }

  /**
   * Login with email and password
   */
  login(credentials: LoginRequest): Observable<AuthResponse> {
    this.isLoadingSignal.set(true);

    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap(response => {
        if (response.success && response.token && response.user) {
          this.storeAuthData(response.token, response.refreshToken!, response.user);
          this.currentUserSignal.set(response.user);
          this.isAuthenticatedSignal.set(true);
        }
      }),
      catchError(this.handleError),
      tap(() => this.isLoadingSignal.set(false))
    );
  }

  /**
   * Register new user account
   */
  register(userData: RegisterRequest): Observable<AuthResponse> {
    this.isLoadingSignal.set(true);

    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, userData).pipe(
      tap(response => {
        if (response.success && response.token && response.user) {
          this.storeAuthData(response.token, response.refreshToken!, response.user);
          this.currentUserSignal.set(response.user);
          this.isAuthenticatedSignal.set(true);
        }
      }),
      catchError(this.handleError),
      tap(() => this.isLoadingSignal.set(false))
    );
  }

  /**
   * Logout current user
   */
  logout(): void {
    this.http.post(`${this.apiUrl}/logout`, {}).pipe(
      catchError(() => of(null))
    ).subscribe(() => {
      this.clearAuthData();
      this.currentUserSignal.set(null);
      this.isAuthenticatedSignal.set(false);
      this.router.navigate(['/login']);
    });
  }

  /**
   * Refresh JWT token
   */
  refreshToken(): Observable<AuthResponse> {
    const token = this.getToken();
    const refreshToken = this.getRefreshToken();

    if (!token || !refreshToken) {
      return throwError(() => new Error('No tokens available'));
    }

    const request: RefreshTokenRequest = { token, refreshToken };

    return this.http.post<AuthResponse>(`${this.apiUrl}/refresh`, request).pipe(
      tap(response => {
        if (response.success && response.token && response.user) {
          this.storeAuthData(response.token, response.refreshToken!, response.user);
          this.currentUserSignal.set(response.user);
        }
      }),
      catchError(error => {
        this.logout();
        return throwError(() => error);
      })
    );
  }

  /**
   * Get current user from API
   */
  getCurrentUser(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/me`).pipe(
      tap(user => {
        this.currentUserSignal.set(user);
        localStorage.setItem(USER_KEY, JSON.stringify(user));
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Change current user's password
   */
  changePassword(request: ChangePasswordRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/change-password`, request).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Update user profile
   */
  updateProfile(request: UpdateProfileRequest): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/profile`, request).pipe(
      tap(user => {
        this.currentUserSignal.set(user);
        localStorage.setItem(USER_KEY, JSON.stringify(user));
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Validate current token
   */
  validateToken(): Observable<boolean> {
    return this.http.get<{ valid: boolean }>(`${this.apiUrl}/validate`).pipe(
      map(response => response.valid),
      catchError(() => of(false))
    );
  }

  /**
   * Get stored JWT token
   */
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  /**
   * Get stored refresh token
   */
  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  /**
   * Check if user has specific role
   */
  hasRole(role: string): boolean {
    return this.currentUserSignal()?.role === role;
  }

  /**
   * Check if user has any of the specified roles
   */
  hasAnyRole(roles: string[]): boolean {
    const userRole = this.currentUserSignal()?.role;
    return userRole ? roles.includes(userRole) : false;
  }

  /**
   * Check if token is expired
   */
  isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) return true;

    try {
      const payload = this.decodeToken(token);
      const expiry = payload.exp * 1000; // Convert to milliseconds
      return Date.now() >= expiry;
    } catch {
      return true;
    }
  }

  // Private methods

  private storeAuthData(token: string, refreshToken: string, user: User): void {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  private clearAuthData(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  private loadUserFromStorage(): User | null {
    const userJson = localStorage.getItem(USER_KEY);
    if (!userJson) return null;

    try {
      return JSON.parse(userJson) as User;
    } catch {
      return null;
    }
  }

  private hasValidToken(): boolean {
    const token = this.getToken();
    if (!token) return false;
    return !this.isTokenExpired();
  }

  private validateStoredToken(): void {
    if (this.hasValidToken()) {
      this.isAuthenticatedSignal.set(true);
    } else if (this.getRefreshToken()) {
      // Try to refresh the token
      this.refreshToken().subscribe({
        error: () => {
          this.clearAuthData();
          this.isAuthenticatedSignal.set(false);
        }
      });
    } else {
      this.clearAuthData();
      this.isAuthenticatedSignal.set(false);
    }
  }

  private decodeToken(token: string): JwtPayload {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  }

  private handleError = (error: HttpErrorResponse): Observable<never> => {
    let errorMessage = 'An error occurred';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = error.error.message;
    } else {
      // Server-side error
      errorMessage = error.error?.message || error.message || 'Server error';
    }

    return throwError(() => new Error(errorMessage));
  };
}
