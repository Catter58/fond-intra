import { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Loading } from '@carbon/react'
import { useAuthStore } from '@/store/authStore'

// Layouts (not lazy - needed immediately)
import { MainLayout } from '@/components/layout/MainLayout'
import { AuthLayout } from '@/components/layout/AuthLayout'

// Loading component
function PageLoader() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }} role="status" aria-label="Загрузка">
      <Loading withOverlay={false} />
    </div>
  )
}

// Lazy loaded pages - Auth
const LoginPage = lazy(() => import('@/pages/auth/LoginPage').then(m => ({ default: m.LoginPage })))
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage').then(m => ({ default: m.ForgotPasswordPage })))
const ResetPasswordPage = lazy(() => import('@/pages/auth/ResetPasswordPage').then(m => ({ default: m.ResetPasswordPage })))
const ChangePasswordPage = lazy(() => import('@/pages/auth/ChangePasswordPage').then(m => ({ default: m.ChangePasswordPage })))

// Lazy loaded pages - Main
const DashboardPage = lazy(() => import('@/pages/dashboard/DashboardPage').then(m => ({ default: m.DashboardPage })))
const ProfilePage = lazy(() => import('@/pages/profile/ProfilePage').then(m => ({ default: m.ProfilePage })))
const ProfileEditPage = lazy(() => import('@/pages/profile/ProfileEditPage').then(m => ({ default: m.ProfileEditPage })))
const EmployeesPage = lazy(() => import('@/pages/employees/EmployeesPage').then(m => ({ default: m.EmployeesPage })))
const EmployeeDetailPage = lazy(() => import('@/pages/employees/EmployeeDetailPage').then(m => ({ default: m.EmployeeDetailPage })))
const AchievementsPage = lazy(() => import('@/pages/achievements/AchievementsPage').then(m => ({ default: m.AchievementsPage })))
const NewsPage = lazy(() => import('@/pages/news/NewsPage').then(m => ({ default: m.NewsPage })))
const NewsDetailPage = lazy(() => import('@/pages/news/NewsDetailPage').then(m => ({ default: m.NewsDetailPage })))
const NewsCreatePage = lazy(() => import('@/pages/news/NewsCreatePage').then(m => ({ default: m.NewsCreatePage })))
const NewsEditPage = lazy(() => import('@/pages/news/NewsEditPage').then(m => ({ default: m.NewsEditPage })))
const NotificationsPage = lazy(() => import('@/pages/notifications/NotificationsPage').then(m => ({ default: m.NotificationsPage })))
const NotificationSettingsPage = lazy(() => import('@/pages/notifications/NotificationSettingsPage').then(m => ({ default: m.NotificationSettingsPage })))
const OrganizationPage = lazy(() => import('@/pages/organization/OrganizationPage').then(m => ({ default: m.OrganizationPage })))

// Lazy loaded pages - Admin
const AdminDashboardPage = lazy(() => import('@/pages/admin/AdminDashboardPage').then(m => ({ default: m.AdminDashboardPage })))
const AdminUsersPage = lazy(() => import('@/pages/admin/AdminUsersPage').then(m => ({ default: m.AdminUsersPage })))
const AdminUserFormPage = lazy(() => import('@/pages/admin/AdminUserFormPage').then(m => ({ default: m.AdminUserFormPage })))
const AdminDepartmentsPage = lazy(() => import('@/pages/admin/AdminDepartmentsPage').then(m => ({ default: m.AdminDepartmentsPage })))
const AdminRolesPage = lazy(() => import('@/pages/admin/AdminRolesPage').then(m => ({ default: m.AdminRolesPage })))
const AdminAchievementTypesPage = lazy(() => import('@/pages/admin/AdminAchievementTypesPage').then(m => ({ default: m.AdminAchievementTypesPage })))
const AdminAuditPage = lazy(() => import('@/pages/admin/AdminAuditPage').then(m => ({ default: m.AdminAuditPage })))

// Protected Route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

// Admin Route wrapper
function AdminRoute({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((state) => state.user)
  const isAdmin = user?.role?.is_admin || user?.is_superuser

  if (!isAdmin) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

function App() {
  return (
    <>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Auth routes */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
          </Route>

          {/* Protected routes */}
          <Route
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<DashboardPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/profile/edit" element={<ProfileEditPage />} />
            <Route path="/profile/change-password" element={<ChangePasswordPage />} />
            <Route path="/employees" element={<EmployeesPage />} />
            <Route path="/employees/:id" element={<EmployeeDetailPage />} />
            <Route path="/achievements" element={<AchievementsPage />} />
            <Route path="/news" element={<NewsPage />} />
            <Route path="/news/create" element={<NewsCreatePage />} />
            <Route path="/news/:id" element={<NewsDetailPage />} />
            <Route path="/news/:id/edit" element={<NewsEditPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/notifications/settings" element={<NotificationSettingsPage />} />
            <Route path="/organization" element={<OrganizationPage />} />

            {/* Admin routes */}
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminDashboardPage />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <AdminRoute>
                  <AdminUsersPage />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/users/new"
              element={
                <AdminRoute>
                  <AdminUserFormPage />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/users/:id/edit"
              element={
                <AdminRoute>
                  <AdminUserFormPage />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/departments"
              element={
                <AdminRoute>
                  <AdminDepartmentsPage />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/roles"
              element={
                <AdminRoute>
                  <AdminRolesPage />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/achievements"
              element={
                <AdminRoute>
                  <AdminAchievementTypesPage />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/audit"
              element={
                <AdminRoute>
                  <AdminAuditPage />
                </AdminRoute>
              }
            />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </>
  )
}

export default App
