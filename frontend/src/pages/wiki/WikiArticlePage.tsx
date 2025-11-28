import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Button,
  Tag,
  InlineLoading,
  OverflowMenu,
  OverflowMenuItem,
  Modal,
} from '@carbon/react';
import {
  Edit,
  Time,
  View,
  RecentlyViewed,
  Add,
  Document,
} from '@carbon/icons-react';
import { wikiPagesApi, wikiSpacesApi } from '../../api/endpoints/wiki';
import { WikiSidebar, WikiPageCard, WikiVersionHistory } from '../../components/features/wiki';
import { Avatar } from '../../components/ui/Avatar';
import RichTextViewer from '../../components/ui/EditorJSViewer';
import { EmptyState } from '../../components/ui/EmptyState';
import { PageBreadcrumb, BreadcrumbItemData } from '../../components/ui/PageBreadcrumb';
import { useAuthStore } from '../../store/authStore';
import { CreatePageModal } from './CreatePageModal';
import './WikiArticlePage.scss';

export const WikiArticlePage = () => {
  const { spaceSlug, pageSlug } = useParams<{ spaceSlug: string; pageSlug: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [showSidebar] = useState(true);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const { data: spaces } = useQuery({
    queryKey: ['wiki-spaces'],
    queryFn: () => wikiSpacesApi.getAll(),
  });

  const currentSpace = spaces?.find(s => s.slug === spaceSlug);

  const { data: page, isLoading, error } = useQuery({
    queryKey: ['wiki-page-by-slug', spaceSlug, pageSlug],
    queryFn: () => wikiPagesApi.getBySlug(spaceSlug!, pageSlug!),
    enabled: !!spaceSlug && !!pageSlug,
  });

  const deleteMutation = useMutation({
    mutationFn: () => wikiPagesApi.delete(page!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wiki-space-pages'] });
      queryClient.invalidateQueries({ queryKey: ['wiki-tree'] });
      navigate(`/wiki/${spaceSlug}`);
    },
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isAuthor = page?.author === user?.id;
  const isOwner = currentSpace && spaces?.find(s => s.id === currentSpace.id)?.owner === user?.id;
  const isAdmin = user?.role?.is_admin || user?.is_superuser;
  const canEdit = isAuthor || isOwner || isAdmin;

  // Build breadcrumb items from page hierarchy
  const breadcrumbItems = useMemo((): BreadcrumbItemData[] => {
    if (!page) return [];

    const items: BreadcrumbItemData[] = [
      { path: '/', label: 'Главная' },
      { path: '/wiki', label: 'База знаний' },
      { path: `/wiki/${page.space_slug}`, label: page.space_name },
    ];

    // Add page hierarchy from breadcrumbs
    page.breadcrumbs.forEach((crumb) => {
      items.push({
        path: `/wiki/${page.space_slug}/${crumb.slug}`,
        label: crumb.title,
      });
    });

    return items;
  }, [page]);

  if (!spaceSlug || !pageSlug) {
    navigate('/wiki');
    return null;
  }

  return (
    <div className={`wiki-article-page ${showSidebar ? 'wiki-article-page--with-sidebar' : ''}`}>
      <main className="wiki-article-page__main">
        {isLoading ? (
          <InlineLoading description="Загрузка страницы..." />
        ) : error || !page ? (
          <EmptyState
            icon={Document}
            title="Страница не найдена"
            description="Запрошенная страница не существует или у вас нет доступа"
            size="lg"
            action={{
              label: "Вернуться к пространству",
              onClick: () => navigate(`/wiki/${spaceSlug}`)
            }}
          />
        ) : (
          <>
            <PageBreadcrumb items={breadcrumbItems} />

            <article className="wiki-article">
              <header className="wiki-article__header">
                <div className="wiki-article__header-content">
                  <h1 className="wiki-article__title">{page.title}</h1>
                  <div className="wiki-article__meta">
                    <div className="wiki-article__author">
                      <Avatar
                        src={page.author_avatar || undefined}
                        name={page.author_name}
                        size={24}
                      />
                      <span>{page.author_name}</span>
                    </div>
                    <span className="wiki-article__date">
                      <Time size={14} />
                      {formatDate(page.updated_at)}
                    </span>
                    <span className="wiki-article__views">
                      <View size={14} />
                      {page.view_count} просмотров
                    </span>
                    {page.versions_count > 0 && (
                      <button
                        className="wiki-article__versions"
                        onClick={() => setShowVersionHistory(true)}
                      >
                        <RecentlyViewed size={14} />
                        {page.versions_count} версий
                      </button>
                    )}
                  </div>
                  {page.tags.length > 0 && (
                    <div className="wiki-article__tags">
                      {page.tags.map(tag => (
                        <Tag
                          key={tag.id}
                          type="cool-gray"
                          size="sm"
                          style={{ backgroundColor: tag.color || undefined }}
                        >
                          {tag.name}
                        </Tag>
                      ))}
                    </div>
                  )}
                </div>
                <div className="wiki-article__actions">
                  {canEdit && (
                    <>
                      <Button
                        kind="ghost"
                        size="sm"
                        renderIcon={Edit}
                        onClick={() => navigate(`/wiki/${spaceSlug}/${pageSlug}/edit`)}
                      >
                        Редактировать
                      </Button>
                      <Button
                        kind="ghost"
                        size="sm"
                        renderIcon={Add}
                        onClick={() => setIsCreateModalOpen(true)}
                      >
                        Подстраница
                      </Button>
                      <OverflowMenu flipped ariaLabel="Действия">
                        <OverflowMenuItem
                          itemText="История версий"
                          onClick={() => setShowVersionHistory(true)}
                        />
                        <OverflowMenuItem
                          itemText="Удалить страницу"
                          isDelete
                          onClick={() => setShowDeleteModal(true)}
                        />
                      </OverflowMenu>
                    </>
                  )}
                </div>
              </header>

              <div className="wiki-article__content">
                {page.content ? (
                  <RichTextViewer content={page.content} />
                ) : (
                  <p className="wiki-article__empty">Содержимое отсутствует</p>
                )}
              </div>

              {page.children && page.children.length > 0 && (
                <div className="wiki-article__children">
                  <h3>Подстраницы</h3>
                  <div className="wiki-article__children-list">
                    {page.children.map(child => (
                      <WikiPageCard key={child.id} page={child} spaceSlug={spaceSlug} />
                    ))}
                  </div>
                </div>
              )}

              {page.attachments && page.attachments.length > 0 && (
                <div className="wiki-article__attachments">
                  <h3>Вложения</h3>
                  <ul className="wiki-article__attachments-list">
                    {page.attachments.map(att => (
                      <li key={att.id}>
                        <a href={att.file} target="_blank" rel="noopener noreferrer">
                          {att.filename}
                        </a>
                        <span className="wiki-article__attachment-size">
                          {(att.size / 1024).toFixed(1)} KB
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </article>

            <WikiVersionHistory
              pageId={page.id}
              isOpen={showVersionHistory}
              onClose={() => setShowVersionHistory(false)}
            />

            <Modal
              open={showDeleteModal}
              onRequestClose={() => setShowDeleteModal(false)}
              modalHeading="Удалить страницу?"
              primaryButtonText="Удалить"
              secondaryButtonText="Отмена"
              danger
              onRequestSubmit={() => deleteMutation.mutate()}
            >
              <p>Вы уверены, что хотите удалить страницу "{page.title}"?</p>
              {page.children && page.children.length > 0 && (
                <p className="wiki-article__delete-warning">
                  Внимание: у этой страницы есть {page.children.length} подстраниц, которые также будут удалены.
                </p>
              )}
            </Modal>
          </>
        )}
      </main>

      {showSidebar && (
        <aside className="wiki-article-page__sidebar">
          <WikiSidebar onCreatePage={() => setIsCreateModalOpen(true)} />
        </aside>
      )}

      {currentSpace && page && (
        <CreatePageModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          spaceId={currentSpace.id}
          spaceSlug={spaceSlug}
          parentId={page.id}
        />
      )}
    </div>
  );
};
