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
  Toggle,
  NumberInput,
} from '@carbon/react'
import { Add, Edit, TrashCan } from '@carbon/icons-react'
import { faqApi } from '@/api/endpoints/faq'
import type { FAQCategory, FAQItem } from '@/types'

interface CategoryFormData {
  name: string
  description: string
  icon: string
  order: number
  is_active: boolean
}

interface ItemFormData {
  category: number | ''
  question: string
  answer: string
  order: number
  is_published: boolean
}

export function AdminFAQPage() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState(0)

  // Categories state
  const [categoryModalOpen, setCategoryModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<FAQCategory | null>(null)
  const [categoryForm, setCategoryForm] = useState<CategoryFormData>({
    name: '',
    description: '',
    icon: '',
    order: 0,
    is_active: true,
  })
  const [categoryError, setCategoryError] = useState<string | null>(null)

  // Items state
  const [itemModalOpen, setItemModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<FAQItem | null>(null)
  const [itemForm, setItemForm] = useState<ItemFormData>({
    category: '',
    question: '',
    answer: '',
    order: 0,
    is_published: true,
  })
  const [itemError, setItemError] = useState<string | null>(null)

  // Delete confirmation
  const [deleteModal, setDeleteModal] = useState<{
    type: 'category' | 'item'
    id: number
    name: string
  } | null>(null)

  // Queries
  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['faq-categories'],
    queryFn: faqApi.getCategories,
  })

  const { data: items = [], isLoading: itemsLoading } = useQuery({
    queryKey: ['faq-items'],
    queryFn: () => faqApi.getItems(),
  })

  const isLoading = categoriesLoading || itemsLoading

  // Category mutations
  const createCategoryMutation = useMutation({
    mutationFn: (data: Partial<FAQCategory>) => faqApi.createCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faq-categories'] })
      closeCategoryModal()
    },
    onError: (err: any) => {
      setCategoryError(
        err.response?.data?.detail || err.response?.data?.name?.[0] || 'Ошибка при создании категории'
      )
    },
  })

  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<FAQCategory> }) =>
      faqApi.updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faq-categories'] })
      closeCategoryModal()
    },
    onError: (err: any) => {
      setCategoryError(
        err.response?.data?.detail || err.response?.data?.name?.[0] || 'Ошибка при обновлении категории'
      )
    },
  })

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: number) => faqApi.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faq-categories'] })
      setDeleteModal(null)
    },
    onError: (err: any) => {
      setCategoryError(err.response?.data?.detail || 'Ошибка при удалении категории')
    },
  })

  // Item mutations
  const createItemMutation = useMutation({
    mutationFn: (data: Partial<FAQItem>) => faqApi.createItem(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faq-items'] })
      queryClient.invalidateQueries({ queryKey: ['faq-categories'] })
      closeItemModal()
    },
    onError: (err: any) => {
      setItemError(
        err.response?.data?.detail || err.response?.data?.question?.[0] || 'Ошибка при создании вопроса'
      )
    },
  })

  const updateItemMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<FAQItem> }) =>
      faqApi.updateItem(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faq-items'] })
      queryClient.invalidateQueries({ queryKey: ['faq-categories'] })
      closeItemModal()
    },
    onError: (err: any) => {
      setItemError(
        err.response?.data?.detail || err.response?.data?.question?.[0] || 'Ошибка при обновлении вопроса'
      )
    },
  })

  const deleteItemMutation = useMutation({
    mutationFn: (id: number) => faqApi.deleteItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faq-items'] })
      queryClient.invalidateQueries({ queryKey: ['faq-categories'] })
      setDeleteModal(null)
    },
    onError: (err: any) => {
      setItemError(err.response?.data?.detail || 'Ошибка при удалении вопроса')
    },
  })

  // Category handlers
  const openCategoryModal = (category?: FAQCategory) => {
    if (category) {
      setEditingCategory(category)
      setCategoryForm({
        name: category.name,
        description: category.description || '',
        icon: category.icon || '',
        order: category.order || 0,
        is_active: category.is_active,
      })
    } else {
      setEditingCategory(null)
      setCategoryForm({
        name: '',
        description: '',
        icon: '',
        order: categories.length,
        is_active: true,
      })
    }
    setCategoryError(null)
    setCategoryModalOpen(true)
  }

  const closeCategoryModal = () => {
    setCategoryModalOpen(false)
    setEditingCategory(null)
    setCategoryForm({
      name: '',
      description: '',
      icon: '',
      order: 0,
      is_active: true,
    })
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
      icon: categoryForm.icon.trim() || undefined,
      order: categoryForm.order,
      is_active: categoryForm.is_active,
    }

    if (editingCategory) {
      updateCategoryMutation.mutate({ id: editingCategory.id, data })
    } else {
      createCategoryMutation.mutate(data)
    }
  }

  // Item handlers
  const openItemModal = (item?: FAQItem) => {
    if (item) {
      setEditingItem(item)
      setItemForm({
        category: item.category,
        question: item.question,
        answer: item.answer || '',
        order: item.order || 0,
        is_published: item.is_published,
      })
    } else {
      setEditingItem(null)
      setItemForm({
        category: categories[0]?.id || '',
        question: '',
        answer: '',
        order: items.length,
        is_published: true,
      })
    }
    setItemError(null)
    setItemModalOpen(true)
  }

  const closeItemModal = () => {
    setItemModalOpen(false)
    setEditingItem(null)
    setItemForm({
      category: '',
      question: '',
      answer: '',
      order: 0,
      is_published: true,
    })
    setItemError(null)
  }

  const handleItemSubmit = () => {
    if (!itemForm.question.trim()) {
      setItemError('Введите вопрос')
      return
    }
    if (itemForm.category === '') {
      setItemError('Выберите категорию')
      return
    }
    if (!itemForm.answer.trim()) {
      setItemError('Введите ответ')
      return
    }

    const data = {
      category: itemForm.category as number,
      question: itemForm.question.trim(),
      answer: itemForm.answer.trim(),
      order: itemForm.order,
      is_published: itemForm.is_published,
    }

    if (editingItem) {
      updateItemMutation.mutate({ id: editingItem.id, data })
    } else {
      createItemMutation.mutate(data)
    }
  }

  // Delete handler
  const handleDelete = () => {
    if (!deleteModal) return
    if (deleteModal.type === 'category') {
      deleteCategoryMutation.mutate(deleteModal.id)
    } else {
      deleteItemMutation.mutate(deleteModal.id)
    }
  }

  // Table headers
  const categoryHeaders = [
    { key: 'name', header: 'Название' },
    { key: 'icon', header: 'Иконка' },
    { key: 'items_count', header: 'Вопросов' },
    { key: 'order', header: 'Порядок' },
    { key: 'is_active', header: 'Статус' },
    { key: 'actions', header: '' },
  ]

  const itemHeaders = [
    { key: 'question', header: 'Вопрос' },
    { key: 'category_name', header: 'Категория' },
    { key: 'views_count', header: 'Просмотров' },
    { key: 'order', header: 'Порядок' },
    { key: 'is_published', header: 'Статус' },
    { key: 'actions', header: '' },
  ]

  // Prepare data for DataTable (requires string ids)
  const categoryRows = categories.map((cat) => ({
    id: String(cat.id),
    name: cat.name,
    icon: cat.icon || '-',
    items_count: cat.items_count || 0,
    order: cat.order || 0,
    is_active: cat.is_active,
  }))

  const itemRows = items.map((item) => ({
    id: String(item.id),
    question: item.question,
    category_name: item.category_name || categories.find((c) => c.id === item.category)?.name || '-',
    views_count: item.views_count || 0,
    order: item.order || 0,
    is_published: item.is_published,
  }))

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Управление FAQ</h1>
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
          <Switch name="categories">Категории ({categories.length})</Switch>
          <Switch name="items">Вопросы ({items.length})</Switch>
        </ContentSwitcher>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <Loading withOverlay={false} />
        </div>
      ) : activeTab === 0 ? (
        <DataTable rows={categoryRows} headers={categoryHeaders}>
          {({ rows, headers, getTableProps, getHeaderProps, getRowProps, getToolbarProps }) => (
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
                                  onClick={() =>
                                    category &&
                                    setDeleteModal({
                                      type: 'category',
                                      id: category.id,
                                      name: category.name,
                                    })
                                  }
                                  disabled={(category?.items_count || 0) > 0}
                                />
                              </div>
                            ) : cell.info.header === 'items_count' ? (
                              <Tag size="sm" type="gray">
                                {cell.value}
                              </Tag>
                            ) : cell.info.header === 'is_active' ? (
                              <Tag size="sm" type={cell.value ? 'green' : 'gray'}>
                                {cell.value ? 'Активна' : 'Скрыта'}
                              </Tag>
                            ) : cell.info.header === 'icon' && cell.value !== '-' ? (
                              <span style={{ fontSize: '1.25rem' }}>{cell.value}</span>
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
        <DataTable rows={itemRows} headers={itemHeaders}>
          {({ rows, headers, getTableProps, getHeaderProps, getRowProps, getToolbarProps }) => (
            <TableContainer>
              <TableToolbar {...getToolbarProps()}>
                <TableToolbarContent>
                  <TableToolbarSearch placeholder="Поиск вопросов..." />
                  <Button renderIcon={Add} onClick={() => openItemModal()}>
                    Добавить вопрос
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
                    const item = items.find((i) => String(i.id) === row.id)
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
                                  onClick={() => item && openItemModal(item)}
                                />
                                <Button
                                  kind="ghost"
                                  size="sm"
                                  hasIconOnly
                                  renderIcon={TrashCan}
                                  iconDescription="Удалить"
                                  onClick={() =>
                                    item &&
                                    setDeleteModal({
                                      type: 'item',
                                      id: item.id,
                                      name: item.question,
                                    })
                                  }
                                />
                              </div>
                            ) : cell.info.header === 'category_name' ? (
                              <Tag size="sm" type="blue">
                                {cell.value}
                              </Tag>
                            ) : cell.info.header === 'is_published' ? (
                              <Tag size="sm" type={cell.value ? 'green' : 'gray'}>
                                {cell.value ? 'Опубликован' : 'Черновик'}
                              </Tag>
                            ) : cell.info.header === 'question' ? (
                              <span
                                style={{
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden',
                                  maxWidth: '400px',
                                }}
                              >
                                {cell.value}
                              </span>
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
            <InlineNotification
              kind="error"
              title="Ошибка"
              subtitle={categoryError}
              lowContrast
              hideCloseButton
            />
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
            rows={2}
          />
          <TextInput
            id="category-icon"
            labelText="Иконка (emoji)"
            placeholder="Например: 📋"
            value={categoryForm.icon}
            onChange={(e) => setCategoryForm({ ...categoryForm, icon: e.target.value })}
          />
          <NumberInput
            id="category-order"
            label="Порядок сортировки"
            min={0}
            value={categoryForm.order}
            onChange={(_e, { value }) =>
              setCategoryForm({ ...categoryForm, order: typeof value === 'number' ? value : 0 })
            }
          />
          <Toggle
            id="category-active"
            labelText="Статус"
            labelA="Скрыта"
            labelB="Активна"
            toggled={categoryForm.is_active}
            onToggle={(checked) => setCategoryForm({ ...categoryForm, is_active: checked })}
          />
        </div>
      </Modal>

      {/* Item Modal */}
      <Modal
        open={itemModalOpen}
        onRequestClose={closeItemModal}
        onRequestSubmit={handleItemSubmit}
        modalHeading={editingItem ? 'Редактировать вопрос' : 'Добавить вопрос'}
        primaryButtonText={editingItem ? 'Сохранить' : 'Добавить'}
        secondaryButtonText="Отмена"
        primaryButtonDisabled={createItemMutation.isPending || updateItemMutation.isPending}
        size="lg"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {itemError && (
            <InlineNotification
              kind="error"
              title="Ошибка"
              subtitle={itemError}
              lowContrast
              hideCloseButton
            />
          )}
          <Select
            id="item-category"
            labelText="Категория"
            value={itemForm.category}
            onChange={(e) =>
              setItemForm({ ...itemForm, category: e.target.value ? Number(e.target.value) : '' })
            }
            required
          >
            <SelectItem value="" text="Выберите категорию" />
            {categories
              .filter((c) => c.is_active)
              .map((cat) => (
                <SelectItem key={cat.id} value={cat.id} text={cat.name} />
              ))}
          </Select>
          <TextInput
            id="item-question"
            labelText="Вопрос"
            value={itemForm.question}
            onChange={(e) => setItemForm({ ...itemForm, question: e.target.value })}
            required
          />
          <TextArea
            id="item-answer"
            labelText="Ответ"
            value={itemForm.answer}
            onChange={(e) => setItemForm({ ...itemForm, answer: e.target.value })}
            rows={6}
            required
          />
          <NumberInput
            id="item-order"
            label="Порядок сортировки"
            min={0}
            value={itemForm.order}
            onChange={(_e, { value }) =>
              setItemForm({ ...itemForm, order: typeof value === 'number' ? value : 0 })
            }
          />
          <Toggle
            id="item-published"
            labelText="Статус"
            labelA="Черновик"
            labelB="Опубликован"
            toggled={itemForm.is_published}
            onToggle={(checked) => setItemForm({ ...itemForm, is_published: checked })}
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
          Вы уверены, что хотите удалить {deleteModal?.type === 'category' ? 'категорию' : 'вопрос'}{' '}
          <strong>
            {deleteModal?.name.length && deleteModal.name.length > 50
              ? deleteModal.name.slice(0, 50) + '...'
              : deleteModal?.name}
          </strong>
          ?
        </p>
        {deleteModal?.type === 'category' && (
          <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: 'var(--cds-text-secondary)' }}>
            Категорию можно удалить только если в ней нет вопросов.
          </p>
        )}
      </Modal>
    </div>
  )
}
