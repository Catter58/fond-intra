import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Grid,
  Column,
  Tile,
  TextInput,
  TextArea,
  Button,
  Select,
  SelectItem,
  Toggle,
  DatePicker,
  DatePickerInput,
  IconButton,
  InlineNotification,
  NumberInput,
  Loading,
} from '@carbon/react'
import { ArrowLeft, Add, TrashCan, ChevronUp, ChevronDown, Play, Save } from '@carbon/icons-react'
import { surveysApi } from '@/api/endpoints/surveys'
import { organizationApi } from '@/api/endpoints/organization'

interface QuestionOption {
  text: string
}

interface Question {
  id: string
  text: string
  type: string
  is_required: boolean
  scale_min?: number
  scale_max?: number
  scale_min_label?: string
  scale_max_label?: string
  options: QuestionOption[]
}

const generateId = () => Math.random().toString(36).substring(7)

export function SurveyEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // Survey settings
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [isRequired, setIsRequired] = useState(false)
  const [targetType, setTargetType] = useState('all')
  const [targetDepartments, setTargetDepartments] = useState<number[]>([])
  const [startsAt, setStartsAt] = useState<Date | null>(null)
  const [endsAt, setEndsAt] = useState<Date | null>(null)

  // Questions
  const [questions, setQuestions] = useState<Question[]>([])
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set())

  // Fetch existing survey
  const { data: survey, isLoading: surveyLoading } = useQuery({
    queryKey: ['survey', id],
    queryFn: () => surveysApi.getById(Number(id)),
    enabled: !!id,
  })

  // Populate form with existing data
  useEffect(() => {
    if (survey) {
      setTitle(survey.title)
      setDescription(survey.description || '')
      setIsAnonymous(survey.is_anonymous)
      setIsRequired(survey.is_required)
      setTargetType(survey.target_type)
      setStartsAt(survey.starts_at ? new Date(survey.starts_at) : null)
      setEndsAt(survey.ends_at ? new Date(survey.ends_at) : null)

      // Map questions
      if (survey.questions) {
        setQuestions(survey.questions.map(q => ({
          id: generateId(),
          text: q.text,
          type: q.type,
          is_required: q.is_required,
          scale_min: q.scale_min,
          scale_max: q.scale_max,
          scale_min_label: q.scale_min_label,
          scale_max_label: q.scale_max_label,
          options: q.options?.map(o => ({ text: o.text })) || [],
        })))
      }
    }
  }, [survey])

  // Fetch data
  const { data: questionTypes } = useQuery({
    queryKey: ['question-types'],
    queryFn: surveysApi.getQuestionTypes,
  })

  const { data: targetTypes } = useQuery({
    queryKey: ['target-types'],
    queryFn: surveysApi.getTargetTypes,
  })

  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: organizationApi.getDepartments,
  })

  const updateMutation = useMutation({
    mutationFn: (data: Parameters<typeof surveysApi.update>[1]) =>
      surveysApi.update(Number(id), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['surveys'] })
      queryClient.invalidateQueries({ queryKey: ['survey', id] })
      navigate(`/surveys/${id}`)
    },
  })

  const publishMutation = useMutation({
    mutationFn: () => surveysApi.publish(Number(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['surveys'] })
      navigate('/surveys')
    },
  })

  // Question management
  const addQuestion = () => {
    const newQuestion: Question = {
      id: generateId(),
      text: '',
      type: 'single_choice',
      is_required: true,
      options: [{ text: '' }, { text: '' }],
    }
    setQuestions([...questions, newQuestion])
    setExpandedQuestions((prev) => new Set([...prev, newQuestion.id]))
  }

  const removeQuestion = (qId: string) => {
    setQuestions(questions.filter((q) => q.id !== qId))
    setExpandedQuestions((prev) => {
      const next = new Set(prev)
      next.delete(qId)
      return next
    })
  }

  const updateQuestion = (qId: string, updates: Partial<Question>) => {
    setQuestions(
      questions.map((q) => (q.id === qId ? { ...q, ...updates } : q))
    )
  }

  const moveQuestion = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= questions.length) return

    const newQuestions = [...questions]
    const temp = newQuestions[index]
    newQuestions[index] = newQuestions[newIndex]
    newQuestions[newIndex] = temp
    setQuestions(newQuestions)
  }

  const addOption = (questionId: string) => {
    setQuestions(
      questions.map((q) =>
        q.id === questionId
          ? { ...q, options: [...q.options, { text: '' }] }
          : q
      )
    )
  }

  const removeOption = (questionId: string, optionIndex: number) => {
    setQuestions(
      questions.map((q) =>
        q.id === questionId
          ? { ...q, options: q.options.filter((_, i) => i !== optionIndex) }
          : q
      )
    )
  }

  const updateOption = (questionId: string, optionIndex: number, text: string) => {
    setQuestions(
      questions.map((q) =>
        q.id === questionId
          ? {
              ...q,
              options: q.options.map((opt, i) =>
                i === optionIndex ? { text } : opt
              ),
            }
          : q
      )
    )
  }

  const toggleQuestionExpanded = (qId: string) => {
    setExpandedQuestions((prev) => {
      const next = new Set(prev)
      if (next.has(qId)) {
        next.delete(qId)
      } else {
        next.add(qId)
      }
      return next
    })
  }

  // Form validation
  const isValid =
    title.trim() &&
    questions.length > 0 &&
    questions.every(
      (q) =>
        q.text.trim() &&
        (['single_choice', 'multiple_choice'].includes(q.type)
          ? q.options.length >= 2 && q.options.every((o) => o.text.trim())
          : true)
    )

  // Submit
  const handleSave = () => {
    const data = {
      title,
      description,
      is_anonymous: isAnonymous,
      is_required: isRequired,
      target_type: targetType,
      target_departments: targetType === 'departments' ? targetDepartments : [],
      starts_at: startsAt?.toISOString() || null,
      ends_at: endsAt?.toISOString() || null,
      questions: questions.map((q) => ({
        text: q.text,
        type: q.type,
        is_required: q.is_required,
        scale_min: q.scale_min,
        scale_max: q.scale_max,
        scale_min_label: q.scale_min_label,
        scale_max_label: q.scale_max_label,
        options:
          ['single_choice', 'multiple_choice'].includes(q.type)
            ? q.options
            : [],
      })),
    }

    updateMutation.mutate(data)
  }

  const handlePublish = () => {
    // Save first, then publish
    const data = {
      title,
      description,
      is_anonymous: isAnonymous,
      is_required: isRequired,
      target_type: targetType,
      target_departments: targetType === 'departments' ? targetDepartments : [],
      starts_at: startsAt?.toISOString() || null,
      ends_at: endsAt?.toISOString() || null,
      questions: questions.map((q) => ({
        text: q.text,
        type: q.type,
        is_required: q.is_required,
        scale_min: q.scale_min,
        scale_max: q.scale_max,
        scale_min_label: q.scale_min_label,
        scale_max_label: q.scale_max_label,
        options:
          ['single_choice', 'multiple_choice'].includes(q.type)
            ? q.options
            : [],
      })),
    }

    updateMutation.mutate(data, {
      onSuccess: () => {
        publishMutation.mutate()
      },
    })
  }

  const getQuestionTypeLabel = (type: string) => {
    return questionTypes?.find((t) => t.value === type)?.label || type
  }

  if (surveyLoading) {
    return <Loading description="Загрузка опроса..." withOverlay />
  }

  if (!survey) {
    return (
      <Grid className="dashboard-page">
        <Column lg={16} md={8} sm={4}>
          <InlineNotification
            kind="error"
            title="Ошибка"
            subtitle="Опрос не найден"
            hideCloseButton
          />
        </Column>
      </Grid>
    )
  }

  if (survey.status !== 'draft') {
    return (
      <Grid className="dashboard-page">
        <Column lg={16} md={8} sm={4}>
          <InlineNotification
            kind="warning"
            title="Недоступно"
            subtitle="Редактировать можно только черновики"
            hideCloseButton
          />
          <Button
            kind="ghost"
            renderIcon={ArrowLeft}
            onClick={() => navigate('/surveys')}
            className="mt-4"
          >
            Вернуться к опросам
          </Button>
        </Column>
      </Grid>
    )
  }

  return (
    <Grid className="dashboard-page">
      <Column lg={16} md={8} sm={4}>
        <Button
          kind="ghost"
          renderIcon={ArrowLeft}
          onClick={() => navigate('/surveys')}
          className="mb-4"
        >
          Назад к опросам
        </Button>

        <div className="page-header mb-6">
          <h1 className="page-title">Редактирование опроса</h1>
        </div>

        {updateMutation.isError && (
          <InlineNotification
            kind="error"
            title="Ошибка"
            subtitle="Не удалось сохранить опрос. Проверьте данные и попробуйте снова."
            hideCloseButton
            className="mb-4"
          />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content - Questions */}
          <div className="lg:col-span-2 space-y-4">
            <Tile className="p-6">
              <h2 className="text-lg font-semibold mb-4">Основная информация</h2>

              <TextInput
                id="title"
                labelText="Название опроса"
                placeholder="Например: Оценка удовлетворенности сотрудников"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mb-4"
              />

              <TextArea
                id="description"
                labelText="Описание (необязательно)"
                placeholder="Краткое описание цели опроса..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </Tile>

            <Tile className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">
                  Вопросы ({questions.length})
                </h2>
                <Button
                  kind="tertiary"
                  size="sm"
                  renderIcon={Add}
                  onClick={addQuestion}
                >
                  Добавить вопрос
                </Button>
              </div>

              {questions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p className="mb-4">Вопросы пока не добавлены</p>
                  <Button
                    kind="primary"
                    renderIcon={Add}
                    onClick={addQuestion}
                  >
                    Добавить первый вопрос
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {questions.map((question, index) => (
                    <div
                      key={question.id}
                      className="border border-gray-200 rounded"
                    >
                      {/* Question header */}
                      <div
                        className="flex items-center justify-between p-4 cursor-pointer bg-gray-50"
                        onClick={() => toggleQuestionExpanded(question.id)}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-gray-500">
                            #{index + 1}
                          </span>
                          <span className="font-medium">
                            {question.text || 'Новый вопрос'}
                          </span>
                          <span className="text-xs text-gray-400">
                            ({getQuestionTypeLabel(question.type)})
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <IconButton
                            kind="ghost"
                            size="sm"
                            label="Вверх"
                            onClick={(e: React.MouseEvent) => {
                              e.stopPropagation()
                              moveQuestion(index, 'up')
                            }}
                            disabled={index === 0}
                          >
                            <ChevronUp />
                          </IconButton>
                          <IconButton
                            kind="ghost"
                            size="sm"
                            label="Вниз"
                            onClick={(e: React.MouseEvent) => {
                              e.stopPropagation()
                              moveQuestion(index, 'down')
                            }}
                            disabled={index === questions.length - 1}
                          >
                            <ChevronDown />
                          </IconButton>
                          <IconButton
                            kind="ghost"
                            size="sm"
                            label="Удалить"
                            onClick={(e: React.MouseEvent) => {
                              e.stopPropagation()
                              removeQuestion(question.id)
                            }}
                          >
                            <TrashCan />
                          </IconButton>
                        </div>
                      </div>

                      {/* Question body */}
                      {expandedQuestions.has(question.id) && (
                        <div className="p-4 border-t">
                          <TextInput
                            id={`question-${question.id}-text`}
                            labelText="Текст вопроса"
                            placeholder="Введите вопрос..."
                            value={question.text}
                            onChange={(e) =>
                              updateQuestion(question.id, { text: e.target.value })
                            }
                            className="mb-4"
                          />

                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <Select
                              id={`question-${question.id}-type`}
                              labelText="Тип вопроса"
                              value={question.type}
                              onChange={(e) =>
                                updateQuestion(question.id, {
                                  type: e.target.value,
                                  options:
                                    ['single_choice', 'multiple_choice'].includes(
                                      e.target.value
                                    )
                                      ? question.options.length >= 2
                                        ? question.options
                                        : [{ text: '' }, { text: '' }]
                                      : [],
                                  scale_min:
                                    e.target.value === 'scale' ? 1 : undefined,
                                  scale_max:
                                    e.target.value === 'scale' ? 5 : undefined,
                                })
                              }
                            >
                              {questionTypes?.map((type) => (
                                <SelectItem
                                  key={type.value}
                                  value={type.value}
                                  text={type.label}
                                />
                              ))}
                            </Select>

                            <div className="flex items-end">
                              <Toggle
                                id={`question-${question.id}-required`}
                                labelText="Обязательный"
                                toggled={question.is_required}
                                onToggle={(toggled) =>
                                  updateQuestion(question.id, {
                                    is_required: toggled,
                                  })
                                }
                              />
                            </div>
                          </div>

                          {/* Scale settings */}
                          {question.type === 'scale' && (
                            <div className="grid grid-cols-2 gap-4 mb-4">
                              <NumberInput
                                id={`question-${question.id}-scale-min`}
                                label="Минимум"
                                value={question.scale_min || 1}
                                onChange={(_e, { value }) =>
                                  updateQuestion(question.id, {
                                    scale_min: Number(value),
                                  })
                                }
                                min={0}
                                max={10}
                              />
                              <NumberInput
                                id={`question-${question.id}-scale-max`}
                                label="Максимум"
                                value={question.scale_max || 5}
                                onChange={(_e, { value }) =>
                                  updateQuestion(question.id, {
                                    scale_max: Number(value),
                                  })
                                }
                                min={1}
                                max={10}
                              />
                              <TextInput
                                id={`question-${question.id}-scale-min-label`}
                                labelText="Подпись минимума"
                                placeholder="Например: Плохо"
                                value={question.scale_min_label || ''}
                                onChange={(e) =>
                                  updateQuestion(question.id, {
                                    scale_min_label: e.target.value,
                                  })
                                }
                              />
                              <TextInput
                                id={`question-${question.id}-scale-max-label`}
                                labelText="Подпись максимума"
                                placeholder="Например: Отлично"
                                value={question.scale_max_label || ''}
                                onChange={(e) =>
                                  updateQuestion(question.id, {
                                    scale_max_label: e.target.value,
                                  })
                                }
                              />
                            </div>
                          )}

                          {/* Options for choice questions */}
                          {['single_choice', 'multiple_choice'].includes(
                            question.type
                          ) && (
                            <div>
                              <div className="text-sm font-medium mb-2">
                                Варианты ответа
                              </div>
                              {question.options.map((option, optIndex) => (
                                <div
                                  key={optIndex}
                                  className="flex items-center gap-2 mb-2"
                                >
                                  <TextInput
                                    id={`question-${question.id}-option-${optIndex}`}
                                    labelText=""
                                    hideLabel
                                    placeholder={`Вариант ${optIndex + 1}`}
                                    value={option.text}
                                    onChange={(e) =>
                                      updateOption(
                                        question.id,
                                        optIndex,
                                        e.target.value
                                      )
                                    }
                                    size="sm"
                                  />
                                  {question.options.length > 2 && (
                                    <IconButton
                                      kind="ghost"
                                      size="sm"
                                      label="Удалить"
                                      onClick={() =>
                                        removeOption(question.id, optIndex)
                                      }
                                    >
                                      <TrashCan />
                                    </IconButton>
                                  )}
                                </div>
                              ))}
                              <Button
                                kind="ghost"
                                size="sm"
                                renderIcon={Add}
                                onClick={() => addOption(question.id)}
                              >
                                Добавить вариант
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Tile>
          </div>

          {/* Sidebar - Settings */}
          <div className="lg:col-span-1">
            <Tile className="p-6 sticky top-4">
              <h2 className="text-lg font-semibold mb-4">Настройки</h2>

              <div className="space-y-4">
                <Toggle
                  id="is-anonymous"
                  labelText="Анонимный опрос"
                  labelA="Нет"
                  labelB="Да"
                  toggled={isAnonymous}
                  onToggle={setIsAnonymous}
                />

                <Toggle
                  id="is-required"
                  labelText="Обязательный опрос"
                  labelA="Нет"
                  labelB="Да"
                  toggled={isRequired}
                  onToggle={setIsRequired}
                />

                <Select
                  id="target-type"
                  labelText="Целевая аудитория"
                  value={targetType}
                  onChange={(e) => setTargetType(e.target.value)}
                >
                  {targetTypes?.map((type) => (
                    <SelectItem
                      key={type.value}
                      value={type.value}
                      text={type.label}
                    />
                  ))}
                </Select>

                {targetType === 'departments' && departments && (
                  <Select
                    id="target-departments"
                    labelText="Отделы"
                    value={targetDepartments[0] || ''}
                    onChange={(e) =>
                      setTargetDepartments(
                        e.target.value ? [Number(e.target.value)] : []
                      )
                    }
                  >
                    <SelectItem value="" text="Выберите отдел" />
                    {departments.map((dept) => (
                      <SelectItem
                        key={dept.id}
                        value={dept.id}
                        text={dept.name}
                      />
                    ))}
                  </Select>
                )}

                <DatePicker
                  datePickerType="single"
                  dateFormat="d.m.Y"
                  value={startsAt ? [startsAt] : []}
                  onChange={([date]) => setStartsAt(date)}
                >
                  <DatePickerInput
                    id="starts-at"
                    labelText="Дата начала"
                    placeholder="дд.мм.гггг"
                  />
                </DatePicker>

                <DatePicker
                  datePickerType="single"
                  dateFormat="d.m.Y"
                  value={endsAt ? [endsAt] : []}
                  onChange={([date]) => setEndsAt(date)}
                >
                  <DatePickerInput
                    id="ends-at"
                    labelText="Дата окончания"
                    placeholder="дд.мм.гггг"
                  />
                </DatePicker>

                <div className="pt-4 border-t space-y-2">
                  <Button
                    kind="primary"
                    className="w-full"
                    renderIcon={Play}
                    onClick={handlePublish}
                    disabled={!isValid || updateMutation.isPending || publishMutation.isPending}
                  >
                    Сохранить и опубликовать
                  </Button>
                  <Button
                    kind="secondary"
                    className="w-full"
                    renderIcon={Save}
                    onClick={handleSave}
                    disabled={!title.trim() || updateMutation.isPending}
                  >
                    Сохранить черновик
                  </Button>
                </div>
              </div>
            </Tile>
          </div>
        </div>
      </Column>
    </Grid>
  )
}
