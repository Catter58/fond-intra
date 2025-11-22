import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Edit, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { achievementsApi } from '@/api/endpoints/achievements'
import type { Achievement } from '@/types'

const EMOJI_OPTIONS = ['🏆', '⭐', '🎯', '🚀', '💡', '🔥', '💪', '🎉', '👏', '❤️', '🌟', '✨']
const CATEGORIES = [
  { value: 'professional', label: 'Профессиональные' },
  { value: 'corporate', label: 'Корпоративные' },
  { value: 'social', label: 'Социальные' },
  { value: 'special', label: 'Особые' },
]

export function AdminAchievementTypesPage() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '🏆',
    category: 'professional',
  })
  const [error, setError] = useState('')

  const { data: achievements, isLoading } = useQuery({
    queryKey: ['achievement-types'],
    queryFn: achievementsApi.getTypes,
  })

  const createMutation = useMutation({
    mutationFn: achievementsApi.createType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['achievement-types'] })
      resetForm()
    },
    onError: (err: any) => setError(err.response?.data?.detail || 'Ошибка'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => achievementsApi.updateType(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['achievement-types'] })
      resetForm()
    },
    onError: (err: any) => setError(err.response?.data?.detail || 'Ошибка'),
  })

  const deleteMutation = useMutation({
    mutationFn: achievementsApi.deleteType,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['achievement-types'] }),
  })

  const resetForm = () => {
    setShowForm(false)
    setEditingId(null)
    setFormData({ name: '', description: '', icon: '🏆', category: 'professional' })
    setError('')
  }

  const handleEdit = (achievement: Achievement) => {
    setEditingId(achievement.id)
    setFormData({
      name: achievement.name,
      description: achievement.description,
      icon: achievement.icon,
      category: achievement.category,
    })
    setShowForm(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: formData })
    } else {
      createMutation.mutate(formData)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-text-primary">Типы достижений</h1>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Добавить тип
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'Редактирование' : 'Новый тип достижения'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-support-error/10 text-support-error text-sm rounded">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Название *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Категория</Label>
                  <select
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="flex h-12 w-full border border-input bg-background px-3 py-2 text-sm"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="description">Описание *</Label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="flex w-full border border-input bg-background px-3 py-2 text-sm min-h-[80px]"
                    required
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>Иконка</Label>
                  <div className="flex flex-wrap gap-2">
                    {EMOJI_OPTIONS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setFormData({ ...formData, icon: emoji })}
                        className={`text-2xl p-2 rounded hover:bg-layer-hover ${
                          formData.icon === emoji ? 'bg-interactive-primary/10 ring-2 ring-interactive-primary' : ''
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingId ? 'Сохранить' : 'Создать'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>Отмена</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* List */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 text-center text-text-secondary">Загрузка...</div>
          ) : achievements && achievements.length > 0 ? (
            <div className="divide-y">
              {achievements.map((achievement) => (
                <div key={achievement.id} className="flex items-center gap-4 p-4 hover:bg-layer-hover">
                  <span className="text-3xl">{achievement.icon}</span>
                  <div className="flex-1">
                    <p className="font-medium">{achievement.name}</p>
                    <p className="text-sm text-text-secondary line-clamp-1">{achievement.description}</p>
                    <p className="text-xs text-text-helper">
                      {CATEGORIES.find(c => c.value === achievement.category)?.label}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(achievement)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (confirm('Удалить тип достижения?')) deleteMutation.mutate(achievement.id)
                      }}
                      className="text-support-error hover:text-support-error"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-text-secondary">Типы достижений не созданы</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
