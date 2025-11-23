import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import {
  Form,
  Stack,
  TextInput,
  PasswordInput,
  Button,
  InlineNotification,
  Tile,
} from '@carbon/react'
import { ArrowRight } from '@carbon/icons-react'
import { authApi } from '@/api/endpoints/auth'
import { useAuthStore } from '@/store/authStore'

export function LoginPage() {
  const navigate = useNavigate()
  const { setTokens, setUser } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      setTokens(data.access, data.refresh)
      setUser(data.user)
      navigate('/')
    },
    onError: () => {
      setError('Неверный email или пароль')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    loginMutation.mutate({ email, password })
  }

  return (
    <Tile>
      <h2 style={{ marginBottom: '1.5rem', textAlign: 'center', fontSize: '1.25rem', fontWeight: 600 }}>
        Вход в систему
      </h2>

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

          <div>
            <PasswordInput
              id="password"
              labelText="Пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
            <div style={{ marginTop: '0.5rem', textAlign: 'right' }}>
              <Link
                to="/forgot-password"
                style={{
                  fontSize: '0.875rem',
                  color: 'var(--cds-link-primary)',
                  textDecoration: 'none'
                }}
              >
                Забыли пароль?
              </Link>
            </div>
          </div>

          <Button
            type="submit"
            disabled={loginMutation.isPending}
            renderIcon={ArrowRight}
            style={{ width: '100%', maxWidth: '100%' }}
          >
            {loginMutation.isPending ? 'Вход...' : 'Войти'}
          </Button>
        </Stack>
      </Form>
    </Tile>
  )
}
