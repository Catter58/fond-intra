import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { X, Search, Award } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { achievementsApi } from '@/api/endpoints/achievements'
import { usersApi } from '@/api/endpoints/users'
import { getInitials, cn } from '@/lib/utils'
import type { Achievement, UserBasic } from '@/types'

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

  const { data: users } = useQuery({
    queryKey: ['users', 'search', userSearch],
    queryFn: () => usersApi.search(userSearch),
    enabled: userSearch.length >= 2 && step === 'user',
  })

  const { data: achievementTypes } = useQuery({
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
      setError(err.response?.data?.detail || 'Ошибка при выдаче ачивки')
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

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-overlay flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Наградить коллегу
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={handleClose}>
            <X className="h-5 w-5" />
          </Button>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto">
          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-6">
            <div className={cn(
              'flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium',
              step === 'user' ? 'bg-interactive-primary text-white' : 'bg-layer-02 text-text-secondary'
            )}>
              1
            </div>
            <div className="flex-1 h-0.5 bg-layer-02" />
            <div className={cn(
              'flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium',
              step === 'achievement' ? 'bg-interactive-primary text-white' : 'bg-layer-02 text-text-secondary'
            )}>
              2
            </div>
            <div className="flex-1 h-0.5 bg-layer-02" />
            <div className={cn(
              'flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium',
              step === 'comment' ? 'bg-interactive-primary text-white' : 'bg-layer-02 text-text-secondary'
            )}>
              3
            </div>
          </div>

          {error && (
            <div className="p-3 mb-4 bg-support-error/10 border border-support-error text-support-error text-sm rounded">
              {error}
            </div>
          )}

          {/* Step 1: Select user */}
          {step === 'user' && (
            <div className="space-y-4">
              <div>
                <Label>Выберите сотрудника</Label>
                <div className="relative mt-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-placeholder" />
                  <Input
                    type="search"
                    placeholder="Поиск по имени..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {users && users.length > 0 && (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {users.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => handleSelectUser(user)}
                      className="w-full flex items-center gap-3 p-3 rounded hover:bg-layer-hover transition-colors text-left"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.avatar || undefined} />
                        <AvatarFallback>{getInitials(user.full_name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{user.full_name}</p>
                        <p className="text-sm text-text-secondary">{user.position?.name}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {userSearch.length >= 2 && users?.length === 0 && (
                <p className="text-sm text-text-secondary text-center py-4">
                  Сотрудники не найдены
                </p>
              )}

              {userSearch.length < 2 && (
                <p className="text-sm text-text-helper text-center py-4">
                  Введите минимум 2 символа для поиска
                </p>
              )}
            </div>
          )}

          {/* Step 2: Select achievement */}
          {step === 'achievement' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-layer-02 rounded">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={selectedUser?.avatar || undefined} />
                  <AvatarFallback>{selectedUser ? getInitials(selectedUser.full_name) : ''}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{selectedUser?.full_name}</p>
                  <p className="text-sm text-text-secondary">{selectedUser?.position?.name}</p>
                </div>
                {!preselectedUser && (
                  <Button variant="ghost" size="sm" onClick={() => setStep('user')} className="ml-auto">
                    Изменить
                  </Button>
                )}
              </div>

              <div>
                <Label>Выберите награду</Label>
                <div className="mt-2 grid grid-cols-1 gap-2 max-h-64 overflow-y-auto">
                  {achievementTypes?.map((achievement) => (
                    <button
                      key={achievement.id}
                      onClick={() => handleSelectAchievement(achievement)}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded border transition-colors text-left',
                        selectedAchievement?.id === achievement.id
                          ? 'border-interactive-primary bg-interactive-primary/5'
                          : 'border-transparent hover:bg-layer-hover'
                      )}
                    >
                      <span className="text-3xl">{achievement.icon}</span>
                      <div>
                        <p className="font-medium">{achievement.name}</p>
                        <p className="text-sm text-text-secondary line-clamp-1">
                          {achievement.description}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Add comment */}
          {step === 'comment' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-layer-02 rounded">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={selectedUser?.avatar || undefined} />
                  <AvatarFallback>{selectedUser ? getInitials(selectedUser.full_name) : ''}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium">{selectedUser?.full_name}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{selectedAchievement?.icon}</span>
                    <span className="text-sm text-interactive-primary">{selectedAchievement?.name}</span>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setStep('achievement')}>
                  Изменить
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="comment">Комментарий (обязательно)</Label>
                <textarea
                  id="comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="За что вы награждаете этого сотрудника?"
                  rows={4}
                  className="flex w-full border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  required
                />
                <p className="text-xs text-text-helper">
                  Опишите, за какие заслуги сотрудник получает эту награду
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={awardMutation.isPending}>
                  {awardMutation.isPending ? 'Награждение...' : 'Наградить'}
                </Button>
                <Button type="button" variant="outline" onClick={handleClose}>
                  Отмена
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
