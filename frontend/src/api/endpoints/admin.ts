import apiClient from '../client'

export interface SiteSettings {
  registration_enabled: boolean
  default_role: number | null
  default_role_name: string | null
}

export interface Role {
  id: number
  name: string
  description: string
  is_system: boolean
  is_admin: boolean
}

export const adminApi = {
  // Site settings
  getSettings: async (): Promise<SiteSettings> => {
    const response = await apiClient.get<SiteSettings>('/admin/settings/')
    return response.data
  },

  updateSettings: async (data: Partial<SiteSettings>): Promise<SiteSettings> => {
    const response = await apiClient.patch<SiteSettings>('/admin/settings/update/', data)
    return response.data
  },

  // Roles
  getRoles: async (): Promise<Role[]> => {
    const response = await apiClient.get<Role[]>('/admin/roles/')
    return response.data
  },
}
