import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Tile, Button, Toggle, Loading } from '@carbon/react'
import { ArrowLeft, Notification, Email, Trophy, Document, Events, Chat } from '@carbon/icons-react'
import { notificationsApi } from '@/api/endpoints/notifications'

interface SettingToggleProps {
  icon: React.ReactNode
  title: string
  description: string
  id: string
  checked: boolean
  onChange: (checked: boolean) => void
}

function SettingToggle({ icon, title, description, id, checked, onChange }: SettingToggleProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '1rem',
        padding: '1rem',
      }}
    >
      <div
        style={{
          padding: '0.5rem',
          background: 'var(--cds-layer-02)',
          color: 'var(--cds-text-secondary)',
        }}
      >
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ fontWeight: 500 }}>{title}</p>
        <p style={{ fontSize: '0.875rem', color: 'var(--cds-text-secondary)' }}>{description}</p>
      </div>
      <Toggle
        id={id}
        labelA=""
        labelB=""
        toggled={checked}
        onToggle={(e) => onChange(e)}
        size="sm"
      />
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
      <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
        <Loading withOverlay={false} />
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Button
            kind="ghost"
            hasIconOnly
            renderIcon={ArrowLeft}
            iconDescription="Назад"
            onClick={() => navigate(-1)}
          />
          <h1 className="page-title">Настройки уведомлений</h1>
        </div>
      </div>

      <Tile style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <Notification size={20} />
          <h3 style={{ fontWeight: 600 }}>Уведомления в приложении</h3>
        </div>
        <p style={{ fontSize: '0.875rem', color: 'var(--cds-text-secondary)', marginBottom: '1rem' }}>
          Выберите, о каких событиях вы хотите получать уведомления
        </p>

        <div style={{ borderTop: '1px solid var(--cds-border-subtle-01)' }}>
          <SettingToggle
            icon={<Events size={20} />}
            title="Дни рождения"
            description="Уведомления о днях рождения коллег"
            id="birthdays"
            checked={settings.birthdays_enabled}
            onChange={(v) => handleChange('birthdays_enabled', v)}
          />
          <SettingToggle
            icon={<Trophy size={20} />}
            title="Достижения"
            description="Уведомления о полученных наградах"
            id="achievements"
            checked={settings.achievements_enabled}
            onChange={(v) => handleChange('achievements_enabled', v)}
          />
          <SettingToggle
            icon={<Document size={20} />}
            title="Новости"
            description="Уведомления о новых публикациях"
            id="news"
            checked={settings.news_enabled}
            onChange={(v) => handleChange('news_enabled', v)}
          />
          <SettingToggle
            icon={<Chat size={20} />}
            title="Комментарии"
            description="Уведомления о комментариях к вашим публикациям"
            id="comments"
            checked={settings.comments_enabled}
            onChange={(v) => handleChange('comments_enabled', v)}
          />
        </div>
      </Tile>

      <Tile>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <Email size={20} />
          <h3 style={{ fontWeight: 600 }}>Email уведомления</h3>
        </div>
        <p style={{ fontSize: '0.875rem', color: 'var(--cds-text-secondary)', marginBottom: '1rem' }}>
          Дублировать важные уведомления на почту
        </p>

        <div style={{ borderTop: '1px solid var(--cds-border-subtle-01)' }}>
          <SettingToggle
            icon={<Email size={20} />}
            title="Отправлять на email"
            description="Получать уведомления на электронную почту"
            id="email"
            checked={settings.email_enabled}
            onChange={(v) => handleChange('email_enabled', v)}
          />
        </div>
      </Tile>

      {updateSettingsMutation.isPending && (
        <p style={{ fontSize: '0.875rem', color: 'var(--cds-text-helper)', textAlign: 'center', marginTop: '1rem' }}>
          Сохранение...
        </p>
      )}
    </div>
  )
}
