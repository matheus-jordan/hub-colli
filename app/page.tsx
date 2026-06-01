import { Suspense } from 'react'
import { CLIENTS } from '@/lib/config'
import { getClientSummary } from '@/lib/data'
import { Sidebar } from '@/components/Sidebar'
import { ClientAvatar } from '@/components/ClientAvatar'
import { StatusBadge } from '@/components/StatusBadge'
import { MonthFilter } from '@/components/MonthFilter'
import Link from 'next/link'

export const revalidate = 1800

async function DashboardContent({ selectedPeriod }: { selectedPeriod?: string }) {
  const summaries = await Promise.all(CLIENTS.map(c => getClientSummary(c, selectedPeriod)))
  const availablePeriods = summaries[0]?.availablePeriods ?? []

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
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar clients={summaries} />

      <main style={{ flex: 1, overflowY: 'auto', background: 'var(--bg)' }}>
        {/* Top bar */}
        <div style={{
          background: 'rgba(8,8,8,0.85)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid var(--border)', padding: '14px 32px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          position: 'sticky', top: 0, zIndex: 10,
        }}>
          <div>
            <p style={{ fontWeight: 700, fontSize: 16, color: 'var(--text)' }}>Visão Geral</p>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
              Todos os clientes · {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <MonthFilter periods={availablePeriods} selected={selectedPeriod ?? ''} />
            {staleCount > 0 && (
              <span style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'rgba(255,59,59,0.1)', border: '1px solid var(--red-border)',
                color: 'var(--red)', fontSize: 11, fontWeight: 600,
                padding: '5px 12px', borderRadius: 20,
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--red)', flexShrink: 0 }} />
                {staleCount} cliente{staleCount > 1 ? 's' : ''} com dado desatualizado
              </span>
            )}
          </div>
        </div>

        <div style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 32 }}>
          {/* Portfolio KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            {[
              { label: 'Clientes ativos', value: CLIENTS.length.toString() },
              { label: 'Investimento total', value: fmtBRL(totals.investment) },
              { label: 'Leads totais', value: totals.leads.toLocaleString('pt-BR') },
              { label: 'Com alertas', value: `${summaries.filter(s => s.status !== 'ok').length} / ${CLIENTS.length}` },
            ].map(kpi => (
              <div key={kpi.label} className="glass" style={{ padding: '18px 20px' }}>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
                  {kpi.label}
                </p>
                <p style={{ fontSize: 26, fontWeight: 700, color: 'var(--text)', marginTop: 6 }}>{kpi.value}</p>
              </div>
            ))}
          </div>

          {/* Client cards */}
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>
              Clientes
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              {summaries.map(({ client, status, currentMonth, previousMonth, staleData }) => {
                const roasTrend =
                  currentMonth?.roas.value && previousMonth?.roas.value
                    ? ((currentMonth.roas.value - previousMonth.roas.value) / previousMonth.roas.value) * 100
                    : null

                return (
                  <Link
                    key={client.id}
                    href={`/clients/${client.id}`}
                    className="glass glass-hover"
                    style={{ padding: 20, textDecoration: 'none', display: 'block' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                      <ClientAvatar name={client.name} color={client.color} size="md" />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: 600, color: 'var(--text)', fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {client.name}
                        </p>
                        {client.since && (
                          <p style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 1 }}>Cliente desde {client.since}</p>
                        )}
                      </div>
                      <StatusBadge status={status} />
                    </div>

                    {(staleData.meta.isStale || staleData.google.isStale) && (
                      <div style={{
                        marginBottom: 12, fontSize: 11, color: 'var(--red)',
                        background: 'rgba(255,59,59,0.08)', borderRadius: 8,
                        padding: '6px 10px', border: '1px solid rgba(255,59,59,0.2)',
                      }}>
                        ⚠ Dado desatualizado — verificar automação
                      </div>
                    )}

                    {currentMonth ? (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        {[
                          { label: 'Investimento', val: currentMonth.investment.formatted },
                          { label: 'Leads', val: currentMonth.leads.formatted },
                          { label: 'ROAS', val: currentMonth.roas.formatted, trend: roasTrend },
                          { label: 'CPL', val: currentMonth.cpl.formatted },
                        ].map(m => (
                          <div key={m.label}>
                            <p style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{m.label}</p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                              <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{m.val}</p>
                              {'trend' in m && m.trend !== null && m.trend !== undefined && (
                                <span style={{ fontSize: 11, color: m.trend > 0 ? 'var(--green)' : 'var(--red)' }}>
                                  {m.trend > 0 ? '▲' : '▼'}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{ fontSize: 12, color: 'var(--text-dim)', textAlign: 'center', padding: '16px 0' }}>Sem dados este mês</p>
                    )}

                    <p style={{ fontSize: 12, color: 'var(--red)', marginTop: 16 }}>Ver detalhes →</p>
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Comparative table */}
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>
              Comparativo
            </p>
            <div className="glass" style={{ overflow: 'hidden' }}>
              <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Cliente', 'Investimento', 'Leads', 'ROAS', 'CPL', 'Status'].map((h, i) => (
                      <th key={h} style={{
                        padding: '12px 16px', fontSize: 11, fontWeight: 700,
                        color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em',
                        textAlign: i === 0 ? 'left' : i === 5 ? 'center' : 'right',
                      }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {summaries.map(({ client, status, currentMonth, staleData }) => (
                    <tr key={client.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.15s' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <ClientAvatar name={client.name} color={client.color} size="sm" />
                          <div>
                            <p style={{ fontWeight: 500, color: 'var(--text)', fontSize: 12 }}>{client.name}</p>
                            {(staleData.meta.isStale || staleData.google.isStale) && (
                              <p style={{ fontSize: 10, color: 'var(--red)' }}>⚠ desatualizado</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', color: 'var(--text-muted)' }}>{currentMonth?.investment.formatted ?? '—'}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', color: 'var(--text-muted)' }}>{currentMonth?.leads.formatted ?? '—'}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600 }}>
                        <span style={{ color: (currentMonth?.roas.value ?? 0) >= 1.5 ? 'var(--green)' : (currentMonth?.roas.value ?? 0) >= 1 ? 'var(--yellow)' : 'var(--red)' }}>
                          {currentMonth?.roas.formatted ?? '—'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', color: 'var(--text-muted)' }}>{currentMonth?.cpl.formatted ?? '—'}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}><StatusBadge status={status} /></td>
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

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>
}) {
  const { month } = await searchParams
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            border: '2px solid var(--red)', borderTopColor: 'transparent',
            animation: 'spin 0.8s linear infinite', margin: '0 auto 12px',
          }} />
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Carregando dados das planilhas...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    }>
      <DashboardContent selectedPeriod={month} />
    </Suspense>
  )
}
