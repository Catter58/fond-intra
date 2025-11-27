import { apiClient } from '../client'
import type { SkillsMatrix } from '@/types'

export interface Department {
  id: number
  name: string
  description?: string
  parent?: number | null
  head?: {
    id: number
    full_name: string
    avatar?: string
  } | null
  employees_count?: number
  children?: Department[]
}

export interface Position {
  id: number
  name: string
  description?: string
  department?: number | null
}

export const organizationApi = {
  getDepartments: async (): Promise<Department[]> => {
    const response = await apiClient.get<Department[]>('/organization/departments/')
    return response.data
  },

  getDepartment: async (id: number): Promise<Department> => {
    const response = await apiClient.get<Department>(`/organization/departments/${id}/`)
    return response.data
  },

  getPositions: async (): Promise<Position[]> => {
    const response = await apiClient.get<Position[]>('/organization/positions/')
    return response.data
  },

  getPosition: async (id: number): Promise<Position> => {
    const response = await apiClient.get<Position>(`/organization/positions/${id}/`)
    return response.data
  },

  getTree: async (): Promise<Department[]> => {
    const response = await apiClient.get<Department[]>('/organization/tree/')
    return response.data
  },

  getDepartmentSkillsMatrix: async (departmentId: number, categoryId?: number): Promise<SkillsMatrix> => {
    const params = categoryId ? { category: categoryId } : undefined
    const response = await apiClient.get<SkillsMatrix>(
      `/organization/departments/${departmentId}/skills-matrix/`,
      { params }
    )
    return response.data
  },
}
