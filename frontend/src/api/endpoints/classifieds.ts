import { apiClient as api } from '../client'
import type { ClassifiedCategory, Classified, PaginatedResponse } from '@/types'

interface ClassifiedsFilters {
  page?: number
  category?: number
  status?: string
  search?: string
  ordering?: string
  my?: boolean
}

interface CreateClassifiedData {
  title: string
  description: string
  category: number
  contact_info?: string
  price?: number | null
}

export const classifiedsApi = {
  getCategories: async (): Promise<ClassifiedCategory[]> => {
    const response = await api.get('/classifieds/categories/')
    return response.data
  },

  getList: async (filters: ClassifiedsFilters = {}): Promise<PaginatedResponse<Classified>> => {
    const params = new URLSearchParams()
    if (filters.page) params.append('page', filters.page.toString())
    if (filters.category) params.append('category', filters.category.toString())
    if (filters.status) params.append('status', filters.status)
    if (filters.search) params.append('search', filters.search)
    if (filters.ordering) params.append('ordering', filters.ordering)
    if (filters.my) params.append('my', 'true')

    const response = await api.get(`/classifieds/?${params.toString()}`)
    return response.data
  },

  getMy: async (): Promise<Classified[]> => {
    const response = await api.get('/classifieds/my/')
    return response.data
  },

  getById: async (id: number): Promise<Classified> => {
    const response = await api.get(`/classifieds/${id}/`)
    return response.data
  },

  create: async (data: CreateClassifiedData): Promise<Classified> => {
    const response = await api.post('/classifieds/', data)
    return response.data
  },

  update: async (id: number, data: Partial<CreateClassifiedData>): Promise<Classified> => {
    const response = await api.patch(`/classifieds/${id}/`, data)
    return response.data
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/classifieds/${id}/`)
  },

  close: async (id: number): Promise<Classified> => {
    const response = await api.post(`/classifieds/${id}/close/`)
    return response.data
  },

  extend: async (id: number, days?: number): Promise<Classified> => {
    const response = await api.post(`/classifieds/${id}/extend/`, { days: days || 30 })
    return response.data
  },

  uploadImage: async (id: number, file: File): Promise<{ id: number; image: string }> => {
    const formData = new FormData()
    formData.append('image', file)
    const response = await api.post(`/classifieds/${id}/upload_image/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },

  deleteImage: async (classifiedId: number, imageId: number): Promise<void> => {
    await api.delete(`/classifieds/${classifiedId}/images/${imageId}/`)
  },
}
