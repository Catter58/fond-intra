import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Button,
  Loading,
  InlineNotification,
  Tag,
  ProgressBar,
} from '@carbon/react'
import { ArrowLeft, Checkmark, Analytics } from '@carbon/icons-react'
import { surveysApi } from '@/api/endpoints/surveys'
import { QuestionRenderer } from '@/components/features/surveys'
import type { SurveyAnswer } from '@/types'
import { useAuthStore } from '@/store/authStore'

export function SurveyDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const [answers, setAnswers] = useState<Map<number, SurveyAnswer>>(new Map())
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const isAdmin = user?.role?.is_admin || user?.is_superuser

  const { data: survey, isLoading } = useQuery({
    queryKey: ['survey', id],
    queryFn: () => surveysApi.getById(Number(id)),
    enabled: !!id,
  })

  const submitMutation = useMutation({
    mutationFn: () => {
      const answersArray = Array.from(answers.values())
      return surveysApi.respond(Number(id), { answers: answersArray })
    },
    onSuccess: () => {
      setSubmitted(true)
      queryClient.invalidateQueries({ queryKey: ['surveys'] })
      queryClient.invalidateQueries({ queryKey: ['survey', id] })
    },
    onError: (err: Error) => {
      setError(err.message || 'Ошибка при отправке ответов')
    },
  })

  const handleAnswerChange = (answer: SurveyAnswer) => {
    setAnswers((prev) => {
      const newMap = new Map(prev)
      newMap.set(answer.question_id, answer)
      return newMap
    })
  }

  const handleSubmit = () => {
    setError(null)

    // Validate required questions
    const requiredQuestions = survey?.questions.filter((q) => q.is_required) || []
    for (const question of requiredQuestions) {
      const answer = answers.get(question.id)
      if (!answer) {
        setError(`Пожалуйста, ответьте на вопрос: "${question.text}"`)
        return
      }

      // Check if answer is actually filled
      if (question.type === 'text' && !answer.text_value?.trim()) {
        setError(`Пожалуйста, ответьте на вопрос: "${question.text}"`)
        return
      }
      if (['single_choice', 'multiple_choice'].includes(question.type) && (!answer.selected_options || answer.selected_options.length === 0)) {
        setError(`Пожалуйста, ответьте на вопрос: "${question.text}"`)
        return
      }
      if (['scale', 'nps'].includes(question.type) && answer.scale_value === undefined) {
        setError(`Пожалуйста, ответьте на вопрос: "${question.text}"`)
        return
      }
    }

    submitMutation.mutate()
  }

  const progress = survey ? Math.round((answers.size / survey.questions.length) * 100) : 0

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
        <Loading withOverlay={false} />
      </div>
    )
  }

  if (!survey) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Опрос не найден</p>
        <Button kind="ghost" onClick={() => navigate('/surveys')}>
          Вернуться к списку
        </Button>
      </div>
    )
  }

  // Already responded or submitted
  if (survey.has_responded || submitted) {
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <Button
          kind="ghost"
          renderIcon={ArrowLeft}
          onClick={() => navigate('/surveys')}
          style={{ marginBottom: '1rem' }}
        >
          Назад к опросам
        </Button>

        <div
          style={{
            padding: '3rem',
            backgroundColor: 'var(--cds-layer-01)',
            borderRadius: '4px',
            textAlign: 'center',
          }}
        >
          <Checkmark size={64} style={{ color: 'var(--cds-support-success)', marginBottom: '1rem' }} />
          <h2 style={{ marginBottom: '0.5rem' }}>Спасибо за участие!</h2>
          <p style={{ color: 'var(--cds-text-secondary)' }}>
            Ваши ответы успешно сохранены
          </p>
          <Button
            kind="primary"
            onClick={() => navigate('/surveys')}
            style={{ marginTop: '1.5rem' }}
          >
            Вернуться к опросам
          </Button>
        </div>
      </div>
    )
  }

  // Survey not active
  if (survey.status !== 'active') {
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <Button
          kind="ghost"
          renderIcon={ArrowLeft}
          onClick={() => navigate('/surveys')}
          style={{ marginBottom: '1rem' }}
        >
          Назад к опросам
        </Button>

        <InlineNotification
          kind="warning"
          title="Опрос недоступен"
          subtitle="Этот опрос ещё не начался или уже завершён"
        />

        {isAdmin && (
          <Button
            kind="tertiary"
            renderIcon={Analytics}
            onClick={() => navigate(`/surveys/${survey.id}/results`)}
            style={{ marginTop: '1rem' }}
          >
            Посмотреть результаты
          </Button>
        )}
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <Button
        kind="ghost"
        renderIcon={ArrowLeft}
        onClick={() => navigate('/surveys')}
        style={{ marginBottom: '1rem' }}
      >
        Назад к опросам
      </Button>

      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600, margin: 0 }}>{survey.title}</h1>
          {survey.is_anonymous && (
            <Tag size="sm" type="purple">Анонимный</Tag>
          )}
        </div>
        {survey.description && (
          <p style={{ color: 'var(--cds-text-secondary)', marginBottom: '1rem' }}>
            {survey.description}
          </p>
        )}
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.875rem' }}>
            <span>Прогресс</span>
            <span>{answers.size} из {survey.questions.length} вопросов</span>
          </div>
          <ProgressBar value={progress} max={100} size="small" label="Прогресс" hideLabel />
        </div>
      </div>

      {error && (
        <InlineNotification
          kind="error"
          title="Ошибка"
          subtitle={error}
          onCloseButtonClick={() => setError(null)}
          style={{ marginBottom: '1rem' }}
        />
      )}

      {/* Questions */}
      <div>
        {survey.questions.map((question, index) => (
          <div key={question.id}>
            <div
              style={{
                fontSize: '0.75rem',
                color: 'var(--cds-text-secondary)',
                marginBottom: '0.25rem',
              }}
            >
              Вопрос {index + 1} из {survey.questions.length}
            </div>
            <QuestionRenderer
              question={question}
              answer={answers.get(question.id)}
              onAnswerChange={handleAnswerChange}
              disabled={submitMutation.isPending}
            />
          </div>
        ))}
      </div>

      {/* Submit */}
      <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
        <Button
          kind="primary"
          onClick={handleSubmit}
          disabled={submitMutation.isPending}
        >
          {submitMutation.isPending ? 'Отправка...' : 'Отправить ответы'}
        </Button>
        <Button kind="ghost" onClick={() => navigate('/surveys')}>
          Отмена
        </Button>
      </div>
    </div>
  )
}
