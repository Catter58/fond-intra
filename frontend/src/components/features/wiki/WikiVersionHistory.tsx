import { useState } from 'react';
import {
  Modal,
  StructuredListWrapper,
  StructuredListHead,
  StructuredListRow,
  StructuredListCell,
  StructuredListBody,
  Button,
  InlineLoading,
} from '@carbon/react';
import { Undo, View } from '@carbon/icons-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { wikiPagesApi, WikiPageVersion } from '../../../api/endpoints/wiki';
import { Avatar } from '../../ui/Avatar';
import './WikiVersionHistory.scss';

interface WikiVersionHistoryProps {
  pageId: number;
  isOpen: boolean;
  onClose: () => void;
}

export const WikiVersionHistory = ({ pageId, isOpen, onClose }: WikiVersionHistoryProps) => {
  const queryClient = useQueryClient();
  const [selectedVersion, setSelectedVersion] = useState<WikiPageVersion | null>(null);

  const { data: versions, isLoading } = useQuery({
    queryKey: ['wiki-versions', pageId],
    queryFn: () => wikiPagesApi.getVersions(pageId),
    enabled: isOpen,
  });

  const restoreMutation = useMutation({
    mutationFn: (versionNumber: number) => wikiPagesApi.restoreVersion(pageId, versionNumber),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wiki-page', pageId] });
      queryClient.invalidateQueries({ queryKey: ['wiki-versions', pageId] });
      onClose();
    },
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <>
      <Modal
        open={isOpen}
        onRequestClose={onClose}
        modalHeading="История версий"
        primaryButtonText=""
        secondaryButtonText="Закрыть"
        size="lg"
        className="wiki-version-modal"
      >
        {isLoading ? (
          <InlineLoading description="Загрузка..." />
        ) : versions && versions.length > 0 ? (
          <StructuredListWrapper>
            <StructuredListHead>
              <StructuredListRow head>
                <StructuredListCell head>Версия</StructuredListCell>
                <StructuredListCell head>Автор</StructuredListCell>
                <StructuredListCell head>Дата</StructuredListCell>
                <StructuredListCell head>Описание</StructuredListCell>
                <StructuredListCell head>Действия</StructuredListCell>
              </StructuredListRow>
            </StructuredListHead>
            <StructuredListBody>
              {versions.map((version, index) => (
                <StructuredListRow key={version.id}>
                  <StructuredListCell>
                    <span className="wiki-version__number">v{version.version_number}</span>
                    {index === 0 && (
                      <span className="wiki-version__current">текущая</span>
                    )}
                  </StructuredListCell>
                  <StructuredListCell>
                    <div className="wiki-version__author">
                      <Avatar
                        src={version.author_avatar || undefined}
                        name={version.author_name}
                        size={24}
                      />
                      <span>{version.author_name}</span>
                    </div>
                  </StructuredListCell>
                  <StructuredListCell>
                    {formatDate(version.created_at)}
                  </StructuredListCell>
                  <StructuredListCell>
                    {version.change_summary || '-'}
                  </StructuredListCell>
                  <StructuredListCell>
                    <div className="wiki-version__actions">
                      <Button
                        kind="ghost"
                        size="sm"
                        renderIcon={View}
                        iconDescription="Просмотр"
                        hasIconOnly
                        onClick={() => setSelectedVersion(version)}
                      />
                      {index > 0 && (
                        <Button
                          kind="ghost"
                          size="sm"
                          renderIcon={Undo}
                          iconDescription="Восстановить"
                          hasIconOnly
                          disabled={restoreMutation.isPending}
                          onClick={() => restoreMutation.mutate(version.version_number)}
                        />
                      )}
                    </div>
                  </StructuredListCell>
                </StructuredListRow>
              ))}
            </StructuredListBody>
          </StructuredListWrapper>
        ) : (
          <p className="wiki-version__empty">Нет сохраненных версий</p>
        )}
      </Modal>

      {selectedVersion && (
        <Modal
          open={!!selectedVersion}
          onRequestClose={() => setSelectedVersion(null)}
          modalHeading={`Версия ${selectedVersion.version_number}: ${selectedVersion.title}`}
          primaryButtonText=""
          secondaryButtonText="Закрыть"
          size="lg"
        >
          <div className="wiki-version__preview">
            <pre>{JSON.stringify(selectedVersion.content, null, 2)}</pre>
          </div>
        </Modal>
      )}
    </>
  );
};
