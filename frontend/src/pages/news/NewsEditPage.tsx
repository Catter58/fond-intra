import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Tile, Button, TextInput, TextArea, Loading, InlineNotification } from '@carbon/react'
import { ArrowLeft, Attachment, TrashCan, Upload, Close } from '@carbon/icons-react'
import { newsApi } from '@/api/endpoints/news'
import type { NewsAttachment } from '@/types'

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
  const [content, setContent] = useState('')
  const [newFiles, setNewFiles] = useState<FileWithPreview[]>([])
  const [existingAttachments, setExistingAttachments] = useState<NewsAttachment[]>([])
  const [attachmentsToDelete, setAttachmentsToDelete] = useState<number[]>([])
  const [error, setError] = useState('')

  const { data: news, isLoading } = useQuery({
    queryKey: ['news', id],
    queryFn: () => newsApi.getById(Number(id)),
    enabled: !!id,
  })

  useEffect(() => {
    if (news) {
      setTitle(news.title)
      setContent(news.content)
      setExistingAttachments(news.attachments || [])
    }
  }, [news])

  const updateNewsMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData()
      formData.append('title', title)
      formData.append('content', content)

      newFiles.forEach((f) => {
        formData.append('attachments', f.file)
      })

      if (attachmentsToDelete.length > 0) {
        formData.append('delete_attachments', JSON.stringify(attachmentsToDelete))
      }

      return newsApi.update(Number(id), formData)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['news', id] })
      navigate(`/news/${id}`)
    },
    onError: (err: any) => {
      setError(err.response?.data?.detail || 'Ошибка при обновлении новости')
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!title.trim()) {
      setError('Заголовок обязателен')
      return
    }

    if (!content.trim()) {
      setError('Содержание обязательно')
      return
    }

    updateNewsMutation.mutate()
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

      <form onSubmit={handleSubmit}>
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
            <TextArea
              id="content"
              labelText="Содержание"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Напишите текст новости..."
              rows={10}
              required
            />
          </div>

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
                      kind="danger--ghost"
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

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Button type="submit" disabled={updateNewsMutation.isPending}>
              {updateNewsMutation.isPending ? 'Сохранение...' : 'Сохранить изменения'}
            </Button>
            <Button kind="secondary" onClick={() => navigate(-1)}>
              Отмена
            </Button>
          </div>
        </Tile>
      </form>
    </div>
  )
}
