import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Users, Building2, Shield, Award, FileText, TrendingUp } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

export function AdminDashboardPage() {
  const { data: stats } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: async () => {
      // TODO: Replace with actual admin stats endpoint
      return {
        total_users: 0,
        active_users: 0,
        archived_users: 0,
        departments: 0,
        positions: 0,
        roles: 0,
        achievement_types: 0,
        audit_entries: 0,
      }
    },
  })

  const adminCards = [
    {
      title: 'Пользователи',
      description: 'Управление сотрудниками',
      icon: Users,
      href: '/admin/users',
      stats: `${stats?.active_users || 0} активных`,
      color: 'text-interactive-primary',
    },
    {
      title: 'Отделы',
      description: 'Организационная структура',
      icon: Building2,
      href: '/admin/departments',
      stats: `${stats?.departments || 0} отделов`,
      color: 'text-support-success',
    },
    {
      title: 'Роли',
      description: 'Права и доступы',
      icon: Shield,
      href: '/admin/roles',
      stats: `${stats?.roles || 0} ролей`,
      color: 'text-support-warning',
    },
    {
      title: 'Достижения',
      description: 'Типы наград',
      icon: Award,
      href: '/admin/achievements',
      stats: `${stats?.achievement_types || 0} типов`,
      color: 'text-support-info',
    },
    {
      title: 'Аудит',
      description: 'Журнал действий',
      icon: FileText,
      href: '/admin/audit',
      stats: 'Просмотр логов',
      color: 'text-text-secondary',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Администрирование</h1>
        <p className="text-text-secondary mt-1">
          Управление порталом и настройки системы
        </p>
      </div>

      {/* Stats overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-interactive-primary/10 rounded">
                <Users className="h-5 w-5 text-interactive-primary" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{stats?.total_users || 0}</p>
                <p className="text-xs text-text-secondary">Всего сотрудников</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-support-success/10 rounded">
                <TrendingUp className="h-5 w-5 text-support-success" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{stats?.active_users || 0}</p>
                <p className="text-xs text-text-secondary">Активных</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-support-warning/10 rounded">
                <Building2 className="h-5 w-5 text-support-warning" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{stats?.departments || 0}</p>
                <p className="text-xs text-text-secondary">Отделов</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-text-secondary/10 rounded">
                <Users className="h-5 w-5 text-text-secondary" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{stats?.archived_users || 0}</p>
                <p className="text-xs text-text-secondary">В архиве</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Admin sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {adminCards.map((card) => (
          <Link key={card.href} to={card.href}>
            <Card className="h-full hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className={`p-3 bg-layer-02 rounded ${card.color}`}>
                    <card.icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{card.title}</h3>
                    <p className="text-sm text-text-secondary mt-1">
                      {card.description}
                    </p>
                    <p className="text-xs text-text-helper mt-2">{card.stats}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
