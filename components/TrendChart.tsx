'use client'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { MonthlyMetrics } from '@/lib/types'

interface Props {
  data: MonthlyMetrics[]
  metric: keyof Pick<MonthlyMetrics, 'investment' | 'leads' | 'roas' | 'cpa'>
  color?: string
  label?: string
}

export function TrendChart({ data, metric, color = '#3b82f6', label }: Props) {
  const chartData = [...data].reverse().map(m => ({
    period: m.period.slice(0, 7),
    value: m[metric].value ?? 0,
    label: m[metric].formatted,
  }))

  if (chartData.every(d => d.value === 0)) {
    return (
      <div className="h-32 flex items-center justify-center text-xs text-gray-400">
        Sem dados suficientes
      </div>
    )
  }

  return (
    <div className="h-32">
      {label && <p className="text-xs text-gray-500 mb-1">{label}</p>}
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="period" tick={{ fontSize: 10 }} tickLine={false} />
          <YAxis hide />
          <Tooltip
            contentStyle={{ fontSize: 11, borderRadius: 6, border: '1px solid #e5e7eb' }}
            formatter={(_v: unknown, _n: unknown, p: { payload?: { label?: string } }) => [p?.payload?.label ?? '']}
          />
          <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
