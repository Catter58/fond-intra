import { Tag, ClickableTile } from '@carbon/react';
import { Document, View, Time } from '@carbon/icons-react';
import { WikiPageListItem } from '../../../api/endpoints/wiki';
import './WikiPageCard.scss';

interface WikiPageCardProps {
  page: WikiPageListItem;
  spaceSlug: string;
}

export const WikiPageCard = ({ page, spaceSlug }: WikiPageCardProps) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <ClickableTile
      className="wiki-page-card"
      href={`/wiki/${spaceSlug}/${page.slug}`}
      light
    >
      <div className="wiki-page-card__icon">
        <Document size={24} />
      </div>
      <div className="wiki-page-card__content">
        <h3 className="wiki-page-card__title">{page.title}</h3>
        {page.excerpt && (
          <p className="wiki-page-card__excerpt">{page.excerpt}</p>
        )}
        <div className="wiki-page-card__meta">
          <span className="wiki-page-card__author">{page.author_name}</span>
          <span className="wiki-page-card__date">
            <Time size={14} />
            {formatDate(page.updated_at)}
          </span>
          <span className="wiki-page-card__views">
            <View size={14} />
            {page.view_count}
          </span>
        </div>
        {page.tags.length > 0 && (
          <div className="wiki-page-card__tags">
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
      {page.children_count > 0 && (
        <div className="wiki-page-card__children">
          {page.children_count} подстраниц
        </div>
      )}
    </ClickableTile>
  );
};
