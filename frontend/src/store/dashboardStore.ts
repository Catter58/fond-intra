import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { usersApi } from '@/api/endpoints/users'

// Default widget configuration
export const DEFAULT_WIDGETS = [
  { id: 'stats', name: 'Статистика', visible: true },
  { id: 'birthdays', name: 'Дни рождения', visible: true },
  { id: 'news', name: 'Последние новости', visible: true },
  { id: 'achievements', name: 'Последние достижения', visible: true },
  { id: 'leaderboard', name: 'Топ-3 лидера', visible: true },
  { id: 'kudos', name: 'Благодарности', visible: true },
  { id: 'okr', name: 'Мои цели (OKR)', visible: true },
  { id: 'bookings', name: 'Мои бронирования', visible: true },
  { id: 'ideas', name: 'Топ идеи', visible: true },
  { id: 'viewHistory', name: 'Недавно просмотренные', visible: true },
] as const

export type WidgetId = typeof DEFAULT_WIDGETS[number]['id']

export interface WidgetConfig {
  id: WidgetId
  name: string
  visible: boolean
}

interface DashboardState {
  widgetOrder: WidgetId[]
  hiddenWidgets: Set<WidgetId>
  isEditMode: boolean
  isLoading: boolean
  isSynced: boolean

  // Actions
  setEditMode: (enabled: boolean) => void
  toggleWidgetVisibility: (widgetId: WidgetId) => void
  reorderWidgets: (newOrder: WidgetId[]) => void
  resetToDefault: () => void
  loadFromServer: () => Promise<void>
  saveToServer: () => Promise<void>
}

const getDefaultOrder = (): WidgetId[] => DEFAULT_WIDGETS.map(w => w.id)

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set, get) => ({
      widgetOrder: getDefaultOrder(),
      hiddenWidgets: new Set<WidgetId>(),
      isEditMode: false,
      isLoading: false,
      isSynced: false,

      setEditMode: (enabled) => {
        set({ isEditMode: enabled })
        // Auto-save when exiting edit mode
        if (!enabled && get().isSynced) {
          get().saveToServer()
        }
      },

      toggleWidgetVisibility: (widgetId) => {
        set((state) => {
          const newHidden = new Set(state.hiddenWidgets)
          if (newHidden.has(widgetId)) {
            newHidden.delete(widgetId)
          } else {
            newHidden.add(widgetId)
          }
          return { hiddenWidgets: newHidden }
        })
      },

      reorderWidgets: (newOrder) => {
        set({ widgetOrder: newOrder })
      },

      resetToDefault: () => {
        set({
          widgetOrder: getDefaultOrder(),
          hiddenWidgets: new Set<WidgetId>(),
        })
      },

      loadFromServer: async () => {
        set({ isLoading: true })
        try {
          const response = await usersApi.getDashboardSettings()
          const settings = response.dashboard_settings

          if (settings.widgetOrder && Array.isArray(settings.widgetOrder)) {
            // Validate widget IDs
            const validOrder = settings.widgetOrder.filter(id =>
              DEFAULT_WIDGETS.some(w => w.id === id)
            ) as WidgetId[]

            // Add any missing widgets at the end
            const missingWidgets = getDefaultOrder().filter(id => !validOrder.includes(id))
            set({ widgetOrder: [...validOrder, ...missingWidgets] })
          }

          if (settings.hiddenWidgets && Array.isArray(settings.hiddenWidgets)) {
            const validHidden = settings.hiddenWidgets.filter(id =>
              DEFAULT_WIDGETS.some(w => w.id === id)
            ) as WidgetId[]
            set({ hiddenWidgets: new Set(validHidden) })
          }

          set({ isSynced: true })
        } catch (error) {
          console.error('Failed to load dashboard settings:', error)
        } finally {
          set({ isLoading: false })
        }
      },

      saveToServer: async () => {
        const { widgetOrder, hiddenWidgets } = get()
        try {
          await usersApi.updateDashboardSettings({
            widgetOrder,
            hiddenWidgets: Array.from(hiddenWidgets),
          })
        } catch (error) {
          console.error('Failed to save dashboard settings:', error)
        }
      },
    }),
    {
      name: 'dashboard-settings',
      partialize: (state) => ({
        widgetOrder: state.widgetOrder,
        hiddenWidgets: Array.from(state.hiddenWidgets),
      }),
      merge: (persisted: any, current) => ({
        ...current,
        widgetOrder: persisted?.widgetOrder || current.widgetOrder,
        hiddenWidgets: new Set(persisted?.hiddenWidgets || []),
      }),
    }
  )
)

// Helper to get widgets in order with visibility
export const getOrderedWidgets = (state: DashboardState): WidgetConfig[] => {
  return state.widgetOrder.map(id => {
    const widget = DEFAULT_WIDGETS.find(w => w.id === id)!
    return {
      id,
      name: widget.name,
      visible: !state.hiddenWidgets.has(id),
    }
  })
}
