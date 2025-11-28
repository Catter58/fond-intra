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
  Modal,
} from '@carbon/react';
import { Save, TrashCan } from '@carbon/icons-react';
import { wikiSpacesApi } from '../../api/endpoints/wiki';
import { PageBreadcrumb, BreadcrumbItemData } from '../../components/ui/PageBreadcrumb';
import { EmptyState } from '../../components/ui/EmptyState';
import './WikiSpaceSettingsPage.scss';

export const WikiSpaceSettingsPage = () => {
  const { spaceSlug } = useParams<{ spaceSlug: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '',
    is_public: true,
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const { data: spaces } = useQuery({
    queryKey: ['wiki-spaces'],
    queryFn: () => wikiSpacesApi.getAll(),
  });

  const currentSpace = spaces?.find(s => s.slug === spaceSlug);

  const { data: space, isLoading } = useQuery({
    queryKey: ['wiki-space', currentSpace?.id],
    queryFn: () => wikiSpacesApi.getById(currentSpace!.id),
    enabled: !!currentSpace?.id,
  });

  useEffect(() => {
    if (space) {
      setFormData({
        name: space.name,
        description: space.description || '',
        icon: space.icon || '',
        is_public: space.is_public,
      });
    }
  }, [space]);

  const updateMutation = useMutation({
    mutationFn: () => wikiSpacesApi.update(space!.id, formData),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['wiki-spaces'] });
      queryClient.invalidateQueries({ queryKey: ['wiki-space', space!.id] });
      navigate(`/wiki/${data.slug}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => wikiSpacesApi.delete(space!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wiki-spaces'] });
      navigate('/wiki');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    updateMutation.mutate();
  };

  const breadcrumbItems = useMemo((): BreadcrumbItemData[] => {
    if (!space) return [];
    return [
      { path: '/', label: 'Главная' },
      { path: '/wiki', label: 'База знаний' },
      { path: `/wiki/${space.slug}`, label: space.name },
      { path: `/wiki/${space.slug}/settings`, label: 'Настройки' },
    ];
  }, [space]);

  if (!spaceSlug) {
    navigate('/wiki');
    return null;
  }

  if (isLoading) {
    return (
      <div className="wiki-space-settings">
        <InlineLoading description="Загрузка..." />
      </div>
    );
  }

  if (!space) {
    return (
      <div className="wiki-space-settings">
        <EmptyState
          icon={TrashCan}
          title="Пространство не найдено"
          description="Запрошенное пространство не существует"
          size="lg"
          action={{
            label: "Вернуться к базе знаний",
            onClick: () => navigate('/wiki')
          }}
        />
      </div>
    );
  }

  return (
    <div className="wiki-space-settings">
      <PageBreadcrumb items={breadcrumbItems} />

      <div className="page-header">
        <div className="page-header__content">
          <h1>Настройки пространства</h1>
          <p className="page-header__description">
            Управление пространством "{space.name}"
          </p>
        </div>
        <div className="wiki-space-settings__actions">
          <Button kind="ghost" onClick={() => navigate(`/wiki/${spaceSlug}`)}>
            Отмена
          </Button>
          <Button
            renderIcon={Save}
            onClick={handleSubmit}
            disabled={!formData.name.trim() || updateMutation.isPending}
          >
            Сохранить
          </Button>
        </div>
      </div>

      {updateMutation.isError && (
        <InlineNotification
          kind="error"
          title="Ошибка"
          subtitle="Не удалось сохранить настройки"
          lowContrast
          hideCloseButton
        />
      )}

      <Form onSubmit={handleSubmit} className="wiki-space-settings__form">
        <Grid>
          <Column lg={12} md={6} sm={4}>
            <FormGroup legendText="">
              <TextInput
                id="space-name"
                labelText="Название пространства"
                placeholder="Название"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </FormGroup>
          </Column>

          <Column lg={4} md={2} sm={4}>
            <FormGroup legendText="">
              <TextInput
                id="space-icon"
                labelText="Иконка (эмодзи)"
                placeholder="📚"
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                maxLength={4}
              />
            </FormGroup>
          </Column>

          <Column lg={16} md={8} sm={4}>
            <FormGroup legendText="">
              <TextArea
                id="space-description"
                labelText="Описание"
                placeholder="Краткое описание пространства"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </FormGroup>
          </Column>

          <Column lg={16} md={8} sm={4}>
            <FormGroup legendText="">
              <Toggle
                id="space-public"
                labelText="Доступ"
                labelA="Приватное"
                labelB="Публичное"
                toggled={formData.is_public}
                onToggle={(checked) => setFormData({ ...formData, is_public: checked })}
              />
            </FormGroup>
          </Column>
        </Grid>
      </Form>

      <div className="wiki-space-settings__danger-zone">
        <h3>Опасная зона</h3>
        <p>Удаление пространства приведет к удалению всех страниц в нем. Это действие необратимо.</p>
        <Button
          kind="danger"
          renderIcon={TrashCan}
          onClick={() => setShowDeleteModal(true)}
        >
          Удалить пространство
        </Button>
      </div>

      <Modal
        open={showDeleteModal}
        onRequestClose={() => setShowDeleteModal(false)}
        modalHeading="Удалить пространство?"
        primaryButtonText="Удалить"
        secondaryButtonText="Отмена"
        danger
        onRequestSubmit={() => deleteMutation.mutate()}
      >
        <p>
          Вы уверены, что хотите удалить пространство "{space.name}"?
        </p>
        <p>
          <strong>Все страницы ({space.pages_count}) будут безвозвратно удалены.</strong>
        </p>
      </Modal>
    </div>
  );
};
