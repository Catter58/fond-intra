import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Tile, Button, TextInput, Loading, InlineNotification, Checkbox, MultiSelect, Tag } from '@carbon/react'
import { ArrowLeft, Attachment, TrashCan, Upload, Close, Send, DocumentBlank, Undo } from '@carbon/icons-react'
import { newsApi } from '@/api/endpoints/news'
import { RichTextEditor } from '@/components/ui/EditorJS'
import type { NewsAttachment, NewsTag, EditorJSContent, NewsStatus } from '@/types'

interface FileWithPreview {
  file: File
  id: string
  preview?: string
}

export function NewsEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [title, setTitle] = useState('')
  const [content, setContent] = useState<EditorJSContent>({ blocks: [] })
  const [status, setStatus] = useState<NewsStatus>('draft')
  const [isPinned, setIsPinned] = useState(false)
  const [selectedTags, setSelectedTags] = useState<NewsTag[]>([])
  const [newFiles, setNewFiles] = useState<FileWithPreview[]>([])
  const [existingAttachments, setExistingAttachments] = useState<NewsAttachment[]>([])
  const [attachmentsToDelete, setAttachmentsToDelete] = useState<number[]>([])
  const [error, setError] = useState('')

  const { data: news, isLoading } = useQuery({
    queryKey: ['news', id],
    queryFn: () => newsApi.getById(Number(id)),
    enabled: !!id,
  })

  const { data: tagsData } = useQuery({
    queryKey: ['news-tags'],
    queryFn: newsApi.getTags,
  })

  useEffect(() => {
    if (news) {
      setTitle(news.title)
      setContent(news.content || { blocks: [] })
      setStatus(news.status || 'draft')
      setIsPinned(news.is_pinned ?? false)
      setExistingAttachments(news.attachments || [])
      setSelectedTags(news.tags || [])
    }
  }, [news])

  const updateNewsMutation = useMutation({
    mutationFn: async (newStatus?: NewsStatus) => {
      const formData = new FormData()
      formData.append('title', title)
      formData.append('content', JSON.stringify(content))
      formData.append('status', newStatus || status)
      formData.append('is_pinned', String(isPinned))
      formData.append('tag_ids', JSON.stringify(selectedTags.map(t => t.id)))

      newFiles.forEach((f) => {
        formData.append('attachments', f.file)
      })

      if (attachmentsToDelete.length > 0) {
        formData.append('delete_attachments', JSON.stringify(attachmentsToDelete))
      }

      return newsApi.update(Number(id), formData)
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['news', id] })
      queryClient.invalidateQueries({ queryKey: ['news-drafts'] })
      if (data.status === 'draft') {
        navigate('/news/drafts')
      } else {
        navigate(`/news/${id}`)
      }
    },
    onError: (err: any) => {
      const data = err.response?.data
      if (data?.detail) {
        setError(data.detail)
      } else if (data?.title) {
        setError(`Заголовок: ${data.title[0]}`)
      } else if (data?.content) {
        setError(`Содержание: ${data.content[0]}`)
      } else if (typeof data === 'object') {
        const firstError = Object.entries(data)[0]
        if (firstError) {
          setError(`${firstError[0]}: ${firstError[1]}`)
        } else {
          setError('Ошибка при обновлении новости')
        }
      } else {
        setError('Ошибка при обновлении новости')
      }
    },
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    const files: FileWithPreview[] = selectedFiles.map((file) => ({
      file,
      id: Math.random().toString(36).substring(7),
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
    }))
    setNewFiles((prev) => [...prev, ...files])
    e.target.value = ''
  }

  const removeNewFile = (fileId: string) => {
    setNewFiles((prev) => {
      const file = prev.find((f) => f.id === fileId)
      if (file?.preview) {
        URL.revokeObjectURL(file.preview)
      }
      return prev.filter((f) => f.id !== fileId)
    })
  }

  const markAttachmentForDeletion = (attachmentId: number) => {
    setAttachmentsToDelete((prev) => [...prev, attachmentId])
    setExistingAttachments((prev) => prev.filter((a) => a.id !== attachmentId))
  }

  const handleSaveDraft = () => {
    setError('')
    if (!title.trim()) {
      setError('Заголовок обязателен')
      return
    }
    updateNewsMutation.mutate('draft')
  }

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!title.trim()) {
      setError('Заголовок обязателен')
      return
    }

    if (!content.blocks || content.blocks.length === 0) {
      setError('Содержание обязательно для публикации')
      return
    }

    updateNewsMutation.mutate('published')
  }

  const handleUnpublish = () => {
    setError('')
    updateNewsMutation.mutate('draft')
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
        <Loading withOverlay={false} />
      </div>
    )
  }

  if (!news) {
    return (
      <div>
        <Button kind="ghost" renderIcon={ArrowLeft} onClick={() => navigate('/news')}>
          Вернуться к новостям
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
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Button
            kind="ghost"
            hasIconOnly
            renderIcon={ArrowLeft}
            iconDescription="Назад"
            onClick={() => navigate(-1)}
          />
          <h1 className="page-title">Редактирование новости</h1>
        </div>
      </div>

      <form onSubmit={handlePublish}>
        <Tile>
          <h3 style={{ fontWeight: 600, marginBottom: '1rem' }}>Редактировать публикацию</h3>

          {error && (
            <InlineNotification
              kind="error"
              title="Ошибка"
              subtitle={error}
              hideCloseButton
              lowContrast
              style={{ marginBottom: '1rem' }}
            />
          )}

          <div style={{ marginBottom: '1rem' }}>
            <TextInput
              id="title"
              labelText="Заголовок"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Введите заголовок новости"
              required
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <RichTextEditor
              data={content}
              onChange={setContent}
              placeholder="Напишите текст новости..."
              label="Содержание"
            />
          </div>

          {/* Tags selection */}
          {tagsData && tagsData.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <MultiSelect
                id="tags"
                titleText="Теги"
                label="Выберите теги"
                items={tagsData}
                itemToString={(item) => item?.name || ''}
                selectedItems={selectedTags}
                onChange={({ selectedItems }) => setSelectedTags(selectedItems as NewsTag[])}
              />
              {selectedTags.length > 0 && (
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                  {selectedTags.map((tag) => (
                    <Tag
                      key={tag.id}
                      type={tag.color as 'gray' | 'blue' | 'green' | 'red' | 'purple' | 'cyan' | 'teal' | 'magenta'}
                      filter
                      onClose={() => setSelectedTags(selectedTags.filter(t => t.id !== tag.id))}
                    >
                      {tag.name}
                    </Tag>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Existing attachments */}
          {existingAttachments.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <p style={{ fontSize: '0.75rem', fontWeight: 400, marginBottom: '0.5rem', color: 'var(--cds-text-secondary)' }}>
                Текущие вложения
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {existingAttachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.75rem',
                      background: 'var(--cds-layer-02)',
                    }}
                  >
                    <Attachment size={20} style={{ color: 'var(--cds-text-secondary)' }} />
                    <p style={{ flex: 1, fontSize: '0.875rem', fontWeight: 500 }}>{attachment.file_name}</p>
                    <Button
                      kind="danger--tertiary"
                      hasIconOnly
                      renderIcon={TrashCan}
                      iconDescription="Удалить"
                      size="sm"
                      onClick={() => markAttachmentForDeletion(attachment.id)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* New file attachments */}
          <div style={{ marginBottom: '1.5rem' }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 400, marginBottom: '0.5rem', color: 'var(--cds-text-secondary)' }}>
              Добавить вложения
            </p>
            <div
              style={{
                border: '2px dashed var(--cds-border-subtle-01)',
                padding: '1.5rem',
                textAlign: 'center',
              }}
            >
              <input
                type="file"
                id="file-upload"
                multiple
                onChange={handleFileChange}
                style={{ display: 'none' }}
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
              />
              <label htmlFor="file-upload" style={{ cursor: 'pointer' }}>
                <Upload size={32} style={{ color: 'var(--cds-text-helper)', marginBottom: '0.5rem' }} />
                <p style={{ fontSize: '0.875rem', color: 'var(--cds-text-secondary)' }}>
                  Нажмите для загрузки или перетащите файлы
                </p>
              </label>
            </div>

            {newFiles.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
                {newFiles.map((f) => (
                  <div
                    key={f.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.75rem',
                      background: 'var(--cds-layer-02)',
                    }}
                  >
                    {f.preview ? (
                      <img
                        src={f.preview}
                        alt={f.file.name}
                        style={{ width: '48px', height: '48px', objectFit: 'cover' }}
                      />
                    ) : (
                      <Attachment size={20} style={{ color: 'var(--cds-text-secondary)' }} />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '0.875rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {f.file.name}
                      </p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--cds-text-helper)' }}>
                        {formatFileSize(f.file.size)}
                      </p>
                    </div>
                    <Button
                      kind="ghost"
                      hasIconOnly
                      renderIcon={Close}
                      iconDescription="Удалить"
                      size="sm"
                      onClick={() => removeNewFile(f.id)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Status indicator */}
          {news && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '1rem',
              padding: '0.5rem 0.75rem',
              background: status === 'published' ? 'var(--cds-support-success)' : 'var(--cds-layer-02)',
              color: status === 'published' ? 'white' : 'var(--cds-text-primary)',
              fontSize: '0.875rem',
            }}>
              <span style={{ fontWeight: 500 }}>
                Статус: {status === 'published' ? 'Опубликована' : status === 'scheduled' ? 'Запланирована' : 'Черновик'}
              </span>
            </div>
          )}

          {/* Options */}
          <div style={{ marginBottom: '1.5rem' }}>
            <Checkbox
              id="is_pinned"
              labelText="Закрепить новость"
              checked={isPinned}
              onChange={(_, { checked }) => setIsPinned(checked)}
            />
          </div>

          <div style={{
            display: 'flex',
            gap: '0.75rem',
            flexWrap: 'wrap',
            paddingTop: '1rem',
            borderTop: '1px solid var(--cds-border-subtle-01)'
          }}>
            {status !== 'published' ? (
              <>
                <Button
                  type="submit"
                  renderIcon={Send}
                  disabled={updateNewsMutation.isPending}
                >
                  {updateNewsMutation.isPending ? 'Публикация...' : 'Опубликовать'}
                </Button>
                <Button
                  kind="secondary"
                  renderIcon={DocumentBlank}
                  onClick={handleSaveDraft}
                  disabled={updateNewsMutation.isPending}
                >
                  Сохранить черновик
                </Button>
              </>
            ) : (
              <>
                <Button
                  type="submit"
                  disabled={updateNewsMutation.isPending}
                >
                  {updateNewsMutation.isPending ? 'Сохранение...' : 'Сохранить изменения'}
                </Button>
                <Button
                  kind="danger--tertiary"
                  renderIcon={Undo}
                  onClick={handleUnpublish}
                  disabled={updateNewsMutation.isPending}
                >
                  Снять с публикации
                </Button>
              </>
            )}
            <Button kind="ghost" onClick={() => navigate(-1)}>
              Отмена
            </Button>
          </div>
        </Tile>
      </form>
    </div>
  )
}
