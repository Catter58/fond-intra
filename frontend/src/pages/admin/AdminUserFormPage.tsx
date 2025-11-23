import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Tile, Button, TextInput, Select, SelectItem, Loading, InlineNotification } from '@carbon/react'
import { ArrowLeft } from '@carbon/icons-react'
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

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['admin', 'user', id],
    queryFn: () => usersApi.adminGetById(Number(id)),
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
      queryClient.invalidateQueries({ queryKey: ['admin', 'user', id] })
      navigate('/admin/users')
    },
    onError: (err: any) => {
      setError(err.response?.data?.detail || 'Ошибка при обновлении сотрудника')
    },
  })

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

  if (isEdit && userLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
        <Loading withOverlay={false} />
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Button
            kind="ghost"
            hasIconOnly
            renderIcon={ArrowLeft}
            iconDescription="Назад"
            onClick={() => navigate(-1)}
          />
          <h1 className="page-title">
            {isEdit ? 'Редактирование сотрудника' : 'Новый сотрудник'}
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Tile>
          <h3 style={{ fontWeight: 600, marginBottom: '1rem' }}>Информация о сотруднике</h3>

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
              id="email"
              labelText="Email *"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
            <TextInput
              id="phone"
              labelText="Телефон"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
            <TextInput
              id="last_name"
              labelText="Фамилия *"
              value={formData.last_name}
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              required
            />
            <TextInput
              id="first_name"
              labelText="Имя *"
              value={formData.first_name}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              required
            />
            <TextInput
              id="patronymic"
              labelText="Отчество"
              value={formData.patronymic}
              onChange={(e) => setFormData({ ...formData, patronymic: e.target.value })}
            />
            <TextInput
              id="hire_date"
              labelText="Дата найма"
              type="date"
              value={formData.hire_date}
              onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
            />
            <Select
              id="department_id"
              labelText="Отдел"
              value={formData.department_id}
              onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
            >
              <SelectItem value="" text="Не выбран" />
              {departments?.map((dept) => (
                <SelectItem key={dept.id} value={String(dept.id)} text={dept.name} />
              ))}
            </Select>
            <Select
              id="position_id"
              labelText="Должность"
              value={formData.position_id}
              onChange={(e) => setFormData({ ...formData, position_id: e.target.value })}
            >
              <SelectItem value="" text="Не выбрана" />
              {positions?.map((pos) => (
                <SelectItem key={pos.id} value={String(pos.id)} text={pos.name} />
              ))}
            </Select>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <Select
              id="role_id"
              labelText="Роль"
              value={formData.role_id}
              onChange={(e) => setFormData({ ...formData, role_id: e.target.value })}
            >
              <SelectItem value="" text="Не выбрана" />
              {roles?.map((role) => (
                <SelectItem
                  key={role.id}
                  value={String(role.id)}
                  text={role.description ? `${role.name} — ${role.description}` : role.name}
                />
              ))}
            </Select>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Сохранение...' : isEdit ? 'Сохранить' : 'Создать'}
            </Button>
            <Button kind="secondary" onClick={() => navigate(-1)}>
              Отмена
            </Button>
          </div>
        </Tile>
      </form>
    </div>
  )
}
