import { useState, useEffect } from 'react'
import {
  Grid,
  Column,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Select,
  SelectItem,
  Button,
  Loading,
  InlineNotification
} from '@carbon/react'
import { Add, Crossroads, Dashboard, UserMultiple, Enterprise } from '@carbon/icons-react'
import { ObjectiveCard, CreateObjectiveModal, OKRDashboard } from '../../components/features/okr'
import { EmptyState } from '../../components/ui/EmptyState'
import {
  getMyObjectives,
  getTeamObjectives,
  getCompanyObjectives,
  getPeriods,
  deleteObjective,
  getOKRStats
} from '../../api/endpoints/okr'
import type { Objective, OKRPeriod, OKRStats } from '../../types'
import { useAuthStore } from '../../store/authStore'

export default function OKRPage() {
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState(0)
  const [periods, setPeriods] = useState<OKRPeriod[]>([])
  const [selectedPeriod, setSelectedPeriod] = useState<number | null>(null)
  const [myObjectives, setMyObjectives] = useState<Objective[]>([])
  const [teamObjectives, setTeamObjectives] = useState<Objective[]>([])
  const [companyObjectives, setCompanyObjectives] = useState<Objective[]>([])
  const [stats, setStats] = useState<OKRStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [statsLoading, setStatsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [createModalOpen, setCreateModalOpen] = useState(false)

  useEffect(() => {
    loadPeriods()
  }, [])

  useEffect(() => {
    if (selectedPeriod) {
      loadObjectives()
      loadStats()
    }
  }, [selectedPeriod])

  const loadPeriods = async () => {
    try {
      const data = await getPeriods()
      setPeriods(data)

      // Set active period by default
      const activePeriod = data.find(p => p.is_active)
      if (activePeriod) {
        setSelectedPeriod(activePeriod.id)
      } else if (data.length > 0) {
        setSelectedPeriod(data[0].id)
      }
    } catch (err) {
      setError('Не удалось загрузить периоды')
    }
  }

  const loadObjectives = async () => {
    if (!selectedPeriod) return

    setLoading(true)
    setError(null)
    try {
      const params = { period: selectedPeriod }
      const [my, team, company] = await Promise.all([
        getMyObjectives(params),
        getTeamObjectives(params),
        getCompanyObjectives(params)
      ])
      setMyObjectives(my)
      setTeamObjectives(team)
      setCompanyObjectives(company)
    } catch (err) {
      setError('Не удалось загрузить цели')
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    if (!selectedPeriod) return

    setStatsLoading(true)
    try {
      const data = await getOKRStats(selectedPeriod)
      setStats(data)
    } catch (err) {
      console.error('Failed to load OKR stats:', err)
    } finally {
      setStatsLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Вы уверены, что хотите удалить эту цель?')) return
    try {
      await deleteObjective(id)
      loadObjectives()
    } catch (err) {
      setError('Не удалось удалить цель')
    }
  }

  const handleEdit = (objective: Objective) => {
    // TODO: Implement edit modal
    console.log('Edit objective:', objective)
  }

  const handleAddKeyResult = (objectiveId: number) => {
    // TODO: Implement add KR modal
    console.log('Add KR to objective:', objectiveId)
  }

  const renderObjectivesList = (objectives: Objective[], showOwner = true) => {
    if (loading) {
      return <Loading />
    }

    if (objectives.length === 0) {
      return (
        <EmptyState
          icon={Crossroads}
          title="Нет целей"
          description="Для этого периода ещё не создано целей"
          action={{
            label: 'Создать цель',
            onClick: () => setCreateModalOpen(true)
          }}
        />
      )
    }

    return objectives.map(objective => (
      <ObjectiveCard
        key={objective.id}
        objective={objective}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onAddKeyResult={handleAddKeyResult}
        canEdit={objective.owner?.id === user?.id || user?.is_superuser}
        showOwner={showOwner}
      />
    ))
  }

  return (
    <Grid>
      <Column lg={16} md={8} sm={4}>
        <div className="page-header" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1 style={{ margin: 0 }}>OKR</h1>
              <p style={{ margin: '0.5rem 0 0', color: 'var(--cds-text-secondary)' }}>
                Objectives & Key Results
              </p>
            </div>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <Select
                id="period-select"
                labelText=""
                value={selectedPeriod?.toString() || ''}
                onChange={(e) => setSelectedPeriod(Number(e.target.value))}
                size="md"
                style={{ minWidth: '200px' }}
              >
                {periods.map(period => (
                  <SelectItem
                    key={period.id}
                    value={period.id.toString()}
                    text={`${period.name}${period.is_active ? ' (активный)' : ''}`}
                  />
                ))}
              </Select>
              <Button
                kind="primary"
                renderIcon={Add}
                onClick={() => setCreateModalOpen(true)}
              >
                Создать цель
              </Button>
            </div>
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

        <Tabs selectedIndex={activeTab} onChange={({ selectedIndex }) => setActiveTab(selectedIndex)}>
          <TabList aria-label="OKR tabs" contained>
            <Tab renderIcon={Dashboard}>Дашборд</Tab>
            <Tab renderIcon={Crossroads}>Мои OKR ({myObjectives.length})</Tab>
            <Tab renderIcon={UserMultiple}>Команда ({teamObjectives.length})</Tab>
            <Tab renderIcon={Enterprise}>Компания ({companyObjectives.length})</Tab>
          </TabList>
          <TabPanels>
            <TabPanel style={{ padding: '1rem 0' }}>
              {stats ? (
                <OKRDashboard stats={stats} loading={statsLoading} />
              ) : (
                <Loading />
              )}
            </TabPanel>
            <TabPanel style={{ padding: '1rem 0' }}>
              {renderObjectivesList(myObjectives, false)}
            </TabPanel>
            <TabPanel style={{ padding: '1rem 0' }}>
              {renderObjectivesList(teamObjectives)}
            </TabPanel>
            <TabPanel style={{ padding: '1rem 0' }}>
              {renderObjectivesList(companyObjectives)}
            </TabPanel>
          </TabPanels>
        </Tabs>

        <CreateObjectiveModal
          open={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          onSuccess={loadObjectives}
        />
      </Column>
    </Grid>
  )
}
