import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Tile,
  Button,
  TextInput,
  Select,
  SelectItem,
  InlineNotification,
  Modal,
} from '@carbon/react'
import { Add, Building } from '@carbon/icons-react'
import { apiClient } from '@/api/client'
import { AdminDataTable, exportToCSV } from '@/components/admin'
import type { Department } from '@/types'

export function AdminDepartmentsPage() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState({ name: '', description: '', parent_id: '' })
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null)

  const { data: departments, isLoading } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const response = await apiClient.get<Department[]>('/organization/departments/')
      return response.data
    },
  })

  const createMutation = useMutation({
    mutationFn: async (data: { name: string; description: string; parent: number | null }) => {
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
    mutationFn: async ({ id, data }: { id: number; data: { name: string; description: string; parent: number | null } }) => {
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] })
      setDeleteConfirmId(null)
    },
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
      parent: formData.parent_id ? Number(formData.parent_id) : null,
    }
    if (editingId) {
      updateMutation.mutate({ id: editingId, data })
    } else {
      createMutation.mutate(data)
    }
  }

  // Filter departments by search
  const filteredDepartments = departments?.filter(dept =>
    dept.name.toLowerCase().includes(search.toLowerCase()) ||
    dept.description?.toLowerCase().includes(search.toLowerCase())
  ) || []

  const handleExport = () => {
    if (!departments) return
    exportToCSV(
      departments.map(dept => ({
        name: dept.name,
        description: dept.description || '',
        parent: dept.parent_name || '',
      })),
      [
        { key: 'name', label: 'Название' },
        { key: 'description', label: 'Описание' },
        { key: 'parent', label: 'Родительский отдел' },
      ],
      `departments_${new Date().toISOString().split('T')[0]}`
    )
  }

  const headers = [
    { key: 'name', header: 'Отдел' },
    { key: 'description', header: 'Описание' },
    { key: 'parent', header: 'Родитель' },
  ]

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

      {/* Departments table */}
      <AdminDataTable
        rows={filteredDepartments}
        headers={headers}
        isLoading={isLoading}
        emptyMessage="Отделы не созданы"
        emptyIcon={Building}
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
            onClick: (dept) => setDeleteConfirmId(dept.id),
            isDelete: true,
          },
        ]}
        renderCell={(dept, key) => {
          switch (key) {
            case 'name':
              return (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Building size={16} style={{ color: 'var(--cds-text-secondary)' }} />
                  <span style={{ fontWeight: 500 }}>{dept.name}</span>
                </div>
              )
            case 'description':
              return (
                <span style={{ color: dept.description ? 'inherit' : 'var(--cds-text-helper)' }}>
                  {dept.description || '—'}
                </span>
              )
            case 'parent':
              return (
                <span style={{ color: dept.parent_name ? 'inherit' : 'var(--cds-text-helper)' }}>
                  {dept.parent_name || 'Корневой'}
                </span>
              )
            default:
              return null
          }
        }}
      />

      {/* Delete confirmation modal */}
      <Modal
        open={deleteConfirmId !== null}
        modalHeading="Удалить отдел?"
        primaryButtonText="Удалить"
        secondaryButtonText="Отмена"
        danger
        onRequestClose={() => setDeleteConfirmId(null)}
        onRequestSubmit={() => deleteConfirmId && deleteMutation.mutate(deleteConfirmId)}
      >
        <p>Это действие нельзя отменить. Все подотделы и сотрудники этого отдела будут отвязаны.</p>
      </Modal>
    </div>
  )
}
