import { useState } from 'react'
import {
  RadioButton,
  RadioButtonGroup,
  Checkbox,
  TextArea,
  Slider,
} from '@carbon/react'
import type { Question, SurveyAnswer } from '@/types'

interface QuestionRendererProps {
  question: Question
  answer: SurveyAnswer | undefined
  onAnswerChange: (answer: SurveyAnswer) => void
  disabled?: boolean
}

export function QuestionRenderer({
  question,
  answer,
  onAnswerChange,
  disabled = false,
}: QuestionRendererProps) {
  const [sliderValue, setSliderValue] = useState<number>(
    answer?.scale_value ?? Math.floor((question.scale_min + question.scale_max) / 2)
  )

  const handleSingleChoice = (value: string | number | undefined) => {
    if (value === undefined) return
    onAnswerChange({
      question_id: question.id,
      selected_options: [typeof value === 'string' ? parseInt(value) : value],
    })
  }

  const handleMultipleChoice = (optionId: number, checked: boolean) => {
    const currentOptions = answer?.selected_options || []
    let newOptions: number[]

    if (checked) {
      newOptions = [...currentOptions, optionId]
    } else {
      newOptions = currentOptions.filter((id) => id !== optionId)
    }

    onAnswerChange({
      question_id: question.id,
      selected_options: newOptions,
    })
  }

  const handleTextChange = (value: string) => {
    onAnswerChange({
      question_id: question.id,
      text_value: value,
    })
  }

  const handleScaleChange = (value: number) => {
    setSliderValue(value)
    onAnswerChange({
      question_id: question.id,
      scale_value: value,
    })
  }

  return (
    <div
      style={{
        padding: '1.5rem',
        marginBottom: '1rem',
        backgroundColor: 'var(--cds-layer-01)',
        borderRadius: '4px',
      }}
    >
      <div style={{ marginBottom: '1rem' }}>
        <span style={{ fontWeight: 500 }}>{question.text}</span>
        {question.is_required && (
          <span style={{ color: 'var(--cds-support-error)', marginLeft: '0.25rem' }}>*</span>
        )}
      </div>

      {/* Single Choice */}
      {question.type === 'single_choice' && (
        <RadioButtonGroup
          name={`question-${question.id}`}
          valueSelected={answer?.selected_options?.[0]?.toString() || ''}
          onChange={handleSingleChoice}
          orientation="vertical"
          disabled={disabled}
        >
          {question.options.map((option) => (
            <RadioButton
              key={option.id}
              labelText={option.text}
              value={option.id.toString()}
              id={`option-${option.id}`}
            />
          ))}
        </RadioButtonGroup>
      )}

      {/* Multiple Choice */}
      {question.type === 'multiple_choice' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {question.options.map((option) => (
            <Checkbox
              key={option.id}
              id={`option-${option.id}`}
              labelText={option.text}
              checked={answer?.selected_options?.includes(option.id) || false}
              onChange={(_, { checked }) => handleMultipleChoice(option.id, checked)}
              disabled={disabled}
            />
          ))}
        </div>
      )}

      {/* Text */}
      {question.type === 'text' && (
        <TextArea
          id={`question-${question.id}`}
          labelText=""
          placeholder="Введите ваш ответ..."
          value={answer?.text_value || ''}
          onChange={(e) => handleTextChange(e.target.value)}
          disabled={disabled}
          rows={4}
        />
      )}

      {/* Scale */}
      {question.type === 'scale' && (
        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '0.5rem',
              fontSize: '0.75rem',
              color: 'var(--cds-text-secondary)',
            }}
          >
            <span>{question.scale_min_label || question.scale_min}</span>
            <span>{question.scale_max_label || question.scale_max}</span>
          </div>
          <Slider
            id={`question-${question.id}`}
            min={question.scale_min}
            max={question.scale_max}
            step={1}
            value={sliderValue}
            onChange={({ value }) => handleScaleChange(value)}
            disabled={disabled}
          />
          <div style={{ textAlign: 'center', marginTop: '0.5rem', fontWeight: 600 }}>
            {sliderValue}
          </div>
        </div>
      )}

      {/* NPS */}
      {question.type === 'nps' && (
        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '0.5rem',
              fontSize: '0.75rem',
              color: 'var(--cds-text-secondary)',
            }}
          >
            <span>Совсем не вероятно</span>
            <span>Очень вероятно</span>
          </div>
          <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'center' }}>
            {Array.from({ length: 11 }, (_, i) => (
              <button
                key={i}
                onClick={() => !disabled && handleScaleChange(i)}
                disabled={disabled}
                style={{
                  width: '36px',
                  height: '36px',
                  border: answer?.scale_value === i
                    ? '2px solid var(--cds-link-primary)'
                    : '1px solid var(--cds-border-subtle-01)',
                  borderRadius: '4px',
                  backgroundColor: answer?.scale_value === i
                    ? 'var(--cds-layer-selected-01)'
                    : 'transparent',
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  fontWeight: answer?.scale_value === i ? 600 : 400,
                  color: i <= 6
                    ? 'var(--cds-support-error)'
                    : i <= 8
                      ? 'var(--cds-support-warning)'
                      : 'var(--cds-support-success)',
                }}
              >
                {i}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
