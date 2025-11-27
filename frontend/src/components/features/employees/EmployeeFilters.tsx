import { useQuery } from '@tanstack/react-query'
import {
  Dropdown,
  DatePicker,
  DatePickerInput,
  Button,
  Accordion,
  AccordionItem,
} from '@carbon/react'
import { Filter, Close } from '@carbon/icons-react'
import { organizationApi } from '@/api/endpoints/organization'
import { skillsApi } from '@/api/endpoints/skills'

interface EmployeeFiltersProps {
  filters: {
    department?: number
    position?: number
    skill?: number
    status?: string
    hired_after?: string
    hired_before?: string
  }
  onFiltersChange: (filters: EmployeeFiltersProps['filters']) => void
  onReset: () => void
}

const STATUS_OPTIONS = [
  { id: '', text: 'Все' },
  { id: 'vacation', text: 'В отпуске' },
  { id: 'sick_leave', text: 'На больничном' },
  { id: 'business_trip', text: 'В командировке' },
  { id: 'remote', text: 'Удалённая работа' },
  { id: 'maternity_leave', text: 'Декретный отпуск' },
]

export function EmployeeFilters({ filters, onFiltersChange, onReset }: EmployeeFiltersProps) {
  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: organizationApi.getDepartments,
  })

  const { data: positions } = useQuery({
    queryKey: ['positions'],
    queryFn: organizationApi.getPositions,
  })

  const { data: skills } = useQuery({
    queryKey: ['skills-catalog'],
    queryFn: skillsApi.getCatalog,
  })

  const hasActiveFilters = Object.values(filters).some((v) => v !== undefined && v !== '')

  const departmentItems = [
    { id: '', text: 'Все отделы' },
    ...(departments?.map((d) => ({ id: String(d.id), text: d.name })) || []),
  ]

  const positionItems = [
    { id: '', text: 'Все должности' },
    ...(positions?.map((p) => ({ id: String(p.id), text: p.name })) || []),
  ]

  const skillItems = [
    { id: '', text: 'Любой навык' },
    ...(skills?.map((s) => ({ id: String(s.id), text: s.name })) || []),
  ]

  return (
    <Accordion align="start">
      <AccordionItem
        title={
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Filter size={16} />
            Фильтры
            {hasActiveFilters && (
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: 'var(--cds-support-info)',
                }}
              />
            )}
          </span>
        }
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', padding: '1rem 0' }}>
          <Dropdown
            id="department-filter"
            titleText="Отдел"
            label="Выберите отдел"
            items={departmentItems}
            itemToString={(item) => item?.text || ''}
            selectedItem={departmentItems.find((d) => d.id === String(filters.department || '')) || departmentItems[0]}
            onChange={({ selectedItem }) => {
              onFiltersChange({
                ...filters,
                department: selectedItem?.id ? Number(selectedItem.id) : undefined,
              })
            }}
          />

          <Dropdown
            id="position-filter"
            titleText="Должность"
            label="Выберите должность"
            items={positionItems}
            itemToString={(item) => item?.text || ''}
            selectedItem={positionItems.find((p) => p.id === String(filters.position || '')) || positionItems[0]}
            onChange={({ selectedItem }) => {
              onFiltersChange({
                ...filters,
                position: selectedItem?.id ? Number(selectedItem.id) : undefined,
              })
            }}
          />

          <Dropdown
            id="skill-filter"
            titleText="Навык"
            label="Выберите навык"
            items={skillItems}
            itemToString={(item) => item?.text || ''}
            selectedItem={skillItems.find((s) => s.id === String(filters.skill || '')) || skillItems[0]}
            onChange={({ selectedItem }) => {
              onFiltersChange({
                ...filters,
                skill: selectedItem?.id ? Number(selectedItem.id) : undefined,
              })
            }}
          />

          <Dropdown
            id="status-filter"
            titleText="Статус"
            label="Выберите статус"
            items={STATUS_OPTIONS}
            itemToString={(item) => item?.text || ''}
            selectedItem={STATUS_OPTIONS.find((s) => s.id === (filters.status || '')) || STATUS_OPTIONS[0]}
            onChange={({ selectedItem }) => {
              onFiltersChange({
                ...filters,
                status: selectedItem?.id || undefined,
              })
            }}
          />

          <DatePicker
            datePickerType="single"
            dateFormat="d.m.Y"
            value={filters.hired_after || ''}
            onChange={([date]) => {
              onFiltersChange({
                ...filters,
                hired_after: date ? date.toISOString().split('T')[0] : undefined,
              })
            }}
          >
            <DatePickerInput
              id="hired-after"
              labelText="Нанят после"
              placeholder="дд.мм.гггг"
            />
          </DatePicker>

          <DatePicker
            datePickerType="single"
            dateFormat="d.m.Y"
            value={filters.hired_before || ''}
            onChange={([date]) => {
              onFiltersChange({
                ...filters,
                hired_before: date ? date.toISOString().split('T')[0] : undefined,
              })
            }}
          >
            <DatePickerInput
              id="hired-before"
              labelText="Нанят до"
              placeholder="дд.мм.гггг"
            />
          </DatePicker>
        </div>

        {hasActiveFilters && (
          <div style={{ paddingBottom: '1rem' }}>
            <Button
              kind="ghost"
              size="sm"
              renderIcon={Close}
              onClick={onReset}
            >
              Сбросить фильтры
            </Button>
          </div>
        )}
      </AccordionItem>
    </Accordion>
  )
}
