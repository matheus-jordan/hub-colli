'use client'
import { MonthlyMetrics } from '@/lib/types'

interface Props {
  meta: MonthlyMetrics[]
  google: MonthlyMetrics[]
}

interface ChannelCardProps {
  name: string
  accent: string
  current: MonthlyMetrics | null
  previous: MonthlyMetrics | null
}

function trendPct(curr: number | null, prev: number | null): number | null {
  if (curr === null || prev === null || prev === 0) return null
  return ((curr - prev) / prev) * 100
}

function ChannelCard({ name, accent, current, previous }: ChannelCardProps) {
  if (!current) return (
    <div style={{
      flex: 1, borderRadius: 16, padding: '18px 20px',
      background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)',
    }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: accent, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
        {name}
      </p>
      <p style={{ fontSize: 12, color: 'var(--text-dim)' }}>Sem dados disponíveis</p>
    </div>
  )

  const metrics = [
    { label: 'Investimento', value: current.investment.formatted, trend: trendPct(current.investment.value, previous?.investment.value ?? null), lowerBetter: false },
    { label: 'Leads', value: current.leads.formatted, trend: trendPct(current.leads.value, previous?.leads.value ?? null), lowerBetter: false },
    { label: 'ROAS', value: current.roas.formatted, trend: trendPct(current.roas.value, previous?.roas.value ?? null), lowerBetter: false },
    { label: 'CPL', value: current.cpl.formatted, trend: trendPct(current.cpl.value, previous?.cpl.value ?? null), lowerBetter: true },
  ].filter(m => m.value !== '—')

  return (
    <div style={{
      flex: 1, borderRadius: 16, padding: '18px 20px',
      background: `${accent}08`,
      border: `1px solid ${accent}25`,
    }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: accent, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>
        {name}
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {metrics.map(m => {
          const up = m.trend !== null && m.trend > 0
          const down = m.trend !== null && m.trend < 0
          const positive = m.lowerBetter ? down : up
          const negative = m.lowerBetter ? up : down
          return (
            <div key={m.label}>
              <p style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, marginBottom: 4 }}>{m.label}</p>
              <p style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)' }}>{m.value}</p>
              {m.trend !== null && (
                <p style={{ fontSize: 10, fontWeight: 600, marginTop: 2, color: positive ? '#34d399' : negative ? '#ff3b3b' : 'var(--text-dim)' }}>
                  {up ? '▲' : '▼'} {Math.abs(m.trend).toFixed(1)}%
                </p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function ChannelCards({ meta, google }: Props) {
  const hasMeta = meta.length > 0
  const hasGoogle = google.length > 0
  if (!hasMeta && !hasGoogle) return null

  return (
    <div>
      <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
        Por canal
      </p>
      <div style={{ display: 'flex', gap: 16 }}>
        <ChannelCard
          name="Meta Ads"
          accent="#3b82f6"
          current={meta[0] ?? null}
          previous={meta[1] ?? null}
        />
        <ChannelCard
          name="Google Ads"
          accent="#f97316"
          current={google[0] ?? null}
          previous={google[1] ?? null}
        />
      </div>
    </div>
  )
}
