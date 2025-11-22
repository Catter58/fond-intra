import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Edit, Trash2, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
      const response = await apiClient.get<Permission[]>('/admin/roles/permissions/')
      return response.data
    },
  })

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
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
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-text-primary">Управление ролями</h1>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Добавить роль
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'Редактирование роли' : 'Новая роль'}</CardTitle>
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
                  <Label htmlFor="description">Описание</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
              </div>

              {/* Permissions */}
              <div className="space-y-2">
                <Label>Права доступа</Label>
                <div className="border rounded p-4 max-h-64 overflow-y-auto">
                  {groupedPermissions && Object.entries(groupedPermissions).map(([category, perms]) => (
                    <div key={category} className="mb-4 last:mb-0">
                      <p className="text-xs font-semibold text-text-helper uppercase mb-2">{category}</p>
                      <div className="space-y-1">
                        {perms.map((perm) => (
                          <label
                            key={perm.id}
                            className="flex items-center gap-2 p-2 hover:bg-layer-hover rounded cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={formData.permissions.includes(perm.id)}
                              onChange={() => togglePermission(perm.id)}
                              className="w-4 h-4"
                            />
                            <span className="text-sm">{perm.name}</span>
                            <span className="text-xs text-text-helper">({perm.codename})</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
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

      {/* Roles list */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 text-center text-text-secondary">Загрузка...</div>
          ) : roles && roles.length > 0 ? (
            <div className="divide-y">
              {roles.map((role) => (
                <div key={role.id} className="flex items-start gap-4 p-4 hover:bg-layer-hover">
                  <Shield className="h-5 w-5 text-text-secondary mt-1" />
                  <div className="flex-1">
                    <p className="font-medium">
                      {role.name}
                      {role.is_system && (
                        <span className="ml-2 text-xs bg-layer-02 px-2 py-0.5 rounded">Системная</span>
                      )}
                    </p>
                    {role.description && (
                      <p className="text-sm text-text-secondary">{role.description}</p>
                    )}
                    <p className="text-xs text-text-helper mt-1">
                      {role.permissions?.length || 0} прав
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(role)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    {!role.is_system && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (confirm('Удалить роль?')) deleteMutation.mutate(role.id)
                        }}
                        className="text-support-error hover:text-support-error"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-text-secondary">Роли не созданы</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
