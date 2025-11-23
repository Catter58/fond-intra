import apiClient from '../client'
import type { News, Comment, Reaction, PaginatedResponse } from '@/types'

export const newsApi = {
  getList: async (params: { page?: number; page_size?: number } = {}): Promise<PaginatedResponse<News>> => {
    const response = await apiClient.get<PaginatedResponse<News>>('/news/', { params })
    return response.data
  },

  getById: async (id: number): Promise<News> => {
    const response = await apiClient.get<News>(`/news/${id}/`)
    return response.data
  },

  create: async (data: FormData): Promise<News> => {
    const response = await apiClient.post<News>('/news/', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },

  update: async (id: number, data: FormData): Promise<News> => {
    const response = await apiClient.patch<News>(`/news/${id}/`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/news/${id}/`)
  },

  // Comments
  getComments: async (newsId: number): Promise<Comment[]> => {
    const response = await apiClient.get<Comment[]>(`/news/${newsId}/comments/`)
    return response.data
  },

  addComment: async (newsId: number, data: { content: string; parent?: number }): Promise<Comment> => {
    const response = await apiClient.post<Comment>(`/news/${newsId}/comments/`, data)
    return response.data
  },

  toggleReaction: async (newsId: number, data: { type: string }): Promise<Reaction> => {
    const response = await apiClient.post<Reaction>(`/news/${newsId}/reactions/`, data)
    return response.data
  },

  deleteComment: async (newsId: number, commentId: number): Promise<void> => {
    await apiClient.delete(`/news/${newsId}/comments/${commentId}/`)
  },

  // Reactions
  getReactions: async (newsId: number): Promise<Reaction[]> => {
    const response = await apiClient.get<Reaction[]>(`/news/${newsId}/reactions/`)
    return response.data
  },

  addReaction: async (newsId: number, type: string): Promise<Reaction> => {
    const response = await apiClient.post<Reaction>(`/news/${newsId}/reactions/`, { type })
    return response.data
  },

  removeReaction: async (newsId: number): Promise<void> => {
    await apiClient.delete(`/news/${newsId}/reactions/`)
  },
}
