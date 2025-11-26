import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Tile,
  Button,
  TextInput,
  TextArea,
  Select,
  SelectItem,
  InlineNotification,
  Checkbox,
  NumberInput,
  Modal,
  Tag,
} from '@carbon/react'
import { Add, Trophy } from '@carbon/icons-react'
import { achievementsApi } from '@/api/endpoints/achievements'
import { AdminDataTable, exportToCSV } from '@/components/admin'
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
    is_automatic: false,
    trigger_type: '',
    trigger_value: 1,
  })
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null)

  const { data: achievements, isLoading } = useQuery({
    queryKey: ['achievement-types'],
    queryFn: achievementsApi.getTypes,
  })

  const { data: triggerTypes } = useQuery({
    queryKey: ['trigger-types'],
    queryFn: achievementsApi.getTriggerTypes,
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['achievement-types'] })
      setDeleteConfirmId(null)
    },
  })

  const resetForm = () => {
    setShowForm(false)
    setEditingId(null)
    setFormData({
      name: '',
      description: '',
      icon: '🏆',
      category: 'professional',
      is_automatic: false,
      trigger_type: '',
      trigger_value: 1,
    })
    setError('')
  }

  const handleEdit = (achievement: Achievement) => {
    setEditingId(achievement.id)
    setFormData({
      name: achievement.name,
      description: achievement.description,
      icon: achievement.icon,
      category: achievement.category,
      is_automatic: achievement.is_automatic,
      trigger_type: achievement.trigger_type || '',
      trigger_value: achievement.trigger_value || 1,
    })
    setShowForm(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const submitData = {
      ...formData,
      trigger_type: formData.is_automatic && formData.trigger_type ? formData.trigger_type : null,
      trigger_value: formData.is_automatic && formData.trigger_value ? formData.trigger_value : null,
    }

    if (editingId) {
      updateMutation.mutate({ id: editingId, data: submitData })
    } else {
      createMutation.mutate(submitData)
    }
  }

  // Filter achievements by search
  const filteredAchievements = achievements?.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.description?.toLowerCase().includes(search.toLowerCase())
  ) || []

  const handleExport = () => {
    if (!achievements) return
    exportToCSV(
      achievements.map(a => ({
        name: a.name,
        description: a.description,
        category: CATEGORIES.find(c => c.value === a.category)?.label || a.category,
        icon: a.icon,
        is_automatic: a.is_automatic ? 'Да' : 'Нет',
        trigger_type: a.trigger_type_display || '',
        trigger_value: a.trigger_value || '',
      })),
      [
        { key: 'name', label: 'Название' },
        { key: 'description', label: 'Описание' },
        { key: 'category', label: 'Категория' },
        { key: 'icon', label: 'Иконка' },
        { key: 'is_automatic', label: 'Автоматическое' },
        { key: 'trigger_type', label: 'Триггер' },
        { key: 'trigger_value', label: 'Порог' },
      ],
      `achievement_types_${new Date().toISOString().split('T')[0]}`
    )
  }

  const headers = [
    { key: 'name', header: 'Достижение' },
    { key: 'category', header: 'Категория' },
    { key: 'trigger', header: 'Условие' },
  ]

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

            <div style={{ marginBottom: '1rem' }}>
              <Checkbox
                id="is_automatic"
                labelText="Автоматическое достижение"
                checked={formData.is_automatic}
                onChange={(_, { checked }) => setFormData({ ...formData, is_automatic: checked })}
              />
              <p style={{ fontSize: '0.75rem', color: 'var(--cds-text-helper)', marginTop: '0.25rem', marginLeft: '1.5rem' }}>
                Будет автоматически присуждаться при достижении порогового значения
              </p>
            </div>

            {formData.is_automatic && (
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <Select
                  id="trigger_type"
                  labelText="Тип триггера *"
                  value={formData.trigger_type}
                  onChange={(e) => setFormData({ ...formData, trigger_type: e.target.value })}
                  required={formData.is_automatic}
                >
                  <SelectItem value="" text="Выберите тип триггера" />
                  {triggerTypes?.map((type) => (
                    <SelectItem key={type.value} value={type.value} text={type.label} />
                  ))}
                </Select>
                <NumberInput
                  id="trigger_value"
                  label="Пороговое значение *"
                  value={formData.trigger_value}
                  onChange={(_, { value }) => setFormData({ ...formData, trigger_value: typeof value === 'number' ? value : (parseInt(String(value)) || 1) })}
                  min={1}
                  step={1}
                  required={formData.is_automatic}
                />
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {editingId ? 'Сохранить' : 'Создать'}
              </Button>
              <Button kind="secondary" onClick={resetForm}>Отмена</Button>
            </div>
          </form>
        </Tile>
      )}

      {/* Achievements table */}
      <AdminDataTable
        rows={filteredAchievements}
        headers={headers}
        isLoading={isLoading}
        emptyMessage="Типы достижений не созданы"
        emptyIcon={Trophy}
        searchPlaceholder="Поиск по названию..."
        searchValue={search}
        onSearchChange={setSearch}
        exportConfig={{
          enabled: true,
          onExport: handleExport,
        }}
        rowActions={[
          {
            label: 'Редактировать',
            onClick: handleEdit,
          },
          {
            label: 'Удалить',
            onClick: (a) => setDeleteConfirmId(a.id),
            isDelete: true,
          },
        ]}
        renderCell={(achievement, key) => {
          switch (key) {
            case 'name':
              return (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontSize: '1.5rem' }}>{achievement.icon}</span>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontWeight: 500 }}>{achievement.name}</span>
                      {achievement.is_automatic && (
                        <Tag size="sm" type="blue">Авто</Tag>
                      )}
                    </div>
                    <p style={{ fontSize: '0.875rem', color: 'var(--cds-text-secondary)', marginTop: '0.125rem' }}>
                      {achievement.description.length > 60
                        ? achievement.description.slice(0, 60) + '...'
                        : achievement.description}
                    </p>
                  </div>
                </div>
              )
            case 'category':
              return (
                <Tag size="sm" type="gray">
                  {CATEGORIES.find(c => c.value === achievement.category)?.label || achievement.category}
                </Tag>
              )
            case 'trigger':
              return achievement.is_automatic && achievement.trigger_type_display ? (
                <span style={{ color: 'var(--cds-text-secondary)' }}>
                  {achievement.trigger_type_display}: {achievement.trigger_value}
                </span>
              ) : (
                <span style={{ color: 'var(--cds-text-helper)' }}>—</span>
              )
            default:
              return null
          }
        }}
      />

      {/* Delete confirmation modal */}
      <Modal
        open={deleteConfirmId !== null}
        modalHeading="Удалить тип достижения?"
        primaryButtonText="Удалить"
        secondaryButtonText="Отмена"
        danger
        onRequestClose={() => setDeleteConfirmId(null)}
        onRequestSubmit={() => deleteConfirmId && deleteMutation.mutate(deleteConfirmId)}
      >
        <p>Это действие нельзя отменить. Все награждения этим достижением будут сохранены.</p>
      </Modal>
    </div>
  )
}
