import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import {
  Search,
  ClickableTile,
  Pagination,
  ContentSwitcher,
  Switch,
  Tag,
} from '@carbon/react'
import { Grid, List, UserMultiple, SearchLocate } from '@carbon/icons-react'
import { usersApi } from '@/api/endpoints/users'
import { EmptyState } from '@/components/ui/EmptyState'
import { EmployeeCardSkeleton } from '@/components/ui/Skeletons'
import { EmployeeFilters } from '@/components/features/employees'

interface Filters {
  department?: number
  position?: number
  skill?: number
  status?: string
  hired_after?: string
  hired_before?: string
}

export function EmployeesPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [viewMode, setViewMode] = useState(0) // 0 = grid, 1 = list
  const [page, setPage] = useState(1)

  // Parse filters from URL
  const filters = useMemo<Filters>(() => ({
    department: searchParams.get('department') ? Number(searchParams.get('department')) : undefined,
    position: searchParams.get('position') ? Number(searchParams.get('position')) : undefined,
    skill: searchParams.get('skill') ? Number(searchParams.get('skill')) : undefined,
    status: searchParams.get('status') || undefined,
    hired_after: searchParams.get('hired_after') || undefined,
    hired_before: searchParams.get('hired_before') || undefined,
  }), [searchParams])

  const updateFilters = (newFilters: Filters) => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.set(key, String(value))
      }
    })
    setSearchParams(params)
    setPage(1)
  }

  const resetFilters = () => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    setSearchParams(params)
    setPage(1)
  }

  const { data, isLoading } = useQuery({
    queryKey: ['employees', { search, page, ...filters }],
    queryFn: () => usersApi.getList({ search, page, page_size: 20, ...filters }),
  })

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // Check if employee was hired within the last 14 days
  const isNewEmployee = (hireDate: string | null | undefined): boolean => {
    if (!hireDate) return false
    const hire = new Date(hireDate)
    const now = new Date()
    const diffTime = now.getTime() - hire.getTime()
    const diffDays = diffTime / (1000 * 60 * 60 * 24)
    return diffDays >= 0 && diffDays < 14
  }

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 className="page-title">Сотрудники</h1>
          <ContentSwitcher
            onChange={(e) => e.index !== undefined && setViewMode(e.index)}
            selectedIndex={viewMode}
            size="sm"
            style={{ width: 'auto' }}
          >
            <Switch name="grid">
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Grid size={16} />
                Сетка
              </span>
            </Switch>
            <Switch name="list">
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <List size={16} />
                Список
              </span>
            </Switch>
          </ContentSwitcher>
        </div>
      </div>

      {/* Search */}
      <div style={{ maxWidth: '400px', marginBottom: '1rem' }}>
        <Search
          labelText="Поиск"
          placeholder="Поиск по имени или должности..."
          value={search}
          onChange={(e) => {
            const value = typeof e === 'string' ? e : e.target.value
            setSearch(value)
            setPage(1)
          }}
          closeButtonLabelText="Очистить поиск"
        />
      </div>

      {/* Filters */}
      <div style={{ marginBottom: '1.5rem' }}>
        <EmployeeFilters
          filters={filters}
          onFiltersChange={updateFilters}
          onReset={resetFilters}
        />
      </div>

      {/* Results count */}
      {data && (
        <p style={{ fontSize: '0.875rem', color: 'var(--cds-text-secondary)', marginBottom: '1rem' }}>
          Найдено: {data.count} {data.count === 1 ? 'сотрудник' : data.count < 5 ? 'сотрудника' : 'сотрудников'}
        </p>
      )}

      {/* Employees grid/list */}
      {isLoading ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
          gap: '1rem'
        }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <EmployeeCardSkeleton key={i} />
          ))}
        </div>
      ) : data?.results && data.results.length > 0 ? (
        <>
          {viewMode === 0 ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
              gap: '1rem'
            }}>
              {data.results.map((employee) => (
                <ClickableTile
                  key={employee.id}
                  href={`/employees/${employee.id}`}
                  onClick={(e) => {
                    e.preventDefault()
                    window.location.href = `/employees/${employee.id}`
                  }}
                  style={{ position: 'relative' }}
                >
                  {isNewEmployee(employee.hire_date) && (
                    <Tag
                      type="green"
                      size="sm"
                      style={{
                        position: 'absolute',
                        top: '0.5rem',
                        right: '0.5rem',
                      }}
                    >
                      Новый
                    </Tag>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '1rem' }}>
                    <div className="list-item-avatar" style={{ width: '80px', height: '80px', fontSize: '1.5rem', marginBottom: '1rem' }}>
                      {employee.avatar ? (
                        <img src={employee.avatar} alt={employee.full_name} />
                      ) : (
                        getInitials(employee.full_name)
                      )}
                    </div>
                    <h4 style={{ fontWeight: 500, fontSize: '0.875rem' }}>{employee.full_name}</h4>
                    <p style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)', marginTop: '0.25rem' }}>
                      {employee.position?.name || 'Должность не указана'}
                    </p>
                    {employee.department && (
                      <p style={{ fontSize: '0.75rem', color: 'var(--cds-text-helper)', marginTop: '0.25rem' }}>
                        {employee.department.name}
                      </p>
                    )}
                    {employee.current_status && (
                      <Tag type="blue" size="sm" style={{ marginTop: '0.5rem' }}>
                        {employee.current_status.status_display}
                      </Tag>
                    )}
                  </div>
                </ClickableTile>
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {data.results.map((employee) => (
                <ClickableTile
                  key={employee.id}
                  href={`/employees/${employee.id}`}
                  onClick={(e) => {
                    e.preventDefault()
                    window.location.href = `/employees/${employee.id}`
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div className="list-item-avatar" style={{ width: '48px', height: '48px' }}>
                      {employee.avatar ? (
                        <img src={employee.avatar} alt={employee.full_name} />
                      ) : (
                        getInitials(employee.full_name)
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h4 style={{ fontWeight: 500 }}>{employee.full_name}</h4>
                      <p style={{ fontSize: '0.875rem', color: 'var(--cds-text-secondary)' }}>
                        {employee.position?.name || 'Должность не указана'}
                        {employee.department && ` • ${employee.department.name}`}
                      </p>
                    </div>
                    {isNewEmployee(employee.hire_date) && (
                      <Tag type="green" size="sm">
                        Новый
                      </Tag>
                    )}
                    {employee.current_status && (
                      <Tag type="blue" size="sm">
                        {employee.current_status.status_display}
                      </Tag>
                    )}
                  </div>
                </ClickableTile>
              ))}
            </div>
          )}

          {/* Pagination */}
          {data.count > 20 && (
            <div style={{ marginTop: '2rem' }}>
              <Pagination
                totalItems={data.count}
                pageSize={20}
                pageSizes={[20]}
                page={page}
                onChange={({ page: newPage }) => newPage && setPage(newPage)}
                itemsPerPageText="Элементов на странице"
                pageRangeText={(_current, total) => `из ${total} страниц`}
                itemRangeText={(min, max, total) => `${min}–${max} из ${total} элементов`}
              />
            </div>
          )}
        </>
      ) : (
        <EmptyState
          icon={search ? SearchLocate : UserMultiple}
          title={search ? 'Сотрудники не найдены' : 'Список сотрудников пуст'}
          description={
            search
              ? `По запросу "${search}" ничего не найдено. Попробуйте изменить поисковый запрос.`
              : 'В системе пока нет зарегистрированных сотрудников.'
          }
          action={search ? { label: 'Сбросить поиск', onClick: () => setSearch(''), kind: 'tertiary' } : undefined}
        />
      )}
    </div>
  )
}
