'use client'
import { MonthlyMetrics } from '@/lib/types'

interface Props {
  current: MonthlyMetrics
  previous?: MonthlyMetrics | null
}

interface Stage {
  label: string
  value: number | null
  formatted: string
  color: string
}

function convRate(a: number | null, b: number | null): string | null {
  if (!a || !b || b === 0) return null
  return ((a / b) * 100).toFixed(1) + '%'
}

function trendPct(curr: number | null, prev: number | null): number | null {
  if (curr === null || prev === null || prev === 0) return null
  return ((curr - prev) / prev) * 100
}

export function FunnelView({ current, previous }: Props) {
  const stages: Stage[] = [
    { label: 'Investimento', value: current.investment.value, formatted: current.investment.formatted, color: '#ff3b3b' },
    { label: 'Leads', value: current.leads.value, formatted: current.leads.formatted, color: '#f97316' },
    { label: 'MQLs', value: current.mqls.value, formatted: current.mqls.formatted, color: '#fbbf24' },
    { label: 'SQLs', value: current.sqls.value, formatted: current.sqls.formatted, color: '#a3e635' },
    { label: 'Vendas', value: current.sales.value, formatted: current.sales.formatted, color: '#34d399' },
  ]

  // Use leads as width base (most relevant funnel top after investment)
  const leadsVal = current.leads.value ?? 0
  const maxWidth = 100

  function stageWidth(val: number | null): number {
    if (!val || leadsVal === 0) return maxWidth
    // Investment is always full width, rest proportional to leads
    return Math.max(20, Math.min(maxWidth, (val / leadsVal) * maxWidth))
  }

  const kpis = [
    {
      label: 'CPL',
      value: current.cpl.formatted,
      trend: trendPct(current.cpl.value, previous?.cpl.value ?? null),
      lowerIsBetter: true,
    },
    {
      label: 'ROAS',
      value: current.roas.formatted,
      trend: trendPct(current.roas.value, previous?.roas.value ?? null),
      lowerIsBetter: false,
    },
    {
      label: 'CPA',
      value: current.cpa.formatted,
      trend: trendPct(current.cpa.value, previous?.cpa.value ?? null),
      lowerIsBetter: true,
    },
    {
      label: 'Faturamento',
      value: current.revenue.formatted,
      trend: trendPct(current.revenue.value, previous?.revenue.value ?? null),
      lowerIsBetter: false,
    },
  ].filter(k => k.value !== '—')

  return (
    <div className="glass" style={{ padding: '20px 24px' }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 20 }}>
        Funil de resultados · {current.period}
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Funnel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {stages.map((stage, i) => {
            const next = stages[i + 1]
            const conv = next ? convRate(next.value, stage.value) : null
            const width = i === 0 ? maxWidth : stageWidth(stage.value)
            const prevVal = previous ? [
              previous.investment.value, previous.leads.value, previous.mqls.value,
              previous.sqls.value, previous.sales.value
            ].filter(v => v !== null)[i] ?? null : null
            const trend = trendPct(stage.value, prevVal)

            return (
              <div key={stage.label}>
                <div style={{ width: `${width}%`, transition: 'width 0.5s ease' }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 14px', borderRadius: 10,
                    background: `${stage.color}12`,
                    border: `1px solid ${stage.color}30`,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: stage.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>{stage.label}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)' }}>{stage.formatted}</span>
                      {trend !== null && (
                        <span style={{ fontSize: 10, fontWeight: 600, color: trend > 0 ? '#34d399' : '#ff3b3b' }}>
                          {trend > 0 ? '▲' : '▼'}{Math.abs(trend).toFixed(0)}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {conv && (
                  <div style={{ paddingLeft: 14, margin: '3px 0' }}>
                    <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>
                      → {conv} conv.
                    </span>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* KPI grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, alignContent: 'start' }}>
          {kpis.map(k => {
            const positive = k.trend !== null && (k.lowerIsBetter ? k.trend < 0 : k.trend > 0)
            const negative = k.trend !== null && (k.lowerIsBetter ? k.trend > 0 : k.trend < 0)
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
                  <p style={{ fontSize: 10, fontWeight: 600, marginTop: 4, color: positive ? '#34d399' : negative ? '#ff3b3b' : 'var(--text-dim)' }}>
                    {k.trend > 0 ? '▲' : '▼'} {Math.abs(k.trend).toFixed(1)}% vs ant.
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
