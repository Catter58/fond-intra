import { apiClient as api } from '../client'
import type { FAQCategory, FAQCategoryWithItems, FAQItem } from '@/types'

export const faqApi = {
  getCategories: async (): Promise<FAQCategory[]> => {
    const response = await api.get('/faq/categories/')
    return response.data
  },

  getCategoriesWithItems: async (): Promise<FAQCategoryWithItems[]> => {
    const response = await api.get('/faq/categories/with_items/')
    return response.data
  },

  getItems: async (categoryId?: number): Promise<FAQItem[]> => {
    const params = categoryId ? `?category=${categoryId}` : ''
    const response = await api.get(`/faq/items/${params}`)
    return response.data
  },

  getItem: async (id: number): Promise<FAQItem> => {
    const response = await api.get(`/faq/items/${id}/`)
    return response.data
  },

  search: async (query: string): Promise<FAQItem[]> => {
    const response = await api.get(`/faq/items/search/?q=${encodeURIComponent(query)}`)
    return response.data
  },

  // Admin methods
  createCategory: async (data: Partial<FAQCategory>): Promise<FAQCategory> => {
    const response = await api.post('/faq/categories/', data)
    return response.data
  },

  updateCategory: async (id: number, data: Partial<FAQCategory>): Promise<FAQCategory> => {
    const response = await api.patch(`/faq/categories/${id}/`, data)
    return response.data
  },

  deleteCategory: async (id: number): Promise<void> => {
    await api.delete(`/faq/categories/${id}/`)
  },

  createItem: async (data: Partial<FAQItem>): Promise<FAQItem> => {
    const response = await api.post('/faq/items/', data)
    return response.data
  },

  updateItem: async (id: number, data: Partial<FAQItem>): Promise<FAQItem> => {
    const response = await api.patch(`/faq/items/${id}/`, data)
    return response.data
  },

  deleteItem: async (id: number): Promise<void> => {
    await api.delete(`/faq/items/${id}/`)
  },
}
