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
  NumberInput,
  Loading,
  InlineNotification,
} from '@carbon/react'
import { Add } from '@carbon/icons-react'
import { classifiedsApi } from '@/api/endpoints/classifieds'
import { ClassifiedCard } from '@/components/features/classifieds'
import { EmptyState } from '@/components/ui/EmptyState'
import type { Classified, ClassifiedCategory } from '@/types'

export default function ClassifiedsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [selectedTab, setSelectedTab] = useState(0)
  const [categoryFilter, setCategoryFilter] = useState<number | ''>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [ordering, setOrdering] = useState('-created_at')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newClassified, setNewClassified] = useState({
    title: '',
    description: '',
    category: 0,
    contact_info: '',
    price: null as number | null,
  })

  const { data: categories } = useQuery({
    queryKey: ['classified-categories'],
    queryFn: classifiedsApi.getCategories,
  })

  const { data: classifiedsData, isLoading } = useQuery({
    queryKey: ['classifieds', categoryFilter, searchQuery, ordering],
    queryFn: () => classifiedsApi.getList({
      category: categoryFilter || undefined,
      search: searchQuery || undefined,
      ordering,
    }),
  })

  const { data: myClassifieds } = useQuery({
    queryKey: ['my-classifieds'],
    queryFn: classifiedsApi.getMy,
  })

  const createMutation = useMutation({
    mutationFn: classifiedsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classifieds'] })
      queryClient.invalidateQueries({ queryKey: ['my-classifieds'] })
      setIsCreateOpen(false)
      setNewClassified({
        title: '',
        description: '',
        category: 0,
        contact_info: '',
        price: null,
      })
    },
  })

  const handleCreateClassified = () => {
    if (newClassified.title.trim() && newClassified.description.trim() && newClassified.category) {
      createMutation.mutate({
        title: newClassified.title,
        description: newClassified.description,
        category: newClassified.category,
        contact_info: newClassified.contact_info || undefined,
        price: newClassified.price,
      })
    }
  }

  const renderClassifiedsList = (classifieds: Classified[] | undefined) => {
    if (isLoading) {
      return <Loading description="Загрузка объявлений..." withOverlay={false} />
    }

    if (!classifieds || classifieds.length === 0) {
      return (
        <EmptyState
          title="Нет объявлений"
          description="Объявления пока не добавлены"
          icon="Document"
        />
      )
    }

    return (
      <div className="classifieds-grid">
        {classifieds.map((classified) => (
          <ClassifiedCard
            key={classified.id}
            classified={classified}
            onClick={() => navigate(`/classifieds/${classified.id}`)}
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
            <h1 className="page-title">Доска объявлений</h1>
            <p className="page-description">Объявления от сотрудников</p>
          </div>
          <Button
            renderIcon={Add}
            onClick={() => setIsCreateOpen(true)}
          >
            Создать объявление
          </Button>
        </div>

        <Tabs selectedIndex={selectedTab} onChange={({ selectedIndex }) => setSelectedTab(selectedIndex)}>
          <TabList aria-label="Вкладки объявлений">
            <Tab>Все объявления</Tab>
            <Tab>Мои объявления</Tab>
          </TabList>

          <div className="mt-4 mb-4">
            <div className="flex flex-wrap gap-4 items-end">
              <div className="w-64">
                <Search
                  id="classified-search"
                  labelText="Поиск"
                  placeholder="Поиск объявлений..."
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
                  onChange={(e) => setCategoryFilter(e.target.value ? Number(e.target.value) : '')}
                  size="md"
                >
                  <SelectItem value="" text="Все категории" />
                  {categories?.map((cat: ClassifiedCategory) => (
                    <SelectItem key={cat.id} value={cat.id} text={cat.name} />
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
                  <SelectItem value="-price" text="По цене ↓" />
                  <SelectItem value="price" text="По цене ↑" />
                  <SelectItem value="-views_count" text="По просмотрам" />
                </Select>
              </div>
            </div>
          </div>

          <TabPanels>
            <TabPanel>
              {renderClassifiedsList(classifiedsData?.results)}
            </TabPanel>
            <TabPanel>
              {renderClassifiedsList(myClassifieds)}
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Column>

      <Modal
        open={isCreateOpen}
        onRequestClose={() => setIsCreateOpen(false)}
        modalHeading="Создать объявление"
        primaryButtonText="Создать"
        secondaryButtonText="Отмена"
        onRequestSubmit={handleCreateClassified}
        primaryButtonDisabled={
          !newClassified.title.trim() ||
          !newClassified.description.trim() ||
          !newClassified.category ||
          createMutation.isPending
        }
      >
        {createMutation.isError && (
          <InlineNotification
            kind="error"
            title="Ошибка"
            subtitle="Не удалось создать объявление"
            hideCloseButton
            className="mb-4"
          />
        )}

        <TextInput
          id="classified-title"
          labelText="Заголовок"
          placeholder="Что предлагаете?"
          value={newClassified.title}
          onChange={(e) => setNewClassified({ ...newClassified, title: e.target.value })}
          className="mb-4"
        />

        <Select
          id="classified-category"
          labelText="Категория"
          value={newClassified.category || ''}
          onChange={(e) => setNewClassified({ ...newClassified, category: Number(e.target.value) })}
          className="mb-4"
        >
          <SelectItem value="" text="Выберите категорию" />
          {categories?.map((cat: ClassifiedCategory) => (
            <SelectItem key={cat.id} value={cat.id} text={cat.name} />
          ))}
        </Select>

        <TextArea
          id="classified-description"
          labelText="Описание"
          placeholder="Подробно опишите ваше предложение..."
          value={newClassified.description}
          onChange={(e) => setNewClassified({ ...newClassified, description: e.target.value })}
          rows={4}
          className="mb-4"
        />

        <NumberInput
          id="classified-price"
          label="Цена (необязательно)"
          value={newClassified.price || ''}
          onChange={(_e, { value }) => setNewClassified({ ...newClassified, price: value ? Number(value) : null })}
          min={0}
          step={100}
          className="mb-4"
          hideSteppers
        />

        <TextInput
          id="classified-contact"
          labelText="Контактная информация (необязательно)"
          placeholder="Если отличается от профиля"
          value={newClassified.contact_info}
          onChange={(e) => setNewClassified({ ...newClassified, contact_info: e.target.value })}
        />
      </Modal>
    </Grid>
  )
}
