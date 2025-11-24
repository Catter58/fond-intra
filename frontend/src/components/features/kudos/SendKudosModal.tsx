import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Modal,
  TextArea,
  Select,
  SelectItem,
  Checkbox,
  Search,
  Loading,
  InlineNotification,
} from '@carbon/react'
import { Help, Star, Favorite, Education, Partnership } from '@carbon/icons-react'
import { kudosApi } from '@/api/endpoints/kudos'
import { usersApi } from '@/api/endpoints/users'
import type { KudosCategory, UserBasic } from '@/types'

interface SendKudosModalProps {
  open: boolean
  onClose: () => void
  preselectedRecipient?: UserBasic | null
}

const categoryIcons: Record<KudosCategory, React.ReactNode> = {
  help: <Help size={20} />,
  great_job: <Star size={20} />,
  initiative: <Favorite size={20} />,
  mentorship: <Education size={20} />,
  teamwork: <Partnership size={20} />,
}

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function SendKudosModal({ open, onClose, preselectedRecipient }: SendKudosModalProps) {
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUser, setSelectedUser] = useState<UserBasic | null>(preselectedRecipient || null)
  const [category, setCategory] = useState<KudosCategory>('great_job')
  const [message, setMessage] = useState('')
  const [isPublic, setIsPublic] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { data: categories } = useQuery({
    queryKey: ['kudos-categories'],
    queryFn: kudosApi.getCategories,
  })

  const { data: searchResults, isLoading: isSearching } = useQuery({
    queryKey: ['users-search', searchQuery],
    queryFn: () => usersApi.getList({ search: searchQuery, page_size: 10 }),
    enabled: searchQuery.length >= 2 && !selectedUser,
  })

  const createMutation = useMutation({
    mutationFn: kudosApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kudos'] })
      handleClose()
    },
    onError: (err: Error) => {
      setError(err.message || 'Ошибка при отправке благодарности')
    },
  })

  const handleClose = () => {
    setSearchQuery('')
    setSelectedUser(preselectedRecipient || null)
    setCategory('great_job')
    setMessage('')
    setIsPublic(true)
    setError(null)
    onClose()
  }

  const handleSubmit = () => {
    if (!selectedUser) {
      setError('Выберите получателя')
      return
    }
    if (!message.trim()) {
      setError('Напишите сообщение')
      return
    }
    if (message.length > 500) {
      setError('Сообщение не должно превышать 500 символов')
      return
    }

    createMutation.mutate({
      recipient: selectedUser.id,
      category,
      message: message.trim(),
      is_public: isPublic,
    })
  }

  return (
    <Modal
      open={open}
      onRequestClose={handleClose}
      modalHeading="Отправить благодарность"
      primaryButtonText="Отправить"
      secondaryButtonText="Отмена"
      onRequestSubmit={handleSubmit}
      primaryButtonDisabled={!selectedUser || !message.trim() || createMutation.isPending}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {error && (
          <InlineNotification
            kind="error"
            title="Ошибка"
            subtitle={error}
            onCloseButtonClick={() => setError(null)}
          />
        )}

        {/* Recipient Selection */}
        {selectedUser ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem',
              backgroundColor: 'var(--cds-layer-01)',
              borderRadius: '4px',
            }}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: 'var(--cds-link-primary)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: 600,
                overflow: 'hidden',
                flexShrink: 0,
              }}
            >
              {selectedUser.avatar ? (
                <img
                  src={selectedUser.avatar}
                  alt={selectedUser.full_name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                getInitials(selectedUser.full_name)
              )}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 500 }}>{selectedUser.full_name}</div>
              {selectedUser.position && (
                <div style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)' }}>
                  {typeof selectedUser.position === 'object' ? selectedUser.position.name : selectedUser.position}
                </div>
              )}
            </div>
            <button
              onClick={() => setSelectedUser(null)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--cds-link-primary)',
                cursor: 'pointer',
                fontSize: '0.875rem',
              }}
            >
              Изменить
            </button>
          </div>
        ) : (
          <div>
            <Search
              id="recipient-search"
              labelText="Получатель"
              placeholder="Поиск сотрудника..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              size="lg"
            />
            {isSearching && (
              <div style={{ padding: '1rem', textAlign: 'center' }}>
                <Loading withOverlay={false} small />
              </div>
            )}
            {searchResults && searchResults.results.length > 0 && (
              <div
                style={{
                  marginTop: '0.5rem',
                  border: '1px solid var(--cds-border-subtle-01)',
                  borderRadius: '4px',
                  maxHeight: '200px',
                  overflowY: 'auto',
                }}
              >
                {searchResults.results.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => {
                      setSelectedUser(user)
                      setSearchQuery('')
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.75rem',
                      background: 'none',
                      border: 'none',
                      borderBottom: '1px solid var(--cds-border-subtle-01)',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                    className="list-item"
                  >
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--cds-link-primary)',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.625rem',
                        fontWeight: 600,
                        overflow: 'hidden',
                        flexShrink: 0,
                      }}
                    >
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.full_name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        getInitials(user.full_name)
                      )}
                    </div>
                    <div>
                      <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{user.full_name}</div>
                      {user.position && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)' }}>
                          {typeof user.position === 'object' ? user.position.name : user.position}
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Category Selection */}
        <Select
          id="kudos-category"
          labelText="Категория"
          value={category}
          onChange={(e) => setCategory(e.target.value as KudosCategory)}
        >
          {categories?.map((cat) => (
            <SelectItem key={cat.value} value={cat.value} text={cat.label} />
          ))}
        </Select>

        {/* Category Icons Preview */}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          {Object.entries(categoryIcons).map(([key, icon]) => (
            <button
              key={key}
              onClick={() => setCategory(key as KudosCategory)}
              style={{
                padding: '0.75rem',
                borderRadius: '8px',
                border: category === key ? '2px solid var(--cds-link-primary)' : '1px solid var(--cds-border-subtle-01)',
                backgroundColor: category === key ? 'var(--cds-layer-selected-01)' : 'transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: category === key ? 'var(--cds-link-primary)' : 'var(--cds-text-secondary)',
              }}
              title={categories?.find(c => c.value === key)?.label}
            >
              {icon}
            </button>
          ))}
        </div>

        {/* Message */}
        <TextArea
          id="kudos-message"
          labelText="Сообщение"
          placeholder="Напишите, за что благодарите коллегу..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxCount={500}
          enableCounter
          rows={4}
        />

        {/* Public Checkbox */}
        <Checkbox
          id="kudos-public"
          labelText="Показать в общей ленте"
          checked={isPublic}
          onChange={(_, { checked }) => setIsPublic(checked)}
        />
      </div>
    </Modal>
  )
}
