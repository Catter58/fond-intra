import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Tile, Button, TextInput, Select, SelectItem, Loading, InlineNotification } from '@carbon/react'
import { Add, Edit, TrashCan, Building } from '@carbon/icons-react'
import { apiClient } from '@/api/client'
import type { Department } from '@/types'

export function AdminDepartmentsPage() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState({ name: '', description: '', parent_id: '' })
  const [error, setError] = useState('')

  const { data: departments, isLoading } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const response = await apiClient.get<Department[]>('/organization/departments/')
      return response.data
    },
  })

  const createMutation = useMutation({
    mutationFn: async (data: { name: string; description: string; parent_id: number | null }) => {
      const response = await apiClient.post('/organization/departments/', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] })
      resetForm()
    },
    onError: (err: any) => setError(err.response?.data?.detail || 'Ошибка'),
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: { name: string; description: string; parent_id: number | null } }) => {
      const response = await apiClient.patch(`/organization/departments/${id}/`, data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] })
      resetForm()
    },
    onError: (err: any) => setError(err.response?.data?.detail || 'Ошибка'),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/organization/departments/${id}/`)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['departments'] }),
  })

  const resetForm = () => {
    setShowForm(false)
    setEditingId(null)
    setFormData({ name: '', description: '', parent_id: '' })
    setError('')
  }

  const handleEdit = (dept: Department) => {
    setEditingId(dept.id)
    setFormData({
      name: dept.name,
      description: dept.description || '',
      parent_id: dept.parent?.toString() || '',
    })
    setShowForm(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const data = {
      name: formData.name,
      description: formData.description,
      parent_id: formData.parent_id ? Number(formData.parent_id) : null,
    }
    if (editingId) {
      updateMutation.mutate({ id: editingId, data })
    } else {
      createMutation.mutate(data)
    }
  }

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 className="page-title">Управление отделами</h1>
          <Button renderIcon={Add} onClick={() => setShowForm(true)}>
            Добавить отдел
          </Button>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <Tile style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontWeight: 600, marginBottom: '1rem' }}>
            {editingId ? 'Редактирование' : 'Новый отдел'}
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
                id="parent"
                labelText="Родительский отдел"
                value={formData.parent_id}
                onChange={(e) => setFormData({ ...formData, parent_id: e.target.value })}
              >
                <SelectItem value="" text="Нет (корневой)" />
                {departments?.filter(d => d.id !== editingId).map((dept) => (
                  <SelectItem key={dept.id} value={String(dept.id)} text={dept.name} />
                ))}
              </Select>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <TextInput
                id="description"
                labelText="Описание"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
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

      {/* Departments list */}
      <Tile>
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
            <Loading withOverlay={false} />
          </div>
        ) : departments && departments.length > 0 ? (
          <div>
            {departments.map((dept, index) => (
              <div
                key={dept.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '1rem',
                  borderBottom: index < departments.length - 1 ? '1px solid var(--cds-border-subtle-01)' : 'none',
                }}
              >
                <Building size={20} style={{ color: 'var(--cds-text-secondary)' }} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 500 }}>{dept.name}</p>
                  {dept.description && (
                    <p style={{ fontSize: '0.875rem', color: 'var(--cds-text-secondary)' }}>{dept.description}</p>
                  )}
                  {dept.parent_name && (
                    <p style={{ fontSize: '0.75rem', color: 'var(--cds-text-helper)' }}>Родитель: {dept.parent_name}</p>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '0.25rem' }}>
                  <Button kind="ghost" hasIconOnly renderIcon={Edit} iconDescription="Редактировать" size="sm" onClick={() => handleEdit(dept)} />
                  <Button
                    kind="danger--ghost"
                    hasIconOnly
                    renderIcon={TrashCan}
                    iconDescription="Удалить"
                    size="sm"
                    onClick={() => {
                      if (confirm('Удалить отдел?')) deleteMutation.mutate(dept.id)
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--cds-text-secondary)' }}>Отделы не созданы</p>
        )}
      </Tile>
    </div>
  )
}
