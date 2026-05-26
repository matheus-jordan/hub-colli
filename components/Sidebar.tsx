'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ClientSummary } from '@/lib/types'
import { ClientAvatar } from './ClientAvatar'
import { StatusDot } from './StatusBadge'

interface Props {
  clients: ClientSummary[]
}

export function Sidebar({ clients }: Props) {
  const path = usePathname()

  return (
    <aside className="w-56 shrink-0 flex flex-col h-screen sticky top-0 overflow-y-auto scrollbar-thin"
      style={{ backgroundColor: 'var(--sidebar-bg)' }}>
      {/* Header */}
      <div className="px-4 py-5 border-b" style={{ borderColor: 'var(--sidebar-border)' }}>
        <p className="text-white font-semibold text-sm">Hub do Account Manager</p>
        <p className="text-gray-400 text-xs mt-0.5">Painel do Account Manager</p>
      </div>

      {/* Search placeholder */}
      <div className="px-3 py-3">
        <div className="flex items-center gap-2 bg-gray-800 rounded-md px-3 py-1.5">
          <span className="text-gray-500 text-xs">🔍</span>
          <span className="text-gray-500 text-xs">Buscar cliente</span>
        </div>
      </div>

      {/* Clients list */}
      <nav className="flex-1 px-2 pb-4">
        {clients.map(({ client, status }) => {
          const active = path === `/clients/${client.id}`
          return (
            <Link
              key={client.id}
              href={`/clients/${client.id}`}
              className={`flex items-center gap-2.5 px-2 py-2 rounded-lg mb-0.5 transition-colors group ${
                active
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <ClientAvatar name={client.name} color={client.color} size="sm" />
              <span className="text-xs font-medium flex-1 truncate">{client.name}</span>
              <StatusDot status={status} />
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t text-xs text-gray-500" style={{ borderColor: 'var(--sidebar-border)' }}>
        Colli · {new Date().getFullYear()}
      </div>
    </aside>
  )
}
