import { describe, it, expect, beforeEach } from 'vitest'
import { useAuthStore } from './authStore'
import type { UserBasic } from '@/types'

const mockUser: UserBasic = {
  id: 1,
  email: 'test@example.com',
  first_name: 'Иван',
  last_name: 'Петров',
  patronymic: 'Сергеевич',
  avatar: null,
  full_name: 'Петров Иван Сергеевич',
}

describe('authStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useAuthStore.setState({
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
    })
  })

  describe('initial state', () => {
    it('should have null tokens initially', () => {
      const state = useAuthStore.getState()
      expect(state.accessToken).toBeNull()
      expect(state.refreshToken).toBeNull()
    })

    it('should not be authenticated initially', () => {
      const state = useAuthStore.getState()
      expect(state.isAuthenticated).toBe(false)
    })

    it('should have null user initially', () => {
      const state = useAuthStore.getState()
      expect(state.user).toBeNull()
    })
  })

  describe('setTokens', () => {
    it('should set access and refresh tokens', () => {
      useAuthStore.getState().setTokens('access-token', 'refresh-token')

      const state = useAuthStore.getState()
      expect(state.accessToken).toBe('access-token')
      expect(state.refreshToken).toBe('refresh-token')
    })

    it('should set isAuthenticated to true', () => {
      useAuthStore.getState().setTokens('access', 'refresh')

      const state = useAuthStore.getState()
      expect(state.isAuthenticated).toBe(true)
    })
  })

  describe('setUser', () => {
    it('should set user data', () => {
      useAuthStore.getState().setUser(mockUser)

      const state = useAuthStore.getState()
      expect(state.user).toEqual(mockUser)
    })

    it('should update user data correctly', () => {
      useAuthStore.getState().setUser(mockUser)

      const state = useAuthStore.getState()
      expect(state.user?.email).toBe('test@example.com')
      expect(state.user?.first_name).toBe('Иван')
    })
  })

  describe('logout', () => {
    it('should clear all auth data', () => {
      // First set some data
      useAuthStore.getState().setTokens('access', 'refresh')
      useAuthStore.getState().setUser(mockUser)

      // Then logout
      useAuthStore.getState().logout()

      const state = useAuthStore.getState()
      expect(state.accessToken).toBeNull()
      expect(state.refreshToken).toBeNull()
      expect(state.user).toBeNull()
      expect(state.isAuthenticated).toBe(false)
    })
  })

  describe('full auth flow', () => {
    it('should handle complete login/logout flow', () => {
      const store = useAuthStore.getState()

      // Login
      store.setTokens('access-token-123', 'refresh-token-456')
      store.setUser(mockUser)

      let state = useAuthStore.getState()
      expect(state.isAuthenticated).toBe(true)
      expect(state.user?.email).toBe('test@example.com')
      expect(state.accessToken).toBe('access-token-123')

      // Logout
      useAuthStore.getState().logout()

      state = useAuthStore.getState()
      expect(state.isAuthenticated).toBe(false)
      expect(state.user).toBeNull()
      expect(state.accessToken).toBeNull()
    })
  })
})
