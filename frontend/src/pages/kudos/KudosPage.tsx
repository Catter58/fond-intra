import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Button,
  Select,
  SelectItem,
  Tile,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
} from '@carbon/react'
import { Add, Favorite, Trophy, ChartColumn, Help } from '@carbon/icons-react'
import { kudosApi } from '@/api/endpoints/kudos'
import { KudosCard, SendKudosModal } from '@/components/features/kudos'
import { EmptyState } from '@/components/ui/EmptyState'
import { KudosCardSkeleton } from '@/components/ui/Skeletons'
import { OnboardingTour, useModuleTour } from '@/components/ui/OnboardingTour'
import type { KudosCategory } from '@/types'

export function KudosPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState<KudosCategory | ''>('')
  const { showTour, handleComplete, resetTour } = useModuleTour('kudos')

  const { data: categories } = useQuery({
    queryKey: ['kudos-categories'],
    queryFn: kudosApi.getCategories,
  })

  const { data: kudosFeed, isLoading: isFeedLoading } = useQuery({
    queryKey: ['kudos', 'feed', categoryFilter],
    queryFn: () => kudosApi.getList({ category: categoryFilter || undefined, page_size: 50 }),
  })

  const { data: receivedKudos, isLoading: isReceivedLoading } = useQuery({
    queryKey: ['kudos', 'received'],
    queryFn: () => kudosApi.getReceived({ page_size: 50 }),
  })

  const { data: sentKudos, isLoading: isSentLoading } = useQuery({
    queryKey: ['kudos', 'sent'],
    queryFn: () => kudosApi.getSent({ page_size: 50 }),
  })

  const { data: stats } = useQuery({
    queryKey: ['kudos', 'stats'],
    queryFn: kudosApi.getStats,
  })

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="page-title">Благодарности</h1>
          <p className="page-subtitle">
            Отправляйте благодарности коллегам за помощь и отличную работу
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button
            kind="ghost"
            size="sm"
            hasIconOnly
            iconDescription="Справка по странице"
            renderIcon={Help}
            onClick={resetTour}
          />
          <Button renderIcon={Add} onClick={() => setIsModalOpen(true)} className="send-kudos-btn">
            Отправить благодарность
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <Tile>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Favorite size={24} style={{ color: 'var(--cds-support-error)' }} />
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>{stats.total_count}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)' }}>за 30 дней</div>
              </div>
            </div>
          </Tile>

          {stats.top_recipients.length > 0 && (
            <Tile>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Trophy size={24} style={{ color: 'var(--cds-support-warning)' }} />
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{stats.top_recipients[0].full_name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)' }}>
                    Лидер ({stats.top_recipients[0].count} благодарностей)
                  </div>
                </div>
              </div>
            </Tile>
          )}

          {stats.category_stats.length > 0 && (
            <Tile>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <ChartColumn size={24} style={{ color: 'var(--cds-link-primary)' }} />
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{stats.category_stats[0].label}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)' }}>
                    Популярная категория
                  </div>
                </div>
              </div>
            </Tile>
          )}
        </div>
      )}

      <Tabs>
        <TabList aria-label="Благодарности">
          <Tab>Лента</Tab>
          <Tab>Полученные ({receivedKudos?.count || 0})</Tab>
          <Tab>Отправленные ({sentKudos?.count || 0})</Tab>
        </TabList>

        <TabPanels>
          {/* Feed Tab */}
          <TabPanel>
            <div style={{ marginTop: '1rem', marginBottom: '1.5rem' }}>
              <Select
                id="category-filter"
                labelText="Фильтр по категории"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value as KudosCategory | '')}
                size="md"
                style={{ maxWidth: '300px' }}
              >
                <SelectItem value="" text="Все категории" />
                {categories?.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value} text={cat.label} />
                ))}
              </Select>
            </div>

            {isFeedLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <KudosCardSkeleton key={i} />
                ))}
              </div>
            ) : kudosFeed?.results && kudosFeed.results.length > 0 ? (
              <div>
                {kudosFeed.results.map((kudos) => (
                  <KudosCard key={kudos.id} kudos={kudos} />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Favorite}
                title="Нет благодарностей"
                description="Будьте первым, кто отправит благодарность коллеге!"
                action={{
                  label: 'Отправить благодарность',
                  onClick: () => setIsModalOpen(true),
                }}
              />
            )}
          </TabPanel>

          {/* Received Tab */}
          <TabPanel>
            <div style={{ marginTop: '1rem' }}>
              {isReceivedLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {Array.from({ length: 3 }).map((_, i) => (
                    <KudosCardSkeleton key={i} />
                  ))}
                </div>
              ) : receivedKudos?.results && receivedKudos.results.length > 0 ? (
                <div>
                  {receivedKudos.results.map((kudos) => (
                    <KudosCard key={kudos.id} kudos={kudos} showRecipient={false} />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={Favorite}
                  title="Нет полученных благодарностей"
                  description="Пока вам никто не отправлял благодарности"
                />
              )}
            </div>
          </TabPanel>

          {/* Sent Tab */}
          <TabPanel>
            <div style={{ marginTop: '1rem' }}>
              {isSentLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {Array.from({ length: 3 }).map((_, i) => (
                    <KudosCardSkeleton key={i} />
                  ))}
                </div>
              ) : sentKudos?.results && sentKudos.results.length > 0 ? (
                <div>
                  {sentKudos.results.map((kudos) => (
                    <KudosCard key={kudos.id} kudos={kudos} />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={Favorite}
                  title="Нет отправленных благодарностей"
                  description="Вы ещё не отправляли благодарности"
                  action={{
                    label: 'Отправить благодарность',
                    onClick: () => setIsModalOpen(true),
                  }}
                />
              )}
            </div>
          </TabPanel>
        </TabPanels>
      </Tabs>

      <SendKudosModal open={isModalOpen} onClose={() => setIsModalOpen(false)} />

      {/* Module-specific onboarding tour */}
      <OnboardingTour
        tourType="kudos"
        forceRun={showTour}
        onComplete={handleComplete}
      />
    </div>
  )
}
