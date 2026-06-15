import { Suspense, type CSSProperties } from 'react'
import { CLIENTS } from '@/lib/config'
import { getClientSummary } from '@/lib/data'
import { ClientSummary, ClientStatus, PaceStatus } from '@/lib/types'
import { Sidebar } from '@/components/Sidebar'
import { ClientAvatar } from '@/components/ClientAvatar'
import { StatusBadge } from '@/components/StatusBadge'
import { PaceGauge } from '@/components/PaceBadge'
import { MonthFilter } from '@/components/MonthFilter'
import Link from 'next/link'

export const revalidate = 1800

const LEAD_BREAK_THRESHOLD_DAYS = 2

// Clientes que precisam de atenção sobem para o topo das listas
const STATUS_PRIORITY: Record<ClientStatus, number> = { danger: 0, warning: 1, unknown: 2, ok: 3 }
const PACE_PRIORITY: Record<PaceStatus, number> = { under: 0, over: 1, unknown: 2, on: 3 }

function hasBreak(s: ClientSummary) {
  return s.dailyHealth.gpBreak || (s.dailyHealth.daysSinceLastLead ?? 0) > LEAD_BREAK_THRESHOLD_DAYS
}

function byAttention(a: ClientSummary, b: ClientSummary) {
  const bA = hasBreak(a) ? 0 : 1, bB = hasBreak(b) ? 0 : 1
  if (bA !== bB) return bA - bB
  const sA = STATUS_PRIORITY[a.status], sB = STATUS_PRIORITY[b.status]
  if (sA !== sB) return sA - sB
  const pA = PACE_PRIORITY[a.mediaPace.status], pB = PACE_PRIORITY[b.mediaPace.status]
  if (pA !== pB) return pA - pB
  return a.client.name.localeCompare(b.client.name)
}

async function DashboardContent({ selectedPeriod }: { selectedPeriod?: string }) {
  const summaries = await Promise.all(CLIENTS.map(c => getClientSummary(c, selectedPeriod)))
  const availablePeriods = summaries[0]?.availablePeriods ?? []
  const ordered = [...summaries].sort(byAttention)

  const totals = summaries.reduce(
    (acc, s) => {
      acc.investment += s.currentMonth?.investment.value ?? 0
      acc.leads += s.currentMonth?.leads.value ?? 0
      acc.sales += s.currentMonth?.sales.value ?? 0
      acc.revenue += s.currentMonth?.revenue.value ?? 0
      return acc
    },
    { investment: 0, leads: 0, sales: 0, revenue: 0 }
  )

  const fmtBRL = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)

  const paceCounts = summaries.reduce(
    (acc, s) => { acc[s.mediaPace.status] += 1; return acc },
    { on: 0, over: 0, under: 0, unknown: 0 } as Record<PaceStatus, number>
  )
  const paceMonitored = paceCounts.on + paceCounts.over + paceCounts.under

  const gpBreakClients = summaries.filter(s => s.dailyHealth.gpBreak)
  const leadBreakClients = summaries.filter(s => (s.dailyHealth.daysSinceLastLead ?? 0) > LEAD_BREAK_THRESHOLD_DAYS)

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar clients={summaries} />

      <main style={{ flex: 1 }}>
        {/* Top bar */}
        <header
          className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b px-4 py-3 sm:px-8"
          style={{ borderColor: 'var(--line)', background: 'rgba(59,0,0,0.58)', backdropFilter: 'blur(var(--blur))', WebkitBackdropFilter: 'blur(var(--blur))' }}
        >
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-cond" style={{ fontSize: 22, fontWeight: 700 }}>Visão Geral</h1>
              <span className="v4-accent" />
            </div>
            <p style={{ marginTop: 2, fontSize: 12, color: 'var(--text-3)' }}>
              {CLIENTS.length} clientes · {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <MonthFilter periods={availablePeriods} selected={selectedPeriod ?? ''} />
        </header>

        <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Alert banners */}
          {gpBreakClients.length > 0 && (
            <div className="flex items-center gap-2 rounded-xl border px-3 py-2 text-sm" style={{ borderColor: 'rgba(255,138,128,0.5)', background: 'rgba(255,138,128,0.12)' }}>
              <span className="tag-gp">Quebra GP?</span>
              <span style={{ color: 'var(--text-1)' }}>
                {gpBreakClients.length} cliente{gpBreakClients.length > 1 ? 's' : ''} com investimento zerado no último dia — possível quebra de Growth Pack:{' '}
                {gpBreakClients.map(s => s.client.name).join(', ')}.
              </span>
            </div>
          )}
          {leadBreakClients.length > 0 && (
            <div className="flex items-center gap-2 rounded-xl border px-3 py-2 text-sm" style={{ borderColor: 'rgba(255,209,102,0.5)', background: 'rgba(255,209,102,0.12)' }}>
              <span className="tag-bk">Sem leads novos</span>
              <span style={{ color: 'var(--text-1)' }}>
                {leadBreakClients.length} cliente{leadBreakClients.length > 1 ? 's' : ''} sem novo lead há +{LEAD_BREAK_THRESHOLD_DAYS} dias:{' '}
                {leadBreakClients.map(s => `${s.client.name} (${s.dailyHealth.daysSinceLastLead}d)`).join(', ')}.
              </span>
            </div>
          )}

          {/* Portfolio KPIs */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="v4-kpi">
              <div className="v4-kpi-n">{fmtBRL(totals.investment)}</div>
              <div className="v4-kpi-l">Investido no mês</div>
            </div>
            <div className="v4-kpi">
              <div className="v4-kpi-n">{totals.leads.toLocaleString('pt-BR')}</div>
              <div className="v4-kpi-l">Leads</div>
            </div>
            <div className="v4-kpi">
              <div className="v4-kpi-n" style={{ color: totals.sales > 0 ? 'var(--safe)' : undefined }}>{totals.sales.toLocaleString('pt-BR')}</div>
              <div className="v4-kpi-l">Vendas</div>
            </div>
            <div className="v4-kpi">
              <div className="v4-kpi-n" style={{ color: totals.revenue > 0 ? 'var(--safe)' : undefined }}>{fmtBRL(totals.revenue)}</div>
              <div className="v4-kpi-l">Faturamento</div>
            </div>
          </div>

          {/* Pace summary strip */}
          <div className="flex items-center gap-4 rounded-xl border px-4 py-2.5" style={{ borderColor: 'var(--line)', background: 'var(--surface-glass-soft)' }}>
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--gold)' }}>
              Pace de mídia
            </span>
            <span style={{ fontSize: 13, fontWeight: 700 }}>{paceMonitored > 0 ? `${paceCounts.on}/${paceMonitored} no ritmo` : 'sem dados'}</span>
            <span className="flex items-center gap-1.5" style={{ fontSize: 11, color: 'var(--text-3)' }}>
              <span className="v4-dot" style={{ background: 'var(--care)' }} /> {paceCounts.over} acima
            </span>
            <span className="flex items-center gap-1.5" style={{ fontSize: 11, color: 'var(--text-3)' }}>
              <span className="v4-dot" style={{ background: 'var(--danger)' }} /> {paceCounts.under} abaixo
            </span>
            <span className="flex items-center gap-1.5" style={{ fontSize: 11, color: 'var(--text-3)' }}>
              <span className="v4-dot" style={{ background: 'var(--text-3)' }} /> {paceCounts.unknown} sem dado
            </span>
          </div>

          {/* Client cards */}
          <div>
            <p style={sectionTitle}>Clientes · ordenados por prioridade de atenção</p>
            <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
              {ordered.map((summary) => {
                const { client, status, currentMonth, staleData, mediaPace, dailyHealth } = summary
                const isStale = staleData.meta.isStale || staleData.google.isStale
                const leadBreak = (dailyHealth.daysSinceLastLead ?? 0) > LEAD_BREAK_THRESHOLD_DAYS
                const flagged = dailyHealth.gpBreak || leadBreak

                return (
                  <Link
                    key={client.id}
                    href={`/clients/${client.id}`}
                    className="v4-card v4-card-hover block p-4"
                    style={{
                      textDecoration: 'none', display: 'flex', flexDirection: 'column', gap: 14,
                      ...(flagged ? { borderColor: 'rgba(255,138,128,0.5)', boxShadow: '0 0 0 1px rgba(255,138,128,0.5), var(--shadow)' } : {}),
                    }}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3" style={{ minWidth: 0 }}>
                        <ClientAvatar name={client.name} color={client.color} size="md" />
                        <div style={{ minWidth: 0 }}>
                          <p style={{ fontWeight: 700, color: 'var(--text-1)', fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {client.name}
                          </p>
                          {client.since && (
                            <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>Cliente desde {client.since}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <StatusBadge status={status} />
                        {dailyHealth.gpBreak && <span className="tag-gp">Quebra GP?</span>}
                        {leadBreak && <span className="tag-bk">Sem lead {dailyHealth.daysSinceLastLead}d</span>}
                        {isStale && !dailyHealth.gpBreak && !leadBreak && <span className="tag-gp">Dado desatualizado</span>}
                      </div>
                    </div>

                    {/* Pace gauge — métrica principal */}
                    <PaceGauge pace={mediaPace} />

                    {/* Funil completo */}
                    {currentMonth ? (
                      <div className="grid grid-cols-3 gap-2 text-center">
                        {[
                          { label: 'Leads', val: currentMonth.leads.formatted },
                          { label: 'MQL', val: currentMonth.mqls.formatted },
                          { label: 'SQL', val: currentMonth.sqls.formatted },
                          { label: 'Vendas', val: currentMonth.sales.formatted },
                          { label: 'CPL', val: currentMonth.cpl.formatted },
                          { label: 'Faturamento', val: currentMonth.revenue.formatted },
                        ].map(m => (
                          <div key={m.label} className="rounded-lg py-1.5" style={{ background: 'rgba(255,255,255,0.04)' }}>
                            <div style={{ fontSize: 13, fontWeight: 700 }}>{m.val}</div>
                            <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-3)' }}>{m.label}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{ fontSize: 12, color: 'var(--text-3)', textAlign: 'center', padding: '8px 0' }}>Sem dados este mês</p>
                    )}

                    {/* Footer */}
                    <div className="flex justify-end">
                      <span style={{ fontSize: 12, color: 'var(--gold)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        Ver detalhes <span aria-hidden>→</span>
                      </span>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

const sectionTitle: CSSProperties = {
  fontSize: 11, fontWeight: 700, color: 'var(--gold)',
  textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12,
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>
}) {
  const { month } = await searchParams
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            border: '2px solid var(--gold)', borderTopColor: 'transparent',
            animation: 'spin 0.8s linear infinite', margin: '0 auto 12px',
          }} />
          <p style={{ color: 'var(--text-3)', fontSize: 13 }}>Carregando dados das planilhas...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    }>
      <DashboardContent selectedPeriod={month} />
    </Suspense>
  )
}
