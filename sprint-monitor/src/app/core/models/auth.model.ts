/**
 * User model representing authenticated user
 */
export interface User {
  userId: number;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: UserRole;
  teamId?: number;
  teamName?: string;
  createdAt: Date;
  lastLoginAt?: Date;
}

/**
 * User roles in the system
 */
export type UserRole = 'Developer' | 'ScrumMaster' | 'TeamLead' | 'Admin';

/**
 * Login request payload
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Registration request payload
 */
export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: UserRole;
  teamId?: number;
}

/**
 * Authentication response from API
 */
export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  refreshToken?: string;
  tokenExpiry?: Date;
  user?: User;
}

/**
 * Refresh token request payload
 */
export interface RefreshTokenRequest {
  token: string;
  refreshToken: string;
}

/**
 * Change password request payload
 */
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

/**
 * Update profile request payload
 */
export interface UpdateProfileRequest {
  firstName: string;
  lastName: string;
  teamId?: number;
}

/**
 * Decoded JWT token payload
 */
export interface JwtPayload {
  nameid: string;
  email: string;
  given_name: string;
  family_name: string;
  role: string;
  TeamId: string;
  exp: number;
  iss: string;
  aud: string;
}
