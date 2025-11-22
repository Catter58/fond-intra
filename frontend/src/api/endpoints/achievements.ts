import apiClient from '../client'
import type { Achievement, AchievementAward, PaginatedResponse } from '@/types'

export const achievementsApi = {
  getTypes: async (): Promise<Achievement[]> => {
    const response = await apiClient.get<Achievement[]>('/achievements/types/')
    return response.data
  },

  getFeed: async (params?: { page?: number; page_size?: number }): Promise<PaginatedResponse<AchievementAward>> => {
    const response = await apiClient.get<PaginatedResponse<AchievementAward>>('/achievements/feed/', { params })
    return response.data
  },

  getMy: async (): Promise<AchievementAward[]> => {
    const response = await apiClient.get<AchievementAward[]>('/achievements/my/')
    return response.data
  },

  getUserAchievements: async (userId: number): Promise<AchievementAward[]> => {
    const response = await apiClient.get<AchievementAward[]>(`/achievements/user/${userId}/`)
    return response.data
  },

  award: async (data: {
    achievement: number
    recipient: number
    comment: string
  }): Promise<AchievementAward> => {
    const response = await apiClient.post<AchievementAward>('/achievements/award/', data)
    return response.data
  },

  getStats: async (): Promise<{
    total_awards: number
    this_month: number
    top_achievements: { id: number; name: string; count: number }[]
    top_recipients: { recipient__id: number; recipient__first_name: string; recipient__last_name: string; count: number }[]
  }> => {
    const response = await apiClient.get('/achievements/stats/')
    return response.data
  },

  // Admin methods for achievement types
  createType: async (data: {
    name: string
    description: string
    icon: string
    category: string
  }): Promise<Achievement> => {
    const response = await apiClient.post<Achievement>('/admin/achievements/types/', data)
    return response.data
  },

  updateType: async (id: number, data: {
    name?: string
    description?: string
    icon?: string
    category?: string
  }): Promise<Achievement> => {
    const response = await apiClient.patch<Achievement>(`/admin/achievements/types/${id}/`, data)
    return response.data
  },

  deleteType: async (id: number): Promise<void> => {
    await apiClient.delete(`/admin/achievements/types/${id}/`)
  },
}
