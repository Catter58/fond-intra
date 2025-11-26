import { ReactNode } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Tile, IconButton } from '@carbon/react'
import { Draggable, View, ViewOff } from '@carbon/icons-react'
import type { WidgetId } from '@/store/dashboardStore'

interface DashboardWidgetProps {
  id: WidgetId
  title: string
  icon: ReactNode
  children: ReactNode
  isEditMode?: boolean
  isVisible?: boolean
  onToggleVisibility?: () => void
}

export function DashboardWidget({
  id,
  title,
  icon,
  children,
  isEditMode = false,
  isVisible = true,
  onToggleVisibility,
}: DashboardWidgetProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: !isEditMode })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : isVisible ? 1 : 0.5,
  }

  if (!isEditMode && !isVisible) {
    return null
  }

  return (
    <div ref={setNodeRef} style={style}>
      <Tile
        style={{
          position: 'relative',
          border: isEditMode ? '2px dashed var(--cds-border-subtle-01)' : undefined,
          background: isVisible ? undefined : 'var(--cds-layer-02)',
        }}
      >
        {isEditMode && (
          <div
            style={{
              position: 'absolute',
              top: '0.5rem',
              right: '0.5rem',
              display: 'flex',
              gap: '0.25rem',
              zIndex: 10,
            }}
          >
            <IconButton
              kind="ghost"
              size="sm"
              label={isVisible ? 'Скрыть виджет' : 'Показать виджет'}
              onClick={onToggleVisibility}
            >
              {isVisible ? <ViewOff size={16} /> : <View size={16} />}
            </IconButton>
            <div
              {...attributes}
              {...listeners}
              style={{
                cursor: 'grab',
                padding: '0.5rem',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <Draggable size={16} />
            </div>
          </div>
        )}

        <h3
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '1rem',
            fontSize: '1rem',
            fontWeight: 600,
            opacity: isVisible ? 1 : 0.5,
          }}
        >
          {icon}
          {title}
        </h3>

        <div style={{ opacity: isVisible ? 1 : 0.5 }}>
          {children}
        </div>
      </Tile>
    </div>
  )
}
