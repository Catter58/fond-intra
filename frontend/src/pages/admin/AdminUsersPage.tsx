import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  DataTable,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
  TableToolbar,
  TableToolbarContent,
  TableToolbarSearch,
  Button,
  Pagination,
  Tag,
  OverflowMenu,
  OverflowMenuItem,
  Loading,
  ContentSwitcher,
  Switch,
} from '@carbon/react'
import { Add, Archive } from '@carbon/icons-react'
import { usersApi } from '@/api/endpoints/users'
import { formatDate } from '@/lib/utils'

export function AdminUsersPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [showArchived, setShowArchived] = useState(0)
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'users', { search, showArchived, page }],
    queryFn: () => usersApi.adminGetList({
      search,
      page,
      page_size: 20,
      is_archived: showArchived === 1 ? true : false,
    }),
  })

  const archiveMutation = useMutation({
    mutationFn: (userId: number) => usersApi.archive(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
    },
  })

  const restoreMutation = useMutation({
    mutationFn: (userId: number) => usersApi.restore(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
    },
  })

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const headers = [
    { key: 'name', header: 'Сотрудник' },
    { key: 'email', header: 'Email' },
    { key: 'department', header: 'Отдел' },
    { key: 'position', header: 'Должность' },
    { key: 'hire_date', header: 'Дата найма' },
    { key: 'actions', header: '' },
  ]

  const rows = data?.results?.map((user) => ({
    id: String(user.id),
    name: user.full_name,
    email: user.email,
    department: user.department?.name || '—',
    position: user.position?.name || '—',
    hire_date: user.hire_date ? formatDate(user.hire_date) : '—',
    avatar: user.avatar,
    is_archived: user.is_archived,
    raw: user,
  })) || []

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 className="page-title">Управление сотрудниками</h1>
          <Button
            renderIcon={Add}
            onClick={() => navigate('/admin/users/new')}
          >
            Добавить сотрудника
          </Button>
        </div>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <ContentSwitcher
          onChange={(e) => {
            if (e.index !== undefined) {
              setShowArchived(e.index)
              setPage(1)
            }
          }}
          selectedIndex={showArchived}
          size="sm"
        >
          <Switch name="active">Активные</Switch>
          <Switch name="archived">
            <Archive size={16} style={{ marginRight: '0.5rem' }} />
            Архив
          </Switch>
        </ContentSwitcher>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <Loading withOverlay={false} />
        </div>
      ) : (
        <DataTable rows={rows} headers={headers}>
          {({
            rows: tableRows,
            headers: tableHeaders,
            getTableProps,
            getHeaderProps,
            getRowProps,
            getToolbarProps,
          }) => (
            <TableContainer>
              <TableToolbar {...getToolbarProps()}>
                <TableToolbarContent>
                  <TableToolbarSearch
                    placeholder="Поиск по имени или email..."
                    value={search}
                    onChange={(e) => {
                      const value = typeof e === 'string' ? e : e.target.value
                      setSearch(value)
                      setPage(1)
                    }}
                  />
                </TableToolbarContent>
              </TableToolbar>
              <Table {...getTableProps()}>
                <TableHead>
                  <TableRow>
                    {tableHeaders.map((header) => (
                      <TableHeader {...getHeaderProps({ header })} key={header.key}>
                        {header.header}
                      </TableHeader>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tableRows.length > 0 ? (
                    tableRows.map((row) => {
                      const userData = rows.find(r => r.id === row.id)
                      return (
                        <TableRow {...getRowProps({ row })} key={row.id}>
                          <TableCell>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <div className="list-item-avatar" style={{ width: '40px', height: '40px' }}>
                                {userData?.avatar ? (
                                  <img src={userData.avatar} alt={userData.name} />
                                ) : (
                                  getInitials(userData?.name || '')
                                )}
                              </div>
                              <div>
                                <span style={{ fontWeight: 500 }}>{userData?.name}</span>
                                {userData?.is_archived && (
                                  <Tag type="red" size="sm" style={{ marginLeft: '0.5rem' }}>
                                    В архиве
                                  </Tag>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{userData?.email}</TableCell>
                          <TableCell>{userData?.department}</TableCell>
                          <TableCell>{userData?.position}</TableCell>
                          <TableCell>{userData?.hire_date}</TableCell>
                          <TableCell>
                            <OverflowMenu flipped ariaLabel="Actions">
                              <OverflowMenuItem
                                itemText="Редактировать"
                                onClick={() => navigate(`/admin/users/${row.id}/edit`)}
                              />
                              {userData?.is_archived ? (
                                <OverflowMenuItem
                                  itemText="Восстановить"
                                  onClick={() => restoreMutation.mutate(Number(row.id))}
                                />
                              ) : (
                                <OverflowMenuItem
                                  itemText="Архивировать"
                                  isDelete
                                  onClick={() => archiveMutation.mutate(Number(row.id))}
                                />
                              )}
                            </OverflowMenu>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={headers.length}>
                        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--cds-text-secondary)' }}>
                          {search
                            ? 'Сотрудники не найдены'
                            : showArchived === 1
                              ? 'Архив пуст'
                              : 'Нет сотрудников'}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DataTable>
      )}

      {data && data.count > 20 && (
        <div style={{ marginTop: '1rem' }}>
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
    </div>
  )
}
