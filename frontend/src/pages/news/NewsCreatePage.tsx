import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { Tile, Button, TextInput, TextArea, InlineNotification } from '@carbon/react'
import { ArrowLeft, Attachment, Close, Upload } from '@carbon/icons-react'
import { newsApi } from '@/api/endpoints/news'

interface FileWithPreview {
  file: File
  id: string
  preview?: string
}

export function NewsCreatePage() {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [files, setFiles] = useState<FileWithPreview[]>([])
  const [error, setError] = useState('')

  const createNewsMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData()
      formData.append('title', title)
      formData.append('content', content)
      files.forEach((f) => {
        formData.append('attachments', f.file)
      })
      return newsApi.create(formData)
    },
    onSuccess: (data) => {
      navigate(`/news/${data.id}`)
    },
    onError: (err: any) => {
      setError(err.response?.data?.detail || 'Ошибка при создании новости')
    },
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    const newFiles: FileWithPreview[] = selectedFiles.map((file) => ({
      file,
      id: Math.random().toString(36).substring(7),
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
    }))
    setFiles((prev) => [...prev, ...newFiles])
    e.target.value = ''
  }

  const removeFile = (id: string) => {
    setFiles((prev) => {
      const file = prev.find((f) => f.id === id)
      if (file?.preview) {
        URL.revokeObjectURL(file.preview)
      }
      return prev.filter((f) => f.id !== id)
    })
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

    createNewsMutation.mutate()
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
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
          <h1 className="page-title">Создание новости</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Tile>
          <h3 style={{ fontWeight: 600, marginBottom: '1rem' }}>Новая публикация</h3>

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

          {/* File attachments */}
          <div style={{ marginBottom: '1.5rem' }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 400, marginBottom: '0.5rem', color: 'var(--cds-text-secondary)' }}>
              Вложения
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
                <p style={{ fontSize: '0.75rem', color: 'var(--cds-text-helper)', marginTop: '0.25rem' }}>
                  Изображения, PDF, документы (макс. 10 MB)
                </p>
              </label>
            </div>

            {/* File list */}
            {files.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
                {files.map((f) => (
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
                      onClick={() => removeFile(f.id)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Button type="submit" disabled={createNewsMutation.isPending}>
              {createNewsMutation.isPending ? 'Публикация...' : 'Опубликовать'}
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
