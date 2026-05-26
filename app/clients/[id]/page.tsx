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
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Carregando cliente...</p>
        </div>
      </div>
    )
  }

  const { client, status, currentMonth, previousMonth, staleData, monthlyHistory, weeklyHistory } = detail
  const links = Object.entries(client.links).filter(([, v]) => v)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-gray-400 hover:text-gray-600 text-sm">← Voltar</Link>
          <ClientAvatar name={client.name} color={client.color} size="md" />
          <div>
            <h1 className="text-lg font-bold text-gray-900">{client.name}</h1>
            {client.since && <p className="text-xs text-gray-400">Cliente desde {client.since} · {client.contact && `Contato: ${client.contact}`}</p>}
          </div>
          <StatusBadge status={status} />
          <div className="ml-auto">
            <button
              onClick={analyze}
              disabled={analyzing}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              {analyzing ? (
                <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Analisando...</>
              ) : (
                <><span>✦</span> Analisar com IA</>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="px-8 py-6 space-y-6 max-w-7xl mx-auto">
        {/* Stale alert */}
        <StaleAlert stale={staleData} />

        {/* AI Analysis */}
        {analysis && (
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100 p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-blue-600">✦</span>
              <h3 className="font-semibold text-blue-900 text-sm">Análise IA · {new Date(analysis.generatedAt).toLocaleString('pt-BR')}</h3>
            </div>
            <p className="text-sm text-gray-700 mb-4">{analysis.summary}</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {analysis.highlights.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-green-700 mb-2">✓ Destaques</p>
                  {analysis.highlights.map((h, i) => <p key={i} className="text-xs text-gray-600 mb-1">• {h}</p>)}
                </div>
              )}
              {analysis.warnings.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-red-600 mb-2">⚠ Alertas</p>
                  {analysis.warnings.map((w, i) => <p key={i} className="text-xs text-gray-600 mb-1">• {w}</p>)}
                </div>
              )}
              {analysis.recommendations.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-blue-700 mb-2">→ Recomendações</p>
                  {analysis.recommendations.map((r, i) => <p key={i} className="text-xs text-gray-600 mb-1">• {r}</p>)}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* KPI cards */}
            {currentMonth && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <MetricsCard label="Investimento" current={currentMonth.investment} previous={previousMonth?.investment} />
                <MetricsCard label="Leads" current={currentMonth.leads} previous={previousMonth?.leads} />
                <MetricsCard label="ROAS" current={currentMonth.roas} previous={previousMonth?.roas} highlight />
                <MetricsCard label="CPL" current={currentMonth.cpl} previous={previousMonth?.cpl} />
              </div>
            )}

            {/* Tabs */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
              <div className="flex border-b border-gray-100 px-1 pt-1">
                {([
                  { key: 'mensal', label: 'Mensal' },
                  { key: 'semanal', label: 'Semanal' },
                  { key: 'tasks', label: `Tarefas ${tasks.filter(t => t.status === 'pending').length > 0 ? `(${tasks.filter(t => t.status === 'pending').length})` : ''}` },
                  { key: 'historico', label: 'Histórico' },
                ] as const).map(t => (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key)}
                    className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                      tab === t.key
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <div className="p-5">
                {/* Monthly tab */}
                {tab === 'mensal' && (
                  <div className="space-y-5">
                    {monthlyHistory.length > 0 ? (
                      <>
                        <TrendChart data={monthlyHistory} metric="roas" color="#3b82f6" label="ROAS mensal" />
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="border-b border-gray-100">
                                {['Mês', 'Investimento', 'Leads', 'ROAS', 'CPL', 'Vendas', 'Faturamento'].map(h => (
                                  <th key={h} className={`py-2 px-2 font-semibold text-gray-500 ${h === 'Mês' ? 'text-left' : 'text-right'}`}>{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {monthlyHistory.map((m, i) => (
                                <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                                  <td className="py-2 px-2 text-gray-700 font-medium">{m.period}</td>
                                  <td className="py-2 px-2 text-right text-gray-700">{m.investment.formatted}</td>
                                  <td className="py-2 px-2 text-right text-gray-700">{m.leads.formatted}</td>
                                  <td className={`py-2 px-2 text-right font-medium ${(m.roas.value ?? 0) >= 1.5 ? 'text-green-600' : (m.roas.value ?? 0) >= 1 ? 'text-yellow-600' : 'text-red-500'}`}>
                                    {m.roas.formatted}
                                  </td>
                                  <td className="py-2 px-2 text-right text-gray-700">{m.cpl.formatted}</td>
                                  <td className="py-2 px-2 text-right text-gray-700">{m.sales.formatted}</td>
                                  <td className="py-2 px-2 text-right text-gray-700">{m.revenue.formatted}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </>
                    ) : (
                      <p className="text-sm text-gray-400 text-center py-8">Sem dados mensais disponíveis</p>
                    )}
                  </div>
                )}

                {/* Weekly tab */}
                {tab === 'semanal' && (
                  <div className="space-y-4">
                    {weeklyHistory.length > 0 ? (
                      <>
                        <TrendChart data={weeklyHistory.map(w => ({ ...w, investment: w.investment, leads: w.leads, mqls: { value: null, formatted: '—' }, sqls: { value: null, formatted: '—' }, sales: { value: null, formatted: '—' }, revenue: { value: null, formatted: '—' }, cpa: w.cpa, roas: w.roas, cpl: { value: null, formatted: '—' } }))} metric="leads" color="#8b5cf6" label="Leads semanais" />
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-gray-100">
                              {['Semana', 'Investimento', 'Leads', 'MQLs', 'ROAS', 'CPA'].map(h => (
                                <th key={h} className={`py-2 px-2 font-semibold text-gray-500 ${h === 'Semana' ? 'text-left' : 'text-right'}`}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {weeklyHistory.map((w, i) => (
                              <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                                <td className="py-2 px-2 text-gray-700 font-medium">{w.period}</td>
                                <td className="py-2 px-2 text-right text-gray-700">{w.investment.formatted}</td>
                                <td className="py-2 px-2 text-right text-gray-700">{w.leads.formatted}</td>
                                <td className="py-2 px-2 text-right text-gray-700">{w.mqls.formatted}</td>
                                <td className="py-2 px-2 text-right font-medium text-blue-600">{w.roas.formatted}</td>
                                <td className="py-2 px-2 text-right text-gray-700">{w.cpa.formatted}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </>
                    ) : (
                      <p className="text-sm text-gray-400 text-center py-8">Sem dados semanais disponíveis</p>
                    )}
                  </div>
                )}

                {/* Tasks tab */}
                {tab === 'tasks' && (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <input
                        value={newTask}
                        onChange={e => setNewTask(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && addTask()}
                        placeholder="Nova tarefa..."
                        className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                      />
                      <button onClick={addTask} className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700">
                        Adicionar
                      </button>
                    </div>
                    {tasks.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-6">Nenhuma tarefa</p>
                    ) : (
                      tasks.map(t => (
                        <div key={t.id} className={`flex items-center gap-3 p-3 rounded-lg border ${t.status === 'done' ? 'bg-gray-50 border-gray-100' : 'bg-white border-gray-200'}`}>
                          <button onClick={() => toggleTask(t.id, t.status)} className={`w-4 h-4 rounded border-2 shrink-0 ${t.status === 'done' ? 'bg-green-500 border-green-500' : 'border-gray-300'}`} />
                          <span className={`text-sm flex-1 ${t.status === 'done' ? 'line-through text-gray-400' : 'text-gray-700'}`}>{t.title}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${t.priority === 'high' ? 'bg-red-100 text-red-600' : t.priority === 'medium' ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-100 text-gray-500'}`}>
                            {t.priority}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* History tab */}
                {tab === 'historico' && (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <input
                        value={newNote}
                        onChange={e => setNewNote(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && addNote()}
                        placeholder="Registrar contato ou observação..."
                        className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                      />
                      <button onClick={addNote} className="bg-gray-700 text-white text-sm px-4 py-2 rounded-lg hover:bg-gray-800">
                        Registrar
                      </button>
                    </div>
                    {history.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-6">Nenhum registro</p>
                    ) : (
                      history.map(h => (
                        <div key={h.id} className="p-3 rounded-lg border border-gray-100 bg-white">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs text-gray-400">{new Date(h.date).toLocaleDateString('pt-BR')}</span>
                            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{h.type}</span>
                          </div>
                          <p className="text-sm text-gray-700">{h.summary}</p>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right sidebar */}
          <div className="space-y-4">
            {/* Links */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Links rápidos</h3>
              {links.length > 0 ? (
                <div className="space-y-1.5">
                  {links.map(([key, url]) => (
                    <a
                      key={key}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-2.5 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-all group"
                    >
                      <span className="text-sm text-gray-700">{LINK_LABELS[key] ?? key}</span>
                      <span className="text-xs text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">Abrir ↗</span>
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400">Nenhum link configurado</p>
              )}
            </div>

            {/* Data freshness */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Atualização dos dados</h3>
              <div className="space-y-2">
                {[
                  { label: 'Meta Ads', info: staleData.meta },
                  { label: 'Google Ads', info: staleData.google },
                ].map(({ label, info }) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">{label}</span>
                    <div className="text-right">
                      <p className={`text-xs font-medium ${info.isStale ? 'text-red-600' : 'text-green-600'}`}>
                        {info.isStale ? `⚠ ${info.daysOld}d atrás` : `✓ ${info.daysOld === 0 ? 'hoje' : `${info.daysOld}d atrás`}`}
                      </p>
                      {info.lastDate && <p className="text-xs text-gray-400">{info.lastDate}</p>}
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
