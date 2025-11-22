import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { ArrowLeft, Upload, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuthStore } from '@/store/authStore'
import { usersApi } from '@/api/endpoints/users'
import { getInitials } from '@/lib/utils'

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
    return <div>Загрузка...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-semibold text-text-primary">
          Редактирование профиля
        </h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Avatar */}
          <Card>
            <CardHeader>
              <CardTitle>Фотография</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <Avatar className="h-32 w-32 mb-4">
                <AvatarImage src={avatarDeleted ? undefined : (avatarPreview || user.avatar || undefined)} />
                <AvatarFallback className="text-2xl">
                  {getInitials(user.full_name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col gap-2">
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                  <span className="inline-flex items-center gap-2 px-4 py-2 border rounded hover:bg-secondary transition-colors text-sm">
                    <Upload className="h-4 w-4" />
                    Загрузить фото
                  </span>
                </label>
                {(user.avatar && !avatarDeleted && !avatarPreview) && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleDeleteAvatar}
                    disabled={isDeleting}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    {isDeleting ? 'Удаление...' : 'Удалить фото'}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Form */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Личная информация</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <div className="p-3 bg-support-error/10 border border-support-error text-support-error text-sm rounded">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone_personal">Телефон</Label>
                  <Input
                    id="phone_personal"
                    name="phone_personal"
                    type="tel"
                    value={formData.phone_personal}
                    onChange={handleChange}
                    placeholder="+7 (999) 123-45-67"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="birth_date">День рождения</Label>
                  <Input
                    id="birth_date"
                    name="birth_date"
                    type="date"
                    value={formData.birth_date}
                    onChange={handleChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telegram">Telegram</Label>
                  <Input
                    id="telegram"
                    name="telegram"
                    value={formData.telegram}
                    onChange={handleChange}
                    placeholder="@username"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">О себе</Label>
                <textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  rows={4}
                  className="flex w-full border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Расскажите о себе..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? 'Сохранение...' : 'Сохранить'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(-1)}
                >
                  Отмена
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  )
}
