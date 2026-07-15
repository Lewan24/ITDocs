import { http } from './http'
import type { OrganizationSummary } from './types'

export interface UserDto { id: string; email: string; displayName: string }
export interface AuthResponse {
  token: string
  expiresAt: string
  user: UserDto
  organizations: OrganizationSummary[]
}

export const authApi = {
  register: (email: string, password: string, displayName: string) =>
    http.post<AuthResponse>('/auth/register', { email, password, displayName }),
  login: (email: string, password: string) =>
    http.post<AuthResponse>('/auth/login', { email, password }),
  me: () => http.get<UserDto>('/auth/me'),
  updateProfile: (displayName: string) => http.put<void>('/auth/me', { displayName }),
  changePassword: (currentPassword: string, newPassword: string) =>
    http.post<void>('/auth/change-password', { currentPassword, newPassword }),
}