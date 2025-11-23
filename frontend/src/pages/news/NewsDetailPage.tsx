import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Tile, Button, TextInput, Loading } from '@carbon/react'
import { ArrowLeft, Favorite, FavoriteFilled, Chat, Send, Attachment, Edit } from '@carbon/icons-react'
import { newsApi } from '@/api/endpoints/news'
import { useAuthStore } from '@/store/authStore'
import { formatDate } from '@/lib/utils'

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function NewsDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
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
      <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
        <Loading withOverlay={false} />
      </div>
    )
  }

  if (error || !news) {
    return (
      <div>
        <Button kind="ghost" renderIcon={ArrowLeft} onClick={() => navigate('/news')}>
          Назад к новостям
        </Button>
        <Tile style={{ marginTop: '1rem' }}>
          <p style={{ textAlign: 'center', padding: '3rem', color: 'var(--cds-text-secondary)' }}>
            Новость не найдена
          </p>
        </Tile>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <Button
          kind="ghost"
          hasIconOnly
          renderIcon={ArrowLeft}
          iconDescription="Назад"
          onClick={() => navigate('/news')}
        />
      </div>

      {/* News content */}
      <Tile style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <div className="list-item-avatar" style={{ width: '40px', height: '40px' }}>
            {news.author?.avatar ? (
              <img src={news.author.avatar} alt={news.author.full_name} />
            ) : (
              getInitials(news.author?.full_name || 'A')
            )}
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 500 }}>{news.author?.full_name || 'Автор'}</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--cds-text-helper)' }}>{formatDate(news.created_at)}</p>
          </div>
          {(user?.id === news.author?.id || user?.is_superuser) && (
            <Button kind="ghost" size="sm" renderIcon={Edit} as={Link} to={`/news/${id}/edit`}>
              Редактировать
            </Button>
          )}
        </div>

        <h1 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem' }}>{news.title}</h1>
        <div style={{ color: 'var(--cds-text-secondary)', whiteSpace: 'pre-wrap' }}>
          {news.content}
        </div>

        {/* Attachments */}
        {news.attachments && news.attachments.length > 0 && (
          <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--cds-border-subtle-01)' }}>
            <p style={{ fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Attachment size={16} />
              Вложения
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {news.attachments.map((attachment) => (
                <a
                  key={attachment.id}
                  href={attachment.file}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem',
                    background: 'var(--cds-layer-02)',
                    fontSize: '0.875rem',
                    color: 'var(--cds-link-primary)',
                    textDecoration: 'none',
                  }}
                >
                  <Attachment size={16} />
                  {attachment.file_name}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Reactions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--cds-border-subtle-01)' }}>
          <Button
            kind="ghost"
            size="sm"
            onClick={handleToggleReaction}
            disabled={addReactionMutation.isPending || removeReactionMutation.isPending}
          >
            {news.user_reaction ? (
              <FavoriteFilled size={16} style={{ color: '#da1e28', marginRight: '0.25rem' }} />
            ) : (
              <Favorite size={16} style={{ marginRight: '0.25rem' }} />
            )}
            {news.reactions_count || 0}
          </Button>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.875rem', color: 'var(--cds-text-secondary)' }}>
            <Chat size={16} />
            {news.comments_count || 0} комментариев
          </span>
        </div>
      </Tile>

      {/* Comments */}
      <Tile>
        <h3 style={{ fontWeight: 600, marginBottom: '1rem' }}>Комментарии</h3>

        {/* Add comment form */}
        <form onSubmit={handleSubmitComment} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          <div className="list-item-avatar" style={{ width: '32px', height: '32px', fontSize: '0.75rem', flexShrink: 0 }}>
            {user?.avatar ? (
              <img src={user.avatar} alt={user.full_name} />
            ) : (
              getInitials(user?.full_name || 'U')
            )}
          </div>
          <TextInput
            id="comment"
            labelText=""
            hideLabel
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Написать комментарий..."
            size="sm"
          />
          <Button
            type="submit"
            kind="primary"
            hasIconOnly
            renderIcon={Send}
            iconDescription="Отправить"
            size="sm"
            disabled={!comment.trim() || addCommentMutation.isPending}
          />
        </form>

        {/* Comments list */}
        {comments && comments.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid var(--cds-border-subtle-01)' }}>
            {comments.map((c) => {
              const isCurrentUser = user?.id === c.author?.id
              return (
                <div
                  key={c.id}
                  style={{
                    display: 'flex',
                    gap: '0.75rem',
                    padding: '0.75rem',
                    background: isCurrentUser ? 'var(--cds-layer-selected-01)' : 'var(--cds-layer-02)',
                    border: isCurrentUser ? '1px solid var(--cds-border-interactive)' : 'none',
                  }}
                >
                  <div className="list-item-avatar" style={{ width: '32px', height: '32px', fontSize: '0.75rem', flexShrink: 0 }}>
                    {c.author?.avatar ? (
                      <img src={c.author.avatar} alt={c.author.full_name} />
                    ) : (
                      getInitials(c.author?.full_name || 'U')
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                      <span style={{ fontWeight: 500, fontSize: '0.875rem', color: isCurrentUser ? 'var(--cds-link-primary)' : 'inherit' }}>
                        {c.author?.full_name || 'Пользователь'}
                        {isCurrentUser && <span style={{ fontWeight: 400, fontSize: '0.75rem', marginLeft: '0.25rem' }}>(вы)</span>}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--cds-text-helper)' }}>
                        {formatDate(c.created_at)}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.875rem', color: 'var(--cds-text-secondary)', marginTop: '0.25rem' }}>{c.content}</p>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <p style={{ textAlign: 'center', padding: '1rem', fontSize: '0.875rem', color: 'var(--cds-text-secondary)' }}>
            Комментариев пока нет. Будьте первым!
          </p>
        )}
      </Tile>
    </div>
  )
}
