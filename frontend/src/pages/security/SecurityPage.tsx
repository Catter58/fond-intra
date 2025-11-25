import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Grid,
  Column,
  Tile,
  Button,
  InlineNotification,
  Loading,
  Modal,
  TextInput,
  PasswordInput,
  Tag,
  StructuredListWrapper,
  StructuredListHead,
  StructuredListRow,
  StructuredListCell,
  StructuredListBody,
  CodeSnippet,
  ToastNotification,
} from '@carbon/react'
import {
  ArrowLeft,
  Security,
  Locked,
  Unlocked,
  QrCode,
  Copy,
  Renew,
  Laptop,
  Mobile,
  Tablet,
  TrashCan,
  Warning,
  Checkmark,
} from '@carbon/icons-react'
import { authApi } from '@/api/endpoints/auth'
import { useAuthStore } from '@/store/authStore'
import type { TwoFactorSetup } from '@/types'

export function SecurityPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { logout } = useAuthStore()

  // State
  const [setupModalOpen, setSetupModalOpen] = useState(false)
  const [disableModalOpen, setDisableModalOpen] = useState(false)
  const [backupCodesModalOpen, setBackupCodesModalOpen] = useState(false)
  const [verifyToken, setVerifyToken] = useState('')
  const [disablePassword, setDisablePassword] = useState('')
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [setupData, setSetupData] = useState<TwoFactorSetup | null>(null)
  const [error, setError] = useState('')
  const [toast, setToast] = useState<{ kind: 'success' | 'error'; title: string; subtitle: string } | null>(null)
  const [terminatingCurrentSession, setTerminatingCurrentSession] = useState(false)

  // Queries
  const { data: twoFactorStatus, isLoading: statusLoading } = useQuery({
    queryKey: ['2fa-status'],
    queryFn: authApi.get2FAStatus,
  })

  const { data: sessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ['sessions'],
    queryFn: authApi.getSessions,
  })

  // Mutations
  const setupMutation = useMutation({
    mutationFn: authApi.setup2FA,
    onSuccess: (data) => {
      setSetupData(data)
      setSetupModalOpen(true)
    },
    onError: (err: any) => {
      setError(err.response?.data?.detail || 'Не удалось начать настройку 2FA')
    },
  })

  const verifyMutation = useMutation({
    mutationFn: authApi.verify2FA,
    onSuccess: (data) => {
      setBackupCodes(data.backup_codes)
      setSetupModalOpen(false)
      setBackupCodesModalOpen(true)
      setVerifyToken('')
      queryClient.invalidateQueries({ queryKey: ['2fa-status'] })
      setToast({ kind: 'success', title: 'Готово', subtitle: 'Двухфакторная аутентификация включена' })
    },
    onError: (err: any) => {
      setError(err.response?.data?.detail || 'Неверный код подтверждения')
    },
  })

  const disableMutation = useMutation({
    mutationFn: authApi.disable2FA,
    onSuccess: () => {
      setDisableModalOpen(false)
      setDisablePassword('')
      queryClient.invalidateQueries({ queryKey: ['2fa-status'] })
      setToast({ kind: 'success', title: 'Готово', subtitle: 'Двухфакторная аутентификация отключена' })
    },
    onError: (err: any) => {
      setError(err.response?.data?.detail || 'Не удалось отключить 2FA')
    },
  })

  const regenerateCodesMutation = useMutation({
    mutationFn: authApi.regenerateBackupCodes,
    onSuccess: (data) => {
      setBackupCodes(data.backup_codes)
      setBackupCodesModalOpen(true)
      setToast({ kind: 'success', title: 'Готово', subtitle: 'Новые резервные коды сгенерированы' })
    },
    onError: (err: any) => {
      setToast({ kind: 'error', title: 'Ошибка', subtitle: err.response?.data?.detail || 'Не удалось сгенерировать коды' })
    },
  })

  const terminateSessionMutation = useMutation({
    mutationFn: authApi.terminateSession,
    onSuccess: async () => {
      if (terminatingCurrentSession) {
        // Current session was terminated - log out user
        setTerminatingCurrentSession(false)
        logout()
        navigate('/login')
      } else {
        // Check if there are remaining active sessions
        const remainingSessions = await authApi.getSessions()
        if (remainingSessions.length === 0) {
          // No more sessions - this was likely the current session
          logout()
          navigate('/login')
        } else {
          queryClient.invalidateQueries({ queryKey: ['sessions'] })
          setToast({ kind: 'success', title: 'Готово', subtitle: 'Сессия завершена' })
        }
      }
    },
    onError: (err: any) => {
      setTerminatingCurrentSession(false)
      setToast({ kind: 'error', title: 'Ошибка', subtitle: err.response?.data?.detail || 'Не удалось завершить сессию' })
    },
  })

  const terminateAllMutation = useMutation({
    mutationFn: authApi.terminateAllSessions,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
      setToast({ kind: 'success', title: 'Готово', subtitle: data.detail })
    },
    onError: (err: any) => {
      setToast({ kind: 'error', title: 'Ошибка', subtitle: err.response?.data?.detail || 'Не удалось завершить сессии' })
    },
  })

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'mobile':
        return <Mobile size={20} />
      case 'tablet':
        return <Tablet size={20} />
      default:
        return <Laptop size={20} />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (statusLoading) {
    return <Loading />
  }

  return (
    <div>
      {/* Toast notification */}
      {toast && (
        <div style={{ position: 'fixed', top: '4rem', right: '1rem', zIndex: 9999 }}>
          <ToastNotification
            kind={toast.kind}
            title={toast.title}
            subtitle={toast.subtitle}
            timeout={3000}
            onClose={() => setToast(null)}
          />
        </div>
      )}

      <Grid narrow>
        <Column lg={16} md={8} sm={4}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
            <Button
              kind="ghost"
              hasIconOnly
              iconDescription="Назад"
              renderIcon={ArrowLeft}
              onClick={() => navigate(-1)}
            />
            <div>
              <h1 style={{ margin: 0 }}>Безопасность</h1>
              <p style={{ margin: '0.5rem 0 0', color: 'var(--cds-text-secondary)' }}>
                Управление безопасностью аккаунта
              </p>
            </div>
          </div>
        </Column>

        {/* Two-Factor Authentication Section */}
        <Column lg={8} md={8} sm={4}>
          <Tile style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1rem' }}>
              <Security size={24} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <h3 style={{ margin: 0 }}>Двухфакторная аутентификация</h3>
                  {twoFactorStatus?.is_enabled ? (
                    <Tag type="green" renderIcon={Locked}>Включена</Tag>
                  ) : (
                    <Tag type="gray" renderIcon={Unlocked}>Отключена</Tag>
                  )}
                </div>
                <p style={{ color: 'var(--cds-text-secondary)', marginTop: '0.5rem', fontSize: '0.875rem' }}>
                  Добавьте дополнительный уровень защиты, требуя код подтверждения при входе в систему.
                </p>
              </div>
            </div>

            {twoFactorStatus?.is_enabled ? (
              <div>
                <p style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>
                  <strong>Включена с:</strong> {twoFactorStatus.enabled_at ? formatDate(twoFactorStatus.enabled_at) : 'Неизвестно'}
                </p>
                <p style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>
                  <strong>Резервных кодов осталось:</strong> {twoFactorStatus.backup_codes_count}
                </p>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <Button
                    kind="tertiary"
                    size="sm"
                    renderIcon={Renew}
                    onClick={() => regenerateCodesMutation.mutate()}
                    disabled={regenerateCodesMutation.isPending}
                  >
                    Обновить резервные коды
                  </Button>
                  <Button
                    kind="danger--tertiary"
                    size="sm"
                    renderIcon={Unlocked}
                    onClick={() => setDisableModalOpen(true)}
                  >
                    Отключить 2FA
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                kind="primary"
                renderIcon={QrCode}
                onClick={() => setupMutation.mutate()}
                disabled={setupMutation.isPending}
              >
                {setupMutation.isPending ? 'Настройка...' : 'Включить 2FA'}
              </Button>
            )}

            {error && (
              <InlineNotification
                kind="error"
                title="Ошибка"
                subtitle={error}
                onCloseButtonClick={() => setError('')}
                style={{ marginTop: '1rem' }}
              />
            )}
          </Tile>
        </Column>

        {/* Active Sessions Section */}
        <Column lg={16} md={8} sm={4}>
          <Tile>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ margin: 0 }}>Активные сессии</h3>
                <p style={{ color: 'var(--cds-text-secondary)', marginTop: '0.5rem', fontSize: '0.875rem' }}>
                  Устройства, на которых выполнен вход в ваш аккаунт
                </p>
              </div>
              {sessions && sessions.length > 1 && (
                <Button
                  kind="danger--tertiary"
                  size="sm"
                  renderIcon={TrashCan}
                  onClick={() => terminateAllMutation.mutate()}
                  disabled={terminateAllMutation.isPending}
                >
                  Завершить все остальные
                </Button>
              )}
            </div>

            {sessionsLoading ? (
              <Loading small />
            ) : sessions && sessions.length > 0 ? (
              <StructuredListWrapper>
                <StructuredListHead>
                  <StructuredListRow head>
                    <StructuredListCell head>Устройство</StructuredListCell>
                    <StructuredListCell head>Местоположение</StructuredListCell>
                    <StructuredListCell head>Последняя активность</StructuredListCell>
                    <StructuredListCell head>Действия</StructuredListCell>
                  </StructuredListRow>
                </StructuredListHead>
                <StructuredListBody>
                  {sessions.map((session) => (
                    <StructuredListRow key={session.id}>
                      <StructuredListCell>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          {getDeviceIcon(session.device_type)}
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span>{session.browser || 'Неизвестный браузер'}</span>
                              {session.is_current && <Tag type="blue" size="sm">Текущая</Tag>}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)' }}>
                              {session.os || 'Неизвестная ОС'}
                            </div>
                          </div>
                        </div>
                      </StructuredListCell>
                      <StructuredListCell>
                        <div>{session.ip_address}</div>
                        {session.location && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)' }}>
                            {session.location}
                          </div>
                        )}
                      </StructuredListCell>
                      <StructuredListCell>
                        {formatDate(session.last_activity)}
                      </StructuredListCell>
                      <StructuredListCell>
                        {session.is_current ? (
                          <Button
                            kind="danger--ghost"
                            size="sm"
                            hasIconOnly
                            iconDescription="Завершить текущую сессию (выход)"
                            renderIcon={TrashCan}
                            onClick={() => {
                              if (window.confirm('Вы уверены? Вы будете разлогинены.')) {
                                setTerminatingCurrentSession(true)
                                terminateSessionMutation.mutate(session.id)
                              }
                            }}
                            disabled={terminateSessionMutation.isPending}
                          />
                        ) : (
                          <Button
                            kind="ghost"
                            size="sm"
                            hasIconOnly
                            iconDescription="Завершить сессию"
                            renderIcon={TrashCan}
                            onClick={() => {
                              setTerminatingCurrentSession(false)
                              terminateSessionMutation.mutate(session.id)
                            }}
                            disabled={terminateSessionMutation.isPending}
                          />
                        )}
                      </StructuredListCell>
                    </StructuredListRow>
                  ))}
                </StructuredListBody>
              </StructuredListWrapper>
            ) : (
              <p style={{ color: 'var(--cds-text-secondary)' }}>Активных сессий не найдено</p>
            )}
          </Tile>
        </Column>
      </Grid>

      {/* Setup 2FA Modal */}
      <Modal
        open={setupModalOpen}
        onRequestClose={() => {
          setSetupModalOpen(false)
          setSetupData(null)
          setVerifyToken('')
          setError('')
        }}
        modalHeading="Включение двухфакторной аутентификации"
        primaryButtonText="Подтвердить и включить"
        secondaryButtonText="Отмена"
        primaryButtonDisabled={verifyToken.length !== 6 || verifyMutation.isPending}
        onRequestSubmit={() => verifyMutation.mutate(verifyToken)}
        size="md"
      >
        {setupData && (
          <div>
            <p style={{ marginBottom: '1rem' }}>
              Отсканируйте QR-код с помощью приложения-аутентификатора (Google Authenticator, Authy и др.)
            </p>

            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <img
                src={setupData.qr_code}
                alt="QR-код для 2FA"
                style={{ maxWidth: '200px', border: '1px solid var(--cds-border-subtle-01)' }}
              />
            </div>

            <p style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>
              Или введите секретный ключ вручную:
            </p>
            <CodeSnippet type="single" feedback="Скопировано!">{setupData.secret}</CodeSnippet>

            <div style={{ marginTop: '1.5rem' }}>
              <TextInput
                id="verify-token"
                labelText="Введите 6-значный код из приложения-аутентификатора"
                placeholder="000000"
                value={verifyToken}
                onChange={(e) => setVerifyToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                autoComplete="off"
              />
            </div>

            {error && (
              <InlineNotification
                kind="error"
                title="Ошибка"
                subtitle={error}
                onCloseButtonClick={() => setError('')}
                style={{ marginTop: '1rem' }}
                hideCloseButton
              />
            )}
          </div>
        )}
      </Modal>

      {/* Disable 2FA Modal */}
      <Modal
        open={disableModalOpen}
        onRequestClose={() => {
          setDisableModalOpen(false)
          setDisablePassword('')
          setError('')
        }}
        modalHeading="Отключение двухфакторной аутентификации"
        primaryButtonText="Отключить 2FA"
        secondaryButtonText="Отмена"
        primaryButtonDisabled={!disablePassword || disableMutation.isPending}
        onRequestSubmit={() => disableMutation.mutate(disablePassword)}
        danger
        size="sm"
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1rem' }}>
          <Warning size={24} style={{ color: 'var(--cds-support-error)' }} />
          <p>
            Отключение 2FA сделает ваш аккаунт менее защищённым. Вы уверены, что хотите продолжить?
          </p>
        </div>

        <PasswordInput
          id="disable-password"
          labelText="Введите пароль для подтверждения"
          value={disablePassword}
          onChange={(e) => setDisablePassword(e.target.value)}
        />

        {error && (
          <InlineNotification
            kind="error"
            title="Ошибка"
            subtitle={error}
            onCloseButtonClick={() => setError('')}
            style={{ marginTop: '1rem' }}
            hideCloseButton
          />
        )}
      </Modal>

      {/* Backup Codes Modal */}
      <Modal
        open={backupCodesModalOpen}
        onRequestClose={() => {
          setBackupCodesModalOpen(false)
          setBackupCodes([])
        }}
        modalHeading="Резервные коды"
        primaryButtonText="Я сохранил коды"
        onRequestSubmit={() => {
          setBackupCodesModalOpen(false)
          setBackupCodes([])
        }}
        size="sm"
      >
        <div>
          <InlineNotification
            kind="warning"
            title="Важно"
            subtitle="Сохраните эти резервные коды в надёжном месте. Каждый код можно использовать только один раз."
            hideCloseButton
            lowContrast
            style={{ marginBottom: '1rem' }}
          />

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '0.5rem',
            padding: '1rem',
            backgroundColor: 'var(--cds-layer-01)',
            borderRadius: '4px',
            fontFamily: 'monospace',
            fontSize: '1rem',
          }}>
            {backupCodes.map((code, index) => (
              <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Checkmark size={16} style={{ color: 'var(--cds-support-success)' }} />
                <span>{code}</span>
              </div>
            ))}
          </div>

          <Button
            kind="ghost"
            size="sm"
            renderIcon={Copy}
            onClick={() => {
              navigator.clipboard.writeText(backupCodes.join('\n'))
              setToast({ kind: 'success', title: 'Скопировано', subtitle: 'Резервные коды скопированы в буфер обмена' })
            }}
            style={{ marginTop: '1rem' }}
          >
            Скопировать все коды
          </Button>
        </div>
      </Modal>
    </div>
  )
}
