import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { Tile, Button, TextInput, TextArea, Loading, InlineNotification } from '@carbon/react'
import { ArrowLeft, Upload, TrashCan } from '@carbon/icons-react'
import { useAuthStore } from '@/store/authStore'
import { usersApi } from '@/api/endpoints/users'

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function ProfileEditPage() {
  const navigate = useNavigate()
  const { user, setUser } = useAuthStore()

  const [formData, setFormData] = useState({
    phone_personal: user?.phone_personal || '',
    birth_date: user?.birth_date || '',
    bio: user?.bio || '',
    telegram: user?.telegram || '',
  })
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarDeleted, setAvatarDeleted] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState('')

  const updateMutation = useMutation({
    mutationFn: usersApi.updateMe,
    onSuccess: (data) => {
      setUser(data)
      navigate('/profile')
    },
    onError: () => {
      setError('Ошибка при сохранении профиля')
    },
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setAvatarFile(file)
      setAvatarDeleted(false)
      const reader = new FileReader()
      reader.onload = () => {
        setAvatarPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleDeleteAvatar = async () => {
    if (!user?.avatar || avatarDeleted) return

    setIsDeleting(true)
    setError('')
    try {
      await usersApi.deleteAvatar()
      setUser({ ...user, avatar: null })
      setAvatarDeleted(true)
      setAvatarPreview(null)
      setAvatarFile(null)
    } catch {
      setError('Ошибка при удалении фотографии')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // First upload avatar if changed
    if (avatarFile) {
      try {
        const result = await usersApi.uploadAvatar(avatarFile)
        // Update local user state with new avatar
        if (user) {
          setUser({ ...user, avatar: result.avatar })
        }
      } catch {
        setError('Ошибка при загрузке аватара')
        return
      }
    }

    // Filter out empty values and only send changed fields
    const dataToSend: Record<string, string | null> = {}
    if (formData.phone_personal !== (user?.phone_personal || '')) {
      dataToSend.phone_personal = formData.phone_personal || null
    }
    if (formData.birth_date !== (user?.birth_date || '')) {
      dataToSend.birth_date = formData.birth_date || null
    }
    if (formData.bio !== (user?.bio || '')) {
      dataToSend.bio = formData.bio || null
    }
    if (formData.telegram !== (user?.telegram || '')) {
      dataToSend.telegram = formData.telegram || null
    }

    // Only call update if there are changes
    if (Object.keys(dataToSend).length > 0) {
      updateMutation.mutate(dataToSend)
    } else if (avatarFile) {
      // Only avatar was changed, just navigate back
      navigate('/profile')
    } else {
      // Nothing changed
      navigate('/profile')
    }
  }

  if (!user) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
        <Loading withOverlay={false} />
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Button
            kind="ghost"
            hasIconOnly
            renderIcon={ArrowLeft}
            iconDescription="Назад"
            onClick={() => navigate(-1)}
          />
          <h1 className="page-title">Редактирование профиля</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }}>
          {/* Avatar */}
          <Tile>
            <h3 style={{ fontWeight: 600, marginBottom: '1rem' }}>Фотография</h3>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div className="list-item-avatar" style={{ width: '128px', height: '128px', fontSize: '2rem', marginBottom: '1rem' }}>
                {avatarDeleted ? (
                  getInitials(user.full_name)
                ) : avatarPreview ? (
                  <img src={avatarPreview} alt={user.full_name} />
                ) : user.avatar ? (
                  <img src={user.avatar} alt={user.full_name} />
                ) : (
                  getInitials(user.full_name)
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ cursor: 'pointer' }}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    style={{ display: 'none' }}
                  />
                  <Button kind="tertiary" size="sm" renderIcon={Upload} as="span">
                    Загрузить фото
                  </Button>
                </label>
                {(user.avatar && !avatarDeleted && !avatarPreview) && (
                  <Button
                    kind="danger--ghost"
                    size="sm"
                    renderIcon={TrashCan}
                    onClick={handleDeleteAvatar}
                    disabled={isDeleting}
                  >
                    {isDeleting ? 'Удаление...' : 'Удалить фото'}
                  </Button>
                )}
              </div>
            </div>
          </Tile>

          {/* Form */}
          <Tile>
            <h3 style={{ fontWeight: 600, marginBottom: '1rem' }}>Личная информация</h3>

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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <TextInput
                id="phone_personal"
                name="phone_personal"
                labelText="Телефон"
                type="tel"
                value={formData.phone_personal}
                onChange={handleChange}
                placeholder="+7 (999) 123-45-67"
              />

              <TextInput
                id="birth_date"
                name="birth_date"
                labelText="День рождения"
                type="date"
                value={formData.birth_date}
                onChange={handleChange}
              />

              <TextInput
                id="telegram"
                name="telegram"
                labelText="Telegram"
                value={formData.telegram}
                onChange={handleChange}
                placeholder="@username"
              />
            </div>

            <TextArea
              id="bio"
              name="bio"
              labelText="О себе"
              value={formData.bio}
              onChange={handleChange}
              rows={4}
              placeholder="Расскажите о себе..."
            />

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'Сохранение...' : 'Сохранить'}
              </Button>
              <Button kind="secondary" onClick={() => navigate(-1)}>
                Отмена
              </Button>
            </div>
          </Tile>
        </div>
      </form>
    </div>
  )
}
