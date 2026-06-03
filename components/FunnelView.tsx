'use client'
import { MonthlyMetrics } from '@/lib/types'

interface Props {
  current: MonthlyMetrics
  previous?: MonthlyMetrics | null
}

function trendPct(curr: number | null, prev: number | null): number | null {
  if (curr === null || prev === null || prev === 0) return null
  return ((curr - prev) / prev) * 100
}

function convRate(from: number | null, to: number | null): string | null {
  if (!from || !to || from === 0) return null
  return ((to / from) * 100).toFixed(1) + '%'
}

const STAGES = [
  { key: 'investment' as const, label: 'Investimento', color: '#ff3b3b' },
  { key: 'leads'      as const, label: 'Leads',        color: '#f97316' },
  { key: 'mqls'       as const, label: 'MQLs',         color: '#fbbf24' },
  { key: 'sqls'       as const, label: 'SQLs',         color: '#a3e635' },
  { key: 'sales'      as const, label: 'Vendas',       color: '#34d399' },
  { key: 'revenue'    as const, label: 'Faturamento',  color: '#22d3ee' },
]

export function FunnelView({ current, previous }: Props) {
  const showRoas = current.roas.value !== null && current.revenue.value !== null

  // Calcula larguras: referência = leads para estágios de volume
  const leadsVal = current.leads.value ?? 0
  function widthPct(key: typeof STAGES[number]['key'], val: number | null): number {
    if (key === 'investment' || key === 'revenue') return 100
    if (!val || leadsVal === 0) return 8
    return Math.max(8, Math.min(100, (val / leadsVal) * 100))
  }

  const kpis = [
    { label: 'ROAS', value: current.roas.formatted, show: showRoas,                         trend: trendPct(current.roas.value, previous?.roas.value ?? null), lowerBetter: false },
    { label: 'CPL',  value: current.cpl.formatted,  show: current.cpl.value !== null,        trend: trendPct(current.cpl.value,  previous?.cpl.value  ?? null), lowerBetter: true  },
    { label: 'CPA',  value: current.cpa.formatted,  show: current.cpa.value !== null,        trend: trendPct(current.cpa.value,  previous?.cpa.value  ?? null), lowerBetter: true  },
  ].filter(k => k.show && k.value !== '—')

  return (
    <div className="glass" style={{ padding: '20px 24px' }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 20 }}>
        Funil · {current.period}
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: kpis.length > 0 ? '1fr 130px' : '1fr', gap: 28 }}>
        {/* Funil */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
          {STAGES.map((stage, i) => {
            const val       = current[stage.key].value
            const formatted = current[stage.key].formatted
            const prevVal   = previous?.[stage.key].value ?? null
            const trend     = trendPct(val, prevVal)
            const hasData   = val !== null && val > 0
            const w         = widthPct(stage.key, val)
            const next      = STAGES[i + 1]
            const conv      = next ? convRate(val, current[next.key].value) : null

            return (
              <div key={stage.key} style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                {/* Trapézio */}
                <div style={{
                  width: `${w}%`,
                  padding: '10px 16px',
                  background: hasData ? `${stage.color}15` : 'rgba(255,255,255,0.03)',
                  borderLeft:  `1px solid ${hasData ? stage.color + '40' : 'var(--border)'}`,
                  borderRight: `1px solid ${hasData ? stage.color + '40' : 'var(--border)'}`,
                  borderTop:   i === 0 ? `1px solid ${hasData ? stage.color + '40' : 'var(--border)'}` : 'none',
                  borderBottom: `1px solid ${hasData ? stage.color + '40' : 'var(--border)'}`,
                  borderRadius: i === 0 ? '10px 10px 0 0' : i === STAGES.length - 1 ? '0 0 10px 10px' : '0',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  transition: 'width 0.5s ease',
                  minWidth: 120,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: hasData ? stage.color : 'var(--text-dim)', flexShrink: 0, boxShadow: hasData ? `0 0 6px ${stage.color}` : 'none' }} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: hasData ? 'var(--text)' : 'var(--text-dim)' }}>{stage.label}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: hasData ? stage.color : 'var(--text-dim)' }}>
                      {hasData ? formatted : '—'}
                    </span>
                    {trend !== null && hasData && (
                      <span style={{ fontSize: 10, fontWeight: 700, color: trend > 0 ? '#34d399' : '#ff3b3b' }}>
                        {trend > 0 ? '▲' : '▼'}{Math.abs(trend).toFixed(0)}%
                      </span>
                    )}
                  </div>
                </div>

                {/* Seta de conversão entre estágios */}
                {conv && hasData && i < STAGES.length - 1 && (
                  <div style={{ fontSize: 10, color: 'var(--text-dim)', padding: '2px 0', letterSpacing: '0.02em' }}>
                    ↓ {conv}
                  </div>
                )}
                {(!conv || !hasData) && i < STAGES.length - 1 && (
                  <div style={{ height: 4 }} />
                )}
              </div>
            )
          })}
        </div>

        {/* KPIs laterais */}
        {kpis.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {kpis.map(k => {
              const up = k.trend !== null && k.trend > 0
              const positive = k.lowerBetter ? !up : up
              return (
                <div key={k.label} style={{ padding: '12px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)' }}>
                  <p style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, marginBottom: 6 }}>{k.label}</p>
                  <p style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)' }}>{k.value}</p>
                  {k.trend !== null && (
                    <p style={{ fontSize: 10, fontWeight: 600, marginTop: 4, color: positive ? '#34d399' : '#ff3b3b' }}>
                      {up ? '▲' : '▼'} {Math.abs(k.trend).toFixed(1)}%
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
