import { apiClient } from '../client'

export interface SearchResult {
  id: number
  type: 'user' | 'news' | 'department' | 'achievement' | 'skill'
  title: string
  subtitle: string | null
  description: string | null
  avatar: string | null
  url: string
}

export interface SearchResponse {
  query: string
  results: {
    users?: SearchResult[]
    news?: SearchResult[]
    departments?: SearchResult[]
    achievements?: SearchResult[]
    skills?: SearchResult[]
  }
  total: number
}

export const searchApi = {
  /**
   * Global search across all entities
   */
  globalSearch: async (query: string, type?: string, limit?: number): Promise<SearchResponse> => {
    const params = new URLSearchParams({ q: query })
    if (type) params.append('type', type)
    if (limit) params.append('limit', limit.toString())

    const response = await apiClient.get<SearchResponse>(`/search/?${params.toString()}`)
    return response.data
  },
}
