import {
  SkeletonText,
  SkeletonPlaceholder,
  Tile,
} from '@carbon/react'

// Employee card skeleton
export function EmployeeCardSkeleton() {
  return (
    <Tile style={{ padding: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <SkeletonPlaceholder style={{ width: '64px', height: '64px', borderRadius: '50%' }} />
        <div style={{ flex: 1 }}>
          <SkeletonText heading width="60%" />
          <div style={{ marginTop: '0.5rem' }}>
            <SkeletonText width="40%" />
          </div>
        </div>
      </div>
    </Tile>
  )
}

// News card skeleton
export function NewsCardSkeleton() {
  return (
    <Tile style={{ padding: '1rem' }}>
      <SkeletonPlaceholder style={{ width: '100%', height: '160px', marginBottom: '1rem' }} />
      <SkeletonText heading width="80%" />
      <div style={{ marginTop: '0.5rem' }}>
        <SkeletonText width="100%" />
      </div>
      <SkeletonText width="70%" />
      <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between' }}>
        <SkeletonText width="30%" />
        <SkeletonText width="20%" />
      </div>
    </Tile>
  )
}

// Achievement card skeleton
export function AchievementCardSkeleton() {
  return (
    <Tile style={{ padding: '1rem' }}>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
        <SkeletonPlaceholder style={{ width: '48px', height: '48px', borderRadius: '50%', flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <SkeletonText heading width="70%" />
          <div style={{ marginTop: '0.5rem' }}>
            <SkeletonText width="90%" />
          </div>
          <div style={{ marginTop: '0.5rem' }}>
            <SkeletonText width="40%" />
          </div>
        </div>
      </div>
    </Tile>
  )
}

// Profile skeleton
export function ProfileSkeleton() {
  return (
    <Tile style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
        <div style={{ textAlign: 'center' }}>
          <SkeletonPlaceholder style={{ width: '150px', height: '150px', borderRadius: '50%' }} />
        </div>
        <div style={{ flex: 1, minWidth: '300px' }}>
          <SkeletonText heading width="50%" />
          <div style={{ marginTop: '0.5rem' }}>
            <SkeletonText width="30%" />
          </div>
          <div style={{ marginTop: '1rem' }}>
            <SkeletonText width="80%" />
          </div>
          <SkeletonText width="60%" />
          <SkeletonText width="70%" />
        </div>
      </div>
    </Tile>
  )
}

// Table row skeleton
export function TableRowSkeleton({ columns = 5 }: { columns?: number }) {
  return (
    <tr>
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} style={{ padding: '1rem' }}>
          <SkeletonText width={`${60 + Math.random() * 30}%`} />
        </td>
      ))}
    </tr>
  )
}

// Table skeleton
export function TableSkeleton({ rows = 5, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr>
          {Array.from({ length: columns }).map((_, i) => (
            <th key={i} style={{ padding: '1rem', textAlign: 'left' }}>
              <SkeletonText heading width="60%" />
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: rows }).map((_, i) => (
          <TableRowSkeleton key={i} columns={columns} />
        ))}
      </tbody>
    </table>
  )
}

// Stat tile skeleton
export function StatTileSkeleton() {
  return (
    <Tile className="stat-tile">
      <SkeletonPlaceholder style={{ width: '48px', height: '48px', borderRadius: '8px' }} />
      <div>
        <SkeletonText heading width="60px" />
        <SkeletonText width="100px" />
      </div>
    </Tile>
  )
}

// List item skeleton
export function ListItemSkeleton() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 0', borderBottom: '1px solid var(--cds-border-subtle-01)' }}>
      <SkeletonPlaceholder style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
      <div style={{ flex: 1 }}>
        <SkeletonText width="60%" />
        <SkeletonText width="40%" />
      </div>
    </div>
  )
}

// Page header skeleton
export function PageHeaderSkeleton() {
  return (
    <div className="page-header">
      <div style={{ marginBottom: '0.5rem' }}>
        <SkeletonText heading width="30%" />
      </div>
      <SkeletonText width="50%" />
    </div>
  )
}

// Kudos card skeleton
export function KudosCardSkeleton() {
  return (
    <Tile style={{ padding: '1rem' }}>
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
        <SkeletonPlaceholder style={{ width: '48px', height: '48px', borderRadius: '50%' }} />
        <div style={{ flex: 1 }}>
          <SkeletonText width="40%" />
          <SkeletonText width="30%" />
        </div>
      </div>
      <SkeletonText width="100%" />
      <SkeletonText width="80%" />
    </Tile>
  )
}

// Survey card skeleton
export function SurveyCardSkeleton() {
  return (
    <Tile style={{ padding: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
        <SkeletonText heading width="50%" />
        <SkeletonPlaceholder style={{ width: '60px', height: '24px', borderRadius: '4px' }} />
      </div>
      <SkeletonText width="100%" />
      <SkeletonText width="70%" />
      <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
        <SkeletonText width="80px" />
        <SkeletonText width="100px" />
      </div>
    </Tile>
  )
}

// Booking card skeleton
export function BookingCardSkeleton() {
  return (
    <Tile style={{ padding: '1rem' }}>
      <div style={{ display: 'flex', gap: '1rem' }}>
        <SkeletonPlaceholder style={{ width: '100px', height: '80px', borderRadius: '4px' }} />
        <div style={{ flex: 1 }}>
          <SkeletonText heading width="60%" />
          <SkeletonText width="40%" />
          <SkeletonText width="50%" />
        </div>
      </div>
    </Tile>
  )
}

// OKR card skeleton
export function OKRCardSkeleton() {
  return (
    <Tile style={{ padding: '1rem' }}>
      <SkeletonText heading width="70%" />
      <div style={{ marginTop: '0.5rem' }}>
        <SkeletonText width="90%" />
      </div>
      <SkeletonPlaceholder style={{ width: '100%', height: '8px', borderRadius: '4px', marginTop: '1rem' }} />
      <div style={{ marginTop: '1rem' }}>
        <SkeletonText width="60%" />
        <SkeletonText width="50%" />
        <SkeletonText width="70%" />
      </div>
    </Tile>
  )
}
