'use client'
import { MetricValue } from '@/lib/types'

interface Props {
  label: string
  current: MetricValue
  previous?: MetricValue
  highlight?: boolean
}

function trend(curr: number | null, prev: number | null) {
  if (curr === null || prev === null || prev === 0) return null
  return ((curr - prev) / prev) * 100
}

export function MetricsCard({ label, current, previous, highlight }: Props) {
  const pct = previous ? trend(current.value, previous.value) : null
  const up = pct !== null && pct > 0
  const down = pct !== null && pct < 0

  return (
    <div style={{
      borderRadius: 14,
      padding: '16px 18px',
      background: highlight ? 'rgba(255,59,59,0.08)' : 'rgba(255,255,255,0.04)',
      border: `1px solid ${highlight ? 'rgba(255,59,59,0.35)' : 'rgba(255,255,255,0.08)'}`,
      backdropFilter: 'blur(20px)',
      boxShadow: highlight ? '0 0 24px rgba(255,59,59,0.1)' : 'none',
    }}>
      <p style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, marginBottom: 6 }}>
        {label}
      </p>
      <p style={{ fontSize: 22, fontWeight: 800, color: highlight ? 'var(--red)' : 'var(--text)', lineHeight: 1 }}>
        {current.formatted}
      </p>
      {pct !== null && (
        <p style={{ fontSize: 11, marginTop: 6, fontWeight: 600, color: up ? 'var(--green)' : down ? 'var(--red)' : 'var(--text-muted)' }}>
          {up ? '▲' : down ? '▼' : '–'} {Math.abs(pct).toFixed(1)}% vs mês anterior
        </p>
      )}
    </div>
  )
}
