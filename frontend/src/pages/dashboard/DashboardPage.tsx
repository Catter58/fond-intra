import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Award, Cake, Newspaper, Users } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuthStore } from '@/store/authStore'
import { usersApi } from '@/api/endpoints/users'
import { newsApi } from '@/api/endpoints/news'
import { achievementsApi } from '@/api/endpoints/achievements'
import { formatDate, getInitials } from '@/lib/utils'

export function DashboardPage() {
  const { user } = useAuthStore()

  const { data: birthdaysData } = useQuery({
    queryKey: ['birthdays'],
    queryFn: () => usersApi.getBirthdays(7),
  })

  const { data: newsData } = useQuery({
    queryKey: ['news', 'latest'],
    queryFn: () => newsApi.getList({ page_size: 5 }),
  })

  const { data: achievementsData } = useQuery({
    queryKey: ['achievements', 'feed'],
    queryFn: () => achievementsApi.getFeed({ page_size: 5 }),
  })

  const { data: statsData } = useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: () => usersApi.getDashboardStats(),
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">
          Добро пожаловать, {user?.first_name}!
        </h1>
        <p className="text-text-secondary mt-1">
          Главная страница корпоративного портала
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-interactive-primary/10 rounded">
                <Users className="h-6 w-6 text-interactive-primary" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{statsData?.users_count ?? '--'}</p>
                <p className="text-sm text-text-secondary">Сотрудников</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-support-success/10 rounded">
                <Award className="h-6 w-6 text-support-success" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{statsData?.achievements_count ?? '--'}</p>
                <p className="text-sm text-text-secondary">Достижений</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-support-info/10 rounded">
                <Newspaper className="h-6 w-6 text-support-info" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{statsData?.news_count ?? '--'}</p>
                <p className="text-sm text-text-secondary">Новостей</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-support-warning/10 rounded">
                <Cake className="h-6 w-6 text-support-warning" />
              </div>
              <div>
                <p className="text-2xl font-semibold">
                  {birthdaysData?.length || 0}
                </p>
                <p className="text-sm text-text-secondary">ДР на этой неделе</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Birthdays */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cake className="h-5 w-5" />
              Ближайшие дни рождения
            </CardTitle>
          </CardHeader>
          <CardContent>
            {birthdaysData && birthdaysData.length > 0 ? (
              <div className="space-y-3">
                {birthdaysData.map((person) => (
                  <Link
                    key={person.id}
                    to={`/employees/${person.id}`}
                    className="flex items-center gap-3 p-2 rounded hover:bg-layer-hover transition-colors"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={person.avatar || undefined} />
                      <AvatarFallback>
                        {getInitials(person.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {person.full_name}
                      </p>
                      <p className="text-xs text-text-secondary">
                        {person.birth_date && formatDate(person.birth_date)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-text-secondary">
                Нет ближайших дней рождения
              </p>
            )}
          </CardContent>
        </Card>

        {/* Latest news */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Newspaper className="h-5 w-5" />
              Последние новости
            </CardTitle>
          </CardHeader>
          <CardContent>
            {newsData?.results && newsData.results.length > 0 ? (
              <div className="space-y-3">
                {newsData.results.map((item) => (
                  <Link
                    key={item.id}
                    to={`/news/${item.id}`}
                    className="block p-2 rounded hover:bg-layer-hover transition-colors"
                  >
                    <p className="text-sm font-medium line-clamp-2">
                      {item.title}
                    </p>
                    <p className="text-xs text-text-secondary mt-1">
                      {formatDate(item.created_at)}
                    </p>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-text-secondary">Нет новостей</p>
            )}
          </CardContent>
        </Card>

        {/* Latest achievements */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Последние достижения
            </CardTitle>
          </CardHeader>
          <CardContent>
            {achievementsData?.results && achievementsData.results.length > 0 ? (
              <div className="space-y-3">
                {achievementsData.results.map((award) => (
                  <div
                    key={award.id}
                    className="p-2 rounded hover:bg-layer-hover transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={award.recipient?.avatar || undefined} />
                        <AvatarFallback className="text-xs">
                          {getInitials(award.recipient?.full_name || '')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {award.recipient?.full_name || 'Неизвестный'}
                        </p>
                        <p className="text-xs text-text-secondary truncate">
                          {award.achievement?.name || 'Достижение'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-text-secondary">Нет достижений</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
