import { useState, useEffect } from 'react'
import Joyride, { CallBackProps, STATUS, Step, ACTIONS, EVENTS } from 'react-joyride'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { usersApi } from '@/api/endpoints/users'

const TOUR_STEPS: Step[] = [
  {
    target: 'body',
    content: (
      <div>
        <h3 style={{ marginBottom: '0.5rem', fontSize: '1.25rem' }}>Добро пожаловать в Fond Intra!</h3>
        <p>Это корпоративный портал вашей компании. Давайте познакомимся с основными функциями.</p>
      </div>
    ),
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '[href="/employees"]',
    content: (
      <div>
        <h4 style={{ marginBottom: '0.5rem' }}>Сотрудники</h4>
        <p>Здесь вы найдёте контакты всех коллег, их навыки и достижения. Используйте фильтры для быстрого поиска.</p>
      </div>
    ),
    disableBeacon: true,
  },
  {
    target: '[href="/achievements"]',
    content: (
      <div>
        <h4 style={{ marginBottom: '0.5rem' }}>Достижения</h4>
        <p>Отслеживайте свои достижения и прогресс. Некоторые награды выдаются автоматически за активность!</p>
      </div>
    ),
    disableBeacon: true,
  },
  {
    target: '[href="/news"]',
    content: (
      <div>
        <h4 style={{ marginBottom: '0.5rem' }}>Новости</h4>
        <p>Будьте в курсе событий компании. Читайте новости, оставляйте комментарии и реакции.</p>
      </div>
    ),
    disableBeacon: true,
  },
  {
    target: '[href="/kudos"]',
    content: (
      <div>
        <h4 style={{ marginBottom: '0.5rem' }}>Благодарности</h4>
        <p>Отправляйте благодарности коллегам за помощь и отличную работу. Это повышает командный дух!</p>
      </div>
    ),
    disableBeacon: true,
  },
  {
    target: '[href="/surveys"]',
    content: (
      <div>
        <h4 style={{ marginBottom: '0.5rem' }}>Опросы</h4>
        <p>Участвуйте в опросах и голосованиях. Ваше мнение важно для компании!</p>
      </div>
    ),
    disableBeacon: true,
  },
  {
    target: '[href="/ideas"]',
    content: (
      <div>
        <h4 style={{ marginBottom: '0.5rem' }}>Банк идей</h4>
        <p>Предлагайте идеи по улучшению процессов и голосуйте за предложения коллег.</p>
      </div>
    ),
    disableBeacon: true,
  },
  {
    target: '[href="/bookings"]',
    content: (
      <div>
        <h4 style={{ marginBottom: '0.5rem' }}>Бронирование</h4>
        <p>Бронируйте переговорные комнаты и оборудование для встреч и мероприятий.</p>
      </div>
    ),
    disableBeacon: true,
  },
  {
    target: '[aria-label="User"]',
    content: (
      <div>
        <h4 style={{ marginBottom: '0.5rem' }}>Ваш профиль</h4>
        <p>Здесь вы можете управлять профилем, сменить пароль и настроить безопасность (включая двухфакторную аутентификацию).</p>
      </div>
    ),
    disableBeacon: true,
  },
  {
    target: '[aria-label="Notifications"]',
    content: (
      <div>
        <h4 style={{ marginBottom: '0.5rem' }}>Уведомления</h4>
        <p>Следите за новыми достижениями, комментариями и упоминаниями. Красный индикатор показывает непрочитанные.</p>
      </div>
    ),
    disableBeacon: true,
  },
  {
    target: 'body',
    content: (
      <div>
        <h3 style={{ marginBottom: '0.5rem', fontSize: '1.25rem' }}>Готово!</h3>
        <p>Теперь вы знаете основы портала. Используйте <strong>Shift + ?</strong> для просмотра горячих клавиш.</p>
        <p style={{ marginTop: '0.5rem', color: 'var(--cds-text-secondary)' }}>Вы можете запустить тур повторно в настройках профиля.</p>
      </div>
    ),
    placement: 'center',
    disableBeacon: true,
  },
]

interface OnboardingTourProps {
  forceRun?: boolean
  onComplete?: () => void
}

export function OnboardingTour({ forceRun = false, onComplete }: OnboardingTourProps) {
  const { user, setUser } = useAuthStore()
  const location = useLocation()
  const queryClient = useQueryClient()
  const [run, setRun] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)

  const completeMutation = useMutation({
    mutationFn: usersApi.completeOnboarding,
    onSuccess: () => {
      if (user) {
        setUser({ ...user, has_completed_onboarding: true })
      }
      queryClient.invalidateQueries({ queryKey: ['user', 'me'] })
      onComplete?.()
    },
  })

  // Start tour for new users on dashboard
  useEffect(() => {
    if (forceRun) {
      setStepIndex(0)
      setRun(true)
      return
    }

    // Only start automatically on dashboard for users who haven't completed onboarding
    if (
      user &&
      !user.has_completed_onboarding &&
      location.pathname === '/'
    ) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        setRun(true)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [user, location.pathname, forceRun])

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, type, action, index } = data

    // Handle step changes
    if (type === EVENTS.STEP_AFTER || type === EVENTS.TARGET_NOT_FOUND) {
      setStepIndex(index + (action === ACTIONS.PREV ? -1 : 1))
    }

    // Handle tour completion or skip
    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status as any)) {
      setRun(false)
      setStepIndex(0)

      // Mark onboarding as completed
      if (!user?.has_completed_onboarding) {
        completeMutation.mutate()
      } else {
        onComplete?.()
      }
    }
  }

  // Don't render if user hasn't loaded yet
  if (!user) return null

  return (
    <Joyride
      steps={TOUR_STEPS}
      run={run}
      stepIndex={stepIndex}
      continuous
      showSkipButton
      callback={handleJoyrideCallback}
      scrollToFirstStep
      disableOverlayClose
      locale={{
        back: 'Назад',
        close: 'Закрыть',
        last: 'Завершить',
        next: `Далее (${stepIndex + 1}/${TOUR_STEPS.length})`,
        skip: 'Пропустить',
      }}
      styles={{
        options: {
          primaryColor: '#0f62fe', // Carbon blue
          textColor: '#161616',
          backgroundColor: '#ffffff',
          arrowColor: '#ffffff',
          overlayColor: 'rgba(22, 22, 22, 0.7)',
          zIndex: 10000,
        },
        tooltip: {
          borderRadius: '4px',
          padding: '1.5rem',
        },
        tooltipContainer: {
          textAlign: 'left',
        },
        tooltipTitle: {
          fontSize: '1rem',
          fontWeight: 600,
        },
        tooltipContent: {
          padding: '0.5rem 0',
        },
        buttonNext: {
          backgroundColor: '#0f62fe',
          borderRadius: '0',
          padding: '0.75rem 1rem',
        },
        buttonBack: {
          color: '#0f62fe',
          marginRight: '0.5rem',
        },
        buttonSkip: {
          color: '#525252',
        },
        spotlight: {
          borderRadius: '4px',
        },
      }}
      floaterProps={{
        disableAnimation: true,
      }}
    />
  )
}
