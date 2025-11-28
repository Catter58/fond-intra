import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Grid,
  Column,
  Button,
  TextInput,
  TextArea,
  Toggle,
  Form,
  FormGroup,
  InlineLoading,
  InlineNotification,
} from '@carbon/react';
import { Save, Close } from '@carbon/icons-react';
import { wikiPagesApi } from '../../api/endpoints/wiki';
import { RichTextEditor } from '../../components/ui/EditorJS';
import { EmptyState } from '../../components/ui/EmptyState';
import { PageBreadcrumb, BreadcrumbItemData } from '../../components/ui/PageBreadcrumb';
import './WikiEditPage.scss';

export const WikiEditPage = () => {
  const { spaceSlug, pageSlug } = useParams<{ spaceSlug: string; pageSlug: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    title: '',
    excerpt: '',
    content: null as any,
    is_published: true,
    change_summary: '',
  });

  const { data: page, isLoading } = useQuery({
    queryKey: ['wiki-page-by-slug', spaceSlug, pageSlug],
    queryFn: () => wikiPagesApi.getBySlug(spaceSlug!, pageSlug!),
    enabled: !!spaceSlug && !!pageSlug,
  });

  useEffect(() => {
    if (page) {
      setFormData({
        title: page.title,
        excerpt: page.excerpt || '',
        content: page.content,
        is_published: page.is_published,
        change_summary: '',
      });
    }
  }, [page]);

  const updateMutation = useMutation({
    mutationFn: () => wikiPagesApi.update(page!.id, formData),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['wiki-page-by-slug', spaceSlug, pageSlug] });
      queryClient.invalidateQueries({ queryKey: ['wiki-space-pages'] });
      queryClient.invalidateQueries({ queryKey: ['wiki-tree'] });
      navigate(`/wiki/${spaceSlug}/${data.slug}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    updateMutation.mutate();
  };

  const handleCancel = () => {
    navigate(`/wiki/${spaceSlug}/${pageSlug}`);
  };

  // Build breadcrumb items from page hierarchy
  const breadcrumbItems = useMemo((): BreadcrumbItemData[] => {
    if (!page) return [];

    const items: BreadcrumbItemData[] = [
      { path: '/', label: 'Главная' },
      { path: '/wiki', label: 'База знаний' },
      { path: `/wiki/${page.space_slug}`, label: page.space_name },
    ];

    // Add page hierarchy
    page.breadcrumbs.forEach((crumb) => {
      items.push({
        path: `/wiki/${page.space_slug}/${crumb.slug}`,
        label: crumb.title,
      });
    });

    // Add edit action
    items.push({
      path: `/wiki/${page.space_slug}/${page.slug}/edit`,
      label: 'Редактирование',
    });

    return items;
  }, [page]);

  if (!spaceSlug || !pageSlug) {
    navigate('/wiki');
    return null;
  }

  if (isLoading) {
    return (
      <div className="wiki-edit-page">
        <InlineLoading description="Загрузка страницы..." />
      </div>
    );
  }

  if (!page) {
    return (
      <div className="wiki-edit-page">
        <EmptyState
          icon={Close}
          title="Страница не найдена"
          description="Запрошенная страница не существует или у вас нет доступа"
          size="lg"
          action={{
            label: "Вернуться к пространству",
            onClick: () => navigate(`/wiki/${spaceSlug}`)
          }}
        />
      </div>
    );
  }

  return (
    <div className="wiki-edit-page">
      <PageBreadcrumb items={breadcrumbItems} />

      <div className="page-header">
        <div className="page-header__content">
          <h1>Редактирование страницы</h1>
        </div>
        <div className="wiki-edit-page__actions">
          <Button kind="ghost" onClick={handleCancel}>
            Отмена
          </Button>
          <Button
            renderIcon={Save}
            onClick={handleSubmit}
            disabled={!formData.title.trim() || updateMutation.isPending}
          >
            Сохранить
          </Button>
        </div>
      </div>

      {updateMutation.isError && (
        <InlineNotification
          kind="error"
          title="Ошибка"
          subtitle="Не удалось сохранить страницу"
          lowContrast
          hideCloseButton
        />
      )}

      <Form onSubmit={handleSubmit} className="wiki-edit-page__form">
        <Grid>
          <Column lg={12} md={6} sm={4}>
            <FormGroup legendText="">
              <TextInput
                id="page-title"
                labelText="Заголовок"
                placeholder="Название страницы"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                size="lg"
              />
            </FormGroup>
          </Column>

          <Column lg={4} md={2} sm={4}>
            <FormGroup legendText="">
              <Toggle
                id="page-published"
                labelText="Статус"
                labelA="Черновик"
                labelB="Опубликовано"
                toggled={formData.is_published}
                onToggle={(checked) => setFormData({ ...formData, is_published: checked })}
              />
            </FormGroup>
          </Column>

          <Column lg={16} md={8} sm={4}>
            <FormGroup legendText="">
              <TextArea
                id="page-excerpt"
                labelText="Краткое описание"
                placeholder="Краткое описание для отображения в списках и результатах поиска"
                value={formData.excerpt}
                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                rows={2}
              />
            </FormGroup>
          </Column>

          <Column lg={16} md={8} sm={4}>
            <FormGroup legendText="Содержимое">
              <div className="wiki-edit-page__editor">
                <RichTextEditor
                  data={formData.content}
                  onChange={(content) => setFormData({ ...formData, content })}
                  placeholder="Начните писать..."
                />
              </div>
            </FormGroup>
          </Column>

          <Column lg={16} md={8} sm={4}>
            <FormGroup legendText="">
              <TextInput
                id="change-summary"
                labelText="Описание изменений (необязательно)"
                placeholder="Что было изменено?"
                value={formData.change_summary}
                onChange={(e) => setFormData({ ...formData, change_summary: e.target.value })}
              />
            </FormGroup>
          </Column>
        </Grid>
      </Form>
    </div>
  );
};
