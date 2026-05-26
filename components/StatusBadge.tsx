'use client'
import { ClientStatus } from '@/lib/types'

const cfg: Record<ClientStatus, { label: string; dot: string; bg: string; text: string }> = {
  ok:      { label: 'Em dia',    dot: 'bg-green-500',  bg: 'bg-green-50',  text: 'text-green-700' },
  warning: { label: 'Atenção',   dot: 'bg-yellow-500', bg: 'bg-yellow-50', text: 'text-yellow-700' },
  danger:  { label: 'Risco',     dot: 'bg-red-500',    bg: 'bg-red-50',    text: 'text-red-700' },
  unknown: { label: 'Sem dados', dot: 'bg-gray-400',   bg: 'bg-gray-100',  text: 'text-gray-500' },
}

export function StatusBadge({ status }: { status: ClientStatus }) {
  const c = cfg[status]
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  )
}

export function StatusDot({ status }: { status: ClientStatus }) {
  return <span className={`w-2 h-2 rounded-full shrink-0 ${cfg[status].dot}`} />
}
