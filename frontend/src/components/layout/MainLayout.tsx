import { useState, useEffect } from 'react'
import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Header,
  HeaderName,
  HeaderGlobalBar,
  HeaderGlobalAction,
  SkipToContent,
  SideNav,
  SideNavItems,
  SideNavLink,
  SideNavMenu,
  SideNavMenuItem,
  Search,
} from '@carbon/react'
import {
  Home,
  User,
  UserMultiple,
  Trophy,
  Document,
  Building,
  Settings,
  Notification,
  Logout,
  Password,
  Menu,
  Close,
  Search as SearchIcon,
  Favorite,
  Task,
  Idea,
  Help,
  Tag,
  Crossroads,
  Calendar,
  Security,
} from '@carbon/icons-react'
import { useAuthStore } from '@/store/authStore'
import { searchApi, type SearchResult } from '@/api/endpoints/search'
import { notificationsApi } from '@/api/endpoints/notifications'

// Carbon lg breakpoint
const MOBILE_BREAKPOINT = 1056

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < MOBILE_BREAKPOINT)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return isMobile
}

export function MainLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuthStore()
  const isMobile = useIsMobile()
  const [sideNavOpen, setSideNavOpen] = useState(!isMobile)
  const [showMobileSearch, setShowMobileSearch] = useState(false)
  const [showUserPanel, setShowUserPanel] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearchResults, setShowSearchResults] = useState(false)

  const isAdmin = user?.role?.is_admin || user?.is_superuser

  // Close sidebar on route change (mobile)
  useEffect(() => {
    if (isMobile) {
      setSideNavOpen(false)
      setShowMobileSearch(false)
    }
  }, [location.pathname, isMobile])

  // Update sidebar state when switching between mobile/desktop
  useEffect(() => {
    setSideNavOpen(!isMobile)
  }, [isMobile])

  const { data: searchData } = useQuery({
    queryKey: ['global-search', searchQuery],
    queryFn: () => searchApi.globalSearch(searchQuery, undefined, 5),
    enabled: searchQuery.length >= 2,
  })

  // Flatten search results for display
  const searchResults: SearchResult[] = searchData
    ? [
        ...(searchData.results.users || []),
        ...(searchData.results.news || []),
        ...(searchData.results.departments || []),
        ...(searchData.results.achievements || []),
        ...(searchData.results.skills || []),
      ]
    : []

  const { data: unreadCount } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: notificationsApi.getUnreadCount,
    refetchInterval: 30000,
  })

  const handleSelectResult = (result: SearchResult) => {
    setShowSearchResults(false)
    setSearchQuery('')
    setShowMobileSearch(false)
    navigate(result.url)
  }

  const getResultIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'user': return <UserMultiple size={16} />
      case 'news': return <Document size={16} />
      case 'department': return <Building size={16} />
      case 'achievement': return <Trophy size={16} />
      case 'skill': return <Settings size={16} />
      default: return null
    }
  }

  const getResultTypeLabel = (type: SearchResult['type']) => {
    switch (type) {
      case 'user': return 'Сотрудник'
      case 'news': return 'Новость'
      case 'department': return 'Отдел'
      case 'achievement': return 'Достижение'
      case 'skill': return 'Навык'
      default: return ''
    }
  }

  const handleLogout = () => {
    logout()
    window.location.href = '/login'
  }

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* Header */}
      <Header aria-label="Fond Intra">
        <SkipToContent />
        <HeaderGlobalAction
          aria-label={sideNavOpen ? 'Close menu' : 'Open menu'}
          onClick={() => setSideNavOpen(!sideNavOpen)}
        >
          {sideNavOpen ? <Close size={20} /> : <Menu size={20} />}
        </HeaderGlobalAction>
        <HeaderName href="/" prefix="" onClick={(e) => { e.preventDefault(); navigate('/'); }}>
          Fond Intra
        </HeaderName>

        {/* Search in header - desktop */}
        {!isMobile && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', paddingLeft: '1rem', position: 'relative' }}>
            <div style={{ width: '300px', position: 'relative' }}>
              <Search
                size="sm"
                placeholder="Поиск..."
                labelText="Search"
                closeButtonLabelText="Clear"
                value={searchQuery}
                onChange={(e) => {
                  const value = typeof e === 'string' ? e : e.target.value
                  setSearchQuery(value)
                  setShowSearchResults(value.length >= 2)
                }}
                onFocus={() => searchQuery.length >= 2 && setShowSearchResults(true)}
                onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
              />
              {showSearchResults && searchResults.length > 0 && (
                <div className="search-results">
                  {searchResults.map((result) => (
                    <button
                      key={`${result.type}-${result.id}`}
                      onClick={() => handleSelectResult(result)}
                      className="search-result-item"
                    >
                      <div className="list-item-avatar" style={{ background: 'var(--cds-layer-02)' }}>
                        {result.avatar ? (
                          <img src={result.avatar} alt={result.title} />
                        ) : (
                          getResultIcon(result.type)
                        )}
                      </div>
                      <div className="list-item-content">
                        <div className="list-item-title">{result.title}</div>
                        <div className="list-item-subtitle">
                          {result.subtitle || getResultTypeLabel(result.type)}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Spacer for mobile */}
        {isMobile && <div style={{ flex: 1 }} />}

        <HeaderGlobalBar>
          {/* Mobile search button */}
          {isMobile && (
            <HeaderGlobalAction
              aria-label="Search"
              onClick={() => setShowMobileSearch(!showMobileSearch)}
            >
              <SearchIcon size={20} />
            </HeaderGlobalAction>
          )}

          <HeaderGlobalAction
            aria-label="Notifications"
            onClick={() => {
              setShowNotifications(!showNotifications)
              setShowUserPanel(false)
            }}
          >
            <div style={{ position: 'relative' }}>
              <Notification size={20} />
              {unreadCount && unreadCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-4px',
                    background: '#da1e28',
                    color: 'white',
                    borderRadius: '50%',
                    width: '16px',
                    height: '16px',
                    fontSize: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
          </HeaderGlobalAction>

          <HeaderGlobalAction
            aria-label="User"
            onClick={() => {
              setShowUserPanel(!showUserPanel)
              setShowNotifications(false)
            }}
            tooltipAlignment="end"
          >
            <User size={20} />
          </HeaderGlobalAction>
        </HeaderGlobalBar>
      </Header>

      {/* Notifications dropdown */}
      {showNotifications && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 7000 }}
            onClick={() => setShowNotifications(false)}
          />
          <div className="user-menu" style={{ top: '48px', right: '48px', width: '280px', zIndex: 7001 }}>
            <div style={{ padding: '1rem' }}>
              <h4 style={{ marginBottom: '1rem', fontWeight: 600 }}>Уведомления</h4>
              <Link
                to="/notifications"
                onClick={() => setShowNotifications(false)}
                style={{ color: 'var(--cds-link-primary)', textDecoration: 'none' }}
              >
                Посмотреть все уведомления
              </Link>
            </div>
          </div>
        </>
      )}

      {/* User menu dropdown */}
      {showUserPanel && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 7000 }}
            onClick={() => setShowUserPanel(false)}
          />
          <div className="user-menu" style={{ top: '48px', right: '0', zIndex: 7001 }}>
            <div style={{ padding: '1rem', borderBottom: '1px solid var(--cds-border-subtle-01)' }}>
              <strong>{user?.full_name}</strong>
              <div style={{ fontSize: '0.875rem', color: 'var(--cds-text-secondary)' }}>
                {user?.email}
              </div>
            </div>
            <nav>
              <Link
                to="/profile"
                className="user-menu-item"
                onClick={() => setShowUserPanel(false)}
              >
                <User size={16} />
                Мой профиль
              </Link>
              <Link
                to="/profile/change-password"
                className="user-menu-item"
                onClick={() => setShowUserPanel(false)}
              >
                <Password size={16} />
                Сменить пароль
              </Link>
              <Link
                to="/security"
                className="user-menu-item"
                onClick={() => setShowUserPanel(false)}
              >
                <Security size={16} />
                Безопасность
              </Link>
              <button
                onClick={handleLogout}
                className="user-menu-item user-menu-item--danger"
              >
                <Logout size={16} />
                Выйти
              </button>
            </nav>
          </div>
        </>
      )}

      {/* Mobile search panel */}
      {isMobile && showMobileSearch && (
        <div
          style={{
            position: 'fixed',
            top: '48px',
            left: 0,
            right: 0,
            background: 'var(--cds-layer-01)',
            padding: '1rem',
            zIndex: 8000,
            borderBottom: '1px solid var(--cds-border-subtle-01)',
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.2)',
          }}
        >
          <div style={{ position: 'relative' }}>
            <Search
              size="lg"
              placeholder="Поиск..."
              labelText="Search"
              closeButtonLabelText="Clear"
              value={searchQuery}
              onChange={(e) => {
                const value = typeof e === 'string' ? e : e.target.value
                setSearchQuery(value)
                setShowSearchResults(value.length >= 2)
              }}
              onFocus={() => searchQuery.length >= 2 && setShowSearchResults(true)}
              autoFocus
            />
            {showSearchResults && searchResults.length > 0 && (
              <div className="search-results">
                {searchResults.map((result) => (
                  <button
                    key={`${result.type}-${result.id}`}
                    onClick={() => handleSelectResult(result)}
                    className="search-result-item"
                  >
                    <div className="list-item-avatar" style={{ background: 'var(--cds-layer-02)' }}>
                      {result.avatar ? (
                        <img src={result.avatar} alt={result.title} />
                      ) : (
                        getResultIcon(result.type)
                      )}
                    </div>
                    <div className="list-item-content">
                      <div className="list-item-title">{result.title}</div>
                      <div className="list-item-subtitle">
                        {result.subtitle || getResultTypeLabel(result.type)}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main content area */}
      <div style={{ display: 'flex', flex: 1, marginTop: '48px' }}>
        {/* Mobile sidebar backdrop */}
        {isMobile && sideNavOpen && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              top: '48px',
              background: 'rgba(0, 0, 0, 0.5)',
              zIndex: 5999,
            }}
            onClick={() => setSideNavOpen(false)}
          />
        )}

        {/* Sidebar */}
        <SideNav
          aria-label="Side navigation"
          expanded={sideNavOpen}
          isFixedNav
          isChildOfHeader={false}
          style={{
            position: 'fixed',
            top: '48px',
            left: 0,
            bottom: 0,
            width: sideNavOpen ? '256px' : '0',
            overflow: 'hidden',
            transition: 'width 0.11s cubic-bezier(0.2, 0, 1, 0.9)',
            zIndex: 6000,
          }}
        >
          <SideNavItems>
            <SideNavLink
              renderIcon={Home}
              href="/"
              isActive={isActive('/')}
              onClick={(e: React.MouseEvent) => {
                e.preventDefault()
                navigate('/')
              }}
            >
              Главная
            </SideNavLink>
            <SideNavLink
              renderIcon={UserMultiple}
              href="/employees"
              isActive={isActive('/employees')}
              onClick={(e: React.MouseEvent) => {
                e.preventDefault()
                navigate('/employees')
              }}
            >
              Сотрудники
            </SideNavLink>
            <SideNavLink
              renderIcon={Trophy}
              href="/achievements"
              isActive={isActive('/achievements')}
              onClick={(e: React.MouseEvent) => {
                e.preventDefault()
                navigate('/achievements')
              }}
            >
              Достижения
            </SideNavLink>
            <SideNavLink
              renderIcon={Document}
              href="/news"
              isActive={isActive('/news')}
              onClick={(e: React.MouseEvent) => {
                e.preventDefault()
                navigate('/news')
              }}
            >
              Новости
            </SideNavLink>
            <SideNavLink
              renderIcon={Building}
              href="/organization"
              isActive={isActive('/organization')}
              onClick={(e: React.MouseEvent) => {
                e.preventDefault()
                navigate('/organization')
              }}
            >
              Структура
            </SideNavLink>
            <SideNavLink
              renderIcon={Favorite}
              href="/kudos"
              isActive={isActive('/kudos')}
              onClick={(e: React.MouseEvent) => {
                e.preventDefault()
                navigate('/kudos')
              }}
            >
              Благодарности
            </SideNavLink>
            <SideNavLink
              renderIcon={Task}
              href="/surveys"
              isActive={isActive('/surveys')}
              onClick={(e: React.MouseEvent) => {
                e.preventDefault()
                navigate('/surveys')
              }}
            >
              Опросы
            </SideNavLink>
            <SideNavLink
              renderIcon={Idea}
              href="/ideas"
              isActive={isActive('/ideas')}
              onClick={(e: React.MouseEvent) => {
                e.preventDefault()
                navigate('/ideas')
              }}
            >
              Банк идей
            </SideNavLink>
            <SideNavLink
              renderIcon={Help}
              href="/faq"
              isActive={isActive('/faq')}
              onClick={(e: React.MouseEvent) => {
                e.preventDefault()
                navigate('/faq')
              }}
            >
              FAQ
            </SideNavLink>
            <SideNavLink
              renderIcon={Tag}
              href="/classifieds"
              isActive={isActive('/classifieds')}
              onClick={(e: React.MouseEvent) => {
                e.preventDefault()
                navigate('/classifieds')
              }}
            >
              Объявления
            </SideNavLink>
            <SideNavLink
              renderIcon={Crossroads}
              href="/okr"
              isActive={isActive('/okr')}
              onClick={(e: React.MouseEvent) => {
                e.preventDefault()
                navigate('/okr')
              }}
            >
              OKR
            </SideNavLink>
            <SideNavLink
              renderIcon={Calendar}
              href="/bookings"
              isActive={isActive('/bookings')}
              onClick={(e: React.MouseEvent) => {
                e.preventDefault()
                navigate('/bookings')
              }}
            >
              Бронирование
            </SideNavLink>

            {isAdmin && (
              <SideNavMenu
                renderIcon={Settings}
                title="Администрирование"
                defaultExpanded={location.pathname.startsWith('/admin')}
              >
                <SideNavMenuItem
                  href="/admin"
                  isActive={location.pathname === '/admin'}
                  onClick={(e: React.MouseEvent) => {
                    e.preventDefault()
                    navigate('/admin')
                  }}
                >
                  Панель управления
                </SideNavMenuItem>
                <SideNavMenuItem
                  href="/admin/users"
                  isActive={location.pathname.startsWith('/admin/users')}
                  onClick={(e: React.MouseEvent) => {
                    e.preventDefault()
                    navigate('/admin/users')
                  }}
                >
                  Пользователи
                </SideNavMenuItem>
                <SideNavMenuItem
                  href="/admin/departments"
                  isActive={location.pathname === '/admin/departments'}
                  onClick={(e: React.MouseEvent) => {
                    e.preventDefault()
                    navigate('/admin/departments')
                  }}
                >
                  Отделы
                </SideNavMenuItem>
                <SideNavMenuItem
                  href="/admin/roles"
                  isActive={location.pathname === '/admin/roles'}
                  onClick={(e: React.MouseEvent) => {
                    e.preventDefault()
                    navigate('/admin/roles')
                  }}
                >
                  Роли
                </SideNavMenuItem>
                <SideNavMenuItem
                  href="/admin/achievements"
                  isActive={location.pathname === '/admin/achievements'}
                  onClick={(e: React.MouseEvent) => {
                    e.preventDefault()
                    navigate('/admin/achievements')
                  }}
                >
                  Типы достижений
                </SideNavMenuItem>
                <SideNavMenuItem
                  href="/admin/audit"
                  isActive={location.pathname === '/admin/audit'}
                  onClick={(e: React.MouseEvent) => {
                    e.preventDefault()
                    navigate('/admin/audit')
                  }}
                >
                  Аудит
                </SideNavMenuItem>
              </SideNavMenu>
            )}
          </SideNavItems>
        </SideNav>

        {/* Content */}
        <main
          style={{
            flex: 1,
            marginLeft: isMobile ? 0 : (sideNavOpen ? '256px' : '0'),
            padding: isMobile ? '1rem' : '2rem',
            transition: 'margin-left 0.11s cubic-bezier(0.2, 0, 1, 0.9)',
            background: 'var(--cds-background)',
            minHeight: 'calc(100vh - 48px)',
            overflow: 'auto',
          }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  )
}
