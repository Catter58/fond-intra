import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { ArrowLeft, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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
      <Card>
        <CardContent className="p-6 text-center">
          <div className="w-16 h-16 bg-support-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="h-8 w-8 text-support-success" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Письмо отправлено</h2>
          <p className="text-text-secondary mb-6">
            Если аккаунт с email <strong>{email}</strong> существует,
            вы получите письмо с инструкциями по восстановлению пароля.
          </p>
          <Button asChild variant="outline">
            <Link to="/login">Вернуться к входу</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2 mb-2">
          <Link to="/login" className="text-text-secondary hover:text-text-primary">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <CardTitle>Восстановление пароля</CardTitle>
        </div>
        <CardDescription>
          Введите email, указанный при регистрации. Мы отправим ссылку для сброса пароля.
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
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={resetPasswordMutation.isPending}
          >
            {resetPasswordMutation.isPending ? 'Отправка...' : 'Отправить ссылку'}
          </Button>

          <p className="text-center text-sm text-text-secondary">
            Вспомнили пароль?{' '}
            <Link to="/login" className="text-interactive-primary hover:underline">
              Войти
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
