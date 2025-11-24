import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Select, SelectItem, Loading, Tile } from '@carbon/react'
import { organizationApi } from '@/api/endpoints/organization'
import { skillsApi } from '@/api/endpoints/skills'
import type { SkillMatrixSkill } from '@/types'

interface SkillsMatrixProps {
  departmentId: number
}

const levelColors = {
  beginner: '#d2a106',
  intermediate: '#0f62fe',
  advanced: '#24a148',
  expert: '#8a3ffc',
}

const levelLabels = {
  beginner: 'Начинающий',
  intermediate: 'Средний',
  advanced: 'Продвинутый',
  expert: 'Эксперт',
}

export function SkillsMatrix({ departmentId }: SkillsMatrixProps) {
  const [categoryFilter, setCategoryFilter] = useState<number | undefined>(undefined)

  const { data: categories } = useQuery({
    queryKey: ['skill-categories'],
    queryFn: skillsApi.getCategories,
  })

  const { data: matrix, isLoading } = useQuery({
    queryKey: ['skills-matrix', departmentId, categoryFilter],
    queryFn: () => organizationApi.getDepartmentSkillsMatrix(departmentId, categoryFilter),
    enabled: !!departmentId,
  })

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
        <Loading withOverlay={false} />
      </div>
    )
  }

  if (!matrix || matrix.users.length === 0 || matrix.skills.length === 0) {
    return (
      <Tile>
        <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--cds-text-secondary)' }}>
          {matrix?.users.length === 0
            ? 'В отделе нет сотрудников'
            : 'В отделе пока нет навыков'}
        </p>
      </Tile>
    )
  }

  const getCellColor = (level: string | null) => {
    if (!level) return 'transparent'
    return levelColors[level as keyof typeof levelColors]
  }

  return (
    <div>
      {/* Filters */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'end' }}>
        <Select
          id="category-filter"
          labelText="Фильтр по категории"
          value={categoryFilter?.toString() || 'all'}
          onChange={(e) => {
            const value = e.target.value
            setCategoryFilter(value === 'all' ? undefined : Number(value))
          }}
          size="md"
          style={{ maxWidth: '300px' }}
        >
          <SelectItem value="all" text="Все категории" />
          {categories?.map((category) => (
            <SelectItem key={category.id} value={category.id.toString()} text={category.name} />
          ))}
        </Select>
      </div>

      {/* Legend */}
      <div style={{ marginBottom: '1rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
        {Object.entries(levelLabels).map(([level, label]) => (
          <div key={level} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div
              style={{
                width: '20px',
                height: '20px',
                borderRadius: '4px',
                backgroundColor: levelColors[level as keyof typeof levelColors],
              }}
            />
            <span style={{ fontSize: '0.875rem' }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Matrix Table */}
      <div style={{ overflowX: 'auto' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '0.875rem',
          }}
        >
          <thead>
            <tr>
              <th
                style={{
                  position: 'sticky',
                  left: 0,
                  zIndex: 2,
                  backgroundColor: 'var(--cds-layer-01)',
                  padding: '0.75rem',
                  textAlign: 'left',
                  borderBottom: '2px solid var(--cds-border-strong-01)',
                  minWidth: '200px',
                  fontWeight: 600,
                }}
              >
                Навык
              </th>
              {matrix.users.map((user) => (
                <th
                  key={user.id}
                  style={{
                    padding: '0.75rem',
                    textAlign: 'center',
                    borderBottom: '2px solid var(--cds-border-strong-01)',
                    minWidth: '120px',
                    fontWeight: 600,
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                    <span>{user.full_name}</span>
                    {user.position && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)', fontWeight: 400 }}>
                        {user.position}
                      </span>
                    )}
                  </div>
                </th>
              ))}
              <th
                style={{
                  padding: '0.75rem',
                  textAlign: 'center',
                  borderBottom: '2px solid var(--cds-border-strong-01)',
                  minWidth: '80px',
                  fontWeight: 600,
                }}
              >
                Всего
              </th>
            </tr>
          </thead>
          <tbody>
            {matrix.skills.map((skill: SkillMatrixSkill, index: number) => (
              <tr
                key={skill.id}
                style={{
                  backgroundColor: index % 2 === 0 ? 'var(--cds-layer-01)' : 'transparent',
                }}
              >
                <td
                  style={{
                    position: 'sticky',
                    left: 0,
                    zIndex: 1,
                    backgroundColor: index % 2 === 0 ? 'var(--cds-layer-01)' : 'var(--cds-background)',
                    padding: '0.75rem',
                    borderBottom: '1px solid var(--cds-border-subtle-01)',
                    fontWeight: 500,
                  }}
                >
                  <div>
                    {skill.name}
                    <div style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)', marginTop: '0.125rem' }}>
                      {skill.category}
                    </div>
                  </div>
                </td>
                {matrix.users.map((user) => {
                  const level = skill.users[user.id.toString()]
                  return (
                    <td
                      key={user.id}
                      style={{
                        padding: '0.5rem',
                        textAlign: 'center',
                        borderBottom: '1px solid var(--cds-border-subtle-01)',
                      }}
                    >
                      {level && (
                        <div
                          style={{
                            backgroundColor: getCellColor(level),
                            color: '#ffffff',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: 500,
                          }}
                          title={levelLabels[level as keyof typeof levelLabels]}
                        >
                          {levelLabels[level as keyof typeof levelLabels]}
                        </div>
                      )}
                    </td>
                  )
                })}
                <td
                  style={{
                    padding: '0.75rem',
                    textAlign: 'center',
                    borderBottom: '1px solid var(--cds-border-subtle-01)',
                    fontWeight: 600,
                    color: 'var(--cds-text-primary)',
                  }}
                >
                  {skill.stats.total}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: 'var(--cds-layer-01)', borderRadius: '4px' }}>
        <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Итого:</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)' }}>Навыков</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>{matrix.skills.length}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)' }}>Сотрудников</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>{matrix.users.length}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
