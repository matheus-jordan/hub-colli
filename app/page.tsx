import { Suspense } from 'react'
import { CLIENTS } from '@/lib/config'
import { getClientSummary } from '@/lib/data'
import { Sidebar } from '@/components/Sidebar'
import { ClientAvatar } from '@/components/ClientAvatar'
import { StatusBadge } from '@/components/StatusBadge'
import Link from 'next/link'

export const revalidate = 1800

async function DashboardContent() {
  const summaries = await Promise.all(CLIENTS.map(getClientSummary))

  const totals = summaries.reduce(
    (acc, s) => {
      acc.investment += s.currentMonth?.investment.value ?? 0
      acc.leads += s.currentMonth?.leads.value ?? 0
      return acc
    },
    { investment: 0, leads: 0 }
  )

  const fmtBRL = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)

  const staleCount = summaries.filter(s => s.staleData.meta.isStale || s.staleData.google.isStale).length

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar clients={summaries} />

      <main className="flex-1 overflow-y-auto bg-gray-50">
        {/* Top bar */}
        <div className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
          <div>
            <h1 className="text-lg font-bold text-gray-900">Visão Geral</h1>
            <p className="text-xs text-gray-500">
              Todos os clientes · {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
            </p>
          </div>
          {staleCount > 0 && (
            <span className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-xs font-medium px-3 py-1.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              {staleCount} cliente{staleCount > 1 ? 's' : ''} com dado desatualizado
            </span>
          )}
        </div>

        <div className="px-8 py-6 space-y-8">
          {/* Portfolio KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Clientes ativos', value: CLIENTS.length.toString() },
              { label: 'Investimento total', value: fmtBRL(totals.investment) },
              { label: 'Leads totais', value: totals.leads.toLocaleString('pt-BR') },
              { label: 'Com alertas', value: `${summaries.filter(s => s.status !== 'ok').length} / ${CLIENTS.length}` },
            ].map(kpi => (
              <div key={kpi.label} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                <p className="text-xs text-gray-500 uppercase tracking-wide">{kpi.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{kpi.value}</p>
              </div>
            ))}
          </div>

          {/* Client cards */}
          <div>
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Clientes</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {summaries.map(({ client, status, currentMonth, previousMonth, staleData }) => {
                const roasTrend =
                  currentMonth?.roas.value && previousMonth?.roas.value
                    ? ((currentMonth.roas.value - previousMonth.roas.value) / previousMonth.roas.value) * 100
                    : null

                return (
                  <Link
                    key={client.id}
                    href={`/clients/${client.id}`}
                    className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all p-5 group"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <ClientAvatar name={client.name} color={client.color} size="md" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm truncate">{client.name}</p>
                        {client.since && <p className="text-xs text-gray-400">Cliente desde {client.since}</p>}
                      </div>
                      <StatusBadge status={status} />
                    </div>

                    {(staleData.meta.isStale || staleData.google.isStale) && (
                      <div className="mb-3 text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2 border border-red-100">
                        ⚠ Dado desatualizado — verificar automação
                      </div>
                    )}

                    {currentMonth ? (
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { label: 'Investimento', val: currentMonth.investment.formatted },
                          { label: 'Leads', val: currentMonth.leads.formatted },
                          {
                            label: 'ROAS',
                            val: currentMonth.roas.formatted,
                            trend: roasTrend,
                          },
                          { label: 'CPL', val: currentMonth.cpl.formatted },
                        ].map(m => (
                          <div key={m.label}>
                            <p className="text-xs text-gray-400">{m.label}</p>
                            <div className="flex items-center gap-1">
                              <p className="text-sm font-bold text-gray-900">{m.val}</p>
                              {'trend' in m && m.trend !== null && m.trend !== undefined && (
                                <span className={`text-xs ${m.trend > 0 ? 'text-green-500' : 'text-red-500'}`}>
                                  {m.trend > 0 ? '▲' : '▼'}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 text-center py-4">Sem dados este mês</p>
                    )}

                    <p className="text-xs text-blue-500 mt-4 group-hover:underline">Ver detalhes →</p>
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Comparative table */}
          <div>
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Comparativo</h2>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {['Cliente', 'Investimento', 'Leads', 'ROAS', 'CPL', 'Status'].map((h, i) => (
                      <th key={h} className={`py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide ${i === 0 ? 'text-left' : i === 5 ? 'text-center' : 'text-right'}`}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {summaries.map(({ client, status, currentMonth, staleData }) => (
                    <tr key={client.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <ClientAvatar name={client.name} color={client.color} size="sm" />
                          <div>
                            <p className="font-medium text-gray-900 text-xs">{client.name}</p>
                            {(staleData.meta.isStale || staleData.google.isStale) && (
                              <p className="text-xs text-red-500">⚠ desatualizado</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-xs font-medium text-gray-700">{currentMonth?.investment.formatted ?? '—'}</td>
                      <td className="px-4 py-3 text-right text-xs text-gray-700">{currentMonth?.leads.formatted ?? '—'}</td>
                      <td className="px-4 py-3 text-right text-xs font-medium">
                        <span className={
                          (currentMonth?.roas.value ?? 0) >= 1.5 ? 'text-green-600' :
                          (currentMonth?.roas.value ?? 0) >= 1 ? 'text-yellow-600' : 'text-red-500'
                        }>
                          {currentMonth?.roas.formatted ?? '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-xs text-gray-700">{currentMonth?.cpl.formatted ?? '—'}</td>
                      <td className="px-4 py-3 text-center"><StatusBadge status={status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Carregando dados das planilhas...</p>
        </div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  )
}
