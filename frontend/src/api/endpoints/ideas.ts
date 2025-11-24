import { apiClient as api } from '../client'
import type {
  Idea,
  IdeaComment,
  IdeaCategoryOption,
  IdeaStatusOption,
  PaginatedResponse,
} from '@/types'

interface IdeasFilters {
  page?: number
  category?: string
  status?: string
  search?: string
  ordering?: string
}

interface CreateIdeaData {
  title: string
  description: string
  category: string
}

interface UpdateIdeaStatusData {
  status: string
  admin_comment?: string
}

export const ideasApi = {
  getList: async (filters: IdeasFilters = {}): Promise<PaginatedResponse<Idea>> => {
    const params = new URLSearchParams()
    if (filters.page) params.append('page', filters.page.toString())
    if (filters.category) params.append('category', filters.category)
    if (filters.status) params.append('status', filters.status)
    if (filters.search) params.append('search', filters.search)
    if (filters.ordering) params.append('ordering', filters.ordering)

    const response = await api.get(`/ideas/?${params.toString()}`)
    return response.data
  },

  getMy: async (): Promise<Idea[]> => {
    const response = await api.get('/ideas/my/')
    return response.data
  },

  getById: async (id: number): Promise<Idea> => {
    const response = await api.get(`/ideas/${id}/`)
    return response.data
  },

  create: async (data: CreateIdeaData): Promise<Idea> => {
    const response = await api.post('/ideas/', data)
    return response.data
  },

  update: async (id: number, data: Partial<CreateIdeaData>): Promise<Idea> => {
    const response = await api.patch(`/ideas/${id}/`, data)
    return response.data
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/ideas/${id}/`)
  },

  vote: async (id: number, isUpvote: boolean): Promise<Idea> => {
    const response = await api.post(`/ideas/${id}/vote/`, { is_upvote: isUpvote })
    return response.data
  },

  unvote: async (id: number): Promise<Idea> => {
    const response = await api.delete(`/ideas/${id}/unvote/`)
    return response.data
  },

  updateStatus: async (id: number, data: UpdateIdeaStatusData): Promise<Idea> => {
    const response = await api.patch(`/ideas/${id}/update_status/`, data)
    return response.data
  },

  getComments: async (id: number): Promise<IdeaComment[]> => {
    const response = await api.get(`/ideas/${id}/comments/`)
    return response.data
  },

  addComment: async (id: number, text: string): Promise<IdeaComment> => {
    const response = await api.post(`/ideas/${id}/comments/`, { text })
    return response.data
  },

  getCategories: async (): Promise<IdeaCategoryOption[]> => {
    const response = await api.get('/ideas/categories/')
    return response.data
  },

  getStatuses: async (): Promise<IdeaStatusOption[]> => {
    const response = await api.get('/ideas/statuses/')
    return response.data
  },
}
