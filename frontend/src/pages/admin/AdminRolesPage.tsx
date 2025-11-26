import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Tile,
  Button,
  TextInput,
  Checkbox,
  InlineNotification,
  Modal,
  Tag,
} from '@carbon/react'
import { Add, Security } from '@carbon/icons-react'
import { apiClient } from '@/api/client'
import { AdminDataTable, exportToCSV } from '@/components/admin'
import type { Role, Permission } from '@/types'

export function AdminRolesPage() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState({ name: '', description: '', permissions: [] as number[] })
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null)

  const { data: roles, isLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const response = await apiClient.get<Role[]>('/admin/roles/')
      return response.data
    },
  })

  const { data: permissions } = useQuery({
    queryKey: ['permissions'],
    queryFn: async () => {
      const response = await apiClient.get<Permission[]>('/admin/permissions/')
      return response.data
    },
  })

  // Helper to extract error message from API response
  const getErrorMessage = (err: any): string => {
    const data = err.response?.data
    if (!data) return 'Ошибка сети'
    if (typeof data === 'string') return data
    if (data.detail) return data.detail
    const fieldErrors = Object.entries(data)
      .map(([field, errors]) => {
        const errorList = Array.isArray(errors) ? errors.join(', ') : String(errors)
        return `${field}: ${errorList}`
      })
      .join('; ')
    return fieldErrors || 'Неизвестная ошибка'
  }

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiClient.post('/admin/roles/', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] })
      resetForm()
    },
    onError: (err: any) => setError(getErrorMessage(err)),
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: typeof formData }) => {
      const response = await apiClient.patch(`/admin/roles/${id}/`, data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] })
      resetForm()
    },
    onError: (err: any) => setError(getErrorMessage(err)),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/admin/roles/${id}/`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] })
      setDeleteConfirmId(null)
    },
  })

  const resetForm = () => {
    setShowForm(false)
    setEditingId(null)
    setFormData({ name: '', description: '', permissions: [] })
    setError('')
  }

  const handleEdit = (role: Role) => {
    setEditingId(role.id)
    setFormData({
      name: role.name,
      description: role.description || '',
      permissions: role.permissions?.map(p => p.id) || [],
    })
    setShowForm(true)
  }

  const togglePermission = (permId: number) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permId)
        ? prev.permissions.filter(id => id !== permId)
        : [...prev.permissions, permId]
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: formData })
    } else {
      createMutation.mutate(formData)
    }
  }

  // Group permissions by category
  const groupedPermissions = permissions?.reduce((acc, perm) => {
    const category = perm.category || 'other'
    if (!acc[category]) acc[category] = []
    acc[category].push(perm)
    return acc
  }, {} as Record<string, Permission[]>)

  // Filter roles by search
  const filteredRoles = roles?.filter(role =>
    role.name.toLowerCase().includes(search.toLowerCase()) ||
    role.description?.toLowerCase().includes(search.toLowerCase())
  ) || []

  const handleExport = () => {
    if (!roles) return
    exportToCSV(
      roles.map(role => ({
        name: role.name,
        description: role.description || '',
        is_system: role.is_system ? 'Да' : 'Нет',
        permissions_count: role.permissions?.length || 0,
        permissions: role.permissions?.map(p => p.codename).join(', ') || '',
      })),
      [
        { key: 'name', label: 'Название' },
        { key: 'description', label: 'Описание' },
        { key: 'is_system', label: 'Системная' },
        { key: 'permissions_count', label: 'Кол-во прав' },
        { key: 'permissions', label: 'Права' },
      ],
      `roles_${new Date().toISOString().split('T')[0]}`
    )
  }

  const headers = [
    { key: 'name', header: 'Роль' },
    { key: 'description', header: 'Описание' },
    { key: 'permissions', header: 'Права' },
  ]

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 className="page-title">Управление ролями</h1>
          <Button renderIcon={Add} onClick={() => setShowForm(true)}>
            Добавить роль
          </Button>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <Tile style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontWeight: 600, marginBottom: '1rem' }}>
            {editingId ? 'Редактирование роли' : 'Новая роль'}
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
              <TextInput
                id="description"
                labelText="Описание"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            {/* Permissions */}
            <div style={{ marginBottom: '1rem' }}>
              <p style={{ fontWeight: 500, marginBottom: '0.5rem' }}>Права доступа</p>
              <div style={{ border: '1px solid var(--cds-border-subtle-01)', padding: '1rem', maxHeight: '250px', overflowY: 'auto' }}>
                {groupedPermissions && Object.entries(groupedPermissions).map(([category, perms]) => (
                  <div key={category} style={{ marginBottom: '1rem' }}>
                    <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--cds-text-helper)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                      {category}
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      {perms.map((perm) => (
                        <Checkbox
                          key={perm.id}
                          id={`perm-${perm.id}`}
                          labelText={`${perm.name} (${perm.codename})`}
                          checked={formData.permissions.includes(perm.id)}
                          onChange={() => togglePermission(perm.id)}
                        />
                      ))}
                    </div>
                  </div>
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

      {/* Roles table */}
      <AdminDataTable
        rows={filteredRoles}
        headers={headers}
        isLoading={isLoading}
        emptyMessage="Роли не созданы"
        emptyIcon={Security}
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
            onClick: (role) => setDeleteConfirmId(role.id),
            isDelete: true,
            isHidden: (role) => role.is_system,
          },
        ]}
        renderCell={(role, key) => {
          switch (key) {
            case 'name':
              return (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Security size={16} style={{ color: 'var(--cds-text-secondary)' }} />
                  <span style={{ fontWeight: 500 }}>{role.name}</span>
                  {role.is_system && (
                    <Tag size="sm" type="gray">Системная</Tag>
                  )}
                </div>
              )
            case 'description':
              return (
                <span style={{ color: role.description ? 'inherit' : 'var(--cds-text-helper)' }}>
                  {role.description || '—'}
                </span>
              )
            case 'permissions':
              return (
                <span style={{ color: 'var(--cds-text-secondary)' }}>
                  {role.permissions?.length || 0} прав
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
        modalHeading="Удалить роль?"
        primaryButtonText="Удалить"
        secondaryButtonText="Отмена"
        danger
        onRequestClose={() => setDeleteConfirmId(null)}
        onRequestSubmit={() => deleteConfirmId && deleteMutation.mutate(deleteConfirmId)}
      >
        <p>Это действие нельзя отменить. Пользователи с этой ролью потеряют связанные с ней права.</p>
      </Modal>
    </div>
  )
}
