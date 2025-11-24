import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Grid,
  Column,
  Search,
  Accordion,
  AccordionItem,
  Tile,
  Tag,
  Button,
  Modal,
  TextInput,
  TextArea,
  Select,
  SelectItem,
  Loading,
  InlineNotification,
} from '@carbon/react'
import { Help, View, Add, Edit, TrashCan } from '@carbon/icons-react'
import { OutputData } from '@editorjs/editorjs'
import { faqApi } from '@/api/endpoints/faq'
import { EmptyState } from '@/components/ui/EmptyState'
import { RichTextEditor } from '@/components/ui/EditorJS'
import { RichTextViewer } from '@/components/ui/EditorJSViewer'
import { useAuthStore } from '@/store/authStore'
import type { FAQCategoryWithItems, FAQItem, FAQCategory } from '@/types'

export default function FAQPage() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const isAdmin = user?.is_superuser || user?.role?.is_admin

  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')

  // Modal states
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [isItemModalOpen, setIsItemModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<FAQCategory | null>(null)
  const [editingItem, setEditingItem] = useState<FAQItem | null>(null)

  // Form states
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '', icon: '', order: 0 })
  const [itemForm, setItemForm] = useState({ question: '', answer: '', category: 0, order: 0 })
  const [editorContent, setEditorContent] = useState<OutputData | null>(null)

  // Debounce search query
  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    setTimeout(() => setDebouncedQuery(value), 300)
  }

  const { data: categories, isLoading } = useQuery({
    queryKey: ['faq-categories-with-items'],
    queryFn: faqApi.getCategoriesWithItems,
  })

  const { data: allCategories } = useQuery({
    queryKey: ['faq-categories'],
    queryFn: faqApi.getCategories,
    enabled: isAdmin,
  })

  const { data: searchResults, isLoading: searchLoading } = useQuery({
    queryKey: ['faq-search', debouncedQuery],
    queryFn: () => faqApi.search(debouncedQuery),
    enabled: debouncedQuery.length >= 2,
  })

  // Mutations
  const createCategoryMutation = useMutation({
    mutationFn: faqApi.createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faq-categories'] })
      queryClient.invalidateQueries({ queryKey: ['faq-categories-with-items'] })
      closeCategoryModal()
    },
  })

  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<FAQCategory> }) =>
      faqApi.updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faq-categories'] })
      queryClient.invalidateQueries({ queryKey: ['faq-categories-with-items'] })
      closeCategoryModal()
    },
  })

  const deleteCategoryMutation = useMutation({
    mutationFn: faqApi.deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faq-categories'] })
      queryClient.invalidateQueries({ queryKey: ['faq-categories-with-items'] })
    },
  })

  const createItemMutation = useMutation({
    mutationFn: faqApi.createItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faq-categories-with-items'] })
      closeItemModal()
    },
  })

  const updateItemMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<FAQItem> }) =>
      faqApi.updateItem(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faq-categories-with-items'] })
      closeItemModal()
    },
  })

  const deleteItemMutation = useMutation({
    mutationFn: faqApi.deleteItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faq-categories-with-items'] })
    },
  })

  const openCategoryModal = (category?: FAQCategory) => {
    if (category) {
      setEditingCategory(category)
      setCategoryForm({
        name: category.name,
        description: category.description || '',
        icon: category.icon || '',
        order: category.order || 0,
      })
    } else {
      setEditingCategory(null)
      setCategoryForm({ name: '', description: '', icon: '', order: 0 })
    }
    setIsCategoryModalOpen(true)
  }

  const closeCategoryModal = () => {
    setIsCategoryModalOpen(false)
    setEditingCategory(null)
    setCategoryForm({ name: '', description: '', icon: '', order: 0 })
  }

  const openItemModal = (item?: FAQItem, categoryId?: number) => {
    if (item) {
      setEditingItem(item)
      // Try to parse answer as EditorJS content
      let parsedAnswer: OutputData | null = null
      try {
        parsedAnswer = JSON.parse(item.answer)
      } catch {
        // If not JSON, wrap in paragraph block
        parsedAnswer = {
          blocks: [{ type: 'paragraph', data: { text: item.answer } }],
        }
      }
      setEditorContent(parsedAnswer)
      setItemForm({
        question: item.question,
        answer: item.answer,
        category: item.category,
        order: item.order || 0,
      })
    } else {
      setEditingItem(null)
      setEditorContent(null)
      setItemForm({
        question: '',
        answer: '',
        category: categoryId || (allCategories?.[0]?.id ?? 0),
        order: 0,
      })
    }
    setIsItemModalOpen(true)
  }

  const closeItemModal = () => {
    setIsItemModalOpen(false)
    setEditingItem(null)
    setItemForm({ question: '', answer: '', category: 0, order: 0 })
    setEditorContent(null)
  }

  const handleSaveCategory = () => {
    if (editingCategory) {
      updateCategoryMutation.mutate({ id: editingCategory.id, data: categoryForm })
    } else {
      createCategoryMutation.mutate(categoryForm)
    }
  }

  const handleSaveItem = () => {
    const answerContent = editorContent ? JSON.stringify(editorContent) : itemForm.answer
    const data = { ...itemForm, answer: answerContent }

    if (editingItem) {
      updateItemMutation.mutate({ id: editingItem.id, data })
    } else {
      createItemMutation.mutate(data)
    }
  }

  // Highlight matching text
  const highlightText = (text: string, query: string) => {
    if (!query || query.length < 2) return text

    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    const parts = text.split(regex)

    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="bg-yellow-200 px-0.5 rounded">{part}</mark>
      ) : (
        part
      )
    )
  }

  // Filter categories and items based on search
  const filteredData = useMemo(() => {
    if (debouncedQuery.length >= 2 && searchResults) {
      // Group search results by category
      const categoryMap = new Map<number, FAQItem[]>()
      searchResults.forEach((item) => {
        if (!categoryMap.has(item.category)) {
          categoryMap.set(item.category, [])
        }
        categoryMap.get(item.category)?.push(item)
      })

      return Array.from(categoryMap.entries()).map(([categoryId, items]) => ({
        id: categoryId,
        name: items[0]?.category_name || '',
        slug: '',
        description: '',
        icon: '',
        order: 0,
        is_active: true,
        items_count: items.length,
        items,
      }))
    }

    return categories || []
  }, [categories, searchResults, debouncedQuery])

  // Parse answer content - try JSON first, fallback to plain text
  const parseAnswerContent = (answer: string): OutputData | string => {
    try {
      const parsed = JSON.parse(answer)
      if (parsed.blocks) return parsed
      return answer
    } catch {
      return answer
    }
  }

  if (isLoading) {
    return <Loading description="Загрузка FAQ..." withOverlay />
  }

  return (
    <Grid className="dashboard-page">
      <Column lg={16} md={8} sm={4}>
        <div className="page-header">
          <div>
            <h1 className="page-title">Часто задаваемые вопросы</h1>
            <p className="page-description">Найдите ответы на популярные вопросы</p>
          </div>
          {isAdmin && (
            <div className="flex gap-2">
              <Button kind="secondary" renderIcon={Add} onClick={() => openCategoryModal()}>
                Категория
              </Button>
              <Button renderIcon={Add} onClick={() => openItemModal()}>
                Вопрос
              </Button>
            </div>
          )}
        </div>

        <div className="mb-6 max-w-xl">
          <Search
            id="faq-search"
            labelText="Поиск"
            placeholder="Поиск по вопросам и ответам..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            size="lg"
          />
        </div>

        {searchLoading && debouncedQuery.length >= 2 && (
          <Loading description="Поиск..." withOverlay={false} small />
        )}

        {debouncedQuery.length >= 2 && searchResults && searchResults.length === 0 && (
          <EmptyState
            title="Ничего не найдено"
            description={`По запросу "${debouncedQuery}" ничего не найдено`}
            icon="Search"
          />
        )}

        {filteredData.length === 0 && !debouncedQuery && (
          <EmptyState
            title="FAQ пока пуст"
            description={isAdmin ? "Добавьте первый вопрос" : "Скоро здесь появятся ответы на часто задаваемые вопросы"}
            icon="Help"
          />
        )}

        <div className="space-y-6">
          {filteredData.map((category: FAQCategoryWithItems) => (
            <Tile key={category.id} className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Help size={20} className="text-blue-600" />
                  <h2 className="text-lg font-semibold">{category.name}</h2>
                  <Tag type="gray" size="sm">{category.items?.length || 0} вопросов</Tag>
                </div>
                {isAdmin && (
                  <div className="flex gap-1">
                    <Button
                      kind="ghost"
                      size="sm"
                      hasIconOnly
                      renderIcon={Add}
                      iconDescription="Добавить вопрос"
                      onClick={() => openItemModal(undefined, category.id)}
                    />
                    <Button
                      kind="ghost"
                      size="sm"
                      hasIconOnly
                      renderIcon={Edit}
                      iconDescription="Редактировать категорию"
                      onClick={() => openCategoryModal(category)}
                    />
                    <Button
                      kind="danger--ghost"
                      size="sm"
                      hasIconOnly
                      renderIcon={TrashCan}
                      iconDescription="Удалить категорию"
                      onClick={() => {
                        if (confirm('Удалить категорию и все её вопросы?')) {
                          deleteCategoryMutation.mutate(category.id)
                        }
                      }}
                    />
                  </div>
                )}
              </div>

              {category.description && (
                <p className="text-gray-600 mb-4">{category.description}</p>
              )}

              <Accordion>
                {category.items?.map((item: FAQItem) => (
                  <AccordionItem
                    key={item.id}
                    title={
                      <div className="flex items-center justify-between w-full pr-4">
                        <span className="font-medium">
                          {highlightText(item.question, debouncedQuery)}
                        </span>
                        {isAdmin && (
                          <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                            <Button
                              kind="ghost"
                              size="sm"
                              hasIconOnly
                              renderIcon={Edit}
                              iconDescription="Редактировать"
                              onClick={(e) => {
                                e.stopPropagation()
                                openItemModal(item)
                              }}
                            />
                            <Button
                              kind="danger--ghost"
                              size="sm"
                              hasIconOnly
                              renderIcon={TrashCan}
                              iconDescription="Удалить"
                              onClick={(e) => {
                                e.stopPropagation()
                                if (confirm('Удалить этот вопрос?')) {
                                  deleteItemMutation.mutate(item.id)
                                }
                              }}
                            />
                          </div>
                        )}
                      </div>
                    }
                  >
                    <div className="prose max-w-none">
                      {(() => {
                        const content = parseAnswerContent(item.answer)
                        if (typeof content === 'string') {
                          return (
                            <div
                              className="text-gray-700 whitespace-pre-wrap"
                              dangerouslySetInnerHTML={{
                                __html: debouncedQuery.length >= 2
                                  ? content.replace(
                                      new RegExp(`(${debouncedQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'),
                                      '<mark class="bg-yellow-200 px-0.5 rounded">$1</mark>'
                                    )
                                  : content,
                              }}
                            />
                          )
                        }
                        return <RichTextViewer content={content} />
                      })()}
                    </div>
                    <div className="mt-3 flex items-center gap-1 text-sm text-gray-400">
                      <View size={14} />
                      <span>{item.views_count} просмотров</span>
                    </div>
                  </AccordionItem>
                ))}
              </Accordion>
            </Tile>
          ))}
        </div>
      </Column>

      {/* Category Modal */}
      <Modal
        open={isCategoryModalOpen}
        onRequestClose={closeCategoryModal}
        modalHeading={editingCategory ? 'Редактировать категорию' : 'Новая категория'}
        primaryButtonText="Сохранить"
        secondaryButtonText="Отмена"
        onRequestSubmit={handleSaveCategory}
        primaryButtonDisabled={!categoryForm.name.trim() || createCategoryMutation.isPending || updateCategoryMutation.isPending}
      >
        <TextInput
          id="category-name"
          labelText="Название"
          value={categoryForm.name}
          onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
          className="mb-4"
        />
        <TextArea
          id="category-description"
          labelText="Описание (необязательно)"
          value={categoryForm.description}
          onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
          rows={3}
          className="mb-4"
        />
        <TextInput
          id="category-icon"
          labelText="Иконка (Carbon icon name, необязательно)"
          value={categoryForm.icon}
          onChange={(e) => setCategoryForm({ ...categoryForm, icon: e.target.value })}
          className="mb-4"
        />
      </Modal>

      {/* Item Modal */}
      <Modal
        open={isItemModalOpen}
        onRequestClose={closeItemModal}
        modalHeading={editingItem ? 'Редактировать вопрос' : 'Новый вопрос'}
        primaryButtonText="Сохранить"
        secondaryButtonText="Отмена"
        onRequestSubmit={handleSaveItem}
        primaryButtonDisabled={!itemForm.question.trim() || !itemForm.category || createItemMutation.isPending || updateItemMutation.isPending}
        size="lg"
      >
        {(createItemMutation.isError || updateItemMutation.isError) && (
          <InlineNotification
            kind="error"
            title="Ошибка"
            subtitle="Не удалось сохранить вопрос"
            hideCloseButton
            className="mb-4"
          />
        )}

        <Select
          id="item-category"
          labelText="Категория"
          value={itemForm.category || ''}
          onChange={(e) => setItemForm({ ...itemForm, category: Number(e.target.value) })}
          className="mb-4"
        >
          <SelectItem value="" text="Выберите категорию" />
          {allCategories?.map((cat) => (
            <SelectItem key={cat.id} value={cat.id} text={cat.name} />
          ))}
        </Select>

        <TextInput
          id="item-question"
          labelText="Вопрос"
          value={itemForm.question}
          onChange={(e) => setItemForm({ ...itemForm, question: e.target.value })}
          className="mb-4"
        />

        <div className="mb-4">
          <RichTextEditor
            label="Ответ"
            data={editorContent || undefined}
            onChange={(data) => setEditorContent(data)}
            placeholder="Введите ответ..."
          />
        </div>
      </Modal>
    </Grid>
  )
}
