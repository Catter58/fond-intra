import { ClickableTile } from '@carbon/react';
import { FolderOpen, Locked, Document } from '@carbon/icons-react';
import { WikiSpaceListItem } from '../../../api/endpoints/wiki';
import './WikiSpaceCard.scss';

interface WikiSpaceCardProps {
  space: WikiSpaceListItem;
}

export const WikiSpaceCard = ({ space }: WikiSpaceCardProps) => {
  return (
    <ClickableTile
      className="wiki-space-card"
      href={`/wiki/${space.slug}`}
      light
    >
      <div className="wiki-space-card__header">
        <span className="wiki-space-card__icon">
          {space.icon || <FolderOpen size={32} />}
        </span>
        {!space.is_public && (
          <span className="wiki-space-card__private">
            <Locked size={16} />
          </span>
        )}
      </div>
      <h3 className="wiki-space-card__title">{space.name}</h3>
      {space.description && (
        <p className="wiki-space-card__description">{space.description}</p>
      )}
      <div className="wiki-space-card__meta">
        <span className="wiki-space-card__pages">
          <Document size={14} />
          {space.pages_count} страниц
        </span>
        {space.department_name && (
          <span className="wiki-space-card__department">
            {space.department_name}
          </span>
        )}
      </div>
    </ClickableTile>
  );
};
