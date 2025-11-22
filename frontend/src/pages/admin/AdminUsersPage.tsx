import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Plus, Search, Archive, RotateCcw, Edit, MoreVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { usersApi } from '@/api/endpoints/users'
import { getInitials, formatDate } from '@/lib/utils'

export function AdminUsersPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [showArchived, setShowArchived] = useState(false)
  const [page, setPage] = useState(1)
  const [openMenu, setOpenMenu] = useState<number | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'users', { search, showArchived, page }],
    queryFn: () => usersApi.getList({
      search,
      page,
      page_size: 20,
      is_archived: showArchived ? true : undefined,
    }),
  })

  const archiveMutation = useMutation({
    mutationFn: (userId: number) => usersApi.archive(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
      setOpenMenu(null)
    },
  })

  const restoreMutation = useMutation({
    mutationFn: (userId: number) => usersApi.restore(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
      setOpenMenu(null)
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-text-primary">Управление сотрудниками</h1>
        <Button asChild>
          <Link to="/admin/users/new">
            <Plus className="h-4 w-4 mr-2" />
            Добавить сотрудника
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-placeholder" />
          <Input
            type="search"
            placeholder="Поиск по имени или email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={!showArchived ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setShowArchived(false)
              setPage(1)
            }}
          >
            Активные
          </Button>
          <Button
            variant={showArchived ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setShowArchived(true)
              setPage(1)
            }}
          >
            <Archive className="h-4 w-4 mr-2" />
            Архив
          </Button>
        </div>
      </div>

      {/* Users table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 text-center text-text-secondary">Загрузка...</div>
          ) : data?.results && data.results.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-layer-02">
                    <th className="text-left p-4 font-medium text-sm">Сотрудник</th>
                    <th className="text-left p-4 font-medium text-sm">Email</th>
                    <th className="text-left p-4 font-medium text-sm">Отдел</th>
                    <th className="text-left p-4 font-medium text-sm">Должность</th>
                    <th className="text-left p-4 font-medium text-sm">Дата найма</th>
                    <th className="text-right p-4 font-medium text-sm">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {data.results.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-layer-hover">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={user.avatar || undefined} />
                            <AvatarFallback>{getInitials(user.full_name)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{user.full_name}</p>
                            {user.is_archived && (
                              <span className="text-xs text-support-error">В архиве</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-text-secondary">{user.email}</td>
                      <td className="p-4 text-sm text-text-secondary">
                        {user.department?.name || '—'}
                      </td>
                      <td className="p-4 text-sm text-text-secondary">
                        {user.position?.name || '—'}
                      </td>
                      <td className="p-4 text-sm text-text-secondary">
                        {user.hire_date ? formatDate(user.hire_date) : '—'}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon" asChild>
                            <Link to={`/admin/users/${user.id}/edit`}>
                              <Edit className="h-4 w-4" />
                            </Link>
                          </Button>
                          <div className="relative">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setOpenMenu(openMenu === user.id ? null : user.id)}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                            {openMenu === user.id && (
                              <>
                                <div
                                  className="fixed inset-0 z-40"
                                  onClick={() => setOpenMenu(null)}
                                />
                                <div className="absolute right-0 top-full mt-1 w-48 bg-layer-01 border rounded shadow-lg z-50">
                                  {user.is_archived ? (
                                    <button
                                      onClick={() => restoreMutation.mutate(user.id)}
                                      className="flex items-center gap-2 w-full px-4 py-2 text-sm hover:bg-layer-hover text-support-success"
                                    >
                                      <RotateCcw className="h-4 w-4" />
                                      Восстановить
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => archiveMutation.mutate(user.id)}
                                      className="flex items-center gap-2 w-full px-4 py-2 text-sm hover:bg-layer-hover text-support-error"
                                    >
                                      <Archive className="h-4 w-4" />
                                      Архивировать
                                    </button>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-6 text-center text-text-secondary">
              {search ? 'Сотрудники не найдены' : showArchived ? 'Архив пуст' : 'Нет сотрудников'}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {data && data.count > 20 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            disabled={!data.previous}
            onClick={() => setPage((p) => p - 1)}
          >
            Назад
          </Button>
          <span className="text-sm text-text-secondary">
            Страница {page} из {Math.ceil(data.count / 20)}
          </span>
          <Button
            variant="outline"
            disabled={!data.next}
            onClick={() => setPage((p) => p + 1)}
          >
            Далее
          </Button>
        </div>
      )}
    </div>
  )
}
