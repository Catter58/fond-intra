import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Grid,
  Column,
  Tile,
  Tag,
  Button,
  Select,
  SelectItem,
  TextArea,
  Modal,
  Loading,
  InlineNotification,
  StructuredListWrapper,
  StructuredListRow,
  StructuredListCell,
  StructuredListBody,
} from '@carbon/react'
import {
  ThumbsUp,
  ThumbsDown,
  TrashCan,
  ArrowLeft,
  Chat,
  Send,
  Time,
  CheckmarkFilled,
  CloseFilled,
  InProgress,
} from '@carbon/icons-react'
import { ideasApi } from '@/api/endpoints/ideas'
import { Avatar } from '@/components/ui/Avatar'
import { useAuthStore } from '@/store/authStore'
import type { IdeaStatus } from '@/types'

const statusConfig: Record<IdeaStatus, { color: 'gray' | 'blue' | 'green' | 'cyan' | 'purple' | 'red', icon: typeof CheckmarkFilled }> = {
  new: { color: 'gray', icon: Time },
  under_review: { color: 'blue', icon: InProgress },
  approved: { color: 'cyan', icon: CheckmarkFilled },
  in_progress: { color: 'purple', icon: InProgress },
  implemented: { color: 'green', icon: CheckmarkFilled },
  rejected: { color: 'red', icon: CloseFilled },
}

const categoryColors: Record<string, 'gray' | 'blue' | 'green' | 'teal'> = {
  process: 'blue',
  product: 'green',
  culture: 'teal',
  other: 'gray',
}

export default function IdeaDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const isAdmin = user?.is_superuser || user?.role?.is_admin

  const [newComment, setNewComment] = useState('')
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false)
  const [newStatus, setNewStatus] = useState('')
  const [adminComment, setAdminComment] = useState('')
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

  const { data: idea, isLoading, error } = useQuery({
    queryKey: ['idea', id],
    queryFn: () => ideasApi.getById(Number(id)),
    enabled: !!id,
  })

  const { data: comments, isLoading: commentsLoading } = useQuery({
    queryKey: ['idea-comments', id],
    queryFn: () => ideasApi.getComments(Number(id)),
    enabled: !!id,
  })

  const { data: statuses } = useQuery({
    queryKey: ['idea-statuses'],
    queryFn: ideasApi.getStatuses,
  })

  const voteMutation = useMutation({
    mutationFn: ({ ideaId, isUpvote }: { ideaId: number; isUpvote: boolean }) =>
      ideasApi.vote(ideaId, isUpvote),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['idea', id] })
    },
  })

  const unvoteMutation = useMutation({
    mutationFn: ideasApi.unvote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['idea', id] })
    },
  })

  const commentMutation = useMutation({
    mutationFn: (text: string) => ideasApi.addComment(Number(id), text),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['idea-comments', id] })
      queryClient.invalidateQueries({ queryKey: ['idea', id] })
      setNewComment('')
    },
  })

  const statusMutation = useMutation({
    mutationFn: () => ideasApi.updateStatus(Number(id), {
      status: newStatus,
      admin_comment: adminComment || undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['idea', id] })
      setIsStatusModalOpen(false)
      setNewStatus('')
      setAdminComment('')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => ideasApi.delete(Number(id)),
    onSuccess: () => {
      navigate('/ideas')
    },
  })

  const handleVote = (isUpvote: boolean) => {
    if (!idea) return
    if (idea.user_vote === (isUpvote ? 'up' : 'down')) {
      unvoteMutation.mutate(idea.id)
    } else {
      voteMutation.mutate({ ideaId: idea.id, isUpvote })
    }
  }

  const handleAddComment = () => {
    if (newComment.trim()) {
      commentMutation.mutate(newComment.trim())
    }
  }

  const openStatusModal = () => {
    if (idea) {
      setNewStatus(idea.status)
      setAdminComment(idea.admin_comment || '')
      setIsStatusModalOpen(true)
    }
  }

  if (isLoading) {
    return <Loading description="Загрузка идеи..." withOverlay />
  }

  if (error || !idea) {
    return (
      <Grid className="dashboard-page">
        <Column lg={16} md={8} sm={4}>
          <InlineNotification
            kind="error"
            title="Ошибка"
            subtitle="Идея не найдена"
            hideCloseButton
          />
          <Button kind="ghost" renderIcon={ArrowLeft} onClick={() => navigate('/ideas')} className="mt-4">
            Вернуться к идеям
          </Button>
        </Column>
      </Grid>
    )
  }

  const isOwner = user?.id === idea.author.id
  const statusInfo = statusConfig[idea.status]
  const StatusIcon = statusInfo.icon

  return (
    <Grid className="dashboard-page">
      <Column lg={16} md={8} sm={4}>
        <Button
          kind="ghost"
          renderIcon={ArrowLeft}
          onClick={() => navigate('/ideas')}
          className="mb-4"
        >
          Назад к идеям
        </Button>

        <div className="idea-detail">
          <div className="idea-detail__main">
            {/* Main content card */}
            <Tile className="idea-detail__content">
              {/* Header with tags */}
              <div className="idea-detail__header">
                <div className="idea-detail__tags">
                  <Tag type={categoryColors[idea.category] || 'gray'} size="md">
                    {idea.category_display}
                  </Tag>
                  <Tag type={statusInfo.color} size="md" renderIcon={StatusIcon}>
                    {idea.status_display}
                  </Tag>
                </div>
                {(isOwner || isAdmin) && (
                  <div className="idea-detail__actions">
                    {isAdmin && (
                      <Button kind="tertiary" size="sm" onClick={openStatusModal}>
                        Изменить статус
                      </Button>
                    )}
                    <Button
                      kind="danger--ghost"
                      size="sm"
                      hasIconOnly
                      renderIcon={TrashCan}
                      iconDescription="Удалить"
                      onClick={() => setIsDeleteModalOpen(true)}
                    />
                  </div>
                )}
              </div>

              {/* Title */}
              <h1 className="idea-detail__title">{idea.title}</h1>

              {/* Description */}
              <div className="idea-detail__description">
                {idea.description}
              </div>

              {/* Admin comment */}
              {idea.admin_comment && (
                <div className="idea-detail__admin-comment">
                  <div className="idea-detail__admin-comment-label">
                    Комментарий модератора
                  </div>
                  <p>{idea.admin_comment}</p>
                </div>
              )}

              {/* Author info */}
              <div className="idea-detail__author-section">
                <div className="idea-detail__author">
                  <Avatar
                    name={idea.author.full_name}
                    src={idea.author.avatar}
                    size={48}
                  />
                  <div className="idea-detail__author-info">
                    <div className="idea-detail__author-name">{idea.author.full_name}</div>
                    <div className="idea-detail__author-meta">
                      {idea.author.position || 'Сотрудник'}
                      {idea.author.department && ` · ${idea.author.department}`}
                    </div>
                    <div className="idea-detail__date">
                      {new Date(idea.created_at).toLocaleString('ru-RU', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </Tile>

            {/* Comments section */}
            <Tile className="idea-detail__comments">
              <h2 className="idea-detail__comments-title">
                <Chat size={20} />
                Обсуждение ({idea.comments_count})
              </h2>

              {/* Comment form */}
              <div className="idea-detail__comment-form">
                <Avatar
                  name={user?.full_name || ''}
                  src={user?.avatar}
                  size={40}
                />
                <div className="idea-detail__comment-input">
                  <TextArea
                    id="new-comment"
                    labelText=""
                    hideLabel
                    placeholder="Написать комментарий..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows={2}
                  />
                  <Button
                    kind="primary"
                    size="md"
                    hasIconOnly
                    renderIcon={Send}
                    iconDescription="Отправить"
                    onClick={handleAddComment}
                    disabled={!newComment.trim() || commentMutation.isPending}
                    className="idea-detail__send-btn"
                  />
                </div>
              </div>

              {/* Comments list */}
              <div className="idea-detail__comments-list">
                {commentsLoading ? (
                  <Loading description="Загрузка комментариев..." withOverlay={false} small />
                ) : comments && comments.length > 0 ? (
                  comments.map((comment) => (
                    <div key={comment.id} className="idea-detail__comment">
                      <Avatar
                        name={comment.author.full_name}
                        src={comment.author.avatar}
                        size={36}
                      />
                      <div className="idea-detail__comment-content">
                        <div className="idea-detail__comment-header">
                          <span className="idea-detail__comment-author">{comment.author.full_name}</span>
                          <span className="idea-detail__comment-time">
                            {new Date(comment.created_at).toLocaleString('ru-RU', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <p className="idea-detail__comment-text">{comment.text}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="idea-detail__no-comments">
                    <Chat size={32} />
                    <p>Комментариев пока нет</p>
                    <span>Будьте первым, кто оставит комментарий!</span>
                  </div>
                )}
              </div>
            </Tile>
          </div>

          {/* Sidebar */}
          <div className="idea-detail__sidebar">
            {/* Voting card */}
            <Tile className="idea-detail__voting">
              <h3 className="idea-detail__voting-title">Голосование</h3>

              {isOwner ? (
                <div className="idea-detail__own-idea">
                  <p>Вы не можете голосовать за свою идею</p>
                </div>
              ) : (
                <div className="idea-detail__voting-buttons">
                  <Button
                    kind={idea.user_vote === 'up' ? 'primary' : 'tertiary'}
                    renderIcon={ThumbsUp}
                    onClick={() => handleVote(true)}
                    className="idea-detail__vote-btn"
                    disabled={voteMutation.isPending || unvoteMutation.isPending}
                  >
                    За ({idea.upvotes_count})
                  </Button>
                  <Button
                    kind={idea.user_vote === 'down' ? 'danger' : 'tertiary'}
                    renderIcon={ThumbsDown}
                    onClick={() => handleVote(false)}
                    className="idea-detail__vote-btn"
                    disabled={voteMutation.isPending || unvoteMutation.isPending}
                  >
                    Против ({idea.downvotes_count})
                  </Button>
                </div>
              )}

              <div className="idea-detail__voting-score">
                <span className="idea-detail__voting-label">Общий рейтинг</span>
                <span className={`idea-detail__voting-value ${
                  idea.votes_score > 0 ? 'positive' : idea.votes_score < 0 ? 'negative' : ''
                }`}>
                  {idea.votes_score > 0 ? '+' : ''}{idea.votes_score}
                </span>
              </div>
            </Tile>

            {/* Stats card */}
            <Tile className="idea-detail__stats">
              <h3 className="idea-detail__stats-title">Информация</h3>
              <StructuredListWrapper isCondensed>
                <StructuredListBody>
                  <StructuredListRow>
                    <StructuredListCell>Статус</StructuredListCell>
                    <StructuredListCell>
                      <Tag type={statusInfo.color} size="sm">{idea.status_display}</Tag>
                    </StructuredListCell>
                  </StructuredListRow>
                  <StructuredListRow>
                    <StructuredListCell>Категория</StructuredListCell>
                    <StructuredListCell>{idea.category_display}</StructuredListCell>
                  </StructuredListRow>
                  <StructuredListRow>
                    <StructuredListCell>Комментарии</StructuredListCell>
                    <StructuredListCell>{idea.comments_count}</StructuredListCell>
                  </StructuredListRow>
                  <StructuredListRow>
                    <StructuredListCell>Создана</StructuredListCell>
                    <StructuredListCell>
                      {new Date(idea.created_at).toLocaleDateString('ru-RU')}
                    </StructuredListCell>
                  </StructuredListRow>
                </StructuredListBody>
              </StructuredListWrapper>
            </Tile>
          </div>
        </div>
      </Column>

      {/* Status change modal */}
      <Modal
        open={isStatusModalOpen}
        onRequestClose={() => setIsStatusModalOpen(false)}
        modalHeading="Изменить статус идеи"
        primaryButtonText="Сохранить"
        secondaryButtonText="Отмена"
        onRequestSubmit={() => statusMutation.mutate()}
        primaryButtonDisabled={statusMutation.isPending}
      >
        <Select
          id="new-status"
          labelText="Статус"
          value={newStatus}
          onChange={(e) => setNewStatus(e.target.value)}
          className="mb-4"
        >
          {statuses?.map((status) => (
            <SelectItem key={status.value} value={status.value} text={status.label} />
          ))}
        </Select>

        <TextArea
          id="admin-comment"
          labelText="Комментарий модератора"
          placeholder="Оставьте комментарий для автора идеи..."
          value={adminComment}
          onChange={(e) => setAdminComment(e.target.value)}
          rows={3}
        />
      </Modal>

      {/* Delete modal */}
      <Modal
        open={isDeleteModalOpen}
        onRequestClose={() => setIsDeleteModalOpen(false)}
        modalHeading="Удалить идею?"
        primaryButtonText="Удалить"
        secondaryButtonText="Отмена"
        danger
        onRequestSubmit={() => deleteMutation.mutate()}
        primaryButtonDisabled={deleteMutation.isPending}
      >
        <p>Вы уверены, что хотите удалить эту идею? Это действие нельзя отменить.</p>
      </Modal>
    </Grid>
  )
}
