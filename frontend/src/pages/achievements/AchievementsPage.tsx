import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Award, Plus, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { AwardAchievementModal } from '@/components/features/achievements/AwardAchievementModal'
import { achievementsApi } from '@/api/endpoints/achievements'
import { formatDate, getInitials } from '@/lib/utils'

export function AchievementsPage() {
  const [page, setPage] = useState(1)
  const [showCreateModal, setShowCreateModal] = useState(false)

  const { data: achievementTypes } = useQuery({
    queryKey: ['achievement-types'],
    queryFn: achievementsApi.getTypes,
  })

  const { data: feed, isLoading } = useQuery({
    queryKey: ['achievements', 'feed', page],
    queryFn: () => achievementsApi.getFeed({ page, page_size: 20 }),
  })

  const { data: stats } = useQuery({
    queryKey: ['achievements', 'stats'],
    queryFn: achievementsApi.getStats,
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-text-primary">Достижения</h1>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Наградить коллегу
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Stats */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="h-5 w-5" />
                Статистика
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-text-secondary">Всего наград</span>
                <span className="font-semibold">{stats?.total_awards || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-text-secondary">За месяц</span>
                <span className="font-semibold">{stats?.this_month || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-text-secondary">Типов наград</span>
                <span className="font-semibold">{achievementTypes?.length || 0}</span>
              </div>
            </CardContent>
          </Card>

          {/* Achievement types */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Типы наград</CardTitle>
            </CardHeader>
            <CardContent>
              {achievementTypes && achievementTypes.length > 0 ? (
                <div className="space-y-2">
                  {achievementTypes.map((type) => (
                    <div
                      key={type.id}
                      className="flex items-center gap-3 p-2 rounded hover:bg-layer-hover"
                    >
                      <span className="text-2xl">{type.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{type.name}</p>
                        <p className="text-xs text-text-secondary truncate">
                          {type.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-text-secondary">Типы наград не созданы</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Feed */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Лента достижений
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-text-secondary">
                  Загрузка...
                </div>
              ) : feed?.results && feed.results.length > 0 ? (
                <div className="space-y-4">
                  {feed.results.map((award) => (
                    <div
                      key={award.id}
                      className="flex gap-4 p-4 bg-layer-02 rounded"
                    >
                      <Avatar className="h-12 w-12 shrink-0">
                        <AvatarImage src={award.recipient?.avatar || undefined} />
                        <AvatarFallback>
                          {getInitials(award.recipient?.full_name || '')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-medium">
                              {award.recipient?.full_name || 'Неизвестный'}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xl">{award.achievement?.icon || '🏆'}</span>
                              <span className="text-sm font-medium text-interactive-primary">
                                {award.achievement?.name || 'Достижение'}
                              </span>
                            </div>
                          </div>
                          <span className="text-xs text-text-helper shrink-0">
                            {formatDate(award.awarded_at)}
                          </span>
                        </div>
                        <p className="text-sm text-text-secondary mt-2">
                          {award.comment}
                        </p>
                        <p className="text-xs text-text-helper mt-2">
                          От: {award.awarded_by?.full_name || 'Система'}
                        </p>
                      </div>
                    </div>
                  ))}

                  {/* Pagination */}
                  {feed.count > 20 && (
                    <div className="flex items-center justify-center gap-2 pt-4">
                      <Button
                        variant="outline"
                        disabled={!feed.previous}
                        onClick={() => setPage((p) => p - 1)}
                      >
                        Назад
                      </Button>
                      <span className="text-sm text-text-secondary">
                        Страница {page} из {Math.ceil(feed.count / 20)}
                      </span>
                      <Button
                        variant="outline"
                        disabled={!feed.next}
                        onClick={() => setPage((p) => p + 1)}
                      >
                        Далее
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-text-secondary">
                  Пока нет достижений. Будьте первым!
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <AwardAchievementModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </div>
  )
}
