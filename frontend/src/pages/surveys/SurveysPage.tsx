import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Button,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Loading,
} from '@carbon/react'
import { Add, Document } from '@carbon/icons-react'
import { useNavigate } from 'react-router-dom'
import { surveysApi } from '@/api/endpoints/surveys'
import { SurveyCard } from '@/components/features/surveys'
import { EmptyState } from '@/components/ui/EmptyState'
import { useAuthStore } from '@/store/authStore'

export function SurveysPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState(0)
  const isAdmin = user?.role?.is_admin || user?.is_superuser

  const { data: availableSurveys, isLoading: isLoadingAvailable } = useQuery({
    queryKey: ['surveys', 'available'],
    queryFn: () => surveysApi.getList({ page_size: 50 }),
  })

  const { data: mySurveys, isLoading: isLoadingMy } = useQuery({
    queryKey: ['surveys', 'my'],
    queryFn: () => surveysApi.getMy({ page_size: 50 }),
    enabled: isAdmin,
  })

  const pendingSurveys = availableSurveys?.results.filter(
    (s) => s.status === 'active' && !s.has_responded
  ) || []

  const completedSurveys = availableSurveys?.results.filter(
    (s) => s.has_responded
  ) || []

  return (
    <div>
      <div
        className="page-header"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <h1 className="page-title">Опросы</h1>
          <p className="page-subtitle">
            Участвуйте в опросах и помогайте улучшать компанию
          </p>
        </div>
        {isAdmin && (
          <Button renderIcon={Add} onClick={() => navigate('/surveys/create')}>
            Создать опрос
          </Button>
        )}
      </div>

      <Tabs selectedIndex={activeTab} onChange={({ selectedIndex }) => setActiveTab(selectedIndex)}>
        <TabList aria-label="Опросы">
          <Tab>Доступные ({pendingSurveys.length})</Tab>
          <Tab>Пройденные ({completedSurveys.length})</Tab>
          {isAdmin && <Tab>Мои опросы ({mySurveys?.results.length || 0})</Tab>}
        </TabList>

        <TabPanels>
          {/* Available surveys */}
          <TabPanel>
            <div style={{ marginTop: '1rem' }}>
              {isLoadingAvailable ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
                  <Loading withOverlay={false} />
                </div>
              ) : pendingSurveys.length > 0 ? (
                <div>
                  {pendingSurveys.map((survey) => (
                    <SurveyCard key={survey.id} survey={survey} />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={Document}
                  title="Нет доступных опросов"
                  description="Все опросы пройдены или пока нет активных опросов"
                />
              )}
            </div>
          </TabPanel>

          {/* Completed surveys */}
          <TabPanel>
            <div style={{ marginTop: '1rem' }}>
              {isLoadingAvailable ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
                  <Loading withOverlay={false} />
                </div>
              ) : completedSurveys.length > 0 ? (
                <div>
                  {completedSurveys.map((survey) => (
                    <SurveyCard key={survey.id} survey={survey} />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={Document}
                  title="Нет пройденных опросов"
                  description="Вы ещё не проходили опросы"
                />
              )}
            </div>
          </TabPanel>

          {/* My surveys (admin) */}
          {isAdmin && (
            <TabPanel>
              <div style={{ marginTop: '1rem' }}>
                {isLoadingMy ? (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
                    <Loading withOverlay={false} />
                  </div>
                ) : mySurveys?.results && mySurveys.results.length > 0 ? (
                  <div>
                    {mySurveys.results.map((survey) => (
                      <SurveyCard key={survey.id} survey={survey} showAuthor={false} />
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={Document}
                    title="Нет созданных опросов"
                    description="Вы ещё не создавали опросы"
                    action={{
                      label: 'Создать опрос',
                      onClick: () => navigate('/surveys/create'),
                    }}
                  />
                )}
              </div>
            </TabPanel>
          )}
        </TabPanels>
      </Tabs>
    </div>
  )
}
