import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Edit, Trash2, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
    mutationFn: async (data: any) => {
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
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-text-primary">Управление отделами</h1>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Добавить отдел
        </Button>
      </div>

      {/* Form modal */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'Редактирование' : 'Новый отдел'}</CardTitle>
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
                  <Label htmlFor="parent">Родительский отдел</Label>
                  <select
                    id="parent"
                    value={formData.parent_id}
                    onChange={(e) => setFormData({ ...formData, parent_id: e.target.value })}
                    className="flex h-12 w-full border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Нет (корневой)</option>
                    {departments?.filter(d => d.id !== editingId).map((dept) => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="description">Описание</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
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

      {/* Departments list */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 text-center text-text-secondary">Загрузка...</div>
          ) : departments && departments.length > 0 ? (
            <div className="divide-y">
              {departments.map((dept) => (
                <div key={dept.id} className="flex items-center gap-4 p-4 hover:bg-layer-hover">
                  <Building2 className="h-5 w-5 text-text-secondary" />
                  <div className="flex-1">
                    <p className="font-medium">{dept.name}</p>
                    {dept.description && (
                      <p className="text-sm text-text-secondary">{dept.description}</p>
                    )}
                    {dept.parent_name && (
                      <p className="text-xs text-text-helper">Родитель: {dept.parent_name}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(dept)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (confirm('Удалить отдел?')) deleteMutation.mutate(dept.id)
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
            <div className="p-6 text-center text-text-secondary">Отделы не созданы</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
