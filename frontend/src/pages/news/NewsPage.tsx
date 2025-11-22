import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Plus, MessageSquare, Heart, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { newsApi } from '@/api/endpoints/news'
import { formatDate, getInitials } from '@/lib/utils'

export function NewsPage() {
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['news', page],
    queryFn: () => newsApi.getList({ page, page_size: 10 }),
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-text-primary">Новости</h1>
        <Button asChild>
          <Link to="/news/create">
            <Plus className="h-4 w-4 mr-2" />
            Создать новость
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-text-secondary">Загрузка...</div>
      ) : data?.results && data.results.length > 0 ? (
        <div className="space-y-4">
          {data.results.map((news) => (
            <Link key={news.id} to={`/news/${news.id}`}>
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarImage src={news.author.avatar || undefined} />
                      <AvatarFallback>
                        {getInitials(news.author.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold text-lg line-clamp-1">
                            {news.title}
                          </h3>
                          <p className="text-sm text-text-helper">
                            {news.author.full_name}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-text-helper shrink-0">
                          <Calendar className="h-3 w-3" />
                          {formatDate(news.created_at)}
                        </div>
                      </div>
                      <p className="text-text-secondary mt-2 line-clamp-3">
                        {news.content}
                      </p>
                      <div className="flex items-center gap-4 mt-4 text-sm text-text-secondary">
                        <span className="flex items-center gap-1">
                          <Heart className="h-4 w-4" />
                          {news.reactions_count || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-4 w-4" />
                          {news.comments_count || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}

          {/* Pagination */}
          {data.count > 10 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button
                variant="outline"
                disabled={!data.previous}
                onClick={() => setPage((p) => p - 1)}
              >
                Назад
              </Button>
              <span className="text-sm text-text-secondary">
                Страница {page} из {Math.ceil(data.count / 10)}
              </span>
              <Button
                variant="outline"
                disabled={!data.next}
                onClick={() => setPage((p) => p + 1)}
              >
                Далее
              </Button>
            </div>
          )}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-text-secondary">Новостей пока нет</p>
            <Button asChild className="mt-4">
              <Link to="/news/create">Создать первую новость</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
