import { UserAvatar } from '@carbon/icons-react'

interface AvatarProps {
  src?: string | null
  name: string
  size?: number
  showIcon?: boolean
}

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function Avatar({ src, name, size = 32, showIcon = true }: AvatarProps) {
  const fontSize = Math.floor(size * 0.4)
  const iconSize = Math.floor(size * 0.5)

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: '50%',
          objectFit: 'cover',
        }}
      />
    )
  }

  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: showIcon ? '0.25rem' : 0,
        background: 'linear-gradient(135deg, #4589ff 0%, #0f62fe 50%, #0043ce 100%)',
      }}
    >
      {showIcon && size >= 48 && (
        <UserAvatar size={iconSize} style={{ color: 'rgba(255,255,255,0.9)' }} />
      )}
      <span
        style={{
          fontSize: `${fontSize}px`,
          fontWeight: 600,
          color: '#ffffff',
          letterSpacing: '0.05em',
        }}
      >
        {getInitials(name)}
      </span>
    </div>
  )
}
