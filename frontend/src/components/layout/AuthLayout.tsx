import { Outlet } from 'react-router-dom'

export function AuthLayout() {
  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-title">Fond Intra</h1>
          <p className="auth-subtitle">
            Корпоративный портал для сотрудников
          </p>
        </div>
        <Outlet />
      </div>
    </div>
  )
}
