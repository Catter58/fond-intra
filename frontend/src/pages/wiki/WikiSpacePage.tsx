import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Grid,
  Column,
  Button,
  Search,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  InlineLoading,
  OverflowMenu,
  OverflowMenuItem,
} from '@carbon/react';
import { Add, Document, TreeViewAlt } from '@carbon/icons-react';
import { wikiSpacesApi } from '../../api/endpoints/wiki';
import { WikiSidebar, WikiPageCard } from '../../components/features/wiki';
import { EmptyState } from '../../components/ui/EmptyState';
import { PageBreadcrumb, BreadcrumbItemData } from '../../components/ui/PageBreadcrumb';
import { useAuthStore } from '../../store/authStore';
import { CreatePageModal } from './CreatePageModal';
import './WikiSpacePage.scss';

export const WikiSpacePage = () => {
  const { spaceSlug } = useParams<{ spaceSlug: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);

  const { data: spaces } = useQuery({
    queryKey: ['wiki-spaces'],
    queryFn: () => wikiSpacesApi.getAll(),
  });

  const currentSpace = spaces?.find(s => s.slug === spaceSlug);

  const { data: space, isLoading: spaceLoading } = useQuery({
    queryKey: ['wiki-space', currentSpace?.id],
    queryFn: () => wikiSpacesApi.getById(currentSpace!.id),
    enabled: !!currentSpace?.id,
  });

  const { data: pages, isLoading: pagesLoading } = useQuery({
    queryKey: ['wiki-space-pages', currentSpace?.id, searchQuery],
    queryFn: () => wikiSpacesApi.getPages(currentSpace!.id, { search: searchQuery }),
    enabled: !!currentSpace?.id,
  });

  const isOwner = space?.owner === user?.id;
  const isAdmin = user?.role?.is_admin || user?.is_superuser;
  const canManage = isOwner || isAdmin;

  // Build breadcrumb items
  const breadcrumbItems = useMemo((): BreadcrumbItemData[] => {
    if (!space) return [];

    return [
      { path: '/', label: 'Главная' },
      { path: '/wiki', label: 'База знаний' },
      { path: `/wiki/${space.slug}`, label: space.name },
    ];
  }, [space]);

  if (!spaceSlug) {
    navigate('/wiki');
    return null;
  }

  return (
    <div className={`wiki-space-page ${showSidebar ? 'wiki-space-page--with-sidebar' : ''}`}>
      <main className="wiki-space-page__main">
        <PageBreadcrumb items={breadcrumbItems} />

        {spaceLoading ? (
          <InlineLoading description="Загрузка пространства..." />
        ) : space ? (
          <>
            <div className="page-header">
              <div className="page-header__content">
                <div className="wiki-space-page__title">
                  <span className="wiki-space-page__icon">{space.icon || '📁'}</span>
                  <h1>{space.name}</h1>
                </div>
                {space.description && (
                  <p className="page-header__description">{space.description}</p>
                )}
              </div>
              <div className="wiki-space-page__actions">
                <Button
                  kind="ghost"
                  size="sm"
                  renderIcon={TreeViewAlt}
                  hasIconOnly
                  iconDescription="Боковая панель"
                  onClick={() => setShowSidebar(!showSidebar)}
                />
                <Button
                  renderIcon={Add}
                  onClick={() => setIsCreateModalOpen(true)}
                >
                  Новая страница
                </Button>
                {canManage && (
                  <OverflowMenu flipped ariaLabel="Действия">
                    <OverflowMenuItem
                      itemText="Настройки пространства"
                      onClick={() => navigate(`/wiki/${spaceSlug}/settings`)}
                    />
                  </OverflowMenu>
                )}
              </div>
            </div>

            <Grid className="wiki-space-page__grid">
              <Column lg={16} md={8} sm={4}>
                <Search
                  labelText="Поиск"
                  placeholder="Поиск страниц в пространстве..."
                  size="md"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="wiki-space-page__search"
                />
              </Column>

              <Column lg={16} md={8} sm={4}>
                <Tabs>
                  <TabList aria-label="Вкладки">
                    <Tab>Все страницы ({pages?.length || 0})</Tab>
                    <Tab>Корневые страницы ({space.root_pages?.length || 0})</Tab>
                  </TabList>
                  <TabPanels>
                    <TabPanel>
                      {pagesLoading ? (
                        <InlineLoading description="Загрузка страниц..." />
                      ) : pages && pages.length > 0 ? (
                        <div className="wiki-space-page__pages">
                          {pages.map(page => (
                            <WikiPageCard key={page.id} page={page} spaceSlug={spaceSlug} />
                          ))}
                        </div>
                      ) : (
                        <EmptyState
                          icon={Document}
                          title="Нет страниц"
                          description="Создайте первую страницу в этом пространстве"
                          size="sm"
                          action={{
                            label: "Создать страницу",
                            onClick: () => setIsCreateModalOpen(true)
                          }}
                        />
                      )}
                    </TabPanel>
                    <TabPanel>
                      {space.root_pages && space.root_pages.length > 0 ? (
                        <div className="wiki-space-page__pages">
                          {space.root_pages.map(page => (
                            <WikiPageCard key={page.id} page={page} spaceSlug={spaceSlug} />
                          ))}
                        </div>
                      ) : (
                        <EmptyState
                          icon={Document}
                          title="Нет корневых страниц"
                          description="Создайте первую страницу"
                          size="sm"
                          action={{
                            label: "Создать страницу",
                            onClick: () => setIsCreateModalOpen(true)
                          }}
                        />
                      )}
                    </TabPanel>
                  </TabPanels>
                </Tabs>
              </Column>
            </Grid>
          </>
        ) : (
          <EmptyState
            icon={Document}
            title="Пространство не найдено"
            description="Запрошенное пространство не существует или у вас нет доступа"
            size="lg"
            action={{
              label: "Вернуться к базе знаний",
              onClick: () => navigate('/wiki')
            }}
          />
        )}
      </main>

      {showSidebar && (
        <aside className="wiki-space-page__sidebar">
          <WikiSidebar onCreatePage={() => setIsCreateModalOpen(true)} />
        </aside>
      )}

      {currentSpace && (
        <CreatePageModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          spaceId={currentSpace.id}
          spaceSlug={spaceSlug}
        />
      )}
    </div>
  );
};
