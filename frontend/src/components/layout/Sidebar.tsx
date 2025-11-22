import { NavLink } from 'react-router-dom'
import {
  Home,
  Users,
  Award,
  Newspaper,
  Building2,
  Settings,
  Shield,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/lib/utils'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

const navItems = [
  { to: '/', icon: Home, label: 'Главная' },
  { to: '/employees', icon: Users, label: 'Сотрудники' },
  { to: '/achievements', icon: Award, label: 'Достижения' },
  { to: '/news', icon: Newspaper, label: 'Новости' },
  { to: '/organization', icon: Building2, label: 'Структура' },
]

const adminItems = [
  { to: '/admin/users', icon: Users, label: 'Пользователи' },
  { to: '/admin/roles', icon: Shield, label: 'Роли' },
  { to: '/admin/settings', icon: Settings, label: 'Настройки' },
]

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user } = useAuthStore()
  const isAdmin = user?.role?.name === 'admin' || user?.is_superuser

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-overlay z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-12 left-0 bottom-0 w-64 bg-layer-01 border-r z-40 transition-transform duration-200',
          'lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Mobile close button */}
          <div className="flex items-center justify-end p-2 lg:hidden">
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={onClose}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2 rounded-sm text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-interactive-primary text-text-on-color'
                      : 'text-text-secondary hover:bg-layer-hover hover:text-text-primary'
                  )
                }
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </NavLink>
            ))}

            {/* Admin section */}
            {isAdmin && (
              <>
                <div className="pt-6 pb-2">
                  <span className="px-3 text-xs font-semibold text-text-helper uppercase tracking-wider">
                    Администрирование
                  </span>
                </div>
                {adminItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={onClose}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 px-3 py-2 rounded-sm text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-interactive-primary text-text-on-color'
                          : 'text-text-secondary hover:bg-layer-hover hover:text-text-primary'
                      )
                    }
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </NavLink>
                ))}
              </>
            )}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t text-xs text-text-helper">
            <p>© {new Date().getFullYear()} Fond Intra</p>
          </div>
        </div>
      </aside>
    </>
  )
}
