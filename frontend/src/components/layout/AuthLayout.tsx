import { Outlet } from 'react-router-dom'
import { useThemeStore } from '@/store/themeStore'
import logoColor from '@/assets/logo_color.svg'
import logoWhite from '@/assets/logo_white.svg'

export function AuthLayout() {
  const { resolvedTheme } = useThemeStore()
  const isDarkTheme = resolvedTheme === 'g100'
  const logo = isDarkTheme ? logoWhite : logoColor

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <img
            src={logo}
            alt="Fond Intra"
            style={{ maxWidth: '250px', width: '100%', height: 'auto', marginBottom: '1rem' }}
          />
          <p className="auth-subtitle">
            Корпоративный портал для сотрудников
          </p>
        </div>
        <Outlet />
      </div>
    </div>
  )
}
