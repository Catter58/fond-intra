import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  DataTable,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
  TableContainer,
  TableToolbar,
  TableToolbarContent,
  TableToolbarSearch,
  Button,
  Modal,
  TextInput,
  TextArea,
  Select,
  SelectItem,
  InlineNotification,
  Tag,
  Loading,
  ContentSwitcher,
  Switch,
} from '@carbon/react'
import { Add, Edit, TrashCan } from '@carbon/icons-react'
import { skillsApi } from '@/api/endpoints/skills'
import type { Skill, SkillCategory } from '@/types'

interface SkillFormData {
  name: string
  description: string
  category: number | ''
}

interface CategoryFormData {
  name: string
  description: string
  order: number
}

export function AdminSkillsPage() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState(0)

  // Skills state
  const [skillModalOpen, setSkillModalOpen] = useState(false)
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null)
  const [skillForm, setSkillForm] = useState<SkillFormData>({ name: '', description: '', category: '' })
  const [skillError, setSkillError] = useState<string | null>(null)

  // Categories state
  const [categoryModalOpen, setCategoryModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<SkillCategory | null>(null)
  const [categoryForm, setCategoryForm] = useState<CategoryFormData>({ name: '', description: '', order: 0 })
  const [categoryError, setCategoryError] = useState<string | null>(null)

  // Delete confirmation
  const [deleteModal, setDeleteModal] = useState<{ type: 'skill' | 'category'; id: number; name: string } | null>(null)

  // Queries
  const { data: skills = [], isLoading: skillsLoading } = useQuery({
    queryKey: ['skills'],
    queryFn: () => skillsApi.getSkills(),
  })

  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['skill-categories'],
    queryFn: skillsApi.getCategories,
  })

  const isLoading = skillsLoading || categoriesLoading

  // Skill mutations
  const createSkillMutation = useMutation({
    mutationFn: (data: { name: string; category: number; description?: string }) =>
      skillsApi.createSkill(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['skills'] })
      closeSkillModal()
    },
    onError: (err: any) => {
      setSkillError(err.response?.data?.detail || err.message || 'Ошибка при создании навыка')
    },
  })

  const updateSkillMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { name?: string; category?: number; description?: string } }) =>
      skillsApi.updateSkill(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['skills'] })
      closeSkillModal()
    },
    onError: (err: any) => {
      setSkillError(err.response?.data?.detail || err.message || 'Ошибка при обновлении навыка')
    },
  })

  const deleteSkillMutation = useMutation({
    mutationFn: (id: number) => skillsApi.deleteSkill(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['skills'] })
      setDeleteModal(null)
    },
  })

  // Category mutations
  const createCategoryMutation = useMutation({
    mutationFn: (data: { name: string; description?: string; order?: number }) =>
      skillsApi.createCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['skill-categories'] })
      closeCategoryModal()
    },
    onError: (err: any) => {
      setCategoryError(err.response?.data?.detail || err.message || 'Ошибка при создании категории')
    },
  })

  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { name?: string; description?: string; order?: number } }) =>
      skillsApi.updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['skill-categories'] })
      closeCategoryModal()
    },
    onError: (err: any) => {
      setCategoryError(err.response?.data?.detail || err.message || 'Ошибка при обновлении категории')
    },
  })

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: number) => skillsApi.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['skill-categories'] })
      setDeleteModal(null)
    },
  })

  // Skills handlers
  const openSkillModal = (skill?: Skill) => {
    if (skill) {
      setEditingSkill(skill)
      setSkillForm({
        name: skill.name,
        description: skill.description || '',
        category: skill.category,
      })
    } else {
      setEditingSkill(null)
      setSkillForm({ name: '', description: '', category: categories[0]?.id || '' })
    }
    setSkillError(null)
    setSkillModalOpen(true)
  }

  const closeSkillModal = () => {
    setSkillModalOpen(false)
    setEditingSkill(null)
    setSkillForm({ name: '', description: '', category: '' })
    setSkillError(null)
  }

  const handleSkillSubmit = () => {
    if (!skillForm.name.trim()) {
      setSkillError('Введите название навыка')
      return
    }
    if (skillForm.category === '') {
      setSkillError('Выберите категорию')
      return
    }

    const data = {
      name: skillForm.name.trim(),
      category: skillForm.category as number,
      description: skillForm.description.trim() || undefined,
    }

    if (editingSkill) {
      updateSkillMutation.mutate({ id: editingSkill.id, data })
    } else {
      createSkillMutation.mutate(data)
    }
  }

  // Categories handlers
  const openCategoryModal = (category?: SkillCategory) => {
    if (category) {
      setEditingCategory(category)
      setCategoryForm({
        name: category.name,
        description: category.description || '',
        order: category.order || 0,
      })
    } else {
      setEditingCategory(null)
      setCategoryForm({ name: '', description: '', order: categories.length })
    }
    setCategoryError(null)
    setCategoryModalOpen(true)
  }

  const closeCategoryModal = () => {
    setCategoryModalOpen(false)
    setEditingCategory(null)
    setCategoryForm({ name: '', description: '', order: 0 })
    setCategoryError(null)
  }

  const handleCategorySubmit = () => {
    if (!categoryForm.name.trim()) {
      setCategoryError('Введите название категории')
      return
    }

    const data = {
      name: categoryForm.name.trim(),
      description: categoryForm.description.trim() || undefined,
      order: categoryForm.order,
    }

    if (editingCategory) {
      updateCategoryMutation.mutate({ id: editingCategory.id, data })
    } else {
      createCategoryMutation.mutate(data)
    }
  }

  // Delete handler
  const handleDelete = () => {
    if (!deleteModal) return
    if (deleteModal.type === 'skill') {
      deleteSkillMutation.mutate(deleteModal.id)
    } else {
      deleteCategoryMutation.mutate(deleteModal.id)
    }
  }

  // Table headers
  const skillHeaders = [
    { key: 'name', header: 'Название' },
    { key: 'category_name', header: 'Категория' },
    { key: 'description', header: 'Описание' },
    { key: 'actions', header: '' },
  ]

  const categoryHeaders = [
    { key: 'name', header: 'Название' },
    { key: 'description', header: 'Описание' },
    { key: 'skills_count', header: 'Навыков' },
    { key: 'order', header: 'Порядок' },
    { key: 'actions', header: '' },
  ]

  // Prepare skills data with category names (DataTable requires string ids)
  const skillRows = skills.map((skill) => ({
    id: String(skill.id),
    name: skill.name,
    category_name: categories.find((c) => c.id === skill.category)?.name || '-',
    description: skill.description || '-',
  }))

  // Prepare categories data with skills count (DataTable requires string ids)
  const categoryRows = categories.map((cat) => ({
    id: String(cat.id),
    name: cat.name,
    description: cat.description || '-',
    skills_count: skills.filter((s) => s.category === cat.id).length,
    order: cat.order || 0,
  }))

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Управление навыками</h1>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <ContentSwitcher
          onChange={(e) => {
            if (e.index !== undefined) {
              setActiveTab(e.index)
            }
          }}
          selectedIndex={activeTab}
          size="md"
        >
          <Switch name="skills">Навыки ({skills.length})</Switch>
          <Switch name="categories">Категории ({categories.length})</Switch>
        </ContentSwitcher>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <Loading withOverlay={false} />
        </div>
      ) : activeTab === 0 ? (
        <DataTable rows={skillRows} headers={skillHeaders}>
          {({
            rows,
            headers,
            getTableProps,
            getHeaderProps,
            getRowProps,
            getToolbarProps,
          }) => (
            <TableContainer>
              <TableToolbar {...getToolbarProps()}>
                <TableToolbarContent>
                  <TableToolbarSearch placeholder="Поиск навыков..." />
                  <Button renderIcon={Add} onClick={() => openSkillModal()}>
                    Добавить навык
                  </Button>
                </TableToolbarContent>
              </TableToolbar>
              <Table {...getTableProps()}>
                <TableHead>
                  <TableRow>
                    {headers.map((header) => (
                      <TableHeader {...getHeaderProps({ header })} key={header.key}>
                        {header.header}
                      </TableHeader>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((row) => {
                    const skill = skills.find((s) => String(s.id) === row.id)
                    return (
                      <TableRow {...getRowProps({ row })} key={row.id}>
                        {row.cells.map((cell) => (
                          <TableCell key={cell.id}>
                            {cell.info.header === 'actions' ? (
                              <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <Button
                                  kind="ghost"
                                  size="sm"
                                  hasIconOnly
                                  renderIcon={Edit}
                                  iconDescription="Редактировать"
                                  onClick={() => skill && openSkillModal(skill)}
                                />
                                <Button
                                  kind="ghost"
                                  size="sm"
                                  hasIconOnly
                                  renderIcon={TrashCan}
                                  iconDescription="Удалить"
                                  onClick={() => skill && setDeleteModal({ type: 'skill', id: skill.id, name: skill.name })}
                                />
                              </div>
                            ) : cell.info.header === 'category_name' ? (
                              <Tag size="sm" type="blue">{cell.value}</Tag>
                            ) : (
                              cell.value || '-'
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DataTable>
      ) : (
        <DataTable rows={categoryRows} headers={categoryHeaders}>
          {({
            rows,
            headers,
            getTableProps,
            getHeaderProps,
            getRowProps,
            getToolbarProps,
          }) => (
            <TableContainer>
              <TableToolbar {...getToolbarProps()}>
                <TableToolbarContent>
                  <TableToolbarSearch placeholder="Поиск категорий..." />
                  <Button renderIcon={Add} onClick={() => openCategoryModal()}>
                    Добавить категорию
                  </Button>
                </TableToolbarContent>
              </TableToolbar>
              <Table {...getTableProps()}>
                <TableHead>
                  <TableRow>
                    {headers.map((header) => (
                      <TableHeader {...getHeaderProps({ header })} key={header.key}>
                        {header.header}
                      </TableHeader>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((row) => {
                    const category = categories.find((c) => String(c.id) === row.id)
                    const skillsCount = skills.filter((s) => s.category === category?.id).length
                    return (
                      <TableRow {...getRowProps({ row })} key={row.id}>
                        {row.cells.map((cell) => (
                          <TableCell key={cell.id}>
                            {cell.info.header === 'actions' ? (
                              <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <Button
                                  kind="ghost"
                                  size="sm"
                                  hasIconOnly
                                  renderIcon={Edit}
                                  iconDescription="Редактировать"
                                  onClick={() => category && openCategoryModal(category)}
                                />
                                <Button
                                  kind="ghost"
                                  size="sm"
                                  hasIconOnly
                                  renderIcon={TrashCan}
                                  iconDescription="Удалить"
                                  onClick={() => category && setDeleteModal({ type: 'category', id: category.id, name: category.name })}
                                  disabled={skillsCount > 0}
                                />
                              </div>
                            ) : cell.info.header === 'skills_count' ? (
                              <Tag size="sm" type="gray">{cell.value}</Tag>
                            ) : (
                              cell.value || '-'
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DataTable>
      )}

      {/* Skill Modal */}
      <Modal
        open={skillModalOpen}
        onRequestClose={closeSkillModal}
        onRequestSubmit={handleSkillSubmit}
        modalHeading={editingSkill ? 'Редактировать навык' : 'Добавить навык'}
        primaryButtonText={editingSkill ? 'Сохранить' : 'Добавить'}
        secondaryButtonText="Отмена"
        primaryButtonDisabled={createSkillMutation.isPending || updateSkillMutation.isPending}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {skillError && (
            <InlineNotification kind="error" title="Ошибка" subtitle={skillError} lowContrast hideCloseButton />
          )}
          <TextInput
            id="skill-name"
            labelText="Название навыка"
            value={skillForm.name}
            onChange={(e) => setSkillForm({ ...skillForm, name: e.target.value })}
            required
          />
          <Select
            id="skill-category"
            labelText="Категория"
            value={skillForm.category}
            onChange={(e) => setSkillForm({ ...skillForm, category: e.target.value ? Number(e.target.value) : '' })}
            required
          >
            <SelectItem value="" text="Выберите категорию" />
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id} text={cat.name} />
            ))}
          </Select>
          <TextArea
            id="skill-description"
            labelText="Описание (опционально)"
            value={skillForm.description}
            onChange={(e) => setSkillForm({ ...skillForm, description: e.target.value })}
            rows={3}
          />
        </div>
      </Modal>

      {/* Category Modal */}
      <Modal
        open={categoryModalOpen}
        onRequestClose={closeCategoryModal}
        onRequestSubmit={handleCategorySubmit}
        modalHeading={editingCategory ? 'Редактировать категорию' : 'Добавить категорию'}
        primaryButtonText={editingCategory ? 'Сохранить' : 'Добавить'}
        secondaryButtonText="Отмена"
        primaryButtonDisabled={createCategoryMutation.isPending || updateCategoryMutation.isPending}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {categoryError && (
            <InlineNotification kind="error" title="Ошибка" subtitle={categoryError} lowContrast hideCloseButton />
          )}
          <TextInput
            id="category-name"
            labelText="Название категории"
            value={categoryForm.name}
            onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
            required
          />
          <TextArea
            id="category-description"
            labelText="Описание (опционально)"
            value={categoryForm.description}
            onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
            rows={3}
          />
          <TextInput
            id="category-order"
            labelText="Порядок сортировки"
            type="number"
            value={categoryForm.order.toString()}
            onChange={(e) => setCategoryForm({ ...categoryForm, order: parseInt(e.target.value) || 0 })}
          />
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={!!deleteModal}
        onRequestClose={() => setDeleteModal(null)}
        onRequestSubmit={handleDelete}
        modalHeading="Подтверждение удаления"
        primaryButtonText="Удалить"
        secondaryButtonText="Отмена"
        danger
        size="xs"
      >
        <p>
          Вы уверены, что хотите удалить {deleteModal?.type === 'skill' ? 'навык' : 'категорию'}{' '}
          <strong>{deleteModal?.name}</strong>?
        </p>
        {deleteModal?.type === 'category' && (
          <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: 'var(--cds-text-secondary)' }}>
            Категорию можно удалить только если в ней нет навыков.
          </p>
        )}
      </Modal>
    </div>
  )
}
