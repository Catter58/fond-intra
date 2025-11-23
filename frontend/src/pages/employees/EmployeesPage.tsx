import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Search,
  Tile,
  ClickableTile,
  Pagination,
  ContentSwitcher,
  Switch,
  Tag,
  Loading,
} from '@carbon/react'
import { Grid, List } from '@carbon/icons-react'
import { usersApi } from '@/api/endpoints/users'

export function EmployeesPage() {
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState(0) // 0 = grid, 1 = list
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['employees', { search, page }],
    queryFn: () => usersApi.getList({ search, page, page_size: 20 }),
  })

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
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
      <div style={{ maxWidth: '400px', marginBottom: '2rem' }}>
        <Search
          labelText="Search"
          placeholder="Поиск по имени или должности..."
          value={search}
          onChange={(e) => {
            const value = typeof e === 'string' ? e : e.target.value
            setSearch(value)
            setPage(1)
          }}
          closeButtonLabelText="Clear search"
        />
      </div>

      {/* Employees grid/list */}
      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <Loading withOverlay={false} />
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
                >
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
        <Tile>
          <p style={{ textAlign: 'center', padding: '3rem', color: 'var(--cds-text-secondary)' }}>
            {search ? 'Сотрудники не найдены' : 'Список сотрудников пуст'}
          </p>
        </Tile>
      )}
    </div>
  )
}
