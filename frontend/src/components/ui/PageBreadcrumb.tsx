import { useLocation, Link } from 'react-router-dom'
import { Breadcrumb, BreadcrumbItem } from '@carbon/react'

// Route configuration for breadcrumbs
const routeConfig: Record<string, { label: string; parent?: string }> = {
  '/': { label: 'Главная' },
  '/employees': { label: 'Сотрудники', parent: '/' },
  '/employees/:id': { label: 'Профиль', parent: '/employees' },
  '/achievements': { label: 'Достижения', parent: '/' },
  '/news': { label: 'Новости', parent: '/' },
  '/news/create': { label: 'Создать новость', parent: '/news' },
  '/news/drafts': { label: 'Черновики', parent: '/news' },
  '/news/:id': { label: 'Новость', parent: '/news' },
  '/news/:id/edit': { label: 'Редактировать', parent: '/news/:id' },
  '/organization': { label: 'Структура', parent: '/' },
  '/kudos': { label: 'Благодарности', parent: '/' },
  '/surveys': { label: 'Опросы', parent: '/' },
  '/surveys/create': { label: 'Создать опрос', parent: '/surveys' },
  '/surveys/:id': { label: 'Опрос', parent: '/surveys' },
  '/surveys/:id/edit': { label: 'Редактировать', parent: '/surveys/:id' },
  '/surveys/:id/results': { label: 'Результаты', parent: '/surveys/:id' },
  '/ideas': { label: 'Банк идей', parent: '/' },
  '/ideas/:id': { label: 'Идея', parent: '/ideas' },
  '/faq': { label: 'FAQ', parent: '/' },
  '/classifieds': { label: 'Объявления', parent: '/' },
  '/classifieds/create': { label: 'Создать объявление', parent: '/classifieds' },
  '/classifieds/:id': { label: 'Объявление', parent: '/classifieds' },
  '/okr': { label: 'OKR', parent: '/' },
  '/okr/:id': { label: 'Цель', parent: '/okr' },
  '/bookings': { label: 'Бронирование', parent: '/' },
  '/bookings/resources/:id': { label: 'Ресурс', parent: '/bookings' },
  '/profile': { label: 'Мой профиль', parent: '/' },
  '/profile/edit': { label: 'Редактировать', parent: '/profile' },
  '/profile/skills': { label: 'Навыки', parent: '/profile' },
  '/profile/change-password': { label: 'Сменить пароль', parent: '/profile' },
  '/security': { label: 'Безопасность', parent: '/' },
  '/notifications': { label: 'Уведомления', parent: '/' },
  '/notifications/settings': { label: 'Настройки', parent: '/notifications' },
  '/admin': { label: 'Администрирование', parent: '/' },
  '/admin/users': { label: 'Пользователи', parent: '/admin' },
  '/admin/users/:id': { label: 'Пользователь', parent: '/admin/users' },
  '/admin/departments': { label: 'Отделы', parent: '/admin' },
  '/admin/roles': { label: 'Роли', parent: '/admin' },
  '/admin/achievements': { label: 'Типы достижений', parent: '/admin' },
  '/admin/skills': { label: 'Навыки', parent: '/admin' },
  '/admin/audit': { label: 'Аудит', parent: '/admin' },
  '/admin/faq': { label: 'FAQ', parent: '/admin' },
}

// Match current path to route pattern
function matchRoute(pathname: string): { pattern: string; params: Record<string, string> } | null {
  // Try exact match first
  if (routeConfig[pathname]) {
    return { pattern: pathname, params: {} }
  }

  // Try pattern matching
  const pathParts = pathname.split('/').filter(Boolean)

  for (const pattern of Object.keys(routeConfig)) {
    const patternParts = pattern.split('/').filter(Boolean)

    if (patternParts.length !== pathParts.length) continue

    const params: Record<string, string> = {}
    let matches = true

    for (let i = 0; i < patternParts.length; i++) {
      if (patternParts[i].startsWith(':')) {
        params[patternParts[i].slice(1)] = pathParts[i]
      } else if (patternParts[i] !== pathParts[i]) {
        matches = false
        break
      }
    }

    if (matches) {
      return { pattern, params }
    }
  }

  return null
}

// Route config type
interface RouteConfig {
  label: string
  parent?: string
}

// Build breadcrumb trail
function buildBreadcrumbs(pathname: string): Array<{ path: string; label: string }> {
  const breadcrumbs: Array<{ path: string; label: string }> = []
  const match = matchRoute(pathname)

  if (!match) return breadcrumbs

  let currentPattern: string | undefined = match.pattern
  const params = match.params

  while (currentPattern) {
    const config: RouteConfig | undefined = routeConfig[currentPattern]
    if (!config) break

    // Replace params in pattern to get actual path
    let actualPath = currentPattern
    for (const [key, value] of Object.entries(params)) {
      actualPath = actualPath.replace(`:${key}`, value)
    }

    breadcrumbs.unshift({ path: actualPath, label: config.label })
    currentPattern = config.parent
  }

  return breadcrumbs
}

interface PageBreadcrumbProps {
  className?: string
  customLabel?: string // Override the label for the current page
}

export function PageBreadcrumb({ className, customLabel }: PageBreadcrumbProps) {
  const location = useLocation()
  const breadcrumbs = buildBreadcrumbs(location.pathname)

  // Don't show breadcrumb on home page or if only one item
  if (breadcrumbs.length <= 1) {
    return null
  }

  // Override last item's label if customLabel provided
  if (customLabel && breadcrumbs.length > 0) {
    breadcrumbs[breadcrumbs.length - 1].label = customLabel
  }

  return (
    <Breadcrumb className={className} noTrailingSlash>
      {breadcrumbs.map((crumb, index) => (
        <BreadcrumbItem
          key={crumb.path}
          isCurrentPage={index === breadcrumbs.length - 1}
        >
          {index === breadcrumbs.length - 1 ? (
            crumb.label
          ) : (
            <Link to={crumb.path}>{crumb.label}</Link>
          )}
        </BreadcrumbItem>
      ))}
    </Breadcrumb>
  )
}
