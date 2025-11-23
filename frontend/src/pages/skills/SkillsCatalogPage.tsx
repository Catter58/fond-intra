import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Tile,
  Search,
  Tag,
  Accordion,
  AccordionItem,
  Loading,
} from '@carbon/react'
import { skillsApi } from '@/api/endpoints/skills'

export function SkillsCatalogPage() {
  const [searchQuery, setSearchQuery] = useState('')

  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['skill-categories'],
    queryFn: skillsApi.getCategories,
  })

  const { data: skills = [], isLoading: skillsLoading } = useQuery({
    queryKey: ['skills'],
    queryFn: () => skillsApi.getSkills(),
  })

  const isLoading = categoriesLoading || skillsLoading

  // Filter skills by search query
  const filteredSkills = skills.filter((skill) =>
    skill.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    skill.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Group skills by category
  const skillsByCategory = categories.map((category) => ({
    ...category,
    skills: filteredSkills.filter((skill) => skill.category === category.id),
  })).filter((cat) => cat.skills.length > 0)

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Каталог навыков</h1>
        <p style={{ color: 'var(--cds-text-secondary)', marginTop: '0.5rem' }}>
          Просмотрите доступные навыки и добавьте их в свой профиль
        </p>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <Search
          labelText="Поиск навыков"
          placeholder="Поиск по названию или описанию..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          size="lg"
        />
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <Loading withOverlay={false} />
        </div>
      ) : skillsByCategory.length === 0 ? (
        <Tile>
          <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--cds-text-secondary)' }}>
            {searchQuery ? 'Навыки не найдены' : 'Навыки пока не добавлены'}
          </p>
        </Tile>
      ) : (
        <Accordion>
          {skillsByCategory.map((category) => (
            <AccordionItem
              key={category.id}
              title={
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {category.name}
                  <Tag size="sm" type="gray">{category.skills.length}</Tag>
                </span>
              }
              open
            >
              {category.description && (
                <p style={{ marginBottom: '1rem', color: 'var(--cds-text-secondary)', fontSize: '0.875rem' }}>
                  {category.description}
                </p>
              )}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {category.skills.map((skill) => (
                  <div
                    key={skill.id}
                    style={{
                      padding: '0.75rem 1rem',
                      backgroundColor: 'var(--cds-layer-02)',
                      borderRadius: '4px',
                      border: '1px solid var(--cds-border-subtle-01)',
                    }}
                  >
                    <p style={{ fontWeight: 500, marginBottom: '0.25rem' }}>{skill.name}</p>
                    {skill.description && (
                      <p style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)' }}>
                        {skill.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </AccordionItem>
          ))}
        </Accordion>
      )}

      <Tile style={{ marginTop: '1.5rem' }}>
        <p style={{ fontSize: '0.875rem', color: 'var(--cds-text-secondary)' }}>
          Чтобы добавить навыки в свой профиль, перейдите в{' '}
          <a href="/profile/skills" style={{ color: 'var(--cds-link-primary)' }}>
            Управление навыками
          </a>
        </p>
      </Tile>
    </div>
  )
}
