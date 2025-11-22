import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { usersApi } from '@/api/endpoints/users'
import { apiClient } from '@/api/client'
import type { Department, Position, Role } from '@/types'

export function AdminUserFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isEdit = !!id

  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    patronymic: '',
    phone: '',
    department_id: '',
    position_id: '',
    hire_date: '',
    role_id: '',
  })
  const [error, setError] = useState('')

  const { data: user } = useQuery({
    queryKey: ['user', id],
    queryFn: () => usersApi.getById(Number(id)),
    enabled: isEdit,
  })

  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const response = await apiClient.get<Department[]>('/organization/departments/')
      return response.data
    },
  })

  const { data: positions } = useQuery({
    queryKey: ['positions'],
    queryFn: async () => {
      const response = await apiClient.get<Position[]>('/organization/positions/')
      return response.data
    },
  })

  const { data: roles } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const response = await apiClient.get<Role[]>('/admin/roles/')
      return response.data
    },
  })

  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        patronymic: user.patronymic || '',
        phone: user.phone_personal || '',
        department_id: user.department?.id?.toString() || '',
        position_id: user.position?.id?.toString() || '',
        hire_date: user.hire_date || '',
        role_id: user.role?.id?.toString() || '',
      })
    }
  }, [user])

  const createMutation = useMutation({
    mutationFn: (data: any) => usersApi.adminCreate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
      navigate('/admin/users')
    },
    onError: (err: any) => {
      setError(err.response?.data?.detail || 'Ошибка при создании сотрудника')
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: any) => usersApi.adminUpdate(Number(id), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
      queryClient.invalidateQueries({ queryKey: ['user', id] })
      navigate('/admin/users')
    },
    onError: (err: any) => {
      setError(err.response?.data?.detail || 'Ошибка при обновлении сотрудника')
    },
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const data = {
      ...formData,
      department_id: formData.department_id ? Number(formData.department_id) : null,
      position_id: formData.position_id ? Number(formData.position_id) : null,
      role_id: formData.role_id ? Number(formData.role_id) : null,
    }

    if (isEdit) {
      updateMutation.mutate(data)
    } else {
      createMutation.mutate(data)
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-semibold text-text-primary">
          {isEdit ? 'Редактирование сотрудника' : 'Новый сотрудник'}
        </h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Информация о сотруднике</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 bg-support-error/10 border border-support-error text-support-error text-sm rounded">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Телефон</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="last_name">Фамилия *</Label>
                <Input
                  id="last_name"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="first_name">Имя *</Label>
                <Input
                  id="first_name"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="patronymic">Отчество</Label>
                <Input
                  id="patronymic"
                  name="patronymic"
                  value={formData.patronymic}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hire_date">Дата найма</Label>
                <Input
                  id="hire_date"
                  name="hire_date"
                  type="date"
                  value={formData.hire_date}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="department_id">Отдел</Label>
                <select
                  id="department_id"
                  name="department_id"
                  value={formData.department_id}
                  onChange={handleChange}
                  className="flex h-12 w-full border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Не выбран</option>
                  {departments?.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="position_id">Должность</Label>
                <select
                  id="position_id"
                  name="position_id"
                  value={formData.position_id}
                  onChange={handleChange}
                  className="flex h-12 w-full border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Не выбрана</option>
                  {positions?.map((pos) => (
                    <option key={pos.id} value={pos.id}>
                      {pos.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="role_id">Роль</Label>
                <select
                  id="role_id"
                  name="role_id"
                  value={formData.role_id}
                  onChange={handleChange}
                  className="flex h-12 w-full border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Не выбрана</option>
                  {roles?.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name} {role.description && `— ${role.description}`}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Сохранение...' : isEdit ? 'Сохранить' : 'Создать'}
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
