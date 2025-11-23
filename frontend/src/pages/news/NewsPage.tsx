import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  Tile,
  ClickableTile,
  Button,
  Pagination,
  Loading,
} from '@carbon/react'
import { Add, Chat, Favorite, Calendar } from '@carbon/icons-react'
import { newsApi } from '@/api/endpoints/news'
import { formatDate } from '@/lib/utils'

export function NewsPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['news', page],
    queryFn: () => newsApi.getList({ page, page_size: 10 }),
  })

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 className="page-title">Новости</h1>
          <Button
            renderIcon={Add}
            onClick={() => navigate('/news/create')}
          >
            Создать новость
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <Loading withOverlay={false} />
        </div>
      ) : data?.results && data.results.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {data.results.map((news) => (
            <ClickableTile
              key={news.id}
              href={`/news/${news.id}`}
              onClick={(e) => {
                e.preventDefault()
                navigate(`/news/${news.id}`)
              }}
            >
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div className="list-item-avatar" style={{ width: '40px', height: '40px', flexShrink: 0 }}>
                  {news.author.avatar ? (
                    <img src={news.author.avatar} alt={news.author.full_name} />
                  ) : (
                    getInitials(news.author.full_name)
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                    <div>
                      <h3 style={{
                        fontWeight: 600,
                        fontSize: '1.125rem',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {news.title}
                      </h3>
                      <p style={{ fontSize: '0.875rem', color: 'var(--cds-text-helper)' }}>
                        {news.author.full_name}
                      </p>
                    </div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      fontSize: '0.75rem',
                      color: 'var(--cds-text-helper)',
                      flexShrink: 0
                    }}>
                      <Calendar size={12} />
                      {formatDate(news.created_at)}
                    </div>
                  </div>
                  <p style={{
                    marginTop: '0.5rem',
                    color: 'var(--cds-text-secondary)',
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {news.content}
                  </p>
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', fontSize: '0.875rem', color: 'var(--cds-text-secondary)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Favorite size={16} />
                      {news.reactions_count || 0}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Chat size={16} />
                      {news.comments_count || 0}
                    </span>
                  </div>
                </div>
              </div>
            </ClickableTile>
          ))}

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
        <Tile>
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <p style={{ color: 'var(--cds-text-secondary)', marginBottom: '1rem' }}>
              Новостей пока нет
            </p>
            <Button renderIcon={Add} onClick={() => navigate('/news/create')}>
              Создать первую новость
            </Button>
          </div>
        </Tile>
      )}
    </div>
  )
}
