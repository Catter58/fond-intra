import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ThemePreference = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'g10' | 'g100'

interface ThemeState {
  preference: ThemePreference
  resolvedTheme: ResolvedTheme

  // Actions
  setPreference: (preference: ThemePreference) => void
}

// Get system preference
const getSystemTheme = (): ResolvedTheme => {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'g100' : 'g10'
  }
  return 'g10'
}

// Resolve theme based on preference
const resolveTheme = (preference: ThemePreference): ResolvedTheme => {
  if (preference === 'system') {
    return getSystemTheme()
  }
  return preference === 'dark' ? 'g100' : 'g10'
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      preference: 'system',
      resolvedTheme: resolveTheme('system'),

      setPreference: (preference) => {
        set({
          preference,
          resolvedTheme: resolveTheme(preference),
        })
      },
    }),
    {
      name: 'theme-storage',
      partialize: (state) => ({
        preference: state.preference,
      }),
      onRehydrateStorage: () => (state) => {
        // Re-resolve theme on hydration
        if (state) {
          state.resolvedTheme = resolveTheme(state.preference)
        }
      },
    }
  )
)

// Listen for system theme changes
if (typeof window !== 'undefined' && window.matchMedia) {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  mediaQuery.addEventListener('change', () => {
    const { preference, setPreference } = useThemeStore.getState()
    if (preference === 'system') {
      // Re-trigger to update resolved theme
      setPreference('system')
    }
  })
}
