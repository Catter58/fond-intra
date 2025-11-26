import apiClient from '../client'
import type { User, UserBasic, PaginatedResponse } from '@/types'

export const usersApi = {
  getMe: async (): Promise<User> => {
    const response = await apiClient.get<User>('/users/me/')
    return response.data
  },

  updateMe: async (data: Partial<User>): Promise<User> => {
    const response = await apiClient.patch<User>('/users/me/', data)
    return response.data
  },

  uploadAvatar: async (file: File): Promise<{ avatar: string }> => {
    const formData = new FormData()
    formData.append('avatar', file)
    const response = await apiClient.post('/users/me/avatar/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },

  deleteAvatar: async (): Promise<void> => {
    await apiClient.delete('/users/me/avatar/')
  },

  getList: async (params?: {
    search?: string
    department?: number
    position?: number
    skill?: number
    skill_level?: string
    status?: string
    role?: number
    hired_after?: string
    hired_before?: string
    page?: number
    page_size?: number
    ordering?: string
  }): Promise<PaginatedResponse<UserBasic>> => {
    const response = await apiClient.get<PaginatedResponse<UserBasic>>('/users/', { params })
    return response.data
  },

  getById: async (id: number): Promise<User> => {
    const response = await apiClient.get<User>(`/users/${id}/`)
    return response.data
  },

  search: async (query: string): Promise<UserBasic[]> => {
    const response = await apiClient.get<UserBasic[]>('/users/search/', {
      params: { q: query },
    })
    return response.data
  },

  getBirthdays: async (days?: number): Promise<UserBasic[]> => {
    const response = await apiClient.get<UserBasic[]>('/users/birthdays/', {
      params: days ? { days } : undefined,
    })
    return response.data
  },

  getDashboardStats: async (): Promise<{
    users_count: number
    achievements_count: number
    news_count: number
  }> => {
    const response = await apiClient.get('/users/dashboard-stats/')
    return response.data
  },

  // Admin methods
  adminGetById: async (id: number): Promise<User> => {
    const response = await apiClient.get<User>(`/users/admin/${id}/`)
    return response.data
  },

  adminGetList: async (params?: {
    search?: string
    department?: number
    position?: number
    page?: number
    page_size?: number
    is_archived?: boolean
  }): Promise<PaginatedResponse<UserBasic>> => {
    const response = await apiClient.get<PaginatedResponse<UserBasic>>('/users/admin/', { params })
    return response.data
  },

  adminCreate: async (data: any): Promise<User> => {
    const response = await apiClient.post<User>('/users/admin/', data)
    return response.data
  },

  adminUpdate: async (id: number, data: any): Promise<User> => {
    const response = await apiClient.put<User>(`/users/admin/${id}/`, data)
    return response.data
  },

  archive: async (id: number): Promise<void> => {
    await apiClient.post(`/users/admin/${id}/archive/`)
  },

  restore: async (id: number): Promise<void> => {
    await apiClient.post(`/users/admin/${id}/restore/`)
  },

  bulkArchive: async (ids: number[]): Promise<{ count: number }> => {
    const response = await apiClient.post('/users/admin/bulk-archive/', { ids })
    return response.data
  },

  bulkRestore: async (ids: number[]): Promise<{ count: number }> => {
    const response = await apiClient.post('/users/admin/bulk-restore/', { ids })
    return response.data
  },

  // Onboarding
  completeOnboarding: async (): Promise<{ has_completed_onboarding: boolean }> => {
    const response = await apiClient.post('/users/me/complete-onboarding/')
    return response.data
  },

  resetOnboarding: async (): Promise<{ has_completed_onboarding: boolean }> => {
    const response = await apiClient.post('/users/me/reset-onboarding/')
    return response.data
  },

  // Dashboard settings
  getDashboardSettings: async (): Promise<{ dashboard_settings: DashboardSettings }> => {
    const response = await apiClient.get('/users/me/dashboard-settings/')
    return response.data
  },

  updateDashboardSettings: async (settings: Partial<DashboardSettings>): Promise<{ dashboard_settings: DashboardSettings }> => {
    const response = await apiClient.patch('/users/me/dashboard-settings/', {
      dashboard_settings: settings,
    })
    return response.data
  },
}

// Types
export interface DashboardSettings {
  widgetOrder?: string[]
  hiddenWidgets?: string[]
}
