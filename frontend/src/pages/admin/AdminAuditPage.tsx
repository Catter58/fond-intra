import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
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
  Dropdown,
  Loading,
  Tag,
} from '@carbon/react'
import { Download, DocumentBlank } from '@carbon/icons-react'
import { apiClient } from '@/api/client'
import { formatDate } from '@/lib/utils'

interface AuditLog {
  id: number
  user: { id: number; full_name: string } | null
  action: string
  entity_type: string
  entity_id: number | null
  old_values: unknown
  new_values: unknown
  ip_address: string | null
  user_agent: string
  created_at: string
}

const ACTION_LABELS: Record<string, string> = {
  create: 'Создание',
  update: 'Изменение',
  delete: 'Удаление',
  login: 'Вход',
  logout: 'Выход',
  archive: 'Архивация',
}

const ACTION_TAG_TYPES: Record<string, 'green' | 'blue' | 'red' | 'purple' | 'gray' | 'warm-gray'> = {
  create: 'green',
  update: 'blue',
  delete: 'red',
  login: 'purple',
  logout: 'gray',
  archive: 'warm-gray',
}

const ACTION_OPTIONS = [
  { id: '', label: 'Все действия' },
  { id: 'create', label: 'Создание' },
  { id: 'update', label: 'Изменение' },
  { id: 'delete', label: 'Удаление' },
  { id: 'login', label: 'Вход' },
  { id: 'logout', label: 'Выход' },
  { id: 'archive', label: 'Архивация' },
]

export function AdminAuditPage() {
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['audit', { search, actionFilter, page }],
    queryFn: async () => {
      const response = await apiClient.get<{ results: AuditLog[]; count: number; next: string | null; previous: string | null }>(
        '/admin/audit/',
        { params: { search, action: actionFilter || undefined, page, page_size: 50 } }
      )
      return response.data
    },
  })

  const handleExport = async () => {
    try {
      const response = await apiClient.get('/admin/audit/export/', {
        responseType: 'blob',
        params: { search, action: actionFilter || undefined },
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `audit_log_${new Date().toISOString().split('T')[0]}.csv`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (error) {
      console.error('Export failed:', error)
    }
  }

  const headers = [
    { key: 'date', header: 'Дата' },
    { key: 'user', header: 'Пользователь' },
    { key: 'action', header: 'Действие' },
    { key: 'entity', header: 'Объект' },
    { key: 'ip', header: 'IP' },
  ]

  const rows = data?.results?.map((log) => ({
    id: String(log.id),
    date: formatDate(log.created_at),
    user: log.user?.full_name || 'Система',
    action: log.action,
    entity: log.entity_type + (log.entity_id ? ` #${log.entity_id}` : ''),
    ip: log.ip_address || '—',
  })) || []

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 className="page-title">Журнал аудита</h1>
          <Button
            kind="tertiary"
            renderIcon={Download}
            onClick={handleExport}
          >
            Экспорт CSV
          </Button>
        </div>
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
                    placeholder="Поиск по пользователю..."
                    value={search}
                    onChange={(e) => {
                      const value = typeof e === 'string' ? e : e.target.value
                      setSearch(value)
                      setPage(1)
                    }}
                  />
                  <Dropdown
                    id="action-filter"
                    titleText=""
                    label="Фильтр по действию"
                    items={ACTION_OPTIONS}
                    itemToString={(item) => item?.label || ''}
                    selectedItem={ACTION_OPTIONS.find(o => o.id === actionFilter) || ACTION_OPTIONS[0]}
                    onChange={({ selectedItem }) => {
                      setActionFilter(selectedItem?.id || '')
                      setPage(1)
                    }}
                    size="sm"
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
                      const rowData = rows.find(r => r.id === row.id)
                      return (
                        <TableRow {...getRowProps({ row })} key={row.id}>
                          <TableCell>{rowData?.date}</TableCell>
                          <TableCell>{rowData?.user}</TableCell>
                          <TableCell>
                            <Tag type={ACTION_TAG_TYPES[rowData?.action || ''] || 'gray'} size="sm">
                              {ACTION_LABELS[rowData?.action || ''] || rowData?.action}
                            </Tag>
                          </TableCell>
                          <TableCell>{rowData?.entity}</TableCell>
                          <TableCell style={{ color: 'var(--cds-text-helper)' }}>{rowData?.ip}</TableCell>
                        </TableRow>
                      )
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={headers.length}>
                        <div style={{ textAlign: 'center', padding: '2rem' }}>
                          <DocumentBlank size={48} style={{ color: 'var(--cds-text-helper)', marginBottom: '0.5rem' }} />
                          <p style={{ color: 'var(--cds-text-secondary)' }}>Записи не найдены</p>
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

      {data && data.count > 50 && (
        <div style={{ marginTop: '1rem' }}>
          <Pagination
            totalItems={data.count}
            pageSize={50}
            pageSizes={[50]}
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
