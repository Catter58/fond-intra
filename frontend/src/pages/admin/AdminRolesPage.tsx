import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Tile, Button, TextInput, Checkbox, Loading, InlineNotification } from '@carbon/react'
import { Add, Edit, TrashCan, Security } from '@carbon/icons-react'
import { apiClient } from '@/api/client'
import type { Role, Permission } from '@/types'

export function AdminRolesPage() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState({ name: '', description: '', permissions: [] as number[] })
  const [error, setError] = useState('')

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

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiClient.post('/admin/roles/', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] })
      resetForm()
    },
    onError: (err: any) => setError(err.response?.data?.detail || 'Ошибка'),
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
    onError: (err: any) => setError(err.response?.data?.detail || 'Ошибка'),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/admin/roles/${id}/`)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['roles'] }),
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

      {/* Roles list */}
      <Tile>
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
            <Loading withOverlay={false} />
          </div>
        ) : roles && roles.length > 0 ? (
          <div>
            {roles.map((role, index) => (
              <div
                key={role.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '1rem',
                  padding: '1rem',
                  borderBottom: index < roles.length - 1 ? '1px solid var(--cds-border-subtle-01)' : 'none',
                }}
              >
                <Security size={20} style={{ color: 'var(--cds-text-secondary)', marginTop: '0.125rem' }} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 500 }}>
                    {role.name}
                    {role.is_system && (
                      <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', background: 'var(--cds-layer-02)', padding: '0.125rem 0.5rem' }}>
                        Системная
                      </span>
                    )}
                  </p>
                  {role.description && (
                    <p style={{ fontSize: '0.875rem', color: 'var(--cds-text-secondary)' }}>{role.description}</p>
                  )}
                  <p style={{ fontSize: '0.75rem', color: 'var(--cds-text-helper)', marginTop: '0.25rem' }}>
                    {role.permissions?.length || 0} прав
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.25rem' }}>
                  <Button kind="ghost" hasIconOnly renderIcon={Edit} iconDescription="Редактировать" size="sm" onClick={() => handleEdit(role)} />
                  {!role.is_system && (
                    <Button
                      kind="danger--ghost"
                      hasIconOnly
                      renderIcon={TrashCan}
                      iconDescription="Удалить"
                      size="sm"
                      onClick={() => {
                        if (confirm('Удалить роль?')) deleteMutation.mutate(role.id)
                      }}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--cds-text-secondary)' }}>Роли не созданы</p>
        )}
      </Tile>
    </div>
  )
}
