import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  ClickableTile,
  Button,
  Loading,
  Tag,
  Pagination,
} from '@carbon/react'
import { Add, Calendar, Edit, TrashCan, Send, DocumentBlank } from '@carbon/icons-react'
import { newsApi } from '@/api/endpoints/news'
import { formatDate } from '@/lib/utils'
import { EmptyState } from '@/components/ui/EmptyState'
import type { News, NewsStatus } from '@/types'

const STATUS_CONFIG: Record<NewsStatus, { label: string; color: 'gray' | 'blue' | 'green' | 'purple' }> = {
  draft: { label: 'Черновик', color: 'gray' },
  scheduled: { label: 'Запланирована', color: 'purple' },
  published: { label: 'Опубликована', color: 'green' },
}

export function NewsDraftsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<NewsStatus | 'all'>('all')

  const { data, isLoading } = useQuery({
    queryKey: ['news-drafts', page, statusFilter],
    queryFn: () => newsApi.getList({
      page,
      page_size: 10,
      drafts: true,
      status: statusFilter === 'all' ? undefined : statusFilter,
    }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => newsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['news-drafts'] })
    },
  })

  const publishMutation = useMutation({
    mutationFn: (id: number) => newsApi.publish(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['news-drafts'] })
    },
  })

  const handleDelete = (e: React.MouseEvent, id: number) => {
    e.stopPropagation()
    e.preventDefault()
    if (confirm('Удалить этот черновик?')) {
      deleteMutation.mutate(id)
    }
  }

  const handlePublish = (e: React.MouseEvent, id: number) => {
    e.stopPropagation()
    e.preventDefault()
    publishMutation.mutate(id)
  }

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 className="page-title">Мои черновики</h1>
          <Button
            renderIcon={Add}
            onClick={() => navigate('/news/create')}
          >
            Создать новость
          </Button>
        </div>

        {/* Status filter */}
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
          <Tag
            type={statusFilter === 'all' ? 'blue' : 'gray'}
            onClick={() => setStatusFilter('all')}
            style={{ cursor: 'pointer' }}
          >
            Все
          </Tag>
          <Tag
            type={statusFilter === 'draft' ? 'blue' : 'gray'}
            onClick={() => setStatusFilter('draft')}
            style={{ cursor: 'pointer' }}
          >
            Черновики
          </Tag>
          <Tag
            type={statusFilter === 'scheduled' ? 'blue' : 'gray'}
            onClick={() => setStatusFilter('scheduled')}
            style={{ cursor: 'pointer' }}
          >
            Запланированные
          </Tag>
          <Tag
            type={statusFilter === 'published' ? 'blue' : 'gray'}
            onClick={() => setStatusFilter('published')}
            style={{ cursor: 'pointer' }}
          >
            Опубликованные
          </Tag>
        </div>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <Loading withOverlay={false} />
        </div>
      ) : data?.results && data.results.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {data.results.map((news: News) => {
            const statusConfig = STATUS_CONFIG[news.status]
            return (
              <ClickableTile
                key={news.id}
                href={`/news/${news.id}/edit`}
                onClick={(e) => {
                  e.preventDefault()
                  navigate(`/news/${news.id}/edit`)
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <Tag type={statusConfig.color} size="sm">
                        {statusConfig.label}
                      </Tag>
                      {news.publish_at && news.status === 'scheduled' && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--cds-text-helper)' }}>
                          Публикация: {formatDate(news.publish_at)}
                        </span>
                      )}
                    </div>
                    <h3 style={{
                      fontWeight: 600,
                      fontSize: '1rem',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {news.title || 'Без заголовка'}
                    </h3>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      marginTop: '0.5rem',
                      fontSize: '0.75rem',
                      color: 'var(--cds-text-helper)'
                    }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Calendar size={12} />
                        Создана: {formatDate(news.created_at)}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        Обновлена: {formatDate(news.updated_at)}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.25rem', flexShrink: 0 }}>
                    {news.status === 'draft' && (
                      <Button
                        kind="ghost"
                        size="sm"
                        hasIconOnly
                        renderIcon={Send}
                        iconDescription="Опубликовать"
                        onClick={(e) => handlePublish(e, news.id)}
                        disabled={publishMutation.isPending}
                      />
                    )}
                    <Button
                      kind="ghost"
                      size="sm"
                      hasIconOnly
                      renderIcon={Edit}
                      iconDescription="Редактировать"
                      onClick={(e) => {
                        e.stopPropagation()
                        e.preventDefault()
                        navigate(`/news/${news.id}/edit`)
                      }}
                    />
                    <Button
                      kind="danger--tertiary"
                      size="sm"
                      hasIconOnly
                      renderIcon={TrashCan}
                      iconDescription="Удалить"
                      onClick={(e) => handleDelete(e, news.id)}
                      disabled={deleteMutation.isPending}
                    />
                  </div>
                </div>
              </ClickableTile>
            )
          })}

          {/* Pagination */}
          {data.count > 10 && (
            <div style={{ marginTop: '1rem' }}>
              <Pagination
                totalItems={data.count}
                pageSize={10}
                pageSizes={[10]}
                page={page}
                onChange={({ page: newPage }) => newPage && setPage(newPage)}
                itemsPerPageText="Элементов на странице"
                pageRangeText={(_current, total) => `из ${total} страниц`}
                itemRangeText={(min, max, total) => `${min}–${max} из ${total} элементов`}
              />
            </div>
          )}
        </div>
      ) : (
        <EmptyState
          icon={DocumentBlank}
          title="Черновиков нет"
          description="Создайте новую новость и сохраните её как черновик."
          action={{
            label: 'Создать новость',
            onClick: () => navigate('/news/create'),
          }}
        />
      )}
    </div>
  )
}
