import { NavLink } from 'react-router-dom'
import { Button } from '@carbon/react'
import {
  Home,
  UserMultiple,
  Trophy,
  Document,
  Building,
  Security,
  Close,
  Dashboard,
  Report,
} from '@carbon/icons-react'
import { useAuthStore } from '@/store/authStore'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

const navItems = [
  { to: '/', icon: Home, label: 'Главная' },
  { to: '/employees', icon: UserMultiple, label: 'Сотрудники' },
  { to: '/achievements', icon: Trophy, label: 'Достижения' },
  { to: '/news', icon: Document, label: 'Новости' },
  { to: '/organization', icon: Building, label: 'Структура' },
]

const adminItems = [
  { to: '/admin', icon: Dashboard, label: 'Дашборд' },
  { to: '/admin/users', icon: UserMultiple, label: 'Пользователи' },
  { to: '/admin/roles', icon: Security, label: 'Роли' },
  { to: '/admin/departments', icon: Building, label: 'Отделы' },
  { to: '/admin/achievements', icon: Trophy, label: 'Типы наград' },
  { to: '/admin/audit', icon: Report, label: 'Аудит' },
]

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user } = useAuthStore()
  const isAdmin = user?.role?.name === 'admin' || user?.is_superuser

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 40,
          }}
          className="lg-hide"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        style={{
          position: 'fixed',
          top: '48px',
          left: 0,
          bottom: 0,
          width: '256px',
          background: 'var(--cds-layer-01)',
          borderRight: '1px solid var(--cds-border-subtle-01)',
          zIndex: 40,
          transition: 'transform 0.2s',
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
        }}
        className="sidebar-desktop"
      >
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* Mobile close button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '0.5rem' }} className="lg-hide">
            <Button kind="ghost" hasIconOnly renderIcon={Close} iconDescription="Закрыть" onClick={onClose} />
          </div>

          {/* Navigation */}
          <nav style={{ flex: 1, padding: '1rem 0.75rem' }}>
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={onClose}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.5rem 0.75rem',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  textDecoration: 'none',
                  marginBottom: '0.25rem',
                  background: isActive ? 'var(--cds-button-primary)' : 'transparent',
                  color: isActive ? 'var(--cds-text-on-color)' : 'var(--cds-text-secondary)',
                })}
                className="sidebar-link"
              >
                <item.icon size={20} />
                {item.label}
              </NavLink>
            ))}

            {/* Admin section */}
            {isAdmin && (
              <>
                <div style={{ paddingTop: '1.5rem', paddingBottom: '0.5rem' }}>
                  <span style={{
                    padding: '0 0.75rem',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: 'var(--cds-text-helper)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}>
                    Администрирование
                  </span>
                </div>
                {adminItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/admin'}
                    onClick={onClose}
                    style={({ isActive }) => ({
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.5rem 0.75rem',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      textDecoration: 'none',
                      marginBottom: '0.25rem',
                      background: isActive ? 'var(--cds-button-primary)' : 'transparent',
                      color: isActive ? 'var(--cds-text-on-color)' : 'var(--cds-text-secondary)',
                    })}
                    className="sidebar-link"
                  >
                    <item.icon size={20} />
                    {item.label}
                  </NavLink>
                ))}
              </>
            )}
          </nav>

          {/* Footer */}
          <div style={{ padding: '1rem', borderTop: '1px solid var(--cds-border-subtle-01)', fontSize: '0.75rem', color: 'var(--cds-text-helper)' }}>
            <p>© {new Date().getFullYear()} Fond Intra</p>
          </div>
        </div>
      </aside>
    </>
  )
}
