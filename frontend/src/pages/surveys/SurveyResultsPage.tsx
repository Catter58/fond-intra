import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Button, Loading, Tile, Tag } from '@carbon/react'
import { ArrowLeft, Checkmark, User, Document } from '@carbon/icons-react'
import { surveysApi } from '@/api/endpoints/surveys'
import type { QuestionResults } from '@/types'

function QuestionResultView({ result }: { result: QuestionResults }) {
  return (
    <Tile style={{ marginBottom: '1rem' }}>
      <div style={{ marginBottom: '1rem' }}>
        <span style={{ fontWeight: 500 }}>{result.text}</span>
        <Tag size="sm" style={{ marginLeft: '0.5rem' }}>
          {result.total_answers} ответов
        </Tag>
      </div>

      {/* Single/Multiple choice */}
      {result.options_stats && (
        <div>
          {result.options_stats.map((option) => (
            <div key={option.id} style={{ marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <span style={{ fontSize: '0.875rem' }}>{option.text}</span>
                <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                  {option.count} ({option.percentage}%)
                </span>
              </div>
              <div
                style={{
                  height: '8px',
                  backgroundColor: 'var(--cds-layer-02)',
                  borderRadius: '4px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${option.percentage}%`,
                    backgroundColor: 'var(--cds-link-primary)',
                    borderRadius: '4px',
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Scale/NPS average */}
      {result.average !== undefined && (
        <div style={{ textAlign: 'center', padding: '1rem' }}>
          <div style={{ fontSize: '2.5rem', fontWeight: 600, color: 'var(--cds-link-primary)' }}>
            {result.average}
          </div>
          <div style={{ color: 'var(--cds-text-secondary)', fontSize: '0.875rem' }}>
            Средний балл
          </div>
          {result.nps_score !== undefined && (
            <div style={{ marginTop: '1rem' }}>
              <div
                style={{
                  fontSize: '1.5rem',
                  fontWeight: 600,
                  color: result.nps_score >= 50
                    ? 'var(--cds-support-success)'
                    : result.nps_score >= 0
                      ? 'var(--cds-support-warning)'
                      : 'var(--cds-support-error)',
                }}
              >
                NPS: {result.nps_score}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Distribution for scale */}
      {result.distribution && (
        <div style={{ marginTop: '1rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)', marginBottom: '0.5rem' }}>
            Распределение ответов
          </div>
          <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'flex-end', height: '80px' }}>
            {Object.entries(result.distribution).map(([value, count]) => {
              const maxCount = Math.max(...Object.values(result.distribution!))
              const height = maxCount > 0 ? (count / maxCount) * 100 : 0
              return (
                <div key={value} style={{ flex: 1, textAlign: 'center' }}>
                  <div
                    style={{
                      height: `${height}%`,
                      minHeight: count > 0 ? '4px' : 0,
                      backgroundColor: 'var(--cds-link-primary)',
                      borderRadius: '2px 2px 0 0',
                      marginBottom: '0.25rem',
                    }}
                  />
                  <div style={{ fontSize: '0.625rem', color: 'var(--cds-text-secondary)' }}>
                    {value}
                  </div>
                  <div style={{ fontSize: '0.625rem' }}>{count}</div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Text answers */}
      {result.text_answers && result.text_answers.length > 0 && (
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)', marginBottom: '0.5rem' }}>
            Текстовые ответы
          </div>
          <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
            {result.text_answers.map((text, index) => (
              <div
                key={index}
                style={{
                  padding: '0.5rem',
                  marginBottom: '0.25rem',
                  backgroundColor: 'var(--cds-layer-02)',
                  borderRadius: '4px',
                  fontSize: '0.875rem',
                }}
              >
                {text}
              </div>
            ))}
          </div>
        </div>
      )}
    </Tile>
  )
}

export function SurveyResultsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: survey, isLoading: isLoadingSurvey } = useQuery({
    queryKey: ['survey', id],
    queryFn: () => surveysApi.getById(Number(id)),
    enabled: !!id,
  })

  const { data: results, isLoading: isLoadingResults } = useQuery({
    queryKey: ['survey', id, 'results'],
    queryFn: () => surveysApi.getResults(Number(id)),
    enabled: !!id,
  })

  const isLoading = isLoadingSurvey || isLoadingResults

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
        <Loading withOverlay={false} />
      </div>
    )
  }

  if (!survey || !results) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Результаты не найдены</p>
        <Button kind="ghost" onClick={() => navigate('/surveys')}>
          Вернуться к списку
        </Button>
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
        <h1 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.5rem' }}>
          Результаты: {survey.title}
        </h1>

        {/* Stats */}
        <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1rem' }}>
          <Tile style={{ flex: 1, textAlign: 'center' }}>
            <User size={24} style={{ color: 'var(--cds-link-primary)', marginBottom: '0.5rem' }} />
            <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>{results.total_responses}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)' }}>
              Всего ответов
            </div>
          </Tile>
          <Tile style={{ flex: 1, textAlign: 'center' }}>
            <Document size={24} style={{ color: 'var(--cds-link-primary)', marginBottom: '0.5rem' }} />
            <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>{survey.questions_count}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)' }}>
              Вопросов
            </div>
          </Tile>
          <Tile style={{ flex: 1, textAlign: 'center' }}>
            <Checkmark size={24} style={{ color: 'var(--cds-support-success)', marginBottom: '0.5rem' }} />
            <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>
              {results.total_responses > 0
                ? Math.round((results.total_responses / (survey.responses_count || 1)) * 100)
                : 0}%
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)' }}>
              Завершённость
            </div>
          </Tile>
        </div>
      </div>

      {/* Questions results */}
      <div>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' }}>
          Результаты по вопросам
        </h2>
        {results.questions.map((result, index) => (
          <div key={result.id}>
            <div
              style={{
                fontSize: '0.75rem',
                color: 'var(--cds-text-secondary)',
                marginBottom: '0.25rem',
              }}
            >
              Вопрос {index + 1}
            </div>
            <QuestionResultView result={result} />
          </div>
        ))}
      </div>
    </div>
  )
}
