import { Link } from 'react-router-dom'
import { Edit, Mail, Phone, Calendar, Building2, Briefcase } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuthStore } from '@/store/authStore'
import { formatDate, getInitials } from '@/lib/utils'

export function ProfilePage() {
  const { user } = useAuthStore()

  if (!user) {
    return <div>Загрузка...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-text-primary">Мой профиль</h1>
        <Button asChild>
          <Link to="/profile/edit">
            <Edit className="h-4 w-4 mr-2" />
            Редактировать
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main info card */}
        <Card className="lg:col-span-1">
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center">
              <Avatar className="h-32 w-32 mb-4">
                <AvatarImage src={user.avatar || undefined} />
                <AvatarFallback className="text-2xl">
                  {getInitials(user.full_name)}
                </AvatarFallback>
              </Avatar>
              <h2 className="text-xl font-semibold">{user.full_name}</h2>
              <p className="text-text-secondary">{user.position?.name || 'Должность не указана'}</p>
              {user.department && (
                <p className="text-sm text-text-helper mt-1">{user.department.name}</p>
              )}
              {user.current_status && (
                <span className="mt-3 px-3 py-1 rounded-full text-sm bg-support-info/10 text-support-info">
                  {user.current_status.status_display}
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
                  <p className="text-sm">{user.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-layer-02 rounded">
                <Phone className="h-5 w-5 text-text-secondary" />
                <div>
                  <p className="text-xs text-text-helper">Телефон</p>
                  <p className="text-sm">{user.phone_personal || 'Не указан'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-layer-02 rounded">
                <Calendar className="h-5 w-5 text-text-secondary" />
                <div>
                  <p className="text-xs text-text-helper">День рождения</p>
                  <p className="text-sm">
                    {user.birth_date ? formatDate(user.birth_date) : 'Не указан'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-layer-02 rounded">
                <Calendar className="h-5 w-5 text-text-secondary" />
                <div>
                  <p className="text-xs text-text-helper">Дата найма</p>
                  <p className="text-sm">
                    {user.hire_date ? formatDate(user.hire_date) : 'Не указана'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-layer-02 rounded">
                <Building2 className="h-5 w-5 text-text-secondary" />
                <div>
                  <p className="text-xs text-text-helper">Отдел</p>
                  <p className="text-sm">{user.department?.name || 'Не указан'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-layer-02 rounded">
                <Briefcase className="h-5 w-5 text-text-secondary" />
                <div>
                  <p className="text-xs text-text-helper">Должность</p>
                  <p className="text-sm">{user.position?.name || 'Не указана'}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bio */}
        {user.bio && (
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>О себе</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-text-secondary whitespace-pre-wrap">{user.bio}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
