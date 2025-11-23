import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Modal,
  TextInput,
  TextArea,
  Button,
  InlineNotification,
  ProgressIndicator,
  ProgressStep,
  Loading,
} from '@carbon/react'
import { Trophy } from '@carbon/icons-react'
import { achievementsApi } from '@/api/endpoints/achievements'
import { usersApi } from '@/api/endpoints/users'
import type { Achievement, UserBasic } from '@/types'

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

interface AwardAchievementModalProps {
  isOpen: boolean
  onClose: () => void
  preselectedUser?: UserBasic
}

export function AwardAchievementModal({ isOpen, onClose, preselectedUser }: AwardAchievementModalProps) {
  const queryClient = useQueryClient()
  const [step, setStep] = useState<'user' | 'achievement' | 'comment'>(
    preselectedUser ? 'achievement' : 'user'
  )
  const [userSearch, setUserSearch] = useState('')
  const [selectedUser, setSelectedUser] = useState<UserBasic | null>(preselectedUser || null)
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null)
  const [comment, setComment] = useState('')
  const [error, setError] = useState('')

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['users', 'search', userSearch],
    queryFn: () => usersApi.search(userSearch),
    enabled: userSearch.length >= 2 && step === 'user',
  })

  const { data: achievementTypes, isLoading: typesLoading } = useQuery({
    queryKey: ['achievement-types'],
    queryFn: achievementsApi.getTypes,
    enabled: step === 'achievement',
  })

  const awardMutation = useMutation({
    mutationFn: achievementsApi.award,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['achievements'] })
      handleClose()
    },
    onError: (err: any) => {
      setError(err.response?.data?.detail || 'Ошибка при выдаче награды')
    },
  })

  const handleClose = () => {
    setStep(preselectedUser ? 'achievement' : 'user')
    setUserSearch('')
    setSelectedUser(preselectedUser || null)
    setSelectedAchievement(null)
    setComment('')
    setError('')
    onClose()
  }

  const handleSelectUser = (user: UserBasic) => {
    setSelectedUser(user)
    setStep('achievement')
  }

  const handleSelectAchievement = (achievement: Achievement) => {
    setSelectedAchievement(achievement)
    setStep('comment')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser || !selectedAchievement) return

    if (!comment.trim()) {
      setError('Комментарий обязателен')
      return
    }

    awardMutation.mutate({
      recipient: selectedUser.id,
      achievement: selectedAchievement.id,
      comment: comment.trim(),
    })
  }

  const getStepIndex = () => {
    switch (step) {
      case 'user': return 0
      case 'achievement': return 1
      case 'comment': return 2
      default: return 0
    }
  }

  return (
    <Modal
      open={isOpen}
      onRequestClose={handleClose}
      modalHeading={
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Trophy size={20} />
          Наградить коллегу
        </span>
      }
      passiveModal
      size="md"
    >
      <div style={{ padding: '1rem 0' }}>
        {/* Step indicator */}
        <ProgressIndicator currentIndex={getStepIndex()} style={{ marginBottom: '1.5rem' }}>
          <ProgressStep label="Сотрудник" />
          <ProgressStep label="Награда" />
          <ProgressStep label="Комментарий" />
        </ProgressIndicator>

        {error && (
          <InlineNotification
            kind="error"
            title="Ошибка"
            subtitle={error}
            hideCloseButton
            lowContrast
            style={{ marginBottom: '1rem' }}
          />
        )}

        {/* Step 1: Select user */}
        {step === 'user' && (
          <div>
            <TextInput
              id="user-search"
              labelText="Поиск сотрудника"
              placeholder="Введите имя..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
            />

            <div style={{ marginTop: '1rem', maxHeight: '300px', overflowY: 'auto' }}>
              {usersLoading && userSearch.length >= 2 && (
                <Loading withOverlay={false} small />
              )}

              {users && users.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {users.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => handleSelectUser(user)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.75rem',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        width: '100%',
                        textAlign: 'left',
                      }}
                      className="list-item"
                    >
                      <div className="list-item-avatar" style={{ width: '40px', height: '40px' }}>
                        {user.avatar ? (
                          <img src={user.avatar} alt={user.full_name} />
                        ) : (
                          getInitials(user.full_name)
                        )}
                      </div>
                      <div>
                        <p style={{ fontWeight: 500 }}>{user.full_name}</p>
                        <p style={{ fontSize: '0.875rem', color: 'var(--cds-text-secondary)' }}>
                          {user.position?.name}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {userSearch.length >= 2 && users?.length === 0 && !usersLoading && (
                <p style={{ textAlign: 'center', padding: '1rem', color: 'var(--cds-text-secondary)' }}>
                  Сотрудники не найдены
                </p>
              )}

              {userSearch.length < 2 && (
                <p style={{ textAlign: 'center', padding: '1rem', color: 'var(--cds-text-helper)' }}>
                  Введите минимум 2 символа для поиска
                </p>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Select achievement */}
        {step === 'achievement' && (
          <div>
            {selectedUser && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem',
                background: 'var(--cds-layer-02)',
                marginBottom: '1rem',
              }}>
                <div className="list-item-avatar" style={{ width: '40px', height: '40px' }}>
                  {selectedUser.avatar ? (
                    <img src={selectedUser.avatar} alt={selectedUser.full_name} />
                  ) : (
                    getInitials(selectedUser.full_name)
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 500 }}>{selectedUser.full_name}</p>
                  <p style={{ fontSize: '0.875rem', color: 'var(--cds-text-secondary)' }}>
                    {selectedUser.position?.name}
                  </p>
                </div>
                {!preselectedUser && (
                  <Button kind="ghost" size="sm" onClick={() => setStep('user')}>
                    Изменить
                  </Button>
                )}
              </div>
            )}

            <p style={{ fontWeight: 500, marginBottom: '0.5rem' }}>Выберите награду</p>

            {typesLoading ? (
              <Loading withOverlay={false} small />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '250px', overflowY: 'auto' }}>
                {achievementTypes?.map((achievement) => (
                  <button
                    key={achievement.id}
                    onClick={() => handleSelectAchievement(achievement)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.75rem',
                      background: selectedAchievement?.id === achievement.id ? 'var(--cds-layer-selected-01)' : 'transparent',
                      border: selectedAchievement?.id === achievement.id ? '2px solid var(--cds-border-interactive)' : '2px solid transparent',
                      cursor: 'pointer',
                      width: '100%',
                      textAlign: 'left',
                    }}
                    className="list-item"
                  >
                    <span style={{ fontSize: '2rem' }}>{achievement.icon}</span>
                    <div>
                      <p style={{ fontWeight: 500 }}>{achievement.name}</p>
                      <p style={{ fontSize: '0.875rem', color: 'var(--cds-text-secondary)' }}>
                        {achievement.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 3: Add comment */}
        {step === 'comment' && (
          <form onSubmit={handleSubmit}>
            {selectedUser && selectedAchievement && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem',
                background: 'var(--cds-layer-02)',
                marginBottom: '1rem',
              }}>
                <div className="list-item-avatar" style={{ width: '40px', height: '40px' }}>
                  {selectedUser.avatar ? (
                    <img src={selectedUser.avatar} alt={selectedUser.full_name} />
                  ) : (
                    getInitials(selectedUser.full_name)
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 500 }}>{selectedUser.full_name}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1.25rem' }}>{selectedAchievement.icon}</span>
                    <span style={{ fontSize: '0.875rem', color: 'var(--cds-link-primary)' }}>
                      {selectedAchievement.name}
                    </span>
                  </div>
                </div>
                <Button kind="ghost" size="sm" onClick={() => setStep('achievement')}>
                  Изменить
                </Button>
              </div>
            )}

            <TextArea
              id="comment"
              labelText="Комментарий (обязательно)"
              placeholder="За что вы награждаете этого сотрудника?"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              helperText="Опишите, за какие заслуги сотрудник получает эту награду"
            />

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
              <Button type="submit" disabled={awardMutation.isPending}>
                {awardMutation.isPending ? 'Награждение...' : 'Наградить'}
              </Button>
              <Button kind="secondary" onClick={handleClose}>
                Отмена
              </Button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  )
}
