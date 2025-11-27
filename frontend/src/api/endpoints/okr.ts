import api from '../client'
import type {
  OKRPeriod,
  Objective,
  KeyResult,
  CheckIn,
  ObjectiveTree,
  OKRLevelOption,
  OKRStatusOption,
  OKRStats
} from '../../types'

// Periods
export const getPeriods = async (): Promise<OKRPeriod[]> => {
  const response = await api.get('/okr/periods/')
  // Handle paginated response
  return response.data.results || response.data
}

export const getActivePeriod = async (): Promise<OKRPeriod | null> => {
  try {
    const response = await api.get('/okr/periods/active/')
    return response.data
  } catch {
    return null
  }
}

export const createPeriod = async (data: Omit<OKRPeriod, 'id' | 'created_at'>): Promise<OKRPeriod> => {
  const response = await api.post('/okr/periods/', data)
  return response.data
}

export const updatePeriod = async (id: number, data: Partial<OKRPeriod>): Promise<OKRPeriod> => {
  const response = await api.patch(`/okr/periods/${id}/`, data)
  return response.data
}

export const deletePeriod = async (id: number): Promise<void> => {
  await api.delete(`/okr/periods/${id}/`)
}

// Objectives
export interface ObjectivesParams {
  period?: number
  level?: string
  status?: string
  owner?: number
  department?: number
}

export const getObjectives = async (params?: ObjectivesParams): Promise<Objective[]> => {
  const response = await api.get('/okr/objectives/', { params })
  return response.data
}

export const getObjective = async (id: number): Promise<Objective> => {
  const response = await api.get(`/okr/objectives/${id}/`)
  return response.data
}

export const getMyObjectives = async (params?: ObjectivesParams): Promise<Objective[]> => {
  const response = await api.get('/okr/objectives/my/', { params })
  return response.data
}

export const getTeamObjectives = async (params?: ObjectivesParams): Promise<Objective[]> => {
  const response = await api.get('/okr/objectives/team/', { params })
  return response.data
}

export const getCompanyObjectives = async (params?: ObjectivesParams): Promise<Objective[]> => {
  const response = await api.get('/okr/objectives/company/', { params })
  return response.data
}

export const getObjectivesTree = async (periodId?: number): Promise<ObjectiveTree[]> => {
  const response = await api.get('/okr/objectives/tree/', {
    params: periodId ? { period: periodId } : {}
  })
  return response.data
}

export interface CreateObjectiveData {
  title: string
  description?: string
  level: 'company' | 'department' | 'personal'
  status?: 'draft' | 'active' | 'completed' | 'cancelled'
  period: number
  department?: number | null
  parent?: number | null
  key_results?: {
    title: string
    type: 'quantitative' | 'qualitative'
    target_value?: number | null
    current_value?: number
    start_value?: number
    unit?: string
    order?: number
  }[]
}

export const createObjective = async (data: CreateObjectiveData): Promise<Objective> => {
  const response = await api.post('/okr/objectives/', data)
  return response.data
}

export const updateObjective = async (id: number, data: Partial<CreateObjectiveData>): Promise<Objective> => {
  const response = await api.patch(`/okr/objectives/${id}/`, data)
  return response.data
}

export const deleteObjective = async (id: number): Promise<void> => {
  await api.delete(`/okr/objectives/${id}/`)
}

// Key Results
export interface CreateKeyResultData {
  title: string
  type: 'quantitative' | 'qualitative'
  target_value?: number | null
  current_value?: number
  start_value?: number
  unit?: string
  order?: number
}

export const addKeyResult = async (objectiveId: number, data: CreateKeyResultData): Promise<KeyResult> => {
  const response = await api.post(`/okr/objectives/${objectiveId}/key-results/`, data)
  return response.data
}

export const updateKeyResult = async (id: number, data: Partial<CreateKeyResultData & { progress?: number }>): Promise<KeyResult> => {
  const response = await api.patch(`/okr/key-results/${id}/`, data)
  return response.data
}

export const deleteKeyResult = async (id: number): Promise<void> => {
  await api.delete(`/okr/key-results/${id}/`)
}

// Check-ins
export interface CreateCheckInData {
  new_value: number
  comment?: string
}

export const createCheckIn = async (keyResultId: number, data: CreateCheckInData): Promise<CheckIn> => {
  const response = await api.post(`/okr/key-results/${keyResultId}/check-in/`, data)
  return response.data
}

export const getKeyResultHistory = async (keyResultId: number): Promise<CheckIn[]> => {
  const response = await api.get(`/okr/key-results/${keyResultId}/history/`)
  return response.data
}

export const getObjectiveCheckIns = async (objectiveId: number): Promise<CheckIn[]> => {
  const response = await api.get(`/okr/objectives/${objectiveId}/check-ins/`)
  return response.data
}

// Meta
export const getLevels = async (): Promise<OKRLevelOption[]> => {
  const response = await api.get('/okr/levels/')
  return response.data
}

export const getStatuses = async (): Promise<OKRStatusOption[]> => {
  const response = await api.get('/okr/statuses/')
  return response.data
}

// Stats
export const getOKRStats = async (periodId?: number): Promise<OKRStats> => {
  const response = await api.get('/okr/stats/', {
    params: periodId ? { period: periodId } : {}
  })
  return response.data
}
