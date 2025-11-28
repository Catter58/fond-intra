import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  TreeView,
  TreeNode,
  Search,
  Button,
  InlineLoading,
} from '@carbon/react';
import { Add, Document, FolderOpen } from '@carbon/icons-react';
import { useQuery } from '@tanstack/react-query';
import { wikiSpacesApi, WikiPageTree, WikiSpaceListItem } from '../../../api/endpoints/wiki';
import './WikiSidebar.scss';

interface WikiSidebarProps {
  onCreatePage?: () => void;
}

export const WikiSidebar = ({ onCreatePage }: WikiSidebarProps) => {
  const navigate = useNavigate();
  const { spaceSlug, pageSlug } = useParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedIds, setExpandedIds] = useState<string[]>([]);

  const { data: spaces, isLoading: spacesLoading } = useQuery({
    queryKey: ['wiki-spaces'],
    queryFn: () => wikiSpacesApi.getAll(),
  });

  const currentSpace = spaces?.find(s => s.slug === spaceSlug);

  const { data: pageTree, isLoading: treeLoading } = useQuery({
    queryKey: ['wiki-tree', currentSpace?.id],
    queryFn: () => wikiSpacesApi.getTree(currentSpace!.id),
    enabled: !!currentSpace?.id,
  });

  useEffect(() => {
    if (pageTree && pageSlug) {
      const findExpandedPaths = (nodes: WikiPageTree[], path: string[] = []): string[] => {
        const result: string[] = [];
        for (const node of nodes) {
          const nodePath = [...path, `page-${node.id}`];
          if (node.slug === pageSlug) {
            result.push(...path);
          }
          if (node.children?.length > 0) {
            result.push(...findExpandedPaths(node.children, nodePath));
          }
        }
        return result;
      };
      setExpandedIds(findExpandedPaths(pageTree));
    }
  }, [pageTree, pageSlug]);

  const handleSpaceSelect = (space: WikiSpaceListItem) => {
    navigate(`/wiki/${space.slug}`);
  };

  const handlePageSelect = (spaceSlug: string, pageSlug: string) => {
    navigate(`/wiki/${spaceSlug}/${pageSlug}`);
  };

  const renderPageTree = (nodes: WikiPageTree[], spaceSlug: string): React.ReactNode[] => {
    return nodes.map(node => (
      <TreeNode
        key={`page-${node.id}`}
        id={`page-${node.id}`}
        label={
          <span className="wiki-tree-label">
            <Document size={16} />
            <span>{node.title}</span>
          </span>
        }
        isExpanded={expandedIds.includes(`page-${node.id}`)}
        onSelect={() => handlePageSelect(spaceSlug, node.slug)}
      >
        {node.children?.length > 0 && renderPageTree(node.children, spaceSlug)}
      </TreeNode>
    ));
  };

  const filteredSpaces = spaces?.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="wiki-sidebar">
      <div className="wiki-sidebar__header">
        <Search
          labelText="Поиск"
          placeholder="Поиск в базе знаний..."
          size="sm"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="wiki-sidebar__actions">
        {onCreatePage && currentSpace && (
          <Button
            kind="ghost"
            size="sm"
            renderIcon={Add}
            onClick={onCreatePage}
          >
            Новая страница
          </Button>
        )}
      </div>

      <div className="wiki-sidebar__content">
        {spacesLoading ? (
          <InlineLoading description="Загрузка..." />
        ) : (
          <div className="wiki-sidebar__spaces">
            <h4 className="wiki-sidebar__section-title">Пространства</h4>
            {filteredSpaces?.map(space => (
              <div
                key={space.id}
                className={`wiki-sidebar__space ${space.slug === spaceSlug ? 'wiki-sidebar__space--active' : ''}`}
                onClick={() => handleSpaceSelect(space)}
              >
                <span className="wiki-sidebar__space-icon">
                  {space.icon || <FolderOpen size={16} />}
                </span>
                <span className="wiki-sidebar__space-name">{space.name}</span>
                <span className="wiki-sidebar__space-count">{space.pages_count}</span>
              </div>
            ))}
          </div>
        )}

        {currentSpace && (
          <div className="wiki-sidebar__pages">
            <h4 className="wiki-sidebar__section-title">Страницы</h4>
            {treeLoading ? (
              <InlineLoading description="Загрузка страниц..." />
            ) : pageTree && pageTree.length > 0 ? (
              <TreeView
                label="Структура"
                hideLabel
                selected={pageSlug ? [`page-${pageSlug}`] : []}
                onSelect={(_e, { id }) => {
                  const pageId = id?.replace('page-', '');
                  if (pageId && pageTree) {
                    const findPage = (nodes: WikiPageTree[]): WikiPageTree | null => {
                      for (const node of nodes) {
                        if (String(node.id) === pageId) return node;
                        if (node.children?.length > 0) {
                          const found = findPage(node.children);
                          if (found) return found;
                        }
                      }
                      return null;
                    };
                    const page = findPage(pageTree);
                    if (page) handlePageSelect(currentSpace.slug, page.slug);
                  }
                }}
              >
                {renderPageTree(pageTree, currentSpace.slug)}
              </TreeView>
            ) : (
              <p className="wiki-sidebar__empty">Нет страниц</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
