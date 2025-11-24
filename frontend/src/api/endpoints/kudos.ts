import { apiClient } from '../client'
import type { Kudos, KudosCategoryOption, KudosStats, PaginatedResponse, KudosCategory } from '@/types'

export interface KudosFilters {
  category?: KudosCategory
  department?: number
  page?: number
  page_size?: number
}

export interface CreateKudosData {
  recipient: number
  category: KudosCategory
  message: string
  is_public?: boolean
}

export const kudosApi = {
  getList: async (filters?: KudosFilters): Promise<PaginatedResponse<Kudos>> => {
    const response = await apiClient.get<PaginatedResponse<Kudos>>('/kudos/', { params: filters })
    return response.data
  },

  getReceived: async (filters?: KudosFilters): Promise<PaginatedResponse<Kudos>> => {
    const response = await apiClient.get<PaginatedResponse<Kudos>>('/kudos/received/', { params: filters })
    return response.data
  },

  getSent: async (filters?: KudosFilters): Promise<PaginatedResponse<Kudos>> => {
    const response = await apiClient.get<PaginatedResponse<Kudos>>('/kudos/sent/', { params: filters })
    return response.data
  },

  getUserKudos: async (userId: number): Promise<Kudos[]> => {
    const response = await apiClient.get<Kudos[]>(`/kudos/user/${userId}/`)
    return response.data
  },

  getCategories: async (): Promise<KudosCategoryOption[]> => {
    const response = await apiClient.get<KudosCategoryOption[]>('/kudos/categories/')
    return response.data
  },

  getStats: async (): Promise<KudosStats> => {
    const response = await apiClient.get<KudosStats>('/kudos/stats/')
    return response.data
  },

  create: async (data: CreateKudosData): Promise<Kudos> => {
    const response = await apiClient.post<Kudos>('/kudos/', data)
    return response.data
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/kudos/${id}/`)
  },
}
