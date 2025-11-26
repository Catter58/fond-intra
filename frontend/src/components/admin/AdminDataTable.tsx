import { ReactNode, useState, useCallback } from 'react'
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
  TableSelectAll,
  TableSelectRow,
  TableBatchActions,
  TableBatchAction,
  Button,
  Pagination,
  Loading,
  OverflowMenu,
  OverflowMenuItem,
} from '@carbon/react'
import { Download, DocumentBlank, TrashCan, Archive } from '@carbon/icons-react'

export interface TableHeader {
  key: string
  header: string
  sortable?: boolean
}

export interface RowAction {
  label: string
  onClick: (row: any) => void
  isDelete?: boolean
  isDisabled?: (row: any) => boolean
  isHidden?: (row: any) => boolean
}

export interface BulkAction {
  label: string
  icon?: React.ComponentType<any>
  onClick: (selectedIds: string[]) => void
  kind?: 'primary' | 'danger'
}

export interface ExportConfig {
  enabled: boolean
  filename?: string
  onExport?: () => void | Promise<void>
}

interface AdminDataTableProps<T extends { id: string | number }> {
  // Data
  rows: T[]
  headers: TableHeader[]

  // Rendering
  renderCell: (row: T, cellKey: string) => ReactNode

  // State
  isLoading?: boolean
  emptyMessage?: string
  emptyIcon?: React.ComponentType<any>

  // Search
  searchPlaceholder?: string
  searchValue?: string
  onSearchChange?: (value: string) => void

  // Pagination
  totalItems?: number
  page?: number
  pageSize?: number
  onPageChange?: (page: number) => void

  // Row actions
  rowActions?: RowAction[]

  // Bulk operations
  enableSelection?: boolean
  bulkActions?: BulkAction[]

  // Export
  exportConfig?: ExportConfig

  // Toolbar extras
  toolbarExtra?: ReactNode

  // Sorting
  sortKey?: string
  sortDirection?: 'ASC' | 'DESC' | 'NONE'
  onSort?: (key: string) => void
}

export function AdminDataTable<T extends { id: string | number }>({
  rows,
  headers,
  renderCell,
  isLoading = false,
  emptyMessage = 'Данные не найдены',
  emptyIcon: EmptyIcon = DocumentBlank,
  searchPlaceholder = 'Поиск...',
  searchValue = '',
  onSearchChange,
  totalItems,
  page = 1,
  pageSize = 20,
  onPageChange,
  rowActions,
  enableSelection = false,
  bulkActions = [],
  exportConfig,
  toolbarExtra,
  sortKey,
  sortDirection,
  onSort,
}: AdminDataTableProps<T>) {
  const [selectedRows, setSelectedRows] = useState<string[]>([])

  // Transform rows for DataTable (requires string id)
  const tableRows = rows.map((row) => ({
    ...row,
    id: String(row.id),
  }))

  // Add actions column if needed
  const tableHeaders = rowActions?.length
    ? [...headers, { key: 'actions', header: '' }]
    : headers

  const handleSearchChange = useCallback(
    (e: string | React.ChangeEvent<HTMLInputElement>) => {
      const value = typeof e === 'string' ? e : e.target.value
      onSearchChange?.(value)
    },
    [onSearchChange]
  )

  const handleBatchAction = useCallback(
    (action: BulkAction) => {
      action.onClick(selectedRows)
      setSelectedRows([])
    },
    [selectedRows]
  )

  const handleExport = useCallback(async () => {
    if (exportConfig?.onExport) {
      await exportConfig.onExport()
    }
  }, [exportConfig])

  const handleSort = useCallback(
    (headerKey: string) => {
      if (onSort) {
        onSort(headerKey)
      }
    },
    [onSort]
  )

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
        <Loading withOverlay={false} />
      </div>
    )
  }

  const showPagination = totalItems !== undefined && totalItems > pageSize

  return (
    <>
      <DataTable
        rows={tableRows}
        headers={tableHeaders}
        isSortable={headers.some((h) => h.sortable)}
        sortRow={(a: any, b: any, { sortDirection: dir, key }: any) => {
          if (dir === 'ASC') {
            return String(a[key]).localeCompare(String(b[key]))
          }
          return String(b[key]).localeCompare(String(a[key]))
        }}
      >
        {({
          rows: dataRows,
          headers: dataHeaders,
          getTableProps,
          getHeaderProps,
          getRowProps,
          getToolbarProps,
          getSelectionProps,
          getBatchActionProps,
          selectedRows: batchSelectedRows,
        }) => {
          // Sync selection state
          const currentSelectedIds = batchSelectedRows.map((r: any) => r.id)
          if (enableSelection && JSON.stringify(currentSelectedIds) !== JSON.stringify(selectedRows)) {
            setSelectedRows(currentSelectedIds)
          }

          const batchActionProps = getBatchActionProps()

          return (
            <TableContainer>
              <TableToolbar {...getToolbarProps()}>
                {enableSelection && bulkActions.length > 0 && (
                  <TableBatchActions {...batchActionProps}>
                    {bulkActions.map((action) => (
                      <TableBatchAction
                        key={action.label}
                        tabIndex={batchActionProps.shouldShowBatchActions ? 0 : -1}
                        renderIcon={action.icon || (action.kind === 'danger' ? TrashCan : Archive)}
                        onClick={() => handleBatchAction(action)}
                      >
                        {action.label}
                      </TableBatchAction>
                    ))}
                  </TableBatchActions>
                )}
                <TableToolbarContent>
                  {onSearchChange && (
                    <TableToolbarSearch
                      placeholder={searchPlaceholder}
                      value={searchValue}
                      onChange={handleSearchChange}
                      persistent
                    />
                  )}
                  {toolbarExtra}
                  {exportConfig?.enabled && (
                    <Button
                      kind="ghost"
                      hasIconOnly
                      renderIcon={Download}
                      iconDescription="Экспорт"
                      onClick={handleExport}
                      tooltipPosition="bottom"
                    />
                  )}
                </TableToolbarContent>
              </TableToolbar>
              <Table {...getTableProps()}>
                <TableHead>
                  <TableRow>
                    {enableSelection && <TableSelectAll {...getSelectionProps()} />}
                    {dataHeaders.map((header) => {
                      const headerConfig = headers.find((h) => h.key === header.key)
                      const isSortable = headerConfig?.sortable
                      const isSorted = sortKey === header.key

                      return (
                        <TableHeader
                          {...getHeaderProps({
                            header,
                            isSortable,
                            onClick: isSortable ? () => handleSort(header.key) : undefined,
                          })}
                          key={header.key}
                          isSortHeader={isSorted}
                          sortDirection={isSorted ? sortDirection : 'NONE'}
                        >
                          {header.header}
                        </TableHeader>
                      )
                    })}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dataRows.length > 0 ? (
                    dataRows.map((row) => {
                      const originalRow = rows.find((r) => String(r.id) === row.id) as T

                      return (
                        <TableRow {...getRowProps({ row })} key={row.id}>
                          {enableSelection && <TableSelectRow {...getSelectionProps({ row })} />}
                          {headers.map((header) => (
                            <TableCell key={header.key}>
                              {renderCell(originalRow, header.key)}
                            </TableCell>
                          ))}
                          {rowActions && rowActions.length > 0 && (
                            <TableCell>
                              <OverflowMenu flipped ariaLabel="Actions" size="sm">
                                {rowActions
                                  .filter((action) => !action.isHidden?.(originalRow))
                                  .map((action) => (
                                    <OverflowMenuItem
                                      key={action.label}
                                      itemText={action.label}
                                      onClick={() => action.onClick(originalRow)}
                                      isDelete={action.isDelete}
                                      disabled={action.isDisabled?.(originalRow)}
                                    />
                                  ))}
                              </OverflowMenu>
                            </TableCell>
                          )}
                        </TableRow>
                      )
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={tableHeaders.length + (enableSelection ? 1 : 0)}>
                        <div
                          style={{
                            textAlign: 'center',
                            padding: '2rem',
                            color: 'var(--cds-text-secondary)',
                          }}
                        >
                          <EmptyIcon
                            size={48}
                            style={{ color: 'var(--cds-text-helper)', marginBottom: '0.5rem' }}
                          />
                          <p>{emptyMessage}</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )
        }}
      </DataTable>

      {showPagination && onPageChange && (
        <div style={{ marginTop: '1rem' }}>
          <Pagination
            totalItems={totalItems}
            pageSize={pageSize}
            pageSizes={[pageSize]}
            page={page}
            onChange={({ page: newPage }) => newPage && onPageChange(newPage)}
            itemsPerPageText="Элементов на странице"
            pageRangeText={(_current, total) => `из ${total} страниц`}
            itemRangeText={(min, max, total) => `${min}–${max} из ${total} элементов`}
          />
        </div>
      )}
    </>
  )
}

// Re-export utility for CSV export
export function exportToCSV(
  data: Record<string, any>[],
  headers: { key: string; label: string }[],
  filename: string
) {
  // BOM for Excel UTF-8 support
  const BOM = '\uFEFF'

  const headerRow = headers.map((h) => h.label).join(';')
  const dataRows = data.map((row) =>
    headers.map((h) => {
      const value = row[h.key]
      if (value === null || value === undefined) return ''
      // Escape quotes and wrap in quotes if contains special chars
      const str = String(value)
      if (str.includes(';') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`
      }
      return str
    }).join(';')
  )

  const csv = BOM + headerRow + '\n' + dataRows.join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', `${filename}.csv`)
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}
