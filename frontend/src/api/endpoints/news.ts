import apiClient from '../client'
import type { News, NewsTag, Comment, Reaction, PaginatedResponse } from '@/types'

export interface NewsListParams {
  page?: number
  page_size?: number
  tag?: string
  tag_id?: number
  drafts?: boolean
  status?: 'draft' | 'scheduled' | 'published'
}

export const newsApi = {
  getList: async (params: NewsListParams = {}): Promise<PaginatedResponse<News>> => {
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

  // Publishing actions
  publish: async (id: number): Promise<{ detail: string; status: string }> => {
    const response = await apiClient.post<{ detail: string; status: string }>(`/news/${id}/publish/`)
    return response.data
  },

  unpublish: async (id: number): Promise<{ detail: string; status: string }> => {
    const response = await apiClient.post<{ detail: string; status: string }>(`/news/${id}/unpublish/`)
    return response.data
  },

  schedule: async (id: number, publishAt: string): Promise<{ detail: string; status: string; publish_at: string }> => {
    const response = await apiClient.post<{ detail: string; status: string; publish_at: string }>(
      `/news/${id}/schedule/`,
      { publish_at: publishAt }
    )
    return response.data
  },

  autosave: async (id: number, data: { title?: string; content?: object; tag_ids?: number[] }): Promise<{ detail: string; updated_at: string }> => {
    const response = await apiClient.patch<{ detail: string; updated_at: string }>(`/news/${id}/autosave/`, data)
    return response.data
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

  // Tags
  getTags: async (): Promise<NewsTag[]> => {
    const response = await apiClient.get<PaginatedResponse<NewsTag>>('/news/tags/')
    return response.data.results
  },

  createTag: async (data: { name: string; color?: string }): Promise<NewsTag> => {
    const response = await apiClient.post<NewsTag>('/news/tags/', data)
    return response.data
  },

  updateTag: async (id: number, data: { name?: string; color?: string }): Promise<NewsTag> => {
    const response = await apiClient.patch<NewsTag>(`/news/tags/${id}/`, data)
    return response.data
  },

  deleteTag: async (id: number): Promise<void> => {
    await apiClient.delete(`/news/tags/${id}/`)
  },
}
