import { useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { Eye, EyeOff, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { authApi } from '@/api/endpoints/auth'

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token') || ''
  const uid = searchParams.get('uid') || ''

  const [showPassword, setShowPassword] = useState(false)
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
      <Card>
        <CardContent className="p-6 text-center">
          <h2 className="text-xl font-semibold mb-2 text-support-error">
            Недействительная ссылка
          </h2>
          <p className="text-text-secondary mb-6">
            Ссылка для сброса пароля недействительна или истекла.
          </p>
          <Button asChild>
            <Link to="/forgot-password">Запросить новую ссылку</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (success) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="w-16 h-16 bg-support-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-support-success" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Пароль изменён</h2>
          <p className="text-text-secondary mb-6">
            Ваш пароль успешно изменён. Теперь вы можете войти с новым паролем.
          </p>
          <Button onClick={() => navigate('/login')}>
            Войти в систему
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Новый пароль</CardTitle>
        <CardDescription>
          Придумайте новый надёжный пароль для вашего аккаунта
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-support-error/10 border border-support-error text-support-error text-sm rounded">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="password">Новый пароль</Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-xs text-text-helper">Минимум 8 символов</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm_password">Подтвердите пароль</Label>
            <Input
              id="confirm_password"
              name="confirm_password"
              type="password"
              value={formData.confirm_password}
              onChange={handleChange}
              required
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={resetPasswordMutation.isPending}
          >
            {resetPasswordMutation.isPending ? 'Сохранение...' : 'Сохранить пароль'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
