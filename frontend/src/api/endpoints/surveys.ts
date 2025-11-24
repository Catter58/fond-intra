import api from '../client'
import type {
  Survey,
  SurveyDetail,
  SurveyResponse,
  SurveyResults,
  SurveyStatusOption,
  QuestionTypeOption,
  TargetTypeOption,
  PaginatedResponse,
} from '@/types'

interface SurveyListParams {
  page?: number
  page_size?: number
  status?: string
}

interface SurveyCreateData {
  title: string
  description?: string
  is_anonymous?: boolean
  is_required?: boolean
  status?: string
  starts_at?: string | null
  ends_at?: string | null
  target_type?: string
  target_departments?: number[]
  target_roles?: number[]
  questions?: {
    text: string
    type: string
    is_required?: boolean
    scale_min?: number
    scale_max?: number
    scale_min_label?: string
    scale_max_label?: string
    options?: { text: string }[]
  }[]
}

export const surveysApi = {
  // Get list of available surveys
  getList: async (params?: SurveyListParams): Promise<PaginatedResponse<Survey>> => {
    const response = await api.get('/surveys/', { params })
    return response.data
  },

  // Get surveys created by current user
  getMy: async (params?: SurveyListParams): Promise<PaginatedResponse<Survey>> => {
    const response = await api.get('/surveys/my/', { params })
    return response.data
  },

  // Get survey details with questions
  getById: async (id: number): Promise<SurveyDetail> => {
    const response = await api.get(`/surveys/${id}/`)
    return response.data
  },

  // Create new survey
  create: async (data: SurveyCreateData): Promise<SurveyDetail> => {
    const response = await api.post('/surveys/', data)
    return response.data
  },

  // Update survey
  update: async (id: number, data: Partial<SurveyCreateData>): Promise<SurveyDetail> => {
    const response = await api.patch(`/surveys/${id}/`, data)
    return response.data
  },

  // Delete survey
  delete: async (id: number): Promise<void> => {
    await api.delete(`/surveys/${id}/`)
  },

  // Submit response to survey
  respond: async (surveyId: number, data: SurveyResponse): Promise<void> => {
    await api.post(`/surveys/${surveyId}/respond/`, data)
  },

  // Get survey results
  getResults: async (surveyId: number): Promise<SurveyResults> => {
    const response = await api.get(`/surveys/${surveyId}/results/`)
    return response.data
  },

  // Publish survey
  publish: async (surveyId: number): Promise<void> => {
    await api.post(`/surveys/${surveyId}/publish/`)
  },

  // Close survey
  close: async (surveyId: number): Promise<void> => {
    await api.post(`/surveys/${surveyId}/close/`)
  },

  // Get available statuses
  getStatuses: async (): Promise<SurveyStatusOption[]> => {
    const response = await api.get('/surveys/statuses/')
    return response.data
  },

  // Get question types
  getQuestionTypes: async (): Promise<QuestionTypeOption[]> => {
    const response = await api.get('/surveys/question-types/')
    return response.data
  },

  // Get target types
  getTargetTypes: async (): Promise<TargetTypeOption[]> => {
    const response = await api.get('/surveys/target-types/')
    return response.data
  },
}
