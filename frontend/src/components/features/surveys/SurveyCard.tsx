import { Link, useNavigate } from 'react-router-dom'
import { Tag, Button, OverflowMenu, OverflowMenuItem } from '@carbon/react'
import { Checkmark, Time, Document, User, Analytics } from '@carbon/icons-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { Survey } from '@/types'
import { formatDate } from '@/lib/utils'
import { surveysApi } from '@/api/endpoints/surveys'
import { useAuthStore } from '@/store/authStore'

interface SurveyCardProps {
  survey: Survey
  showAuthor?: boolean
}

const statusColors: Record<string, 'green' | 'blue' | 'gray'> = {
  draft: 'gray',
  active: 'green',
  closed: 'blue',
}

const statusLabels: Record<string, string> = {
  draft: 'Черновик',
  active: 'Активный',
  closed: 'Завершён',
}

export function SurveyCard({ survey, showAuthor = true }: SurveyCardProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  const isAdmin = user?.is_superuser || user?.role?.is_admin
  const isAuthor = user?.id === survey.author_id
  const canManage = isAdmin || isAuthor

  const publishMutation = useMutation({
    mutationFn: () => surveysApi.publish(survey.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['surveys'] })
    },
  })

  const closeMutation = useMutation({
    mutationFn: () => surveysApi.close(survey.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['surveys'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => surveysApi.delete(survey.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['surveys'] })
    },
  })

  return (
    <div className="survey-card">
      <div className="survey-card__header">
        <div className="survey-card__title-row">
          <Link to={`/surveys/${survey.id}`} className="survey-card__title">
            {survey.title}
          </Link>
          <div className="survey-card__tags">
            {survey.is_anonymous && (
              <Tag size="sm" type="purple">Анонимный</Tag>
            )}
            {survey.is_required && (
              <Tag size="sm" type="red">Обязательный</Tag>
            )}
            <Tag type={statusColors[survey.status]} size="sm">
              {statusLabels[survey.status]}
            </Tag>
          </div>
        </div>

        {canManage && (
          <OverflowMenu flipped aria-label="Управление опросом" size="sm">
            {survey.status === 'draft' && (
              <>
                <OverflowMenuItem
                  itemText="Редактировать"
                  onClick={() => navigate(`/surveys/${survey.id}/edit`)}
                />
                <OverflowMenuItem
                  itemText="Опубликовать"
                  onClick={() => publishMutation.mutate()}
                  disabled={survey.questions_count === 0}
                />
              </>
            )}
            {survey.status === 'active' && (
              <OverflowMenuItem
                itemText="Завершить опрос"
                onClick={() => closeMutation.mutate()}
              />
            )}
            <OverflowMenuItem
              itemText="Результаты"
              onClick={() => navigate(`/surveys/${survey.id}/results`)}
            />
            {survey.status !== 'active' && (
              <OverflowMenuItem
                itemText="Удалить"
                isDelete
                onClick={() => {
                  if (confirm('Удалить этот опрос?')) {
                    deleteMutation.mutate()
                  }
                }}
              />
            )}
          </OverflowMenu>
        )}
      </div>

      {survey.description && (
        <p className="survey-card__description">{survey.description}</p>
      )}

      <div className="survey-card__meta">
        {showAuthor && (
          <span className="survey-card__meta-item">
            <User size={14} />
            {survey.author_name}
          </span>
        )}
        <span className="survey-card__meta-item">
          <Document size={14} />
          {survey.questions_count} вопросов
        </span>
        <span className="survey-card__meta-item">
          <Checkmark size={14} />
          {survey.responses_count} ответов
        </span>
        {survey.ends_at && (
          <span className="survey-card__meta-item">
            <Time size={14} />
            до {formatDate(survey.ends_at)}
          </span>
        )}
      </div>

      <div className="survey-card__actions">
        {survey.status === 'active' && !survey.has_responded && (
          <Button as={Link} to={`/surveys/${survey.id}`} size="sm">
            Пройти опрос
          </Button>
        )}

        {survey.has_responded && (
          <div className="survey-card__completed">
            <Checkmark size={16} />
            Вы уже прошли этот опрос
          </div>
        )}

        {canManage && (
          <Button
            kind="ghost"
            size="sm"
            renderIcon={Analytics}
            onClick={() => navigate(`/surveys/${survey.id}/results`)}
          >
            Результаты
          </Button>
        )}
      </div>
    </div>
  )
}
