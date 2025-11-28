import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import {
  Form,
  Stack,
  TextInput,
  PasswordInput,
  Button,
  InlineNotification,
  Tile,
  InlineLoading,
} from '@carbon/react'
import { ArrowRight, ArrowLeft, UserAvatar } from '@carbon/icons-react'
import { authApi } from '@/api/endpoints/auth'

export function RegisterPage() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    password_confirm: '',
    first_name: '',
    last_name: '',
    patronymic: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [success, setSuccess] = useState(false)

  // Check if registration is enabled
  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ['site-settings'],
    queryFn: authApi.getSiteSettings,
  })

  // Redirect if registration is disabled
  useEffect(() => {
    if (settings && !settings.registration_enabled) {
      // Registration is disabled - we'll show a message instead of redirect
    }
  }, [settings])

  const registerMutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: () => {
      setSuccess(true)
      setErrors({})
    },
    onError: (error: any) => {
      const data = error.response?.data
      if (typeof data === 'object' && data !== null) {
        setErrors(data)
      } else {
        setErrors({ general: 'Произошла ошибка при регистрации' })
      }
    },
  })

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [field]: e.target.value })
    // Clear field error on change
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' })
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    // Client-side validation
    const newErrors: Record<string, string> = {}

    if (!formData.email) {
      newErrors.email = 'Email обязателен'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Некорректный email'
    }

    if (!formData.password) {
      newErrors.password = 'Пароль обязателен'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Пароль должен быть не менее 6 символов'
    }

    if (formData.password !== formData.password_confirm) {
      newErrors.password_confirm = 'Пароли не совпадают'
    }

    if (!formData.first_name) {
      newErrors.first_name = 'Имя обязательно'
    }

    if (!formData.last_name) {
      newErrors.last_name = 'Фамилия обязательна'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    registerMutation.mutate({
      email: formData.email,
      password: formData.password,
      first_name: formData.first_name,
      last_name: formData.last_name,
      patronymic: formData.patronymic || undefined,
    })
  }

  if (settingsLoading) {
    return (
      <Tile>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
          <InlineLoading description="Загрузка..." />
        </div>
      </Tile>
    )
  }

  // Registration disabled
  if (settings && !settings.registration_enabled) {
    return (
      <Tile>
        <div style={{ textAlign: 'center' }}>
          <UserAvatar size={48} style={{ marginBottom: '1rem', color: 'var(--cds-text-secondary)' }} />
          <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem', fontWeight: 600 }}>
            Регистрация закрыта
          </h2>
          <p style={{ color: 'var(--cds-text-secondary)', marginBottom: '1.5rem' }}>
            В данный момент самостоятельная регистрация недоступна.
            Обратитесь к администратору для получения учетной записи.
          </p>
          <Link
            to="/login"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: 'var(--cds-link-primary)',
              textDecoration: 'none'
            }}
          >
            <ArrowLeft size={16} />
            Вернуться к входу
          </Link>
        </div>
      </Tile>
    )
  }

  // Success message
  if (success) {
    return (
      <Tile>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: 'rgba(36, 161, 72, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem'
          }}>
            <UserAvatar size={24} style={{ color: '#24a148' }} />
          </div>
          <h2 style={{ marginBottom: '0.5rem', fontSize: '1.25rem', fontWeight: 600 }}>
            Регистрация успешна!
          </h2>
          <p style={{ color: 'var(--cds-text-secondary)', marginBottom: '1.5rem' }}>
            Теперь вы можете войти в систему.
          </p>
          <Button
            renderIcon={ArrowRight}
            onClick={() => navigate('/login')}
          >
            Перейти к входу
          </Button>
        </div>
      </Tile>
    )
  }

  return (
    <Tile>
      <h2 style={{ marginBottom: '1.5rem', textAlign: 'center', fontSize: '1.25rem', fontWeight: 600 }}>
        Регистрация
      </h2>

      <Form onSubmit={handleSubmit}>
        <Stack gap={5}>
          {errors.general && (
            <InlineNotification
              kind="error"
              title="Ошибка"
              subtitle={errors.general}
              hideCloseButton
              lowContrast
            />
          )}

          <TextInput
            id="last_name"
            labelText="Фамилия"
            value={formData.last_name}
            onChange={handleChange('last_name')}
            placeholder="Иванов"
            invalid={!!errors.last_name}
            invalidText={errors.last_name}
            required
          />

          <TextInput
            id="first_name"
            labelText="Имя"
            value={formData.first_name}
            onChange={handleChange('first_name')}
            placeholder="Иван"
            invalid={!!errors.first_name}
            invalidText={errors.first_name}
            required
          />

          <TextInput
            id="patronymic"
            labelText="Отчество"
            value={formData.patronymic}
            onChange={handleChange('patronymic')}
            placeholder="Иванович"
            helperText="Необязательно"
          />

          <TextInput
            id="email"
            labelText="Email"
            type="email"
            value={formData.email}
            onChange={handleChange('email')}
            placeholder="ivan@example.com"
            invalid={!!errors.email}
            invalidText={errors.email}
            required
          />

          <PasswordInput
            id="password"
            labelText="Пароль"
            value={formData.password}
            onChange={handleChange('password')}
            placeholder="Минимум 6 символов"
            invalid={!!errors.password}
            invalidText={errors.password}
            required
          />

          <PasswordInput
            id="password_confirm"
            labelText="Подтверждение пароля"
            value={formData.password_confirm}
            onChange={handleChange('password_confirm')}
            placeholder="Повторите пароль"
            invalid={!!errors.password_confirm}
            invalidText={errors.password_confirm}
            required
          />

          <Button
            type="submit"
            disabled={registerMutation.isPending}
            renderIcon={ArrowRight}
            style={{ width: '100%', maxWidth: '100%' }}
          >
            {registerMutation.isPending ? 'Регистрация...' : 'Зарегистрироваться'}
          </Button>

          <div style={{ textAlign: 'center' }}>
            <span style={{ color: 'var(--cds-text-secondary)', fontSize: '0.875rem' }}>
              Уже есть аккаунт?{' '}
            </span>
            <Link
              to="/login"
              style={{
                fontSize: '0.875rem',
                color: 'var(--cds-link-primary)',
                textDecoration: 'none'
              }}
            >
              Войти
            </Link>
          </div>
        </Stack>
      </Form>
    </Tile>
  )
}
