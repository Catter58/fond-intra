import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Button, Search } from '@carbon/react'
import { Menu, Logout, UserAvatar, Password } from '@carbon/icons-react'
import { NotificationDropdown } from '@/components/features/notifications/NotificationDropdown'
import { useAuthStore } from '@/store/authStore'
import { usersApi } from '@/api/endpoints/users'
import { getInitials } from '@/lib/utils'

interface HeaderProps {
  onMenuClick: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearchResults, setShowSearchResults] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  const { data: searchResults } = useQuery({
    queryKey: ['user-search', searchQuery],
    queryFn: () => usersApi.search(searchQuery),
    enabled: searchQuery.length >= 2,
  })

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelectUser = (userId: number) => {
    setShowSearchResults(false)
    setSearchQuery('')
    navigate(`/employees/${userId}`)
  }

  const handleLogout = () => {
    logout()
    window.location.href = '/login'
  }

  return (
    <header
      style={{
        height: '48px',
        borderBottom: '1px solid var(--cds-border-subtle-01)',
        background: 'var(--cds-layer-01)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 1rem',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
        <Button
          kind="ghost"
          hasIconOnly
          renderIcon={Menu}
          iconDescription="Меню"
          onClick={onMenuClick}
          className="lg-hide"
          style={{ display: 'none' }}
        />

        <Link to="/" style={{ fontWeight: 600, fontSize: '1.125rem', color: 'var(--cds-text-primary)', textDecoration: 'none' }}>
          Fond Intra
        </Link>

        <div ref={searchRef} style={{ position: 'relative', flex: 1, maxWidth: '400px', marginLeft: '2rem' }} className="hide-mobile">
          <Search
            id="header-search"
            placeholder="Поиск сотрудников..."
            labelText=""
            closeButtonLabelText="Очистить"
            size="sm"
            value={searchQuery}
            onChange={(e) => {
              const value = typeof e === 'string' ? e : e.target.value
              setSearchQuery(value)
              setShowSearchResults(true)
            }}
            onFocus={() => searchQuery.length >= 2 && setShowSearchResults(true)}
          />
          {showSearchResults && searchResults && searchResults.length > 0 && (
            <div className="search-results">
              {searchResults.map((result) => (
                <button
                  key={result.id}
                  onClick={() => handleSelectUser(result.id)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.5rem 0.75rem',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                  className="list-item"
                >
                  <div className="list-item-avatar" style={{ width: '32px', height: '32px', fontSize: '0.75rem' }}>
                    {result.avatar ? (
                      <img src={result.avatar} alt={result.full_name} />
                    ) : (
                      getInitials(result.full_name)
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '0.875rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {result.full_name}
                    </p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {result.position?.name || result.department?.name || ''}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
          {showSearchResults && searchQuery.length >= 2 && searchResults && searchResults.length === 0 && (
            <div className="search-results" style={{ padding: '1rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--cds-text-secondary)' }}>
              Сотрудники не найдены
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <NotificationDropdown />

        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="user-menu"
          >
            <div className="list-item-avatar" style={{ width: '32px', height: '32px', fontSize: '0.75rem' }}>
              {user?.avatar ? (
                <img src={user.avatar} alt={user.full_name} />
              ) : (
                getInitials(user?.full_name || 'U')
              )}
            </div>
            <span className="hide-mobile" style={{ fontSize: '0.875rem', fontWeight: 500 }}>
              {user?.full_name}
            </span>
          </button>

          {showUserMenu && (
            <>
              <div
                style={{ position: 'fixed', inset: 0, zIndex: 40 }}
                onClick={() => setShowUserMenu(false)}
              />
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '100%',
                  marginTop: '0.25rem',
                  width: '200px',
                  background: 'var(--cds-layer-01)',
                  border: '1px solid var(--cds-border-subtle-01)',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                  zIndex: 50,
                }}
              >
                <Link
                  to="/profile"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem 1rem',
                    color: 'inherit',
                    textDecoration: 'none',
                    fontSize: '0.875rem',
                  }}
                  onClick={() => setShowUserMenu(false)}
                  className="list-item"
                >
                  <UserAvatar size={16} />
                  Мой профиль
                </Link>
                <Link
                  to="/profile/change-password"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem 1rem',
                    color: 'inherit',
                    textDecoration: 'none',
                    fontSize: '0.875rem',
                  }}
                  onClick={() => setShowUserMenu(false)}
                  className="list-item"
                >
                  <Password size={16} />
                  Сменить пароль
                </Link>
                <button
                  onClick={handleLogout}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem 1rem',
                    width: '100%',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    color: 'var(--cds-support-error)',
                  }}
                  className="list-item"
                >
                  <Logout size={16} />
                  Выйти
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
