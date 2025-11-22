import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LogOut, Menu, Search, User, Key } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
    <header className="h-12 border-b bg-layer-01 flex items-center px-4 fixed top-0 left-0 right-0 z-50">
      <div className="flex items-center gap-4 flex-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <Link to="/" className="font-semibold text-lg text-text-primary">
          Fond Intra
        </Link>

        <div className="hidden md:flex items-center flex-1 max-w-md ml-8" ref={searchRef}>
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-placeholder" />
            <Input
              type="search"
              placeholder="Поиск сотрудников..."
              className="pl-10 h-10"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setShowSearchResults(true)
              }}
              onFocus={() => searchQuery.length >= 2 && setShowSearchResults(true)}
            />
            {showSearchResults && searchResults && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-card border rounded-sm shadow-lg z-50 max-h-80 overflow-auto">
                {searchResults.map((result) => (
                  <button
                    key={result.id}
                    onClick={() => handleSelectUser(result.id)}
                    className="w-full flex items-center gap-3 px-3 py-2 hover:bg-secondary transition-colors text-left"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={result.avatar || undefined} />
                      <AvatarFallback className="text-xs">
                        {getInitials(result.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{result.full_name}</p>
                      <p className="text-xs text-text-secondary truncate">
                        {result.position?.name || result.department?.name || ''}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {showSearchResults && searchQuery.length >= 2 && searchResults && searchResults.length === 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-card border rounded-sm shadow-lg z-50 p-4 text-center text-sm text-muted-foreground">
                Сотрудники не найдены
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <NotificationDropdown />

        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1 rounded hover:bg-secondary transition-colors"
          >
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.avatar || undefined} alt={user?.full_name} />
              <AvatarFallback className="text-xs">
                {user ? getInitials(user.full_name) : 'U'}
              </AvatarFallback>
            </Avatar>
            <span className="hidden md:block text-sm font-medium">
              {user?.full_name}
            </span>
          </button>

          {showUserMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowUserMenu(false)}
              />
              <div className="absolute right-0 top-full mt-1 w-48 bg-card border rounded-sm shadow-lg z-50">
                <Link
                  to="/profile"
                  className="flex items-center gap-2 px-4 py-3 hover:bg-secondary transition-colors"
                  onClick={() => setShowUserMenu(false)}
                >
                  <User className="h-4 w-4" />
                  <span className="text-sm">Мой профиль</span>
                </Link>
                <Link
                  to="/profile/change-password"
                  className="flex items-center gap-2 px-4 py-3 hover:bg-secondary transition-colors"
                  onClick={() => setShowUserMenu(false)}
                >
                  <Key className="h-4 w-4" />
                  <span className="text-sm">Сменить пароль</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-3 w-full hover:bg-secondary transition-colors text-destructive"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="text-sm">Выйти</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
