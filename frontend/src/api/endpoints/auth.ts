import apiClient from '../client'
import type { AuthTokens, LoginCredentials } from '@/types'

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthTokens> => {
    const response = await apiClient.post<AuthTokens>('/auth/login/', credentials)
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
}
