import { useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import {
  Form,
  Stack,
  PasswordInput,
  Button,
  InlineNotification,
  Tile,
} from '@carbon/react'
import { CheckmarkFilled } from '@carbon/icons-react'
import { authApi } from '@/api/endpoints/auth'

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token') || ''
  const uid = searchParams.get('uid') || ''

  const [formData, setFormData] = useState({
    password: '',
    confirm_password: '',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const resetPasswordMutation = useMutation({
    mutationFn: authApi.resetPasswordConfirm,
    onSuccess: () => {
      setSuccess(true)
    },
    onError: (err: any) => {
      const message = err.response?.data?.detail ||
                      err.response?.data?.token?.[0] ||
                      'Ссылка недействительна или истекла'
      setError(message)
    },
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setError('')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (formData.password !== formData.confirm_password) {
      setError('Пароли не совпадают')
      return
    }

    if (formData.password.length < 8) {
      setError('Пароль должен содержать минимум 8 символов')
      return
    }

    resetPasswordMutation.mutate({
      uid,
      token,
      new_password: formData.password,
    })
  }

  if (!token || !uid) {
    return (
      <Tile>
        <div style={{ textAlign: 'center', padding: '1rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--cds-support-error)' }}>
            Недействительная ссылка
          </h2>
          <p style={{ color: 'var(--cds-text-secondary)', marginBottom: '1.5rem' }}>
            Ссылка для сброса пароля недействительна или истекла.
          </p>
          <Button as={Link} to="/forgot-password">
            Запросить новую ссылку
          </Button>
        </div>
      </Tile>
    )
  }

  if (success) {
    return (
      <Tile>
        <div style={{ textAlign: 'center', padding: '1rem' }}>
          <div style={{
            width: '64px',
            height: '64px',
            background: 'rgba(36, 161, 72, 0.1)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem'
          }}>
            <CheckmarkFilled size={32} style={{ color: '#24a148' }} />
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>
            Пароль изменён
          </h2>
          <p style={{ color: 'var(--cds-text-secondary)', marginBottom: '1.5rem' }}>
            Ваш пароль успешно изменён. Теперь вы можете войти с новым паролем.
          </p>
          <Button onClick={() => navigate('/login')}>
            Войти в систему
          </Button>
        </div>
      </Tile>
    )
  }

  return (
    <Tile>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>
        Новый пароль
      </h2>
      <p style={{ color: 'var(--cds-text-secondary)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
        Придумайте новый надёжный пароль для вашего аккаунта
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

          <div>
            <PasswordInput
              id="password"
              name="password"
              labelText="Новый пароль"
              value={formData.password}
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

          <Button
            type="submit"
            disabled={resetPasswordMutation.isPending}
            style={{ width: '100%', maxWidth: '100%' }}
          >
            {resetPasswordMutation.isPending ? 'Сохранение...' : 'Сохранить пароль'}
          </Button>
        </Stack>
      </Form>
    </Tile>
  )
}
