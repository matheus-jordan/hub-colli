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

const STAGES = [
  { key: 'investment' as const, label: 'Investimento', color: '#ff3b3b', isCurrency: true },
  { key: 'leads'      as const, label: 'Leads',        color: '#f97316', isCurrency: false },
  { key: 'mqls'       as const, label: 'MQLs',         color: '#fbbf24', isCurrency: false },
  { key: 'sqls'       as const, label: 'SQLs',         color: '#a3e635', isCurrency: false },
  { key: 'sales'      as const, label: 'Vendas',       color: '#34d399', isCurrency: false },
  { key: 'revenue'    as const, label: 'Faturamento',  color: '#22d3ee', isCurrency: true },
]

function convRate(a: number | null, b: number | null): string | null {
  if (!a || !b || b === 0) return null
  return ((a / b) * 100).toFixed(1) + '%'
}

export function FunnelView({ current, previous }: Props) {
  // Largest numeric value among non-investment stages to scale width
  const volumeStages = STAGES.filter(s => s.key !== 'investment' && s.key !== 'revenue')
  const topVolume = Math.max(...volumeStages.map(s => current[s.key].value ?? 0), 1)

  // ROAS só se tiver faturamento
  const showRoas = current.roas.value !== null && current.revenue.value !== null

  const kpis = [
    { label: 'ROAS',        value: current.roas.formatted,  show: showRoas,                          trend: trendPct(current.roas.value, previous?.roas.value ?? null),        lowerBetter: false },
    { label: 'CPL',         value: current.cpl.formatted,   show: current.cpl.value !== null,        trend: trendPct(current.cpl.value,  previous?.cpl.value  ?? null),        lowerBetter: true  },
    { label: 'CPA',         value: current.cpa.formatted,   show: current.cpa.value !== null,        trend: trendPct(current.cpa.value,  previous?.cpa.value  ?? null),        lowerBetter: true  },
  ].filter(k => k.show && k.value !== '—')

  return (
    <div className="glass" style={{ padding: '20px 24px' }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 20 }}>
        Funil · {current.period}
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: kpis.length > 0 ? '1fr auto' : '1fr', gap: 32 }}>
        {/* Funil visual */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {STAGES.map((stage, i) => {
            const val       = current[stage.key].value
            const formatted = current[stage.key].formatted
            const prevVal   = previous?.[stage.key].value ?? null
            const trend     = trendPct(val, prevVal)
            const next      = STAGES[i + 1]
            const conv      = next ? convRate(current[next.key].value, val) : null

            // Largura proporcional: investimento = 100%, demais proporcional ao topVolume
            let widthPct: number
            if (stage.key === 'investment' || stage.key === 'revenue') {
              widthPct = 100
            } else {
              widthPct = val !== null ? Math.max(12, Math.min(100, (val / topVolume) * 100)) : 100
            }

            const hasData = val !== null && val > 0

            return (
              <div key={stage.key}>
                {/* Barra centrada */}
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <div style={{
                    width: `${widthPct}%`,
                    padding: '9px 14px',
                    borderRadius: 10,
                    background: hasData ? `${stage.color}15` : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${hasData ? stage.color + '35' : 'var(--border)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    transition: 'width 0.4s ease',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: hasData ? stage.color : 'var(--text-dim)', flexShrink: 0 }} />
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
                </div>
                {/* Taxa de conversão entre estágios */}
                {conv && hasData && (
                  <div style={{ textAlign: 'center', margin: '2px 0' }}>
                    <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>↓ {conv}</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* KPIs de custo */}
        {kpis.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 120 }}>
            {kpis.map(k => {
              const up = k.trend !== null && k.trend > 0
              const positive = k.lowerBetter ? !up : up
              return (
                <div key={k.label} style={{
                  padding: '12px 14px', borderRadius: 12,
                  background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)',
                }}>
                  <p style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, marginBottom: 6 }}>
                    {k.label}
                  </p>
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
