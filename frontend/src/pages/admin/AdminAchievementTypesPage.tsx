import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Tile, Button, TextInput, TextArea, Select, SelectItem, Loading, InlineNotification } from '@carbon/react'
import { Add, Edit, TrashCan } from '@carbon/icons-react'
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
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 className="page-title">Типы достижений</h1>
          <Button renderIcon={Add} onClick={() => setShowForm(true)}>
            Добавить тип
          </Button>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <Tile style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontWeight: 600, marginBottom: '1rem' }}>
            {editingId ? 'Редактирование' : 'Новый тип достижения'}
          </h3>
          <form onSubmit={handleSubmit}>
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <TextInput
                id="name"
                labelText="Название *"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
              <Select
                id="category"
                labelText="Категория"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value} text={cat.label} />
                ))}
              </Select>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <TextArea
                id="description"
                labelText="Описание *"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                required
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <p style={{ fontSize: '0.75rem', fontWeight: 400, marginBottom: '0.5rem', color: 'var(--cds-text-secondary)' }}>Иконка</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {EMOJI_OPTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setFormData({ ...formData, icon: emoji })}
                    style={{
                      fontSize: '1.5rem',
                      padding: '0.5rem',
                      background: formData.icon === emoji ? 'var(--cds-layer-selected-01)' : 'transparent',
                      border: formData.icon === emoji ? '2px solid var(--cds-border-interactive)' : '2px solid transparent',
                      cursor: 'pointer',
                    }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {editingId ? 'Сохранить' : 'Создать'}
              </Button>
              <Button kind="secondary" onClick={resetForm}>Отмена</Button>
            </div>
          </form>
        </Tile>
      )}

      {/* List */}
      <Tile>
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
            <Loading withOverlay={false} />
          </div>
        ) : achievements && achievements.length > 0 ? (
          <div>
            {achievements.map((achievement, index) => (
              <div
                key={achievement.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '1rem',
                  borderBottom: index < achievements.length - 1 ? '1px solid var(--cds-border-subtle-01)' : 'none',
                }}
              >
                <span style={{ fontSize: '2rem' }}>{achievement.icon}</span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 500 }}>{achievement.name}</p>
                  <p style={{ fontSize: '0.875rem', color: 'var(--cds-text-secondary)' }}>{achievement.description}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--cds-text-helper)' }}>
                    {CATEGORIES.find(c => c.value === achievement.category)?.label}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.25rem' }}>
                  <Button kind="ghost" hasIconOnly renderIcon={Edit} iconDescription="Редактировать" size="sm" onClick={() => handleEdit(achievement)} />
                  <Button
                    kind="danger--ghost"
                    hasIconOnly
                    renderIcon={TrashCan}
                    iconDescription="Удалить"
                    size="sm"
                    onClick={() => {
                      if (confirm('Удалить тип достижения?')) deleteMutation.mutate(achievement.id)
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--cds-text-secondary)' }}>Типы достижений не созданы</p>
        )}
      </Tile>
    </div>
  )
}
