import apiClient from '../client'
import type { AuthTokens, LoginCredentials, TwoFactorStatus, TwoFactorSetup, UserSession } from '@/types'

// Login response can be either tokens or 2FA required
export interface LoginResponse {
  requires_2fa?: boolean
  user_id?: number
  message?: string
  access?: string
  refresh?: string
  user?: {
    id: number
    email: string
    first_name: string
    last_name: string
    patronymic?: string
    full_name: string
    avatar: string | null
    is_superuser: boolean
  }
}

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/auth/login/', credentials)
    return response.data
  },

  logout: async (refreshToken: string): Promise<void> => {
    await apiClient.post('/auth/logout/', { refresh: refreshToken })
  },

  refreshToken: async (refreshToken: string): Promise<{ access: string }> => {
    const response = await apiClient.post('/auth/token/refresh/', {
      refresh: refreshToken,
    })
    return response.data
  },

  changePassword: async (data: {
    old_password: string
    new_password: string
    new_password_confirm: string
  }): Promise<void> => {
    await apiClient.post('/auth/password/change/', data)
  },

  requestPasswordReset: async (email: string): Promise<void> => {
    await apiClient.post('/auth/password/reset/', { email })
  },

  resetPasswordConfirm: async (data: {
    uid: string
    token: string
    new_password: string
  }): Promise<void> => {
    await apiClient.post('/auth/password/reset/confirm/', data)
  },

  // Two-Factor Authentication
  get2FAStatus: async (): Promise<TwoFactorStatus> => {
    const response = await apiClient.get<TwoFactorStatus>('/auth/2fa/status/')
    return response.data
  },

  setup2FA: async (): Promise<TwoFactorSetup> => {
    const response = await apiClient.post<TwoFactorSetup>('/auth/2fa/setup/')
    return response.data
  },

  verify2FA: async (token: string): Promise<{ detail: string; backup_codes: string[] }> => {
    const response = await apiClient.post('/auth/2fa/verify/', { token })
    return response.data
  },

  disable2FA: async (password: string): Promise<{ detail: string }> => {
    const response = await apiClient.post('/auth/2fa/disable/', { password })
    return response.data
  },

  regenerateBackupCodes: async (): Promise<{ backup_codes: string[] }> => {
    const response = await apiClient.post('/auth/2fa/backup-codes/')
    return response.data
  },

  authenticate2FA: async (data: { user_id: number; token: string; is_backup_code?: boolean }): Promise<AuthTokens> => {
    const response = await apiClient.post<AuthTokens>('/auth/2fa/authenticate/', data)
    return response.data
  },

  // User Sessions
  getSessions: async (): Promise<UserSession[]> => {
    const response = await apiClient.get<UserSession[]>('/auth/sessions/')
    return response.data
  },

  terminateSession: async (sessionId: number): Promise<{ detail: string; logged_out: boolean }> => {
    const response = await apiClient.post(`/auth/sessions/${sessionId}/terminate/`)
    return response.data
  },

  terminateAllSessions: async (): Promise<{ detail: string }> => {
    const response = await apiClient.post('/auth/sessions/terminate-all/')
    return response.data
  },

  // Site settings
  getSiteSettings: async (): Promise<{ registration_enabled: boolean }> => {
    const response = await apiClient.get('/settings/')
    return response.data
  },

  // Registration
  register: async (data: {
    email: string
    password: string
    first_name: string
    last_name: string
    patronymic?: string
  }): Promise<{ detail: string; user: { id: number; email: string; full_name: string } }> => {
    const response = await apiClient.post('/register/', data)
    return response.data
  },
}
