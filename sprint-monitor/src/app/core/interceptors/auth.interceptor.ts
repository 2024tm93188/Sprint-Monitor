import { Injectable, inject } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse,
  HttpHandlerFn
} from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, filter, take, switchMap, finalize } from 'rxjs/operators';

import { AuthService } from '../services/auth.service';

/**
 * Functional HTTP interceptor for adding JWT token to requests
 */
export function authInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> {
  const authService = inject(AuthService);
  
  // Skip auth header for auth endpoints (except logout and validate)
  const isAuthEndpoint = req.url.includes('/api/auth/') && 
    !req.url.includes('/logout') && 
    !req.url.includes('/validate') &&
    !req.url.includes('/me') &&
    !req.url.includes('/change-password') &&
    !req.url.includes('/profile');
  
  if (isAuthEndpoint) {
    return next(req);
  }

  const token = authService.getToken();
  
  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        // Token expired, try to refresh
        return handleUnauthorized(authService, req, next);
      }
      return throwError(() => error);
    })
  );
}

// Track if we're currently refreshing
let isRefreshing = false;
let refreshTokenSubject = new BehaviorSubject<string | null>(null);

function handleUnauthorized(
  authService: AuthService,
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> {
  if (!isRefreshing) {
    isRefreshing = true;
    refreshTokenSubject.next(null);

    return authService.refreshToken().pipe(
      switchMap(response => {
        isRefreshing = false;
        if (response.success && response.token) {
          refreshTokenSubject.next(response.token);
          // Retry the original request with new token
          return next(addTokenToRequest(req, response.token));
        }
        authService.logout();
        return throwError(() => new Error('Session expired'));
      }),
      catchError(error => {
        isRefreshing = false;
        authService.logout();
        return throwError(() => error);
      }),
      finalize(() => {
        isRefreshing = false;
      })
    );
  } else {
    // Wait for the token refresh to complete
    return refreshTokenSubject.pipe(
      filter(token => token !== null),
      take(1),
      switchMap(token => next(addTokenToRequest(req, token!)))
    );
  }
}

function addTokenToRequest(req: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  return req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });
}
