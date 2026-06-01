'use client'
import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ClientDetail, AIAnalysis, Task, HistoryEntry } from '@/lib/types'
import { ClientAvatar } from '@/components/ClientAvatar'
import { StatusBadge } from '@/components/StatusBadge'
import { StaleAlert } from '@/components/StaleAlert'
import { MetricsCard } from '@/components/MetricsCard'
import { TrendChart } from '@/components/TrendChart'
import { ConstraintsPanel } from '@/components/ConstraintsPanel'

const LINK_LABELS: Record<string, string> = {
  growthPack: 'Growth Pack',
  metaAds: 'Meta Ads',
  googleAds: 'Google Ads',
  drive: 'Pasta Drive',
  crm: 'CRM',
  landingPage: 'Landing Page',
  accessSheet: 'Planilha de Acessos',
  backupContacts: 'Backup Contatos',
}

export default function ClientPage() {
  const { id } = useParams<{ id: string }>()
  const [detail, setDetail] = useState<ClientDetail | null>(null)
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [tasks, setTasks] = useState<Task[]>([])
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [tab, setTab] = useState<'mensal' | 'semanal' | 'tasks' | 'historico'>('mensal')
  const [newTask, setNewTask] = useState('')
  const [newNote, setNewNote] = useState('')

  const load = useCallback(async () => {
    const [d, t, h] = await Promise.all([
      fetch(`/api/clients/${id}`).then(r => r.json()),
      fetch(`/api/clients/${id}/tasks`).then(r => r.json()),
      fetch(`/api/clients/${id}/history`).then(r => r.json()),
    ])
    setDetail(d)
    setTasks(t)
    setHistory(h)
  }, [id])

  useEffect(() => { load() }, [load])

  const analyze = async () => {
    setAnalyzing(true)
    const res = await fetch(`/api/clients/${id}/analyze`, { method: 'POST' })
    const data = await res.json()
    setAnalysis(data)
    setAnalyzing(false)
  }

  const addTask = async () => {
    if (!newTask.trim()) return
    await fetch(`/api/clients/${id}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTask, priority: 'medium' }),
    })
    setNewTask('')
    load()
  }

  const toggleTask = async (taskId: string, status: string) => {
    await fetch(`/api/clients/${id}/tasks`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: taskId, status: status === 'done' ? 'pending' : 'done' }),
    })
    load()
  }

  const addNote = async () => {
    if (!newNote.trim()) return
    await fetch(`/api/clients/${id}/history`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ summary: newNote, type: 'note' }),
    })
    setNewNote('')
    load()
  }

  if (!detail) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            border: '2px solid var(--red)', borderTopColor: 'transparent',
            animation: 'spin 0.8s linear infinite', margin: '0 auto 12px'
          }} />
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Carregando cliente...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  const { client, status, currentMonth, previousMonth, staleData, monthlyHistory, weeklyHistory } = detail
  const links = Object.entries(client.links).filter(([, v]) => v)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Header */}
      <div style={{
        background: 'rgba(8,8,8,0.85)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border)', padding: '14px 32px',
        position: 'sticky', top: 0, zIndex: 20, display: 'flex', alignItems: 'center', gap: 16,
      }}>
        <Link href="/" style={{ color: 'var(--text-muted)', fontSize: 13, textDecoration: 'none' }}>← Voltar</Link>
        <ClientAvatar name={client.name} color={client.color} size="md" />
        <div style={{ flex: 1 }}>
          <p style={{ fontWeight: 700, fontSize: 16, color: 'var(--text)' }}>{client.name}</p>
          {client.since && (
            <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              Cliente desde {client.since}{client.contact ? ` · ${client.contact}` : ''}
            </p>
          )}
        </div>
        <StatusBadge status={status} />
        <button
          onClick={analyze}
          disabled={analyzing}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)',
            color: 'var(--text)', fontSize: 13, fontWeight: 500, padding: '8px 16px',
            borderRadius: 10, cursor: 'pointer', transition: 'background 0.2s',
            opacity: analyzing ? 0.5 : 1,
          }}
        >
          {analyzing ? (
            <><span style={{ width: 14, height: 14, borderRadius: '50%', border: '1.5px solid currentColor', borderTopColor: 'transparent', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} /> Analisando...</>
          ) : (
            <><span style={{ color: 'var(--red)' }}>✦</span> Analisar com IA</>
          )}
        </button>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>

      <div style={{ padding: '28px 32px', maxWidth: 1280, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Stale alert */}
        <StaleAlert stale={staleData} />

        {/* Constraints — sempre no topo */}
        <ConstraintsPanel clientId={id} />

        {/* AI Analysis */}
        {analysis && (
          <div className="glass" style={{ padding: 20, borderColor: 'rgba(255,59,59,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{ color: 'var(--red)' }}>✦</span>
              <p style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>
                Análise IA · {new Date(analysis.generatedAt).toLocaleString('pt-BR')}
              </p>
            </div>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 16, lineHeight: 1.6 }}>{analysis.summary}</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              {analysis.highlights.length > 0 && (
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--green)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>✓ Destaques</p>
                  {analysis.highlights.map((h, i) => <p key={i} style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 4 }}>• {h}</p>)}
                </div>
              )}
              {analysis.warnings.length > 0 && (
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--red)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>⚠ Alertas</p>
                  {analysis.warnings.map((w, i) => <p key={i} style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 4 }}>• {w}</p>)}
                </div>
              )}
              {analysis.recommendations.length > 0 && (
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(100,160,255,1)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>→ Recomendações</p>
                  {analysis.recommendations.map((r, i) => <p key={i} style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 4 }}>• {r}</p>)}
                </div>
              )}
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 24 }}>
          {/* Main */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* KPIs */}
            {currentMonth && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                <MetricsCard label="Investimento" current={currentMonth.investment} previous={previousMonth?.investment} />
                <MetricsCard label="Leads" current={currentMonth.leads} previous={previousMonth?.leads} />
                <MetricsCard label="ROAS" current={currentMonth.roas} previous={previousMonth?.roas} highlight />
                <MetricsCard label="CPL" current={currentMonth.cpl} previous={previousMonth?.cpl} />
              </div>
            )}

            {/* Tabs */}
            <div className="glass" style={{ overflow: 'hidden' }}>
              <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', padding: '0 4px' }}>
                {([
                  { key: 'mensal', label: 'Mensal' },
                  { key: 'semanal', label: 'Semanal' },
                  { key: 'tasks', label: `Tarefas${tasks.filter(t => t.status === 'pending').length > 0 ? ` (${tasks.filter(t => t.status === 'pending').length})` : ''}` },
                  { key: 'historico', label: 'Histórico' },
                ] as const).map(t => (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key)}
                    style={{
                      padding: '12px 16px', fontSize: 13, fontWeight: 500, cursor: 'pointer',
                      background: 'none', border: 'none', borderBottom: `2px solid ${tab === t.key ? 'var(--red)' : 'transparent'}`,
                      color: tab === t.key ? 'var(--text)' : 'var(--text-muted)', marginBottom: -1,
                      transition: 'color 0.15s',
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <div style={{ padding: 20 }}>
                {/* Monthly */}
                {tab === 'mensal' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    {monthlyHistory.length > 0 ? (
                      <>
                        <TrendChart data={monthlyHistory} metric="roas" color="#ff3b3b" label="ROAS mensal" />
                        <div style={{ overflowX: 'auto' }}>
                          <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                            <thead>
                              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                                {['Mês', 'Investimento', 'Leads', 'ROAS', 'CPL', 'Vendas', 'Faturamento'].map((h, i) => (
                                  <th key={h} style={{ padding: '8px', fontWeight: 600, color: 'var(--text-muted)', textAlign: i === 0 ? 'left' : 'right' }}>{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {monthlyHistory.map((m, i) => (
                                <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                  <td style={{ padding: '8px', color: 'var(--text)', fontWeight: 500 }}>{m.period}</td>
                                  <td style={{ padding: '8px', textAlign: 'right', color: 'var(--text-muted)' }}>{m.investment.formatted}</td>
                                  <td style={{ padding: '8px', textAlign: 'right', color: 'var(--text-muted)' }}>{m.leads.formatted}</td>
                                  <td style={{ padding: '8px', textAlign: 'right', fontWeight: 600, color: (m.roas.value ?? 0) >= 1.5 ? 'var(--green)' : (m.roas.value ?? 0) >= 1 ? 'var(--yellow)' : 'var(--red)' }}>
                                    {m.roas.formatted}
                                  </td>
                                  <td style={{ padding: '8px', textAlign: 'right', color: 'var(--text-muted)' }}>{m.cpl.formatted}</td>
                                  <td style={{ padding: '8px', textAlign: 'right', color: 'var(--text-muted)' }}>{m.sales.formatted}</td>
                                  <td style={{ padding: '8px', textAlign: 'right', color: 'var(--text-muted)' }}>{m.revenue.formatted}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </>
                    ) : (
                      <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '32px 0', fontSize: 13 }}>Sem dados mensais disponíveis</p>
                    )}
                  </div>
                )}

                {/* Weekly */}
                {tab === 'semanal' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {weeklyHistory.length > 0 ? (
                      <>
                        <TrendChart
                          data={weeklyHistory.map(w => ({ ...w, mqls: { value: null, formatted: '—' }, sqls: { value: null, formatted: '—' }, sales: { value: null, formatted: '—' }, revenue: { value: null, formatted: '—' }, cpl: { value: null, formatted: '—' } }))}
                          metric="leads" color="#a78bfa" label="Leads semanais"
                        />
                        <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                          <thead>
                            <tr style={{ borderBottom: '1px solid var(--border)' }}>
                              {['Semana', 'Investimento', 'Leads', 'MQLs', 'ROAS', 'CPA'].map((h, i) => (
                                <th key={h} style={{ padding: '8px', fontWeight: 600, color: 'var(--text-muted)', textAlign: i === 0 ? 'left' : 'right' }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {weeklyHistory.map((w, i) => (
                              <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                <td style={{ padding: '8px', color: 'var(--text)', fontWeight: 500 }}>{w.period}</td>
                                <td style={{ padding: '8px', textAlign: 'right', color: 'var(--text-muted)' }}>{w.investment.formatted}</td>
                                <td style={{ padding: '8px', textAlign: 'right', color: 'var(--text-muted)' }}>{w.leads.formatted}</td>
                                <td style={{ padding: '8px', textAlign: 'right', color: 'var(--text-muted)' }}>{w.mqls.formatted}</td>
                                <td style={{ padding: '8px', textAlign: 'right', fontWeight: 600, color: 'var(--text)' }}>{w.roas.formatted}</td>
                                <td style={{ padding: '8px', textAlign: 'right', color: 'var(--text-muted)' }}>{w.cpa.formatted}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </>
                    ) : (
                      <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '32px 0', fontSize: 13 }}>Sem dados semanais disponíveis</p>
                    )}
                  </div>
                )}

                {/* Tasks */}
                {tab === 'tasks' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        value={newTask}
                        onChange={e => setNewTask(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && addTask()}
                        placeholder="Nova tarefa..."
                        className="input-dark"
                        style={{ flex: 1, padding: '9px 14px', fontSize: 13 }}
                      />
                      <button onClick={addTask} className="btn-ghost">Adicionar</button>
                    </div>
                    {tasks.length === 0 ? (
                      <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '24px 0', fontSize: 13 }}>Nenhuma tarefa</p>
                    ) : (
                      tasks.map(t => (
                        <div key={t.id} style={{
                          display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
                          borderRadius: 10, border: '1px solid var(--border)',
                          background: t.status === 'done' ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.04)',
                        }}>
                          <button
                            onClick={() => toggleTask(t.id, t.status)}
                            style={{
                              width: 16, height: 16, borderRadius: 4, flexShrink: 0, cursor: 'pointer',
                              border: `1.5px solid ${t.status === 'done' ? 'var(--green)' : 'var(--border-strong)'}`,
                              background: t.status === 'done' ? 'var(--green)' : 'transparent',
                              color: '#fff', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}
                          >
                            {t.status === 'done' ? '✓' : ''}
                          </button>
                          <span style={{ flex: 1, fontSize: 13, color: t.status === 'done' ? 'var(--text-dim)' : 'var(--text)', textDecoration: t.status === 'done' ? 'line-through' : 'none' }}>
                            {t.title}
                          </span>
                          <span style={{
                            fontSize: 10, padding: '2px 8px', borderRadius: 20,
                            background: t.priority === 'high' ? 'rgba(255,59,59,0.15)' : t.priority === 'medium' ? 'rgba(251,191,36,0.1)' : 'rgba(255,255,255,0.05)',
                            color: t.priority === 'high' ? 'var(--red)' : t.priority === 'medium' ? 'var(--yellow)' : 'var(--text-muted)',
                            border: `1px solid ${t.priority === 'high' ? 'var(--red-border)' : 'var(--border)'}`,
                          }}>
                            {t.priority}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* History */}
                {tab === 'historico' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        value={newNote}
                        onChange={e => setNewNote(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && addNote()}
                        placeholder="Registrar contato ou observação..."
                        className="input-dark"
                        style={{ flex: 1, padding: '9px 14px', fontSize: 13 }}
                      />
                      <button onClick={addNote} className="btn-ghost">Registrar</button>
                    </div>
                    {history.length === 0 ? (
                      <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '24px 0', fontSize: 13 }}>Nenhum registro</p>
                    ) : (
                      history.map(h => (
                        <div key={h.id} style={{ padding: '12px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'rgba(255,255,255,0.03)' }}>
                          <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
                            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{new Date(h.date).toLocaleDateString('pt-BR')}</span>
                            <span style={{ fontSize: 11, color: 'var(--text-dim)', background: 'rgba(255,255,255,0.05)', padding: '0 6px', borderRadius: 10 }}>{h.type}</span>
                          </div>
                          <p style={{ fontSize: 13, color: 'var(--text)' }}>{h.summary}</p>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Links */}
            <div className="glass" style={{ padding: 16 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
                Links rápidos
              </p>
              {links.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {links.map(([key, url]) => (
                    <a
                      key={key}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '9px 12px', borderRadius: 10, textDecoration: 'none',
                        border: '1px solid transparent', transition: 'all 0.15s',
                        color: 'var(--text)',
                      }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLElement).style.background = 'var(--surface-hover)'
                        ;(e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLElement).style.background = 'transparent'
                        ;(e.currentTarget as HTMLElement).style.borderColor = 'transparent'
                      }}
                    >
                      <span style={{ fontSize: 13 }}>{LINK_LABELS[key] ?? key}</span>
                      <span style={{ fontSize: 11, color: 'var(--red)' }}>↗</span>
                    </a>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: 12, color: 'var(--text-dim)' }}>Nenhum link configurado</p>
              )}
            </div>

            {/* Data freshness */}
            <div className="glass" style={{ padding: 16 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
                Atualização dos dados
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { label: 'Meta Ads', info: staleData.meta },
                  { label: 'Google Ads', info: staleData.google },
                ].map(({ label, info }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{label}</span>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: 12, fontWeight: 600, color: info.isStale ? 'var(--red)' : 'var(--green)' }}>
                        {info.isStale ? `⚠ ${info.daysOld}d atrás` : `✓ ${info.daysOld === 0 ? 'hoje' : `${info.daysOld}d atrás`}`}
                      </p>
                      {info.lastDate && <p style={{ fontSize: 11, color: 'var(--text-dim)' }}>{info.lastDate}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
