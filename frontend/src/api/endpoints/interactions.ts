import apiClient from '../client'
import type { UserBasic } from '@/types'

// Types
export interface Bookmark {
  id: number
  content_type: 'user' | 'news'
  object_id: number
  created_at: string
}

export interface BookmarkedUser extends UserBasic {
  bookmark_id: number
  bookmarked_at: string
}

export interface BookmarkedNews {
  id: number
  title: string
  excerpt: string
  cover_image: string | null
  published_at: string
  author: {
    id: number
    full_name: string
    avatar: string | null
  } | null
  bookmark_id: number
  bookmarked_at: string
}

export interface ViewHistoryItem {
  id: number
  viewed_user: UserBasic
  viewed_at: string
}

export interface ProfileStats {
  profile_views: number
  achievements_count: number
  kudos_received: number
  kudos_sent: number
  skills_count: number
  endorsements_received: number
  news_count: number
  comments_count: number
}

export const interactionsApi = {
  // Bookmarks
  getBookmarks: async (): Promise<Bookmark[]> => {
    const response = await apiClient.get<Bookmark[]>('/bookmarks/')
    return response.data
  },

  toggleBookmark: async (contentType: 'user' | 'news', objectId: number): Promise<{ bookmarked: boolean; id?: number }> => {
    const response = await apiClient.post('/bookmarks/', {
      content_type: contentType,
      object_id: objectId,
    })
    return response.data
  },

  deleteBookmark: async (id: number): Promise<void> => {
    await apiClient.delete(`/bookmarks/${id}/`)
  },

  getBookmarkedUsers: async (): Promise<BookmarkedUser[]> => {
    const response = await apiClient.get<BookmarkedUser[]>('/bookmarks/users/')
    return response.data
  },

  getBookmarkedNews: async (): Promise<BookmarkedNews[]> => {
    const response = await apiClient.get<BookmarkedNews[]>('/bookmarks/news/')
    return response.data
  },

  checkBookmarks: async (contentType: 'user' | 'news', ids: number[]): Promise<Record<string, boolean>> => {
    const response = await apiClient.get<Record<string, boolean>>('/bookmarks/check/', {
      params: { type: contentType, ids: ids.join(',') },
    })
    return response.data
  },

  // View History
  getViewHistory: async (): Promise<ViewHistoryItem[]> => {
    const response = await apiClient.get<ViewHistoryItem[]>('/view-history/')
    return response.data
  },

  recordProfileView: async (userId: number): Promise<{ recorded: boolean }> => {
    const response = await apiClient.post('/view-history/record/', { user_id: userId })
    return response.data
  },

  clearViewHistory: async (): Promise<{ cleared: number }> => {
    const response = await apiClient.delete('/view-history/clear/')
    return response.data
  },

  // Profile Stats
  getProfileStats: async (userId?: number): Promise<ProfileStats> => {
    const url = userId ? `/profile-stats/${userId}/` : '/profile-stats/'
    const response = await apiClient.get<ProfileStats>(url)
    return response.data
  },
}
