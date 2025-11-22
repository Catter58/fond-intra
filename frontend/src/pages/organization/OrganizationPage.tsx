import { useQuery } from '@tanstack/react-query'
import { Building2, Users, ChevronRight, ChevronDown, User, Crown } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { apiClient } from '@/api/client'
import { usersApi } from '@/api/endpoints/users'
import { getInitials } from '@/lib/utils'
import type { Department, UserBasic } from '@/types'

interface EmployeesListProps {
  departmentId: number
  headId?: number | null
  level: number
}

function EmployeesList({ departmentId, headId, level }: EmployeesListProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['department-employees', departmentId],
    queryFn: () => usersApi.getList({ department: departmentId, page_size: 100 }),
  })

  if (isLoading) {
    return (
      <div
        className="py-2 text-sm text-text-secondary"
        style={{ marginLeft: `${(level + 1) * 24 + 20}px` }}
      >
        Загрузка сотрудников...
      </div>
    )
  }

  const employees = data?.results || []

  if (employees.length === 0) {
    return (
      <div
        className="py-2 text-sm text-text-secondary"
        style={{ marginLeft: `${(level + 1) * 24 + 20}px` }}
      >
        Нет сотрудников
      </div>
    )
  }

  // Sort: head first, then alphabetically
  const sortedEmployees = [...employees].sort((a, b) => {
    if (a.id === headId) return -1
    if (b.id === headId) return 1
    const nameA = a.full_name || `${a.last_name} ${a.first_name}`
    const nameB = b.full_name || `${b.last_name} ${b.first_name}`
    return nameA.localeCompare(nameB, 'ru')
  })

  return (
    <div className="py-1">
      {sortedEmployees.map((employee) => (
        <Link
          key={employee.id}
          to={`/employees/${employee.id}`}
          className="flex items-center gap-3 p-2 rounded hover:bg-layer-hover transition-colors"
          style={{ marginLeft: `${(level + 1) * 24 + 20}px` }}
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src={employee.avatar || undefined} />
            <AvatarFallback className="text-xs">
              {getInitials(employee.full_name || `${employee.first_name} ${employee.last_name}`)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium truncate">
                {employee.full_name || `${employee.last_name} ${employee.first_name}`}
              </span>
              {employee.id === headId && (
                <Crown className="h-4 w-4 text-support-warning shrink-0" title="Руководитель" />
              )}
            </div>
            {employee.position && (
              <p className="text-xs text-text-secondary truncate">
                {typeof employee.position === 'object' ? employee.position.name : employee.position}
              </p>
            )}
          </div>
        </Link>
      ))}
    </div>
  )
}

interface DepartmentNodeProps {
  department: Department
  level: number
}

function DepartmentNode({ department, level }: DepartmentNodeProps) {
  const [isExpanded, setIsExpanded] = useState(level < 2)
  const [showEmployees, setShowEmployees] = useState(false)
  const hasChildren = department.children && department.children.length > 0
  const hasEmployees = (department.employees_count || 0) > 0

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (hasChildren) {
      setIsExpanded(!isExpanded)
    }
  }

  const handleEmployeesToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowEmployees(!showEmployees)
  }

  return (
    <div className="select-none">
      <div
        className={`flex items-center gap-2 p-3 rounded hover:bg-layer-hover transition-colors ${
          level === 0 ? 'bg-layer-02' : ''
        }`}
        style={{ marginLeft: `${level * 24}px` }}
      >
        <div
          className="cursor-pointer"
          onClick={handleToggle}
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="h-4 w-4 text-text-secondary shrink-0" />
            ) : (
              <ChevronRight className="h-4 w-4 text-text-secondary shrink-0" />
            )
          ) : (
            <span className="w-4" />
          )}
        </div>
        <Building2 className="h-5 w-5 text-interactive-primary shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{department.name}</p>
          {department.head_name && (
            <p className="text-xs text-text-secondary">
              Руководитель: {department.head_name}
            </p>
          )}
        </div>
        {hasEmployees && (
          <button
            onClick={handleEmployeesToggle}
            className={`flex items-center gap-1 text-sm px-2 py-1 rounded transition-colors shrink-0 ${
              showEmployees
                ? 'bg-interactive-primary text-white'
                : 'text-text-secondary hover:bg-layer-hover'
            }`}
            title={showEmployees ? 'Скрыть сотрудников' : 'Показать сотрудников'}
          >
            <Users className="h-4 w-4" />
            <span>{department.employees_count || 0}</span>
          </button>
        )}
        {!hasEmployees && (
          <div className="flex items-center gap-1 text-sm text-text-secondary shrink-0">
            <Users className="h-4 w-4" />
            <span>0</span>
          </div>
        )}
      </div>

      {/* Employees list */}
      {showEmployees && hasEmployees && (
        <EmployeesList
          departmentId={department.id}
          headId={department.head}
          level={level}
        />
      )}

      {/* Child departments */}
      {isExpanded && hasChildren && (
        <div>
          {department.children!.map((child) => (
            <DepartmentNode
              key={child.id}
              department={child}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function OrganizationPage() {
  const { data: tree, isLoading } = useQuery({
    queryKey: ['organization', 'tree'],
    queryFn: async () => {
      const response = await apiClient.get<Department[]>('/organization/tree/')
      return response.data
    },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">
          Организационная структура
        </h1>
        <p className="text-text-secondary mt-1">
          Иерархия отделов и подразделений компании
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Структура компании
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-text-secondary">
              Загрузка...
            </div>
          ) : tree && tree.length > 0 ? (
            <div className="space-y-1">
              {tree.map((department) => (
                <DepartmentNode
                  key={department.id}
                  department={department}
                  level={0}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-text-secondary">
              Организационная структура не настроена
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
