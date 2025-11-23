import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  ClickableTile,
  Button,
  Pagination,
  Loading,
  Tag,
} from '@carbon/react'
import { Add, Chat, Favorite, Calendar, Document, Close, Image as ImageIcon, DocumentBlank } from '@carbon/icons-react'
import { newsApi } from '@/api/endpoints/news'
import { formatDate } from '@/lib/utils'
import { EmptyState } from '@/components/ui/EmptyState'
import type { EditorJSContent } from '@/types'

// Helper function to extract text preview from Editor.js content
const getContentPreview = (content: EditorJSContent | string | null | undefined): string => {
  if (!content) return ''

  // If content is a string (legacy), return it directly
  if (typeof content === 'string') {
    try {
      const parsed = JSON.parse(content)
      return getContentPreview(parsed)
    } catch {
      return content
    }
  }

  // Extract text from Editor.js blocks
  const blocks = content.blocks || []
  const texts: string[] = []

  for (const block of blocks) {
    if (block.type === 'paragraph' && block.data?.text) {
      // Strip HTML tags
      const text = String(block.data.text).replace(/<[^>]*>/g, '')
      texts.push(text)
    } else if (block.type === 'header' && block.data?.text) {
      const text = String(block.data.text).replace(/<[^>]*>/g, '')
      texts.push(text)
    } else if (block.type === 'list' && Array.isArray(block.data?.items)) {
      for (const item of block.data.items) {
        const text = String(item).replace(/<[^>]*>/g, '')
        texts.push(text)
      }
    }

    // Limit preview length
    if (texts.join(' ').length > 200) break
  }

  return texts.join(' ').slice(0, 200)
}

export function NewsPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [page, setPage] = useState(1)
  const selectedTag = searchParams.get('tag')

  const { data: tagsData } = useQuery({
    queryKey: ['news-tags'],
    queryFn: newsApi.getTags,
  })

  const { data, isLoading } = useQuery({
    queryKey: ['news', page, selectedTag],
    queryFn: () => newsApi.getList({
      page,
      page_size: 10,
      tag: selectedTag || undefined
    }),
  })

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const handleTagFilter = (tagSlug: string) => {
    setPage(1)
    if (selectedTag === tagSlug) {
      searchParams.delete('tag')
    } else {
      searchParams.set('tag', tagSlug)
    }
    setSearchParams(searchParams)
  }

  const clearTagFilter = () => {
    setPage(1)
    searchParams.delete('tag')
    setSearchParams(searchParams)
  }

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 className="page-title">Новости</h1>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Button
              kind="secondary"
              renderIcon={DocumentBlank}
              onClick={() => navigate('/news/drafts')}
            >
              Мои черновики
            </Button>
            <Button
              renderIcon={Add}
              onClick={() => navigate('/news/create')}
            >
              Создать новость
            </Button>
          </div>
        </div>

        {/* Tag Filters */}
        {tagsData && tagsData.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '1rem' }}>
            {tagsData.map((tag) => (
              <Tag
                key={tag.id}
                type={selectedTag === tag.slug ? 'blue' : 'gray'}
                onClick={() => handleTagFilter(tag.slug)}
                style={{ cursor: 'pointer' }}
              >
                {tag.name}
              </Tag>
            ))}
            {selectedTag && (
              <Button
                kind="ghost"
                size="sm"
                renderIcon={Close}
                onClick={clearTagFilter}
                style={{ padding: '0 0.5rem' }}
              >
                Сбросить
              </Button>
            )}
          </div>
        )}
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
                {/* Cover Image */}
                {news.cover_image && (
                  <div style={{
                    width: '160px',
                    height: '120px',
                    flexShrink: 0,
                    borderRadius: '4px',
                    overflow: 'hidden',
                    background: 'var(--cds-layer-02)',
                  }}>
                    <img
                      src={news.cover_image.thumbnail || news.cover_image.file}
                      alt=""
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                  </div>
                )}

                <div className="list-item-avatar" style={{
                  width: '40px',
                  height: '40px',
                  flexShrink: 0,
                  display: news.cover_image ? 'none' : 'flex'
                }}>
                  {news.author.avatar ? (
                    <img src={news.author.avatar} alt={news.author.full_name} />
                  ) : (
                    getInitials(news.author.full_name)
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <h3 style={{
                        fontWeight: 600,
                        fontSize: '1.125rem',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {news.title}
                      </h3>
                      <p style={{ fontSize: '0.875rem', color: 'var(--cds-text-helper)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {news.cover_image && (
                          <span className="list-item-avatar" style={{ width: '20px', height: '20px', fontSize: '0.6rem' }}>
                            {news.author.avatar ? (
                              <img src={news.author.avatar} alt={news.author.full_name} />
                            ) : (
                              getInitials(news.author.full_name)
                            )}
                          </span>
                        )}
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
                    WebkitLineClamp: news.cover_image ? 2 : 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {getContentPreview(news.content)}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.75rem', fontSize: '0.875rem', color: 'var(--cds-text-secondary)', flexWrap: 'wrap' }}>
                    {news.tags && news.tags.length > 0 && (
                      <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                        {news.tags.map((tag) => (
                          <Tag
                            key={tag.id}
                            type={tag.color as 'gray' | 'blue' | 'green' | 'red' | 'purple' | 'cyan' | 'teal' | 'magenta'}
                            size="sm"
                            onClick={(e: React.MouseEvent) => {
                              e.stopPropagation()
                              e.preventDefault()
                              handleTagFilter(tag.slug)
                            }}
                            style={{ cursor: 'pointer' }}
                          >
                            {tag.name}
                          </Tag>
                        ))}
                      </div>
                    )}
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Favorite size={16} />
                      {news.reactions_count || 0}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Chat size={16} />
                      {news.comments_count || 0}
                    </span>
                    {/* Image count indicator */}
                    {news.images && news.images.length > 0 && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <ImageIcon size={16} />
                        {news.images.length}
                      </span>
                    )}
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
        <EmptyState
          icon={Document}
          title="Новостей пока нет"
          description="Будьте первым, кто поделится важной информацией с коллегами."
          action={{
            label: 'Создать первую новость',
            onClick: () => navigate('/news/create'),
          }}
        />
      )}
    </div>
  )
}
