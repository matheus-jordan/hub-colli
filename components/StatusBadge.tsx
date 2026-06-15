'use client'
import { ClientStatus } from '@/lib/types'

const cfg: Record<ClientStatus, { label: string; cls: string; color: string }> = {
  ok:      { label: 'no ritmo',  cls: 'badge-safe',   color: 'var(--safe)' },
  warning: { label: 'atenção',   cls: 'badge-care',   color: 'var(--care)' },
  danger:  { label: 'risco',     cls: 'badge-danger', color: 'var(--danger)' },
  unknown: { label: 'sem dados', cls: 'badge-muted',  color: 'var(--text-3)' },
}

export function StatusBadge({ status }: { status: ClientStatus }) {
  const c = cfg[status]
  return (
    <span className={`v4-badge ${c.cls}`}>
      <span className="v4-dot" />
      {c.label}
    </span>
  )
}

export function StatusDot({ status }: { status: ClientStatus }) {
  const c = cfg[status]
  return <span className="v4-dot" style={{ width: 8, height: 8, color: c.color, background: c.color }} />
}
