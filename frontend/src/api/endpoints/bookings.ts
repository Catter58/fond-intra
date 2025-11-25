import api from '../client'
import type {
  ResourceType,
  Resource,
  BookingListItem,
  Booking,
  ResourceAvailability,
  CalendarBooking,
  BookingStats,
} from '../../types'

interface CreateBookingData {
  title: string
  description?: string
  resource: number
  starts_at: string
  ends_at: string
  is_recurring?: boolean
  recurrence_rule?: {
    type: 'weekly' | 'daily'
    days?: number[]
    until?: string
  }
}

interface UpdateBookingData {
  title?: string
  description?: string
  starts_at?: string
  ends_at?: string
}

interface CreateResourceData {
  name: string
  description?: string
  location?: string
  capacity?: number
  amenities?: string[]
  type: number
  is_active?: boolean
  work_hours_start?: string
  work_hours_end?: string
  min_booking_duration?: number
  max_booking_duration?: number
}

// Helper type for paginated response
interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export const bookingsApi = {
  // Resource Types
  getResourceTypes: async () => {
    const { data } = await api.get<PaginatedResponse<ResourceType> | ResourceType[]>('/resource-types/')
    // Handle paginated response
    return Array.isArray(data) ? data : data.results
  },

  getResourceType: async (id: number) => {
    const { data } = await api.get<ResourceType>(`/resource-types/${id}/`)
    return data
  },

  // Resources
  getResources: async (params?: {
    type?: number
    type_slug?: string
    min_capacity?: number
    search?: string
  }) => {
    const { data } = await api.get<PaginatedResponse<Resource> | Resource[]>('/resources/', { params })
    // Handle paginated response
    return Array.isArray(data) ? data : data.results
  },

  getResource: async (id: number) => {
    const { data } = await api.get<Resource>(`/resources/${id}/`)
    return data
  },

  getResourceAvailability: async (id: number, date?: string) => {
    const params = date ? { date } : undefined
    const { data } = await api.get<ResourceAvailability>(`/resources/${id}/availability/`, { params })
    return data
  },

  createResource: async (resourceData: CreateResourceData) => {
    const { data } = await api.post<Resource>('/resources/', resourceData)
    return data
  },

  updateResource: async (id: number, resourceData: Partial<CreateResourceData>) => {
    const { data } = await api.patch<Resource>(`/resources/${id}/`, resourceData)
    return data
  },

  deleteResource: async (id: number) => {
    await api.delete(`/resources/${id}/`)
  },

  // Resource Types CRUD
  createResourceType: async (typeData: { name: string; slug?: string; description?: string; icon?: string }) => {
    const { data } = await api.post<ResourceType>('/resource-types/', typeData)
    return data
  },

  updateResourceType: async (id: number, typeData: Partial<{ name: string; slug?: string; description?: string; icon?: string }>) => {
    const { data } = await api.patch<ResourceType>(`/resource-types/${id}/`, typeData)
    return data
  },

  deleteResourceType: async (id: number) => {
    await api.delete(`/resource-types/${id}/`)
  },

  // Bookings
  getBookings: async (params?: {
    resource?: number
    resource_type?: number
    status?: string
    date_from?: string
    date_to?: string
    upcoming?: boolean
  }) => {
    const { data } = await api.get<PaginatedResponse<BookingListItem> | BookingListItem[]>('/bookings/', { params })
    // Handle paginated response
    return Array.isArray(data) ? data : data.results
  },

  getBooking: async (id: number) => {
    const { data } = await api.get<Booking>(`/bookings/${id}/`)
    return data
  },

  createBooking: async (bookingData: CreateBookingData) => {
    const { data } = await api.post<Booking>('/bookings/', bookingData)
    return data
  },

  updateBooking: async (id: number, bookingData: UpdateBookingData) => {
    const { data } = await api.patch<Booking>(`/bookings/${id}/`, bookingData)
    return data
  },

  deleteBooking: async (id: number) => {
    await api.delete(`/bookings/${id}/`)
  },

  // My Bookings
  getMyBookings: async (upcoming?: boolean) => {
    const params = upcoming !== undefined ? { upcoming: upcoming.toString() } : undefined
    const { data } = await api.get<PaginatedResponse<BookingListItem> | BookingListItem[]>('/bookings/my/', { params })
    // Handle paginated response
    return Array.isArray(data) ? data : data.results
  },

  // Calendar
  getCalendarBookings: async (start: string, end: string, params?: {
    resource?: number
    resource_type?: number
  }) => {
    const { data } = await api.get<PaginatedResponse<CalendarBooking> | CalendarBooking[]>('/bookings/calendar/', {
      params: { start, end, ...params }
    })
    // Handle paginated response
    return Array.isArray(data) ? data : data.results
  },

  // Actions
  cancelBooking: async (id: number) => {
    const { data } = await api.post<Booking>(`/bookings/${id}/cancel/`)
    return data
  },

  extendBooking: async (id: number, ends_at: string) => {
    const { data } = await api.post<Booking>(`/bookings/${id}/extend/`, { ends_at })
    return data
  },

  // Stats
  getStats: async () => {
    const { data } = await api.get<BookingStats>('/bookings/stats/')
    return data
  },
}
