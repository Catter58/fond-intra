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
  Checkbox,
} from '@carbon/react'
import { ArrowRight, Security, ArrowLeft } from '@carbon/icons-react'
import { authApi, type LoginResponse } from '@/api/endpoints/auth'
import { useAuthStore } from '@/store/authStore'
import type { UserBasic } from '@/types'

export function LoginPage() {
  const navigate = useNavigate()
  const { setTokens, setUser } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  // 2FA state
  const [requires2FA, setRequires2FA] = useState(false)
  const [pending2FAUserId, setPending2FAUserId] = useState<number | null>(null)
  const [twoFactorToken, setTwoFactorToken] = useState('')
  const [isBackupCode, setIsBackupCode] = useState(false)

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data: LoginResponse) => {
      if (data.requires_2fa && data.user_id) {
        // 2FA required - show 2FA form
        setRequires2FA(true)
        setPending2FAUserId(data.user_id)
        setError('')
      } else if (data.access && data.refresh && data.user) {
        // Normal login - proceed
        setTokens(data.access, data.refresh)
        setUser({ ...data.user, patronymic: data.user.patronymic || '' } as UserBasic)
        navigate('/')
      }
    },
    onError: () => {
      setError('Неверный email или пароль')
    },
  })

  const twoFactorMutation = useMutation({
    mutationFn: authApi.authenticate2FA,
    onSuccess: (data) => {
      setTokens(data.access, data.refresh)
      setUser(data.user)
      navigate('/')
    },
    onError: (err: any) => {
      const message = err.response?.data?.detail || 'Неверный код подтверждения'
      setError(message)
    },
  })

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    loginMutation.mutate({ email, password })
  }

  const handle2FASubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!pending2FAUserId) return

    twoFactorMutation.mutate({
      user_id: pending2FAUserId,
      token: twoFactorToken,
      is_backup_code: isBackupCode,
    })
  }

  const handleBack = () => {
    setRequires2FA(false)
    setPending2FAUserId(null)
    setTwoFactorToken('')
    setIsBackupCode(false)
    setError('')
  }

  // 2FA Form
  if (requires2FA) {
    return (
      <Tile>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <Button
            kind="ghost"
            size="sm"
            hasIconOnly
            iconDescription="Назад"
            renderIcon={ArrowLeft}
            onClick={handleBack}
          />
          <Security size={24} />
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>
            Двухфакторная аутентификация
          </h2>
        </div>

        <p style={{ color: 'var(--cds-text-secondary)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
          Введите код из приложения-аутентификатора или используйте резервный код.
        </p>

        <Form onSubmit={handle2FASubmit}>
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
              id="2fa-token"
              labelText={isBackupCode ? 'Резервный код' : 'Код подтверждения'}
              value={twoFactorToken}
              onChange={(e) => setTwoFactorToken(e.target.value.replace(isBackupCode ? /[^A-Za-z0-9]/g : /\D/g, '').toUpperCase())}
              placeholder={isBackupCode ? 'XXXXXXXX' : '000000'}
              maxLength={isBackupCode ? 8 : 6}
              autoComplete="one-time-code"
              autoFocus
            />

            <Checkbox
              id="use-backup-code"
              labelText="Использовать резервный код"
              checked={isBackupCode}
              onChange={(_, { checked }) => {
                setIsBackupCode(checked)
                setTwoFactorToken('')
              }}
            />

            <Button
              type="submit"
              disabled={twoFactorMutation.isPending || twoFactorToken.length < (isBackupCode ? 8 : 6)}
              renderIcon={ArrowRight}
              style={{ width: '100%', maxWidth: '100%' }}
            >
              {twoFactorMutation.isPending ? 'Проверка...' : 'Подтвердить'}
            </Button>
          </Stack>
        </Form>
      </Tile>
    )
  }

  // Login Form
  return (
    <Tile>
      <h2 style={{ marginBottom: '1.5rem', textAlign: 'center', fontSize: '1.25rem', fontWeight: 600 }}>
        Вход в систему
      </h2>

      <Form onSubmit={handleLoginSubmit}>
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
