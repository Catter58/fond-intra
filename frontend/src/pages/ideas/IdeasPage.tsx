import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Grid,
  Column,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Button,
  Select,
  SelectItem,
  Search,
  Modal,
  TextInput,
  TextArea,
  Loading,
  InlineNotification,
} from '@carbon/react'
import { Add } from '@carbon/icons-react'
import { ideasApi } from '@/api/endpoints/ideas'
import { IdeaCard } from '@/components/features/ideas'
import { EmptyState } from '@/components/ui/EmptyState'
import { useAuthStore } from '@/store/authStore'
import type { Idea, IdeaCategoryOption } from '@/types'

export default function IdeasPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  const [selectedTab, setSelectedTab] = useState(0)
  const [categoryFilter, setCategoryFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [ordering, setOrdering] = useState('-created_at')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newIdea, setNewIdea] = useState({ title: '', description: '', category: 'other' })

  const { data: categories } = useQuery({
    queryKey: ['idea-categories'],
    queryFn: ideasApi.getCategories,
  })

  const { data: statuses } = useQuery({
    queryKey: ['idea-statuses'],
    queryFn: ideasApi.getStatuses,
  })

  const { data: ideasData, isLoading } = useQuery({
    queryKey: ['ideas', categoryFilter, statusFilter, searchQuery, ordering],
    queryFn: () => ideasApi.getList({
      category: categoryFilter || undefined,
      status: statusFilter || undefined,
      search: searchQuery || undefined,
      ordering,
    }),
  })

  const { data: myIdeas } = useQuery({
    queryKey: ['my-ideas'],
    queryFn: ideasApi.getMy,
  })

  const createMutation = useMutation({
    mutationFn: ideasApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ideas'] })
      queryClient.invalidateQueries({ queryKey: ['my-ideas'] })
      setIsCreateOpen(false)
      setNewIdea({ title: '', description: '', category: 'other' })
    },
  })

  const voteMutation = useMutation({
    mutationFn: ({ id, isUpvote }: { id: number; isUpvote: boolean }) =>
      ideasApi.vote(id, isUpvote),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ideas'] })
      queryClient.invalidateQueries({ queryKey: ['my-ideas'] })
    },
  })

  const unvoteMutation = useMutation({
    mutationFn: ideasApi.unvote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ideas'] })
      queryClient.invalidateQueries({ queryKey: ['my-ideas'] })
    },
  })

  const handleVote = (id: number, isUpvote: boolean) => {
    voteMutation.mutate({ id, isUpvote })
  }

  const handleUnvote = (id: number) => {
    unvoteMutation.mutate(id)
  }

  const handleCreateIdea = () => {
    if (newIdea.title.trim() && newIdea.description.trim()) {
      createMutation.mutate(newIdea)
    }
  }

  const renderIdeasList = (ideas: Idea[] | undefined) => {
    if (isLoading) {
      return <Loading description="Загрузка идей..." withOverlay={false} />
    }

    if (!ideas || ideas.length === 0) {
      return (
        <EmptyState
          title="Нет идей"
          description="Идеи пока не добавлены"
          icon="Idea"
        />
      )
    }

    return (
      <div className="space-y-4">
        {ideas.map((idea) => (
          <IdeaCard
            key={idea.id}
            idea={idea}
            currentUserId={user?.id}
            onVote={handleVote}
            onUnvote={handleUnvote}
            onClick={() => navigate(`/ideas/${idea.id}`)}
          />
        ))}
      </div>
    )
  }

  return (
    <Grid className="dashboard-page">
      <Column lg={16} md={8} sm={4}>
        <div className="page-header">
          <div>
            <h1 className="page-title">Банк идей</h1>
            <p className="page-description">Предлагайте идеи и голосуйте за лучшие</p>
          </div>
          <Button
            renderIcon={Add}
            onClick={() => setIsCreateOpen(true)}
          >
            Предложить идею
          </Button>
        </div>

        <Tabs selectedIndex={selectedTab} onChange={({ selectedIndex }) => setSelectedTab(selectedIndex)}>
          <TabList aria-label="Вкладки идей">
            <Tab>Все идеи</Tab>
            <Tab>Мои идеи</Tab>
          </TabList>

          <div className="mt-4 mb-4">
            <div className="flex flex-wrap gap-4 items-end">
              <div className="w-64">
                <Search
                  id="idea-search"
                  labelText="Поиск"
                  placeholder="Поиск идей..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  size="md"
                />
              </div>

              <div className="w-48">
                <Select
                  id="category-filter"
                  labelText="Категория"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  size="md"
                >
                  <SelectItem value="" text="Все категории" />
                  {categories?.map((cat: IdeaCategoryOption) => (
                    <SelectItem key={cat.value} value={cat.value} text={cat.label} />
                  ))}
                </Select>
              </div>

              <div className="w-48">
                <Select
                  id="status-filter"
                  labelText="Статус"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  size="md"
                >
                  <SelectItem value="" text="Все статусы" />
                  {statuses?.map((status) => (
                    <SelectItem key={status.value} value={status.value} text={status.label} />
                  ))}
                </Select>
              </div>

              <div className="w-48">
                <Select
                  id="ordering"
                  labelText="Сортировка"
                  value={ordering}
                  onChange={(e) => setOrdering(e.target.value)}
                  size="md"
                >
                  <SelectItem value="-created_at" text="Сначала новые" />
                  <SelectItem value="created_at" text="Сначала старые" />
                  <SelectItem value="-votes_score" text="По рейтингу ↓" />
                  <SelectItem value="votes_score" text="По рейтингу ↑" />
                  <SelectItem value="-comments_count" text="По обсуждениям" />
                </Select>
              </div>
            </div>
          </div>

          <TabPanels>
            <TabPanel>
              {renderIdeasList(ideasData?.results)}
            </TabPanel>
            <TabPanel>
              {renderIdeasList(myIdeas)}
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Column>

      <Modal
        open={isCreateOpen}
        onRequestClose={() => setIsCreateOpen(false)}
        modalHeading="Предложить идею"
        primaryButtonText="Отправить"
        secondaryButtonText="Отмена"
        onRequestSubmit={handleCreateIdea}
        primaryButtonDisabled={!newIdea.title.trim() || !newIdea.description.trim() || createMutation.isPending}
      >
        {createMutation.isError && (
          <InlineNotification
            kind="error"
            title="Ошибка"
            subtitle="Не удалось создать идею"
            hideCloseButton
            className="mb-4"
          />
        )}

        <TextInput
          id="idea-title"
          labelText="Заголовок"
          placeholder="Кратко опишите идею"
          value={newIdea.title}
          onChange={(e) => setNewIdea({ ...newIdea, title: e.target.value })}
          className="mb-4"
        />

        <Select
          id="idea-category"
          labelText="Категория"
          value={newIdea.category}
          onChange={(e) => setNewIdea({ ...newIdea, category: e.target.value })}
          className="mb-4"
        >
          {categories?.map((cat: IdeaCategoryOption) => (
            <SelectItem key={cat.value} value={cat.value} text={cat.label} />
          ))}
        </Select>

        <TextArea
          id="idea-description"
          labelText="Описание"
          placeholder="Подробно опишите вашу идею..."
          value={newIdea.description}
          onChange={(e) => setNewIdea({ ...newIdea, description: e.target.value })}
          rows={5}
        />
      </Modal>
    </Grid>
  )
}
