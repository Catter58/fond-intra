import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import {
  Form,
  Stack,
  TextInput,
  Button,
  InlineNotification,
  Tile,
} from '@carbon/react'
import { ArrowLeft, Email } from '@carbon/icons-react'
import { authApi } from '@/api/endpoints/auth'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const resetPasswordMutation = useMutation({
    mutationFn: authApi.requestPasswordReset,
    onSuccess: () => {
      setSuccess(true)
    },
    onError: () => {
      setError('Ошибка при отправке. Проверьте email и попробуйте снова.')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    resetPasswordMutation.mutate(email)
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
            <Email size={32} style={{ color: '#24a148' }} />
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>
            Письмо отправлено
          </h2>
          <p style={{ color: 'var(--cds-text-secondary)', marginBottom: '1.5rem' }}>
            Если аккаунт с email <strong>{email}</strong> существует,
            вы получите письмо с инструкциями по восстановлению пароля.
          </p>
          <Button kind="secondary" as={Link} to="/login">
            Вернуться к входу
          </Button>
        </div>
      </Tile>
    )
  }

  return (
    <Tile>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
        <Link to="/login" style={{ color: 'var(--cds-text-secondary)' }}>
          <ArrowLeft size={20} />
        </Link>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Восстановление пароля</h2>
      </div>
      <p style={{ color: 'var(--cds-text-secondary)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
        Введите email, указанный при регистрации. Мы отправим ссылку для сброса пароля.
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

          <TextInput
            id="email"
            labelText="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
          />

          <Button
            type="submit"
            disabled={resetPasswordMutation.isPending}
            style={{ width: '100%', maxWidth: '100%' }}
          >
            {resetPasswordMutation.isPending ? 'Отправка...' : 'Отправить ссылку'}
          </Button>

          <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--cds-text-secondary)' }}>
            Вспомнили пароль?{' '}
            <Link to="/login" style={{ color: 'var(--cds-link-primary)', textDecoration: 'none' }}>
              Войти
            </Link>
          </p>
        </Stack>
      </Form>
    </Tile>
  )
}
