import { Link } from 'react-router-dom';
import { Breadcrumb, BreadcrumbItem } from '@carbon/react';
import { WikiPageDetail } from '../../../api/endpoints/wiki';
import './WikiBreadcrumb.scss';

interface WikiBreadcrumbProps {
  page: WikiPageDetail;
}

export const WikiBreadcrumb = ({ page }: WikiBreadcrumbProps) => {
  return (
    <Breadcrumb className="wiki-breadcrumb">
      <BreadcrumbItem>
        <Link to="/wiki">База знаний</Link>
      </BreadcrumbItem>
      <BreadcrumbItem>
        <Link to={`/wiki/${page.space_slug}`}>{page.space_name}</Link>
      </BreadcrumbItem>
      {page.breadcrumbs.map((crumb, index) => (
        <BreadcrumbItem key={crumb.id}>
          {index === page.breadcrumbs.length - 1 ? (
            <span>{crumb.title}</span>
          ) : (
            <Link to={`/wiki/${page.space_slug}/${crumb.slug}`}>{crumb.title}</Link>
          )}
        </BreadcrumbItem>
      ))}
    </Breadcrumb>
  );
};
