import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Grid,
  Column,
  Search,
  Button,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  InlineLoading,
} from '@carbon/react';
import { Add, FolderOpen } from '@carbon/icons-react';
import { wikiSpacesApi, wikiPagesApi } from '../../api/endpoints/wiki';
import { WikiSpaceCard, WikiPageCard } from '../../components/features/wiki';
import { EmptyState } from '../../components/ui/EmptyState';
import { useAuthStore } from '../../store/authStore';
import { CreateSpaceModal } from './CreateSpaceModal';
import './WikiPage.scss';

export const WikiPage = () => {
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const { data: spaces, isLoading: spacesLoading } = useQuery({
    queryKey: ['wiki-spaces'],
    queryFn: () => wikiSpacesApi.getAll(),
  });

  const { data: recentPages, isLoading: recentLoading } = useQuery({
    queryKey: ['wiki-recent'],
    queryFn: () => wikiPagesApi.getRecent(),
  });

  const { data: popularPages, isLoading: popularLoading } = useQuery({
    queryKey: ['wiki-popular'],
    queryFn: () => wikiPagesApi.getPopular(),
  });

  const { data: searchResults, isLoading: searchLoading } = useQuery({
    queryKey: ['wiki-search', searchQuery],
    queryFn: () => wikiPagesApi.search(searchQuery),
    enabled: searchQuery.length >= 2,
  });

  const filteredSpaces = searchQuery
    ? spaces?.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : spaces;

  const isAdmin = user?.role?.is_admin || user?.is_superuser;

  return (
    <div className="wiki-page">
      <div className="page-header">
        <div className="page-header__content">
          <h1>База знаний</h1>
          <p className="page-header__description">
            Документация, инструкции и справочные материалы компании
          </p>
        </div>
        {isAdmin && (
          <Button
            renderIcon={Add}
            onClick={() => setIsCreateModalOpen(true)}
          >
            Создать пространство
          </Button>
        )}
      </div>

      <Grid className="wiki-page__grid">
        <Column lg={16} md={8} sm={4}>
          <Search
            labelText="Поиск"
            placeholder="Поиск по базе знаний..."
            size="lg"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="wiki-page__search"
          />
        </Column>

        {searchQuery.length >= 2 ? (
          <Column lg={16} md={8} sm={4}>
            <h2 className="wiki-page__section-title">Результаты поиска</h2>
            {searchLoading ? (
              <InlineLoading description="Поиск..." />
            ) : searchResults && searchResults.length > 0 ? (
              <div className="wiki-page__search-results">
                {searchResults.map(page => (
                  <WikiPageCard
                    key={page.id}
                    page={page}
                    spaceSlug={spaces?.find(s => s.id === page.space)?.slug || ''}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={FolderOpen}
                title="Ничего не найдено"
                description="Попробуйте изменить поисковый запрос"
                size="sm"
              />
            )}
          </Column>
        ) : (
          <>
            <Column lg={16} md={8} sm={4}>
              <h2 className="wiki-page__section-title">Пространства</h2>
              {spacesLoading ? (
                <InlineLoading description="Загрузка..." />
              ) : filteredSpaces && filteredSpaces.length > 0 ? (
                <div className="wiki-page__spaces">
                  {filteredSpaces.map(space => (
                    <WikiSpaceCard key={space.id} space={space} />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={FolderOpen}
                  title="Нет пространств"
                  description={isAdmin ? "Создайте первое пространство для хранения документов" : "Пространства еще не созданы"}
                  size="sm"
                  action={isAdmin ? {
                    label: "Создать пространство",
                    onClick: () => setIsCreateModalOpen(true)
                  } : undefined}
                />
              )}
            </Column>

            <Column lg={16} md={8} sm={4}>
              <Tabs>
                <TabList aria-label="Вкладки">
                  <Tab>Недавние</Tab>
                  <Tab>Популярные</Tab>
                </TabList>
                <TabPanels>
                  <TabPanel>
                    {recentLoading ? (
                      <InlineLoading description="Загрузка..." />
                    ) : recentPages && recentPages.length > 0 ? (
                      <div className="wiki-page__pages-list">
                        {recentPages.map(page => (
                          <WikiPageCard
                            key={page.id}
                            page={page}
                            spaceSlug={spaces?.find(s => s.id === page.space)?.slug || ''}
                          />
                        ))}
                      </div>
                    ) : (
                      <EmptyState
                        icon={FolderOpen}
                        title="Нет недавних страниц"
                        description="Страницы появятся здесь после их создания"
                        size="sm"
                      />
                    )}
                  </TabPanel>
                  <TabPanel>
                    {popularLoading ? (
                      <InlineLoading description="Загрузка..." />
                    ) : popularPages && popularPages.length > 0 ? (
                      <div className="wiki-page__pages-list">
                        {popularPages.map(page => (
                          <WikiPageCard
                            key={page.id}
                            page={page}
                            spaceSlug={spaces?.find(s => s.id === page.space)?.slug || ''}
                          />
                        ))}
                      </div>
                    ) : (
                      <EmptyState
                        icon={FolderOpen}
                        title="Нет популярных страниц"
                        description="Страницы появятся здесь по мере просмотров"
                        size="sm"
                      />
                    )}
                  </TabPanel>
                </TabPanels>
              </Tabs>
            </Column>
          </>
        )}
      </Grid>

      <CreateSpaceModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
};
