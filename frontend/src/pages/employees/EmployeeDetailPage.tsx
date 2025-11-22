import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Mail, Phone, Calendar, Building2, Briefcase, Award } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { usersApi } from '@/api/endpoints/users'
import { achievementsApi } from '@/api/endpoints/achievements'
import { formatDate, getInitials } from '@/lib/utils'

export function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>()

  const { data: employee, isLoading, error } = useQuery({
    queryKey: ['employee', id],
    queryFn: () => usersApi.getById(Number(id)),
    enabled: !!id,
  })

  const { data: achievements } = useQuery({
    queryKey: ['employee-achievements', id],
    queryFn: () => achievementsApi.getUserAchievements(Number(id)),
    enabled: !!id,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-text-secondary">Загрузка...</p>
      </div>
    )
  }

  if (error || !employee) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" asChild>
          <Link to="/employees">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад к списку
          </Link>
        </Button>
        <div className="text-center py-12">
          <p className="text-text-secondary">Сотрудник не найден</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/employees">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold text-text-primary">
          Профиль сотрудника
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main info */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center">
              <Avatar className="h-32 w-32 mb-4">
                <AvatarImage src={employee.avatar || undefined} />
                <AvatarFallback className="text-2xl">
                  {getInitials(employee.full_name)}
                </AvatarFallback>
              </Avatar>
              <h2 className="text-xl font-semibold">{employee.full_name}</h2>
              <p className="text-text-secondary">
                {employee.position?.name || 'Должность не указана'}
              </p>
              {employee.department && (
                <p className="text-sm text-text-helper mt-1">
                  {employee.department.name}
                </p>
              )}
              {employee.current_status && (
                <span className="mt-3 px-3 py-1 rounded-full text-sm bg-support-info/10 text-support-info">
                  {employee.current_status.status_display}
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Contact info */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Контактная информация</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-layer-02 rounded">
                <Mail className="h-5 w-5 text-text-secondary" />
                <div>
                  <p className="text-xs text-text-helper">Email</p>
                  <a
                    href={`mailto:${employee.email}`}
                    className="text-sm text-interactive-primary hover:underline"
                  >
                    {employee.email}
                  </a>
                </div>
              </div>

              {employee.phone_personal && (
                <div className="flex items-center gap-3 p-3 bg-layer-02 rounded">
                  <Phone className="h-5 w-5 text-text-secondary" />
                  <div>
                    <p className="text-xs text-text-helper">Телефон</p>
                    <a
                      href={`tel:${employee.phone_personal}`}
                      className="text-sm text-interactive-primary hover:underline"
                    >
                      {employee.phone_personal}
                    </a>
                  </div>
                </div>
              )}

              {employee.birth_date && (
                <div className="flex items-center gap-3 p-3 bg-layer-02 rounded">
                  <Calendar className="h-5 w-5 text-text-secondary" />
                  <div>
                    <p className="text-xs text-text-helper">День рождения</p>
                    <p className="text-sm">{formatDate(employee.birth_date)}</p>
                  </div>
                </div>
              )}

              {employee.hire_date && (
                <div className="flex items-center gap-3 p-3 bg-layer-02 rounded">
                  <Calendar className="h-5 w-5 text-text-secondary" />
                  <div>
                    <p className="text-xs text-text-helper">Дата найма</p>
                    <p className="text-sm">{formatDate(employee.hire_date)}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 p-3 bg-layer-02 rounded">
                <Building2 className="h-5 w-5 text-text-secondary" />
                <div>
                  <p className="text-xs text-text-helper">Отдел</p>
                  <p className="text-sm">{employee.department?.name || 'Не указан'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-layer-02 rounded">
                <Briefcase className="h-5 w-5 text-text-secondary" />
                <div>
                  <p className="text-xs text-text-helper">Должность</p>
                  <p className="text-sm">{employee.position?.name || 'Не указана'}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bio */}
        {employee.bio && (
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>О сотруднике</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-text-secondary whitespace-pre-wrap">{employee.bio}</p>
            </CardContent>
          </Card>
        )}

        {/* Achievements */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Достижения ({achievements?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {achievements && achievements.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {achievements.map((award) => (
                  <div key={award.id} className="p-4 bg-layer-02 rounded">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{award.achievement?.icon || '🏆'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{award.achievement?.name || 'Достижение'}</p>
                        <p className="text-xs text-text-secondary">
                          {formatDate(award.awarded_at)}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-text-secondary mt-2 line-clamp-2">
                      {award.comment}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-text-secondary text-sm">
                У сотрудника пока нет достижений
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
