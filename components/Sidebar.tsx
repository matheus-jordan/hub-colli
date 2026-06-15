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
    <aside
      className="w-56 shrink-0 flex flex-col h-screen sticky top-0 overflow-y-auto scrollbar-thin border-r"
      style={{ background: 'var(--sidebar-bg)', borderColor: 'var(--sidebar-border)', backdropFilter: 'blur(var(--blur))', WebkitBackdropFilter: 'blur(var(--blur))' }}
    >
      {/* Header */}
      <div className="px-4 py-5 border-b flex items-center gap-3" style={{ borderColor: 'var(--sidebar-border)' }}>
        <img src="/v4-logo-branca.svg" alt="V4 Company" style={{ height: 18, width: 'auto' }} />
        <span style={{ height: 18, width: 1, background: 'var(--line)' }} />
        <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.16em', color: 'var(--gold)' }}>
          Colli
        </span>
      </div>

      {/* Clients list */}
      <nav className="flex-1 px-2 pt-3 pb-4">
        <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-3)', padding: '0 10px', marginBottom: 8 }}>
          Clientes
        </p>
        {clients.map(({ client, status }) => {
          const active = path === `/clients/${client.id}`
          return (
            <Link
              key={client.id}
              href={`/clients/${client.id}`}
              className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg mb-1 transition-colors group"
              style={{
                background: active ? 'var(--sidebar-active)' : 'transparent',
                color: active ? 'var(--text-1)' : 'var(--text-2)',
              }}
            >
              <ClientAvatar name={client.name} color={client.color} size="sm" />
              <span className="text-xs font-medium flex-1 truncate">{client.name}</span>
              <StatusDot status={status} />
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t text-xs" style={{ borderColor: 'var(--sidebar-border)', color: 'var(--text-3)' }}>
        V4 Company · {new Date().getFullYear()}
      </div>
    </aside>
  )
}
