import { useState, useRef, useEffect, useCallback } from 'react'
import './OrgChart.scss'
import { useQuery } from '@tanstack/react-query'
import { Loading, Button } from '@carbon/react'
import {
  ChevronDown,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  ZoomReset,
  User,
  UserMultiple
} from '@carbon/icons-react'
import { Link } from 'react-router-dom'
import { apiClient } from '@/api/client'
import type { DepartmentTree, UserBasic, PaginatedResponse } from '@/types'

interface OrgChartProps {
  className?: string
}

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}


interface OrgNodeProps {
  department: DepartmentTree
  expandedNodes: Set<number>
  onToggle: (id: number) => void
  expandedEmployees: Set<number>
  onToggleEmployees: (id: number) => void
  employeesData: Map<number, UserBasic[]>
  loadingEmployees: Set<number>
}

function OrgNode({ department, expandedNodes, onToggle, expandedEmployees, onToggleEmployees, employeesData, loadingEmployees }: OrgNodeProps) {
  const isExpanded = expandedNodes.has(department.id)
  const hasChildren = department.children && department.children.length > 0
  const isEmployeesExpanded = expandedEmployees.has(department.id)
  const employees = employeesData.get(department.id) || []
  const isLoadingEmployees = loadingEmployees.has(department.id)
  const employeesCount = department.employees_count || 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* Department Card */}
      <div
        style={{
          backgroundColor: 'var(--cds-layer-01)',
          border: '1px solid var(--cds-border-subtle-01)',
          borderRadius: '8px',
          padding: '1rem',
          minWidth: '200px',
          maxWidth: '280px',
          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)',
          position: 'relative',
        }}
      >
        {/* Department Name */}
        <h4 style={{
          fontSize: '0.875rem',
          fontWeight: 600,
          marginBottom: '0.75rem',
          textAlign: 'center',
          color: 'var(--cds-text-primary)'
        }}>
          {department.name}
        </h4>

        {/* Head Info */}
        {department.head_info ? (
          <Link
            to={`/employees/${department.head_info.id}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.5rem',
              backgroundColor: 'var(--cds-layer-02)',
              borderRadius: '4px',
              textDecoration: 'none',
              color: 'inherit',
              transition: 'background-color 0.15s',
            }}
            className="org-chart-head-link"
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: 'var(--cds-link-primary)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: 600,
                overflow: 'hidden',
                flexShrink: 0,
              }}
            >
              {department.head_info.avatar ? (
                <img
                  src={department.head_info.avatar}
                  alt={department.head_info.full_name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                getInitials(department.head_info.full_name)
              )}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{
                fontSize: '0.875rem',
                fontWeight: 500,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                {department.head_info.full_name}
              </div>
              {department.head_info.position && (
                <div style={{
                  fontSize: '0.75rem',
                  color: 'var(--cds-text-secondary)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {department.head_info.position}
                </div>
              )}
            </div>
          </Link>
        ) : (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              padding: '0.5rem',
              backgroundColor: 'var(--cds-layer-02)',
              borderRadius: '4px',
              color: 'var(--cds-text-secondary)',
              fontSize: '0.75rem',
            }}
          >
            <User size={16} />
            Руководитель не назначен
          </div>
        )}

        {/* Employees Count - Clickable */}
        {employeesCount > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onToggleEmployees(department.id)
            }}
            className="org-chart-employees-toggle"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.25rem',
              marginTop: '0.75rem',
              fontSize: '0.75rem',
              color: 'var(--cds-link-primary)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '0.25rem 0.5rem',
              borderRadius: '4px',
              width: '100%',
              transition: 'background-color 0.15s',
            }}
            title={isEmployeesExpanded ? 'Скрыть сотрудников' : 'Показать сотрудников'}
          >
            <UserMultiple size={14} />
            <span>{employeesCount} сотрудников</span>
            {isEmployeesExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </button>
        )}

        {employeesCount === 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.25rem',
              marginTop: '0.75rem',
              fontSize: '0.75rem',
              color: 'var(--cds-text-secondary)',
            }}
          >
            <UserMultiple size={14} />
            <span>0 сотрудников</span>
          </div>
        )}

        {/* Expanded Employees List */}
        {isEmployeesExpanded && (
          <div className="org-chart-employees-list" style={{ marginTop: '0.5rem', width: '100%' }}>
            {isLoadingEmployees ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '0.5rem' }}>
                <Loading small withOverlay={false} />
              </div>
            ) : employees.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                {employees.map((employee) => (
                  <Link
                    key={employee.id}
                    to={`/employees/${employee.id}`}
                    className="org-chart-employee-item"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.375rem 0.5rem',
                      backgroundColor: 'var(--cds-layer-02)',
                      borderRadius: '4px',
                      textDecoration: 'none',
                      color: 'inherit',
                      transition: 'background-color 0.15s',
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--cds-link-primary)',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.625rem',
                        fontWeight: 600,
                        overflow: 'hidden',
                        flexShrink: 0,
                      }}
                    >
                      {employee.avatar ? (
                        <img
                          src={employee.avatar}
                          alt={employee.full_name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        getInitials(employee.full_name)
                      )}
                    </div>
                    <div style={{ overflow: 'hidden', flex: 1 }}>
                      <div style={{
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}>
                        {employee.full_name}
                      </div>
                      {employee.position && (
                        <div style={{
                          fontSize: '0.625rem',
                          color: 'var(--cds-text-secondary)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}>
                          {employee.position.name}
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div style={{
                fontSize: '0.75rem',
                color: 'var(--cds-text-secondary)',
                textAlign: 'center',
                padding: '0.5rem',
              }}>
                Нет сотрудников
              </div>
            )}
          </div>
        )}

        {/* Expand/Collapse Button */}
        {hasChildren && (
          <button
            onClick={() => onToggle(department.id)}
            style={{
              position: 'absolute',
              bottom: '-12px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              backgroundColor: 'var(--cds-link-primary)',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1,
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
            }}
            title={isExpanded ? 'Свернуть' : 'Развернуть'}
          >
            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
        )}
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div className="org-chart-children">
          {/* Vertical line from parent */}
          <div className="org-chart-vline" />

          {/* Children container */}
          <div className="org-chart-children-row">
            {department.children.map((child, index) => {
              const isFirst = index === 0
              const isLast = index === department.children.length - 1
              const isOnly = department.children.length === 1

              return (
                <div key={child.id} className="org-chart-child-wrapper">
                  {/* Connector line with rounded corner */}
                  <div className={`org-chart-connector ${isOnly ? 'only' : isFirst ? 'first' : isLast ? 'last' : 'middle'}`}>
                    <div className="org-chart-connector-v" />
                    {!isOnly && <div className="org-chart-connector-h" />}
                  </div>
                  <div style={{ padding: '0 0.5rem' }}>
                    <OrgNode
                      department={child}
                      expandedNodes={expandedNodes}
                      onToggle={onToggle}
                      expandedEmployees={expandedEmployees}
                      onToggleEmployees={onToggleEmployees}
                      employeesData={employeesData}
                      loadingEmployees={loadingEmployees}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export function OrgChart({ className }: OrgChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [zoom, setZoom] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set())
  const [isInitialized, setIsInitialized] = useState(false)
  const [expandedEmployees, setExpandedEmployees] = useState<Set<number>>(new Set())
  const [employeesData, setEmployeesData] = useState<Map<number, UserBasic[]>>(new Map())
  const [loadingEmployees, setLoadingEmployees] = useState<Set<number>>(new Set())

  const { data: tree, isLoading } = useQuery({
    queryKey: ['organization', 'tree'],
    queryFn: async () => {
      const response = await apiClient.get<DepartmentTree[]>('/organization/tree/')
      return response.data
    },
  })

  // Initialize expanded nodes on first load only
  useEffect(() => {
    if (tree && !isInitialized) {
      // Expand first 2 levels by default
      const initialExpanded = new Set<number>()
      const addLevel = (nodes: DepartmentTree[], level: number) => {
        if (level > 1) return
        nodes.forEach(node => {
          initialExpanded.add(node.id)
          if (node.children) {
            addLevel(node.children, level + 1)
          }
        })
      }
      addLevel(tree, 0)
      setExpandedNodes(initialExpanded)
      setIsInitialized(true)
    }
  }, [tree, isInitialized])

  const handleToggle = useCallback((id: number) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }, [])

  const handleToggleEmployees = useCallback(async (departmentId: number) => {
    // If already expanded, just collapse
    if (expandedEmployees.has(departmentId)) {
      setExpandedEmployees(prev => {
        const newSet = new Set(prev)
        newSet.delete(departmentId)
        return newSet
      })
      return
    }

    // If we already have data, just expand
    if (employeesData.has(departmentId)) {
      setExpandedEmployees(prev => new Set(prev).add(departmentId))
      return
    }

    // Otherwise, fetch the employees
    setLoadingEmployees(prev => new Set(prev).add(departmentId))
    setExpandedEmployees(prev => new Set(prev).add(departmentId))

    try {
      const response = await apiClient.get<PaginatedResponse<UserBasic>>('/users/', {
        params: { department: departmentId, page_size: 50 }
      })
      setEmployeesData(prev => new Map(prev).set(departmentId, response.data.results))
    } catch (error) {
      console.error('Failed to fetch employees:', error)
    } finally {
      setLoadingEmployees(prev => {
        const newSet = new Set(prev)
        newSet.delete(departmentId)
        return newSet
      })
    }
  }, [expandedEmployees, employeesData])

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.1, 2))
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.3))
  const handleZoomReset = () => {
    setZoom(1)
    setPosition({ x: 0, y: 0 })
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) { // Left click only
      setIsDragging(true)
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault()
      const delta = e.deltaY > 0 ? -0.1 : 0.1
      setZoom(prev => Math.max(0.3, Math.min(2, prev + delta)))
    }
  }

  const expandAll = () => {
    if (!tree) return
    const allIds = new Set<number>()
    const collectIds = (nodes: DepartmentTree[]) => {
      nodes.forEach(node => {
        allIds.add(node.id)
        if (node.children) {
          collectIds(node.children)
        }
      })
    }
    collectIds(tree)
    setExpandedNodes(allIds)
  }

  const collapseAll = () => {
    setExpandedNodes(new Set())
  }

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
        <Loading withOverlay={false} />
      </div>
    )
  }

  if (!tree || tree.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--cds-text-secondary)' }}>
        Организационная структура не настроена
      </div>
    )
  }

  return (
    <div className={className}>
      {/* Controls */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        marginBottom: '1rem',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button kind="ghost" size="sm" renderIcon={ZoomOut} iconDescription="Уменьшить" hasIconOnly onClick={handleZoomOut} />
          <Button kind="ghost" size="sm" onClick={handleZoomReset} style={{ minWidth: '60px' }}>
            {Math.round(zoom * 100)}%
          </Button>
          <Button kind="ghost" size="sm" renderIcon={ZoomIn} iconDescription="Увеличить" hasIconOnly onClick={handleZoomIn} />
          <Button kind="ghost" size="sm" renderIcon={ZoomReset} iconDescription="Сбросить" hasIconOnly onClick={handleZoomReset} />
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button kind="tertiary" size="sm" onClick={expandAll}>
            Развернуть все
          </Button>
          <Button kind="tertiary" size="sm" onClick={collapseAll}>
            Свернуть все
          </Button>
        </div>
      </div>

      {/* Chart Container */}
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '600px',
          overflow: 'hidden',
          backgroundColor: 'var(--cds-background)',
          border: '1px solid var(--cds-border-subtle-01)',
          borderRadius: '4px',
          cursor: isDragging ? 'grabbing' : 'grab',
          position: 'relative',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <div
          ref={contentRef}
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
            transformOrigin: 'center top',
            padding: '2rem',
            display: 'inline-flex',
            flexDirection: 'column',
            alignItems: 'center',
            minWidth: '100%',
            minHeight: '100%',
          }}
        >
          {tree.map(rootDept => (
            <OrgNode
              key={rootDept.id}
              department={rootDept}
              expandedNodes={expandedNodes}
              onToggle={handleToggle}
              expandedEmployees={expandedEmployees}
              onToggleEmployees={handleToggleEmployees}
              employeesData={employeesData}
              loadingEmployees={loadingEmployees}
            />
          ))}
        </div>
      </div>

      {/* Instructions */}
      <p style={{
        fontSize: '0.75rem',
        color: 'var(--cds-text-secondary)',
        marginTop: '0.5rem',
        textAlign: 'center'
      }}>
        Перетаскивайте для перемещения. Ctrl + колёсико для масштабирования.
      </p>
    </div>
  )
}
