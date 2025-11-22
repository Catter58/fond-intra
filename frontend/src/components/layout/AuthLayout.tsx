import { Outlet } from 'react-router-dom'

export function AuthLayout() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-text-primary">Fond Intra</h1>
          <p className="text-text-secondary mt-2">
            Корпоративный портал для сотрудников
          </p>
        </div>
        <Outlet />
      </div>
    </div>
  )
}
