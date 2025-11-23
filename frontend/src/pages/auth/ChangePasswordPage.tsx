import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import {
  Form,
  Stack,
  PasswordInput,
  Button,
  InlineNotification,
  Tile,
} from '@carbon/react'
import { ArrowLeft } from '@carbon/icons-react'
import { authApi } from '@/api/endpoints/auth'

export function ChangePasswordPage() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const changePasswordMutation = useMutation({
    mutationFn: authApi.changePassword,
    onSuccess: () => {
      setSuccess(true)
      setFormData({ current_password: '', new_password: '', confirm_password: '' })
    },
    onError: (err: any) => {
      const message = err.response?.data?.detail ||
                      err.response?.data?.current_password?.[0] ||
                      'Ошибка при смене пароля'
      setError(message)
    },
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setError('')
    setSuccess(false)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (formData.new_password !== formData.confirm_password) {
      setError('Пароли не совпадают')
      return
    }

    if (formData.new_password.length < 8) {
      setError('Пароль должен содержать минимум 8 символов')
      return
    }

    changePasswordMutation.mutate({
      old_password: formData.current_password,
      new_password: formData.new_password,
      new_password_confirm: formData.confirm_password,
    })
  }

  return (
    <div style={{ maxWidth: '28rem', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <Button
          kind="ghost"
          hasIconOnly
          iconDescription="Назад"
          renderIcon={ArrowLeft}
          onClick={() => navigate(-1)}
        />
        <h1 className="page-title">Смена пароля</h1>
      </div>

      <Tile>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.5rem' }}>
          Изменить пароль
        </h2>
        <p style={{ color: 'var(--cds-text-secondary)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
          Для безопасности рекомендуем использовать уникальный пароль
        </p>

        <Form onSubmit={handleSubmit}>
          <Stack gap={6}>
            {error && (
              <InlineNotification
                kind="error"
                title="Ошибка"
                subtitle={error}
                hideCloseButton
                lowContrast
              />
            )}

            {success && (
              <InlineNotification
                kind="success"
                title="Успешно"
                subtitle="Пароль успешно изменён"
                hideCloseButton
                lowContrast
              />
            )}

            <PasswordInput
              id="current_password"
              name="current_password"
              labelText="Текущий пароль"
              value={formData.current_password}
              onChange={handleChange}
              required
            />

            <div>
              <PasswordInput
                id="new_password"
                name="new_password"
                labelText="Новый пароль"
                value={formData.new_password}
                onChange={handleChange}
                required
              />
              <p style={{ fontSize: '0.75rem', color: 'var(--cds-text-helper)', marginTop: '0.25rem' }}>
                Минимум 8 символов
              </p>
            </div>

            <PasswordInput
              id="confirm_password"
              name="confirm_password"
              labelText="Подтвердите пароль"
              value={formData.confirm_password}
              onChange={handleChange}
              required
            />

            <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '0.5rem' }}>
              <Button type="submit" disabled={changePasswordMutation.isPending}>
                {changePasswordMutation.isPending ? 'Сохранение...' : 'Изменить пароль'}
              </Button>
              <Button kind="secondary" onClick={() => navigate(-1)}>
                Отмена
              </Button>
            </div>
          </Stack>
        </Form>
      </Tile>
    </div>
  )
}
