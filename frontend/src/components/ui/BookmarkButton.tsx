import { useState, useEffect } from 'react'
import { Button } from '@carbon/react'
import { Bookmark, BookmarkFilled } from '@carbon/icons-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { interactionsApi } from '@/api/endpoints/interactions'
import { useToast } from '@/components/ui/Toaster'

interface BookmarkButtonProps {
  contentType: 'user' | 'news'
  objectId: number
  initialBookmarked?: boolean
  size?: 'sm' | 'md' | 'lg'
  kind?: 'ghost' | 'tertiary' | 'primary'
  className?: string
}

export function BookmarkButton({
  contentType,
  objectId,
  initialBookmarked = false,
  size = 'sm',
  kind = 'ghost',
  className,
}: BookmarkButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(initialBookmarked)
  const queryClient = useQueryClient()
  const { showToast } = useToast()

  useEffect(() => {
    setIsBookmarked(initialBookmarked)
  }, [initialBookmarked])

  const toggleMutation = useMutation({
    mutationFn: () => interactionsApi.toggleBookmark(contentType, objectId),
    onSuccess: (data) => {
      setIsBookmarked(data.bookmarked)
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] })
      queryClient.invalidateQueries({ queryKey: ['bookmarked-users'] })
      queryClient.invalidateQueries({ queryKey: ['bookmarked-news'] })

      showToast({
        title: data.bookmarked ? 'Добавлено в избранное' : 'Удалено из избранного',
        kind: 'success',
      })
    },
    onError: () => {
      showToast({
        title: 'Ошибка',
        subtitle: 'Не удалось изменить закладку',
        kind: 'error',
      })
    },
  })

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    toggleMutation.mutate()
  }

  return (
    <Button
      kind={kind}
      size={size}
      hasIconOnly
      renderIcon={isBookmarked ? BookmarkFilled : Bookmark}
      iconDescription={isBookmarked ? 'Удалить из избранного' : 'Добавить в избранное'}
      onClick={handleClick}
      disabled={toggleMutation.isPending}
      className={className}
      style={{
        color: isBookmarked ? 'var(--cds-support-warning)' : undefined,
      }}
    />
  )
}
