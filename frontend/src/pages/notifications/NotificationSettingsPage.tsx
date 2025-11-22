import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Bell, Mail, Award, Newspaper, Cake, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { notificationsApi } from '@/api/endpoints/notifications'

interface SettingToggleProps {
  icon: React.ReactNode
  title: string
  description: string
  checked: boolean
  onChange: (checked: boolean) => void
}

function SettingToggle({ icon, title, description, checked, onChange }: SettingToggleProps) {
  return (
    <div className="flex items-start gap-4 p-4 rounded hover:bg-layer-02 transition-colors">
      <div className="p-2 bg-layer-02 rounded text-text-secondary">
        {icon}
      </div>
      <div className="flex-1">
        <p className="font-medium">{title}</p>
        <p className="text-sm text-text-secondary">{description}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-12 h-6 rounded-full transition-colors ${
          checked ? 'bg-interactive-primary' : 'bg-layer-hover'
        }`}
      >
        <span
          className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
            checked ? 'translate-x-7' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  )
}

export function NotificationSettingsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [settings, setSettings] = useState({
    birthdays_enabled: true,
    achievements_enabled: true,
    news_enabled: true,
    comments_enabled: true,
    email_enabled: false,
  })

  const { data: currentSettings, isLoading } = useQuery({
    queryKey: ['notification-settings'],
    queryFn: notificationsApi.getSettings,
  })

  useEffect(() => {
    if (currentSettings) {
      setSettings(currentSettings)
    }
  }, [currentSettings])

  const updateSettingsMutation = useMutation({
    mutationFn: notificationsApi.updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-settings'] })
    },
  })

  const handleChange = (key: keyof typeof settings, value: boolean) => {
    const newSettings = { ...settings, [key]: value }
    setSettings(newSettings)
    updateSettingsMutation.mutate(newSettings)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-text-secondary">Загрузка...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-semibold text-text-primary">
          Настройки уведомлений
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Уведомления в приложении
          </CardTitle>
          <CardDescription>
            Выберите, о каких событиях вы хотите получать уведомления
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <SettingToggle
            icon={<Cake className="h-5 w-5" />}
            title="Дни рождения"
            description="Уведомления о днях рождения коллег"
            checked={settings.birthdays_enabled}
            onChange={(v) => handleChange('birthdays_enabled', v)}
          />
          <SettingToggle
            icon={<Award className="h-5 w-5" />}
            title="Достижения"
            description="Уведомления о полученных наградах"
            checked={settings.achievements_enabled}
            onChange={(v) => handleChange('achievements_enabled', v)}
          />
          <SettingToggle
            icon={<Newspaper className="h-5 w-5" />}
            title="Новости"
            description="Уведомления о новых публикациях"
            checked={settings.news_enabled}
            onChange={(v) => handleChange('news_enabled', v)}
          />
          <SettingToggle
            icon={<MessageSquare className="h-5 w-5" />}
            title="Комментарии"
            description="Уведомления о комментариях к вашим публикациям"
            checked={settings.comments_enabled}
            onChange={(v) => handleChange('comments_enabled', v)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email уведомления
          </CardTitle>
          <CardDescription>
            Дублировать важные уведомления на почту
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SettingToggle
            icon={<Mail className="h-5 w-5" />}
            title="Отправлять на email"
            description="Получать уведомления на электронную почту"
            checked={settings.email_enabled}
            onChange={(v) => handleChange('email_enabled', v)}
          />
        </CardContent>
      </Card>

      {updateSettingsMutation.isPending && (
        <p className="text-sm text-text-helper text-center">Сохранение...</p>
      )}
    </div>
  )
}
