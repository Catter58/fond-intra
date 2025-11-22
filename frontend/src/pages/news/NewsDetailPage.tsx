import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Heart, MessageSquare, Send, Paperclip, Edit } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { newsApi } from '@/api/endpoints/news'
import { useAuthStore } from '@/store/authStore'
import { formatDate, getInitials } from '@/lib/utils'

export function NewsDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [comment, setComment] = useState('')

  const { data: news, isLoading, error } = useQuery({
    queryKey: ['news', id],
    queryFn: () => newsApi.getById(Number(id)),
    enabled: !!id,
  })

  const { data: comments } = useQuery({
    queryKey: ['news', id, 'comments'],
    queryFn: () => newsApi.getComments(Number(id)),
    enabled: !!id,
  })

  const addCommentMutation = useMutation({
    mutationFn: (text: string) => newsApi.addComment(Number(id), { content: text }),
    onSuccess: () => {
      setComment('')
      queryClient.invalidateQueries({ queryKey: ['news', id, 'comments'] })
      queryClient.invalidateQueries({ queryKey: ['news', id] })
    },
  })

  const addReactionMutation = useMutation({
    mutationFn: () => newsApi.toggleReaction(Number(id), { type: 'like' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['news', id] })
    },
  })

  const removeReactionMutation = useMutation({
    mutationFn: () => newsApi.removeReaction(Number(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['news', id] })
    },
  })

  const handleToggleReaction = () => {
    if (news?.user_reaction) {
      removeReactionMutation.mutate()
    } else {
      addReactionMutation.mutate()
    }
  }

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault()
    if (comment.trim()) {
      addCommentMutation.mutate(comment)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-text-secondary">Загрузка...</p>
      </div>
    )
  }

  if (error || !news) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" asChild>
          <Link to="/news">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад к новостям
          </Link>
        </Button>
        <div className="text-center py-12">
          <p className="text-text-secondary">Новость не найдена</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/news">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
      </div>

      {/* News content */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Avatar className="h-10 w-10">
              <AvatarImage src={news.author?.avatar || undefined} />
              <AvatarFallback>{getInitials(news.author?.full_name || 'A')}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-medium">{news.author?.full_name || 'Автор'}</p>
              <p className="text-xs text-text-helper">{formatDate(news.created_at)}</p>
            </div>
            {(user?.id === news.author?.id || user?.is_superuser) && (
              <Button variant="ghost" size="sm" asChild>
                <Link to={`/news/${id}/edit`}>
                  <Edit className="h-4 w-4 mr-1" />
                  Редактировать
                </Link>
              </Button>
            )}
          </div>

          <h1 className="text-2xl font-semibold mb-4">{news.title}</h1>
          <div className="prose prose-sm max-w-none text-text-secondary whitespace-pre-wrap">
            {news.content}
          </div>

          {/* Attachments */}
          {news.attachments && news.attachments.length > 0 && (
            <div className="mt-6 pt-4 border-t">
              <p className="text-sm font-medium mb-2 flex items-center gap-2">
                <Paperclip className="h-4 w-4" />
                Вложения
              </p>
              <div className="space-y-2">
                {news.attachments.map((attachment) => (
                  <a
                    key={attachment.id}
                    href={attachment.file}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2 bg-layer-02 rounded hover:bg-layer-hover text-sm"
                  >
                    <Paperclip className="h-4 w-4 text-text-secondary" />
                    {attachment.file_name}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Reactions */}
          <div className="flex items-center gap-4 mt-6 pt-4 border-t">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggleReaction}
              disabled={addReactionMutation.isPending || removeReactionMutation.isPending}
              className={news.user_reaction
                ? "text-destructive hover:text-destructive"
                : "text-muted-foreground hover:text-destructive"
              }
            >
              <Heart className={`h-4 w-4 mr-1 ${news.user_reaction ? 'fill-current' : ''}`} />
              {news.reactions_count || 0}
            </Button>
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <MessageSquare className="h-4 w-4" />
              {news.comments_count || 0} комментариев
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Comments */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Комментарии</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add comment form */}
          <form onSubmit={handleSubmitComment} className="flex gap-2">
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarImage src={user?.avatar || undefined} />
              <AvatarFallback className="text-xs">
                {getInitials(user?.full_name) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 flex gap-2">
              <Input
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Написать комментарий..."
                className="h-10"
              />
              <Button
                type="submit"
                size="icon"
                disabled={!comment.trim() || addCommentMutation.isPending}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </form>

          {/* Comments list */}
          {comments && comments.length > 0 ? (
            <div className="space-y-4 pt-4 border-t">
              {comments.map((c) => {
                const isCurrentUser = user?.id === c.author?.id
                return (
                  <div
                    key={c.id}
                    className={`flex gap-3 p-3 rounded-lg ${
                      isCurrentUser ? 'bg-primary/5 border border-primary/10' : ''
                    }`}
                  >
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarImage src={c.author?.avatar || undefined} />
                      <AvatarFallback className="text-xs">
                        {getInitials(c.author?.full_name || 'U')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                        <span className={`font-medium text-sm ${isCurrentUser ? 'text-primary' : ''}`}>
                          {c.author?.full_name || 'Пользователь'}
                          {isCurrentUser && <span className="ml-1 text-xs font-normal">(вы)</span>}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(c.created_at)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{c.content}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-text-secondary text-center py-4">
              Комментариев пока нет. Будьте первым!
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
