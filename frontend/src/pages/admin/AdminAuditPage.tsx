import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, FileText, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { apiClient } from '@/api/client'
import { formatDate } from '@/lib/utils'

interface AuditLog {
  id: number
  user: { id: number; full_name: string } | null
  action: string
  entity_type: string
  entity_id: number | null
  old_values: any
  new_values: any
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

const ACTION_COLORS: Record<string, string> = {
  create: 'text-support-success',
  update: 'text-support-info',
  delete: 'text-support-error',
  login: 'text-interactive-primary',
  logout: 'text-text-secondary',
  archive: 'text-support-warning',
}

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-text-primary">Журнал аудита</h1>
        <Button variant="outline" onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          Экспорт CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-placeholder" />
          <Input
            type="search"
            placeholder="Поиск по пользователю..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="pl-10"
          />
        </div>
        <select
          value={actionFilter}
          onChange={(e) => {
            setActionFilter(e.target.value)
            setPage(1)
          }}
          className="h-12 border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">Все действия</option>
          {Object.entries(ACTION_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {/* Audit log */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 text-center text-text-secondary">Загрузка...</div>
          ) : data?.results && data.results.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-layer-02">
                    <th className="text-left p-4 font-medium text-sm">Дата</th>
                    <th className="text-left p-4 font-medium text-sm">Пользователь</th>
                    <th className="text-left p-4 font-medium text-sm">Действие</th>
                    <th className="text-left p-4 font-medium text-sm">Объект</th>
                    <th className="text-left p-4 font-medium text-sm">IP</th>
                  </tr>
                </thead>
                <tbody>
                  {data.results.map((log) => (
                    <tr key={log.id} className="border-b hover:bg-layer-hover">
                      <td className="p-4 text-sm">
                        {formatDate(log.created_at)}
                      </td>
                      <td className="p-4 text-sm">
                        {log.user?.full_name || 'Система'}
                      </td>
                      <td className="p-4">
                        <span className={`text-sm font-medium ${ACTION_COLORS[log.action] || ''}`}>
                          {ACTION_LABELS[log.action] || log.action}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-text-secondary">
                        {log.entity_type}
                        {log.entity_id && ` #${log.entity_id}`}
                      </td>
                      <td className="p-4 text-sm text-text-helper">
                        {log.ip_address || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-6 text-center">
              <FileText className="h-12 w-12 text-text-helper mx-auto mb-3" />
              <p className="text-text-secondary">Записи не найдены</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {data && data.count > 50 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            disabled={!data.previous}
            onClick={() => setPage((p) => p - 1)}
          >
            Назад
          </Button>
          <span className="text-sm text-text-secondary">
            Страница {page} из {Math.ceil(data.count / 50)}
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
