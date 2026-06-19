export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export type UserRole = 'CLIENT' | 'AGENT' | 'ADMIN' | 'SERVICE';

export interface AuthResponse {
  token: string;
  type: string;
  userId: number;
  username: string;
  email: string;
  role: string;
}

export interface UserResponse {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

export const API_AUTH = '/api/auth';
export const API_TICKETS = '/api/tickets';
export const API_NOTIFICATIONS = '/api/notifications';

export interface AdminRegisterRequest {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: 'AGENT' | 'ADMIN';
}
