'use client'
import { MediaPace } from '@/lib/types'

const cfg: Record<MediaPace['status'], { label: string; color: string; bg: string; border: string }> = {
  on:      { label: 'No pace',        color: 'var(--green)',  bg: 'rgba(34,197,94,0.1)',  border: 'rgba(34,197,94,0.3)' },
  over:    { label: 'Acima do pace',  color: 'var(--yellow)', bg: 'rgba(251,191,36,0.1)', border: 'rgba(251,191,36,0.3)' },
  under:   { label: 'Abaixo do pace', color: 'var(--red)',    bg: 'rgba(255,59,59,0.1)',  border: 'var(--red-border)' },
  unknown: { label: 'Sem dados de pace', color: 'var(--text-dim)', bg: 'rgba(255,255,255,0.04)', border: 'var(--border)' },
}

export function PaceBadge({ pace, compact }: { pace: MediaPace; compact?: boolean }) {
  const c = cfg[pace.status]
  const pct = pace.ratio !== null ? Math.round(pace.ratio * 100) : null

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      fontSize: 11, fontWeight: 600, color: c.color,
      background: c.bg, border: `1px solid ${c.border}`,
      borderRadius: 20, padding: compact ? '3px 9px' : '4px 10px',
      whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.color, flexShrink: 0 }} />
      {c.label}{pct !== null ? ` · ${pct}%` : ''}
    </span>
  )
}
