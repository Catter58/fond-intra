import apiClient from '../client'
import type { Notification, NotificationSettings, PaginatedResponse } from '@/types'

export const notificationsApi = {
  getList: async (params: { page?: number; page_size?: number; is_read?: boolean } = {}): Promise<PaginatedResponse<Notification>> => {
    const response = await apiClient.get<PaginatedResponse<Notification>>('/notifications/', { params })
    return response.data
  },

  getUnreadCount: async (): Promise<number> => {
    const response = await apiClient.get<{ count: number }>('/notifications/unread-count/')
    return response.data.count
  },

  markAsRead: async (id: number): Promise<void> => {
    await apiClient.post(`/notifications/${id}/read/`)
  },

  markAllAsRead: async (): Promise<void> => {
    await apiClient.post('/notifications/read-all/')
  },

  getSettings: async (): Promise<NotificationSettings> => {
    const response = await apiClient.get<NotificationSettings>('/notifications/settings/')
    return response.data
  },

  updateSettings: async (data: Partial<NotificationSettings>): Promise<NotificationSettings> => {
    const response = await apiClient.patch<NotificationSettings>('/notifications/settings/', data)
    return response.data
  },
}
