import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Paperclip, X, Upload, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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

      // New files
      newFiles.forEach((f) => {
        formData.append('attachments', f.file)
      })

      // Attachments to delete
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
      <div className="flex items-center justify-center py-12">
        <p className="text-text-secondary">Загрузка...</p>
      </div>
    )
  }

  if (!news) {
    return (
      <div className="text-center py-12">
        <p className="text-text-secondary">Новость не найдена</p>
        <Button variant="outline" onClick={() => navigate('/news')} className="mt-4">
          Вернуться к новостям
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-semibold text-text-primary">
          Редактирование новости
        </h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Редактировать публикацию</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 bg-support-error/10 border border-support-error text-support-error text-sm rounded">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="title">Заголовок</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Введите заголовок новости"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Содержание</Label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Напишите текст новости..."
                rows={10}
                className="flex w-full border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y min-h-[200px]"
                required
              />
            </div>

            {/* Existing attachments */}
            {existingAttachments.length > 0 && (
              <div className="space-y-2">
                <Label>Текущие вложения</Label>
                <div className="space-y-2">
                  {existingAttachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="flex items-center gap-3 p-3 bg-layer-02 rounded"
                    >
                      <div className="w-12 h-12 bg-layer-hover rounded flex items-center justify-center">
                        <Paperclip className="h-5 w-5 text-text-secondary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{attachment.file_name}</p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => markAttachmentForDeletion(attachment.id)}
                        className="text-support-error hover:text-support-error"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* New file attachments */}
            <div className="space-y-2">
              <Label>Добавить вложения</Label>
              <div className="border-2 border-dashed border-input rounded p-4">
                <input
                  type="file"
                  id="file-upload"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                />
                <label
                  htmlFor="file-upload"
                  className="flex flex-col items-center justify-center cursor-pointer py-4"
                >
                  <Upload className="h-8 w-8 text-text-helper mb-2" />
                  <span className="text-sm text-text-secondary">
                    Нажмите для загрузки или перетащите файлы
                  </span>
                </label>
              </div>

              {/* New files list */}
              {newFiles.length > 0 && (
                <div className="space-y-2 mt-4">
                  {newFiles.map((f) => (
                    <div
                      key={f.id}
                      className="flex items-center gap-3 p-3 bg-layer-02 rounded"
                    >
                      {f.preview ? (
                        <img
                          src={f.preview}
                          alt={f.file.name}
                          className="w-12 h-12 object-cover rounded"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-layer-hover rounded flex items-center justify-center">
                          <Paperclip className="h-5 w-5 text-text-secondary" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{f.file.name}</p>
                        <p className="text-xs text-text-helper">
                          {formatFileSize(f.file.size)}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeNewFile(f.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={updateNewsMutation.isPending}>
                {updateNewsMutation.isPending ? 'Сохранение...' : 'Сохранить изменения'}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                Отмена
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
