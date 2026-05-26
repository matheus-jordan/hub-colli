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
  const pct = ((curr - prev) / prev) * 100
  return pct
}

export function MetricsCard({ label, current, previous, highlight }: Props) {
  const pct = previous ? trend(current.value, previous.value) : null
  const up = pct !== null && pct > 0
  const down = pct !== null && pct < 0

  return (
    <div className={`rounded-xl p-4 border ${highlight ? 'border-blue-200 bg-blue-50' : 'border-gray-100 bg-white'}`}>
      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-xl font-bold ${highlight ? 'text-blue-700' : 'text-gray-900'}`}>
        {current.formatted}
      </p>
      {pct !== null && (
        <p className={`text-xs mt-1 font-medium ${up ? 'text-green-600' : down ? 'text-red-500' : 'text-gray-400'}`}>
          {up ? '▲' : down ? '▼' : '–'} {Math.abs(pct).toFixed(1)}% vs mês anterior
        </p>
      )}
    </div>
  )
}
