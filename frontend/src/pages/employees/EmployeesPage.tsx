import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Search, Grid, List } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { usersApi } from '@/api/endpoints/users'
import { getInitials } from '@/lib/utils'

export function EmployeesPage() {
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['employees', { search, page }],
    queryFn: () => usersApi.getList({ search, page, page_size: 20 }),
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-text-primary">Сотрудники</h1>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('grid')}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-placeholder" />
        <Input
          type="search"
          placeholder="Поиск по имени или должности..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
          className="pl-10"
        />
      </div>

      {/* Employees grid/list */}
      {isLoading ? (
        <div className="text-center py-12 text-text-secondary">Загрузка...</div>
      ) : data?.results && data.results.length > 0 ? (
        <>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {data.results.map((employee) => (
                <Link key={employee.id} to={`/employees/${employee.id}`}>
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex flex-col items-center text-center">
                        <Avatar className="h-20 w-20 mb-3">
                          <AvatarImage src={employee.avatar || undefined} />
                          <AvatarFallback>
                            {getInitials(employee.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <h3 className="font-medium text-sm">{employee.full_name}</h3>
                        <p className="text-xs text-text-secondary mt-1">
                          {employee.position?.name || 'Должность не указана'}
                        </p>
                        {employee.department && (
                          <p className="text-xs text-text-helper mt-1">
                            {employee.department.name}
                          </p>
                        )}
                        {employee.current_status && (
                          <span className="mt-2 px-2 py-0.5 rounded-full text-xs bg-support-info/10 text-support-info">
                            {employee.current_status.status_display}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {data.results.map((employee) => (
                <Link key={employee.id} to={`/employees/${employee.id}`}>
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={employee.avatar || undefined} />
                          <AvatarFallback>
                            {getInitials(employee.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium">{employee.full_name}</h3>
                          <p className="text-sm text-text-secondary">
                            {employee.position?.name || 'Должность не указана'}
                            {employee.department && ` • ${employee.department.name}`}
                          </p>
                        </div>
                        {employee.current_status && (
                          <span className="px-2 py-0.5 rounded-full text-xs bg-support-info/10 text-support-info">
                            {employee.current_status.status_display}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}

          {/* Pagination */}
          {data.count > 20 && (
            <div className="flex items-center justify-center gap-2 pt-4">
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
        </>
      ) : (
        <div className="text-center py-12 text-text-secondary">
          {search ? 'Сотрудники не найдены' : 'Список сотрудников пуст'}
        </div>
      )}
    </div>
  )
}
