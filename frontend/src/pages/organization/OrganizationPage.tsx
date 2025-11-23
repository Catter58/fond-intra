import { useQuery } from '@tanstack/react-query'
import { Building, UserMultiple, ChevronRight, ChevronDown, Badge } from '@carbon/icons-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Tile, Loading } from '@carbon/react'
import { apiClient } from '@/api/client'
import { usersApi } from '@/api/endpoints/users'
import type { Department } from '@/types'

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

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
        style={{
          marginLeft: `${(level + 1) * 24 + 20}px`,
          padding: '0.5rem 0',
          fontSize: '0.875rem',
          color: 'var(--cds-text-secondary)',
        }}
      >
        Загрузка сотрудников...
      </div>
    )
  }

  const employees = data?.results || []

  if (employees.length === 0) {
    return (
      <div
        style={{
          marginLeft: `${(level + 1) * 24 + 20}px`,
          padding: '0.5rem 0',
          fontSize: '0.875rem',
          color: 'var(--cds-text-secondary)',
        }}
      >
        Нет сотрудников
      </div>
    )
  }

  const sortedEmployees = [...employees].sort((a, b) => {
    if (a.id === headId) return -1
    if (b.id === headId) return 1
    const nameA = a.full_name || `${a.last_name} ${a.first_name}`
    const nameB = b.full_name || `${b.last_name} ${b.first_name}`
    return nameA.localeCompare(nameB, 'ru')
  })

  return (
    <div style={{ padding: '0.25rem 0' }}>
      {sortedEmployees.map((employee) => (
        <Link
          key={employee.id}
          to={`/employees/${employee.id}`}
          className="list-item"
          style={{ marginLeft: `${(level + 1) * 24 + 20}px` }}
        >
          <div className="list-item-avatar" style={{ width: '32px', height: '32px', fontSize: '0.75rem' }}>
            {employee.avatar ? (
              <img src={employee.avatar} alt={employee.full_name} />
            ) : (
              getInitials(employee.full_name || `${employee.first_name} ${employee.last_name}`)
            )}
          </div>
          <div className="list-item-content">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="list-item-title">
                {employee.full_name || `${employee.last_name} ${employee.first_name}`}
              </span>
              {employee.id === headId && (
                <Badge size={16} style={{ color: '#ff832b', flexShrink: 0 }} />
              )}
            </div>
            {employee.position && (
              <span className="list-item-subtitle">
                {typeof employee.position === 'object' ? employee.position.name : employee.position}
              </span>
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
    <div style={{ userSelect: 'none' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.75rem',
          marginLeft: `${level * 24}px`,
          background: level === 0 ? 'var(--cds-layer-02)' : 'transparent',
          borderRadius: 0,
          transition: 'background-color 0.15s',
        }}
        className="list-item"
      >
        <div
          style={{ cursor: hasChildren ? 'pointer' : 'default' }}
          onClick={handleToggle}
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown size={16} style={{ color: 'var(--cds-text-secondary)' }} />
            ) : (
              <ChevronRight size={16} style={{ color: 'var(--cds-text-secondary)' }} />
            )
          ) : (
            <span style={{ width: '16px', display: 'inline-block' }} />
          )}
        </div>
        <Building size={20} style={{ color: 'var(--cds-link-primary)', flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {department.name}
          </p>
          {department.head_name && (
            <p style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)' }}>
              Руководитель: {department.head_name}
            </p>
          )}
        </div>
        {hasEmployees ? (
          <button
            onClick={handleEmployeesToggle}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              fontSize: '0.875rem',
              padding: '0.25rem 0.5rem',
              border: 'none',
              borderRadius: 0,
              cursor: 'pointer',
              flexShrink: 0,
              background: showEmployees ? 'var(--cds-link-primary)' : 'transparent',
              color: showEmployees ? 'white' : 'var(--cds-text-secondary)',
              transition: 'background-color 0.15s, color 0.15s',
            }}
          >
            <UserMultiple size={16} />
            <span>{department.employees_count || 0}</span>
          </button>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.875rem', color: 'var(--cds-text-secondary)', flexShrink: 0 }}>
            <UserMultiple size={16} />
            <span>0</span>
          </div>
        )}
      </div>

      {showEmployees && hasEmployees && (
        <EmployeesList
          departmentId={department.id}
          headId={department.head}
          level={level}
        />
      )}

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
    <div>
      <div className="page-header">
        <h1 className="page-title">Организационная структура</h1>
        <p className="page-subtitle">
          Иерархия отделов и подразделений компании
        </p>
      </div>

      <Tile>
        <h3 style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '1rem',
          fontSize: '1rem',
          fontWeight: 600
        }}>
          <Building size={20} />
          Структура компании
        </h3>

        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
            <Loading withOverlay={false} />
          </div>
        ) : tree && tree.length > 0 ? (
          <div>
            {tree.map((department) => (
              <DepartmentNode
                key={department.id}
                department={department}
                level={0}
              />
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--cds-text-secondary)' }}>
            Организационная структура не настроена
          </div>
        )}
      </Tile>
    </div>
  )
}
