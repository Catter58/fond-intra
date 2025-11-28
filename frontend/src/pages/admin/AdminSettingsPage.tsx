import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Grid,
  Column,
  Tile,
  Toggle,
  Select,
  SelectItem,
  InlineLoading,
  InlineNotification,
} from '@carbon/react'
import { Settings, UserFollow } from '@carbon/icons-react'
import { adminApi } from '@/api/endpoints/admin'

export function AdminSettingsPage() {
  const queryClient = useQueryClient()

  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: adminApi.getSettings,
  })

  const { data: roles, isLoading: rolesLoading } = useQuery({
    queryKey: ['admin', 'roles'],
    queryFn: adminApi.getRoles,
  })

  const updateMutation = useMutation({
    mutationFn: adminApi.updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] })
    },
  })

  const handleRegistrationToggle = (checked: boolean) => {
    updateMutation.mutate({ registration_enabled: checked })
  }

  const handleDefaultRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    updateMutation.mutate({ default_role: value ? Number(value) : null })
  }

  if (settingsLoading || rolesLoading) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title">Настройки портала</h1>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
          <InlineLoading description="Загрузка настроек..." />
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-header__content">
          <h1 className="page-title">Настройки портала</h1>
          <p className="page-subtitle">Общие настройки системы</p>
        </div>
      </div>

      {updateMutation.isError && (
        <InlineNotification
          kind="error"
          title="Ошибка"
          subtitle="Не удалось сохранить настройки"
          lowContrast
          hideCloseButton
          style={{ marginBottom: '1rem' }}
        />
      )}

      {updateMutation.isSuccess && (
        <InlineNotification
          kind="success"
          title="Сохранено"
          subtitle="Настройки успешно обновлены"
          lowContrast
          hideCloseButton
          style={{ marginBottom: '1rem' }}
        />
      )}

      <Grid>
        <Column lg={8} md={6} sm={4}>
          <Tile style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ padding: '0.75rem', background: 'var(--cds-layer-02)', borderRadius: '8px' }}>
                <UserFollow size={24} />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Регистрация пользователей</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--cds-text-secondary)' }}>
                  Разрешить новым пользователям самостоятельно регистрироваться на портале
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <Toggle
                id="registration-toggle"
                labelText="Самостоятельная регистрация"
                labelA="Закрыта"
                labelB="Открыта"
                toggled={settings?.registration_enabled || false}
                onToggle={handleRegistrationToggle}
                disabled={updateMutation.isPending}
              />

              <Select
                id="default-role"
                labelText="Роль по умолчанию для новых пользователей"
                value={settings?.default_role?.toString() || ''}
                onChange={handleDefaultRoleChange}
                disabled={updateMutation.isPending}
                helperText="Роль будет автоматически присвоена при регистрации"
              >
                <SelectItem value="" text="Без роли" />
                {roles?.map(role => (
                  <SelectItem key={role.id} value={role.id.toString()} text={role.name} />
                ))}
              </Select>
            </div>
          </Tile>
        </Column>

        <Column lg={8} md={6} sm={4}>
          <Tile>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ padding: '0.75rem', background: 'var(--cds-layer-02)', borderRadius: '8px' }}>
                <Settings size={24} />
              </div>
              <div>
                <h3 style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Дополнительные настройки</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--cds-text-secondary)' }}>
                  Дополнительные настройки будут добавлены позже
                </p>
              </div>
            </div>
          </Tile>
        </Column>
      </Grid>
    </div>
  )
}
