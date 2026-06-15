'use client'
import { MediaPace } from '@/lib/types'

const cfg: Record<MediaPace['status'], { label: string; cls: string; color: string }> = {
  on:      { label: 'No ritmo',         cls: 'badge-safe',   color: 'var(--safe)' },
  over:    { label: 'Acima do pace',    cls: 'badge-care',   color: 'var(--care)' },
  under:   { label: 'Abaixo do pace',   cls: 'badge-danger', color: 'var(--danger)' },
  unknown: { label: 'Sem dado de pace', cls: 'badge-muted',  color: 'var(--text-3)' },
}

export function PaceBadge({ pace, compact }: { pace: MediaPace; compact?: boolean }) {
  const c = cfg[pace.status]
  const pct = pace.ratio !== null ? Math.round(pace.ratio * 100) : null
  return (
    <span className={`v4-badge ${c.cls}`} style={compact ? { padding: '3px 9px', fontSize: 10 } : undefined}>
      <span className="v4-dot" />
      {c.label}{pct !== null ? ` · ${pct}%` : ''}
    </span>
  )
}

export function PaceGauge({ pace }: { pace: MediaPace }) {
  const c = cfg[pace.status]
  const pct = pace.ratio !== null ? Math.round(pace.ratio * 100) : null

  if (pace.status === 'unknown' || pct === null) {
    return (
      <div>
        <div className="flex items-baseline justify-between">
          <span style={{ fontSize: 13, color: 'var(--text-3)' }}>Pace de mídia</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)' }}>sem dado</span>
        </div>
        <div className="v4-progress-track" style={{ marginTop: 6 }}>
          <div className="v4-progress-fill" style={{ width: '0%', background: 'var(--text-3)' }} />
        </div>
      </div>
    )
  }

  const width = Math.min(pct, 150)

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>{pace.actualMTD.formatted}</span>
        <span style={{ fontSize: 12, fontWeight: 600, color: c.color }}>{pct}% do ideal</span>
      </div>
      <div className="v4-progress-track" style={{ marginTop: 6 }}>
        <div className="v4-progress-fill" style={{ width: `${(width / 150) * 100}%`, background: c.color }} />
        <div className="v4-progress-marker" style={{ left: `${(100 / 150) * 100}%` }} />
      </div>
      <div className="flex justify-between" style={{ marginTop: 4, fontSize: 11, color: 'var(--text-3)' }}>
        <span>esperado p/ a data {pace.targetMTD.formatted}</span>
        <span>{pace.monthLabel}</span>
      </div>
    </div>
  )
}
