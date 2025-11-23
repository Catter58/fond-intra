import { Button } from '@carbon/react'
import { Folder, Search, Document, Trophy, UserMultiple, Notification } from '@carbon/icons-react'
import type { CarbonIconType } from '@carbon/icons-react'
import type { ReactNode } from 'react'

interface EmptyStateAction {
  label: string
  onClick: () => void
  kind?: 'primary' | 'secondary' | 'tertiary' | 'ghost'
}

interface EmptyStateProps {
  icon?: CarbonIconType | ReactNode
  title: string
  description?: string
  action?: EmptyStateAction
  size?: 'sm' | 'md' | 'lg'
}

// Preset icons for common empty states
export const EmptyStateIcons = {
  folder: Folder,
  search: Search,
  document: Document,
  trophy: Trophy,
  users: UserMultiple,
  notification: Notification,
} as const

export function EmptyState({
  icon: IconProp,
  title,
  description,
  action,
  size = 'md',
}: EmptyStateProps) {
  const sizeStyles = {
    sm: {
      iconSize: 48,
      titleSize: '1rem',
      padding: '1.5rem',
    },
    md: {
      iconSize: 64,
      titleSize: '1.25rem',
      padding: '2rem',
    },
    lg: {
      iconSize: 80,
      titleSize: '1.5rem',
      padding: '3rem',
    },
  }

  const styles = sizeStyles[size]

  // Handle both Carbon icons and custom React nodes
  const renderIcon = () => {
    if (!IconProp) return null

    // Check if it's a Carbon icon (function or forwardRef component)
    if (typeof IconProp === 'function' || (typeof IconProp === 'object' && IconProp !== null && '$$typeof' in IconProp)) {
      const IconComponent = IconProp as CarbonIconType
      return (
        <IconComponent
          size={styles.iconSize}
          style={{ color: 'var(--cds-text-helper)' }}
        />
      )
    }

    // It's a ReactNode
    return IconProp
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: styles.padding,
        minHeight: '200px',
      }}
    >
      {IconProp && (
        <div style={{ marginBottom: '1rem' }}>
          {renderIcon()}
        </div>
      )}

      <h3
        style={{
          fontSize: styles.titleSize,
          fontWeight: 600,
          color: 'var(--cds-text-primary)',
          marginBottom: description ? '0.5rem' : action ? '1rem' : 0,
        }}
      >
        {title}
      </h3>

      {description && (
        <p
          style={{
            fontSize: '0.875rem',
            color: 'var(--cds-text-secondary)',
            maxWidth: '400px',
            marginBottom: action ? '1.5rem' : 0,
          }}
        >
          {description}
        </p>
      )}

      {action && (
        <Button
          kind={action.kind || 'primary'}
          size={size === 'sm' ? 'sm' : 'md'}
          onClick={action.onClick}
        >
          {action.label}
        </Button>
      )}
    </div>
  )
}
