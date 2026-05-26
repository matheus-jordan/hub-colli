'use client'
import { StaleDataInfo } from '@/lib/types'

export function StaleAlert({ stale }: { stale: StaleDataInfo }) {
  const issues: string[] = []
  if (stale.meta.isStale) issues.push(`Meta Ads sem atualização há ${stale.meta.daysOld} dias (último: ${stale.meta.lastDate ?? '?'})`)
  if (stale.google.isStale) issues.push(`Google Ads sem atualização há ${stale.google.daysOld} dias (último: ${stale.google.lastDate ?? '?'})`)
  if (issues.length === 0) return null

  return (
    <div className="rounded-lg bg-red-50 border border-red-200 p-3 flex gap-2.5">
      <span className="text-red-500 mt-0.5">⚠</span>
      <div>
        <p className="text-sm font-semibold text-red-700 mb-1">Automação pode ter parado</p>
        {issues.map((msg, i) => (
          <p key={i} className="text-xs text-red-600">{msg}</p>
        ))}
      </div>
    </div>
  )
}
