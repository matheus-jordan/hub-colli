'use client'
import { useRouter, useSearchParams } from 'next/navigation'

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function formatPeriod(period: string) {
  // "abril/2026" → "Abril 2026"
  return period.replace('/', ' · ').split(' · ').map((p, i) => i === 0 ? capitalize(p) : p).join(' · ')
}

export function MonthFilter({ periods, selected }: { periods: string[]; selected: string }) {
  const router = useRouter()
  const params = useSearchParams()

  function onChange(value: string) {
    const p = new URLSearchParams(params.toString())
    if (value) p.set('month', value)
    else p.delete('month')
    router.push(`?${p.toString()}`)
  }

  return (
    <select
      value={selected}
      onChange={e => onChange(e.target.value)}
      className="input-dark"
      style={{ padding: '6px 12px', fontSize: 13, cursor: 'pointer' }}
    >
      <option value="">Mês atual</option>
      {periods.map(p => (
        <option key={p} value={p}>{formatPeriod(p)}</option>
      ))}
    </select>
  )
}
