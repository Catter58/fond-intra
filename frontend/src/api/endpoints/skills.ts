import apiClient from '../client'
import type { SkillCategory, Skill, UserSkill } from '@/types'

interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface AddSkillData {
  skill: number
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert'
}

export interface UpdateSkillData {
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert'
}

export const skillsApi = {
  // Categories
  getCategories: async (): Promise<SkillCategory[]> => {
    const response = await apiClient.get<PaginatedResponse<SkillCategory>>('/skills/categories/')
    return response.data.results
  },

  // Skills
  getSkills: async (categoryId?: number): Promise<Skill[]> => {
    const response = await apiClient.get<PaginatedResponse<Skill>>('/skills/', {
      params: categoryId ? { category: categoryId } : undefined,
    })
    return response.data.results
  },

  getSkillById: async (id: number): Promise<Skill> => {
    const response = await apiClient.get<Skill>(`/skills/${id}/`)
    return response.data
  },

  // My skills
  getMySkills: async (): Promise<UserSkill[]> => {
    const response = await apiClient.get<UserSkill[]>('/skills/me/')
    return response.data
  },

  addMySkill: async (data: AddSkillData): Promise<UserSkill> => {
    const response = await apiClient.post<UserSkill>('/skills/me/', data)
    return response.data
  },

  updateMySkill: async (skillId: number, data: UpdateSkillData): Promise<UserSkill> => {
    const response = await apiClient.patch<UserSkill>(`/skills/me/${skillId}/`, data)
    return response.data
  },

  removeMySkill: async (skillId: number): Promise<void> => {
    await apiClient.delete(`/skills/me/${skillId}/`)
  },

  // User skills (for viewing other users)
  getUserSkills: async (userId: number): Promise<UserSkill[]> => {
    const response = await apiClient.get<UserSkill[]>(`/users/${userId}/skills/`)
    return response.data
  },

  // Admin methods
  createSkill: async (data: { name: string; category: number; description?: string }): Promise<Skill> => {
    const response = await apiClient.post<Skill>('/skills/', data)
    return response.data
  },

  updateSkill: async (id: number, data: { name?: string; category?: number; description?: string }): Promise<Skill> => {
    const response = await apiClient.patch<Skill>(`/skills/${id}/`, data)
    return response.data
  },

  deleteSkill: async (id: number): Promise<void> => {
    await apiClient.delete(`/skills/${id}/`)
  },

  createCategory: async (data: { name: string; description?: string; order?: number }): Promise<SkillCategory> => {
    const response = await apiClient.post<SkillCategory>('/skills/categories/', data)
    return response.data
  },

  updateCategory: async (id: number, data: { name?: string; description?: string; order?: number }): Promise<SkillCategory> => {
    const response = await apiClient.patch<SkillCategory>(`/skills/categories/${id}/`, data)
    return response.data
  },

  deleteCategory: async (id: number): Promise<void> => {
    await apiClient.delete(`/skills/categories/${id}/`)
  },
}
