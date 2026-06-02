'use client'
import { useEffect, useState, useCallback } from 'react'
import { Constraint, ConstraintTask, EkyteTask } from '@/lib/types'

interface Props { clientId: string }

const STATUS_COLOR: Record<number, string> = {
  10: '#34d399',
  20: '#fbbf24',
  30: 'rgba(255,255,255,0.3)',
  40: 'rgba(255,255,255,0.2)',
}

function deadlineLabel(d: string | null): { text: string; urgent: boolean } | null {
  if (!d) return null
  const days = Math.ceil((new Date(d).getTime() - Date.now()) / 86400000)
  if (days < 0) return { text: `Vencida há ${Math.abs(days)}d`, urgent: true }
  if (days === 0) return { text: 'Vence hoje', urgent: true }
  if (days <= 3) return { text: `${days}d restantes`, urgent: true }
  return { text: new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }), urgent: false }
}

// ── Task checklist inside a constraint ──────────────────────────────────────

function TaskChecklist({ constraint, clientId, onUpdate }: {
  constraint: Constraint
  clientId: string
  onUpdate: (updated: Constraint) => void
}) {
  const [newTitle, setNewTitle] = useState('')
  const [adding, setAdding] = useState(false)

  async function patch(tasks: ConstraintTask[]) {
    const res = await fetch(`/api/constraints/${clientId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: constraint.id, tasks }),
    })
    onUpdate(await res.json())
  }

  async function addTask() {
    if (!newTitle.trim()) return
    const task: ConstraintTask = {
      id: crypto.randomUUID(),
      title: newTitle.trim(),
      done: false,
      uploadedToEkyte: false,
    }
    await patch([...constraint.tasks, task])
    setNewTitle('')
    setAdding(false)
  }

  async function toggleDone(task: ConstraintTask) {
    const updated = constraint.tasks.map(t =>
      t.id === task.id ? { ...t, done: !t.done, uploadedToEkyte: !t.done ? t.uploadedToEkyte : false } : t
    )
    await patch(updated)
  }

  async function toggleEkyte(task: ConstraintTask) {
    const updated = constraint.tasks.map(t =>
      t.id === task.id ? { ...t, uploadedToEkyte: !t.uploadedToEkyte } : t
    )
    await patch(updated)
  }

  const pending = constraint.tasks.filter(t => !t.done)
  const done = constraint.tasks.filter(t => t.done)

  return (
    <div style={{ paddingLeft: 20, marginTop: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Tarefas da restrição {pending.length > 0 && <span style={{ color: 'var(--red)', marginLeft: 4 }}>({pending.length} abertas)</span>}
        </p>
        <button onClick={() => setAdding(a => !a)} className="btn-ghost" style={{ fontSize: 11, padding: '3px 10px' }}>
          + Tarefa
        </button>
      </div>

      {adding && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
          <input
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addTask()}
            placeholder="Descreva a tarefa..."
            autoFocus
            className="input-dark input-dark-red"
            style={{ flex: 1, padding: '7px 12px', fontSize: 12 }}
          />
          <button onClick={addTask} className="btn-neon" style={{ fontSize: 11, padding: '4px 12px' }}>Adicionar</button>
          <button onClick={() => setAdding(false)} className="btn-ghost" style={{ fontSize: 11, padding: '4px 10px' }}>×</button>
        </div>
      )}

      {constraint.tasks.length === 0 && !adding && (
        <p style={{ fontSize: 12, color: 'var(--text-dim)', paddingBottom: 4 }}>Nenhuma tarefa. Clique em "+ Tarefa" para adicionar.</p>
      )}

      {/* Pending tasks */}
      {pending.map(task => (
        <div key={task.id} style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
          borderRadius: 10, marginBottom: 4,
          background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)',
        }}>
          {/* Done checkbox */}
          <button
            onClick={() => toggleDone(task)}
            title="Marcar como feito"
            style={{
              width: 18, height: 18, borderRadius: 5, flexShrink: 0, cursor: 'pointer',
              border: '1.5px solid var(--border-strong)', background: 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s',
            }}
          />
          <span style={{ flex: 1, fontSize: 12, color: 'var(--text)' }}>{task.title}</span>

          {/* eKyte checkbox */}
          <button
            onClick={() => toggleEkyte(task)}
            title={task.uploadedToEkyte ? 'Remover marcação eKyte' : 'Marcar como subido no eKyte'}
            style={{
              display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer',
              background: task.uploadedToEkyte ? 'rgba(52,211,153,0.1)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${task.uploadedToEkyte ? 'rgba(52,211,153,0.3)' : 'var(--border)'}`,
              borderRadius: 8, padding: '3px 9px', transition: 'all 0.15s',
            }}
          >
            <span style={{
              width: 12, height: 12, borderRadius: 3, flexShrink: 0,
              border: `1.5px solid ${task.uploadedToEkyte ? '#34d399' : 'var(--border-strong)'}`,
              background: task.uploadedToEkyte ? '#34d399' : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, color: '#000'
            }}>
              {task.uploadedToEkyte ? '✓' : ''}
            </span>
            <span style={{ fontSize: 10, color: task.uploadedToEkyte ? '#34d399' : 'var(--text-dim)', fontWeight: 600 }}>
              eKyte
            </span>
          </button>
        </div>
      ))}

      {/* Done tasks */}
      {done.map(task => (
        <div key={task.id} style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '6px 12px',
          borderRadius: 10, marginBottom: 4, opacity: 0.45,
        }}>
          <button
            onClick={() => toggleDone(task)}
            title="Reabrir"
            style={{
              width: 18, height: 18, borderRadius: 5, flexShrink: 0, cursor: 'pointer',
              border: '1.5px solid var(--green)', background: 'var(--green)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, color: '#000', fontWeight: 700,
            }}
          >✓</button>
          <span style={{ flex: 1, fontSize: 12, color: 'var(--text-muted)', textDecoration: 'line-through' }}>{task.title}</span>
        </div>
      ))}
    </div>
  )
}

// ── Modal ───────────────────────────────────────────────────────────────────

interface ModalProps {
  clientId: string
  initial?: Constraint
  ekyteTasks: EkyteTask[]
  ekyteLoading: boolean
  onFetchEkyte: () => void
  onSave: (c: Constraint) => void
  onClose: () => void
}

function ConstraintModal({ clientId, initial, ekyteTasks, ekyteLoading, onFetchEkyte, onSave, onClose }: ModalProps) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [context, setContext] = useState(initial?.context ?? '')
  const [deadline, setDeadline] = useState(initial?.deadline?.slice(0, 10) ?? '')
  const [linked, setLinked] = useState<string[]>(initial?.linkedEkyteTaskIds ?? [])
  const [saving, setSaving] = useState(false)

  function toggleTask(id: string) {
    setLinked(l => l.includes(id) ? l.filter(x => x !== id) : [...l, id])
  }

  async function save() {
    if (!title.trim()) return
    setSaving(true)
    const method = initial ? 'PATCH' : 'POST'
    const body = initial
      ? { id: initial.id, title, context, deadline: deadline || null, linkedEkyteTaskIds: linked }
      : { title, context, deadline: deadline || null, linkedEkyteTaskIds: linked, tasks: [] }

    const res = await fetch(`/api/constraints/${clientId}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    onSave(await res.json())
    setSaving(false)
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="glass w-full max-w-lg" style={{ padding: '28px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>
            {initial ? 'Editar restrição' : 'Nova restrição'}
          </p>
          <button onClick={onClose} className="btn-ghost" style={{ padding: '4px 10px', fontSize: 16 }}>×</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>
              Qual é a restrição principal?
            </label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Ex: Funil sem qualificação de MQL"
              className="input-dark input-dark-red"
              style={{ width: '100%', padding: '10px 14px', fontSize: 14 }}
              autoFocus
            />
          </div>

          <div>
            <label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>
              Contexto / notas
            </label>
            <textarea
              value={context}
              onChange={e => setContext(e.target.value)}
              placeholder="Descreva o contexto da restrição, hipóteses, evidências..."
              className="input-dark input-dark-red"
              rows={4}
              style={{ width: '100%', padding: '10px 14px', fontSize: 13, resize: 'vertical' }}
            />
          </div>

          <div>
            <label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>
              Prazo para resolver
            </label>
            <input
              type="date"
              value={deadline}
              onChange={e => setDeadline(e.target.value)}
              className="input-dark"
              style={{ padding: '8px 14px', fontSize: 13 }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Tasks do eKyte vinculadas
              </label>
              {ekyteTasks.length === 0 && (
                <button onClick={onFetchEkyte} className="btn-ghost" style={{ fontSize: 11, padding: '3px 10px' }} disabled={ekyteLoading}>
                  {ekyteLoading ? 'Buscando...' : 'Buscar tasks'}
                </button>
              )}
            </div>

            {ekyteTasks.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 200, overflowY: 'auto' }}>
                {ekyteTasks.map(t => {
                  const sel = linked.includes(t.id)
                  return (
                    <button
                      key={t.id}
                      onClick={() => toggleTask(t.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '8px 12px', borderRadius: 10, textAlign: 'left',
                        background: sel ? 'rgba(255,59,59,0.1)' : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${sel ? 'rgba(255,59,59,0.3)' : 'var(--border)'}`,
                        cursor: 'pointer', transition: 'all 0.15s',
                      }}
                    >
                      <span style={{
                        width: 16, height: 16, borderRadius: 4,
                        border: `1.5px solid ${sel ? 'var(--red)' : 'var(--border-strong)'}`,
                        background: sel ? 'var(--red)' : 'transparent', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#fff'
                      }}>
                        {sel ? '✓' : ''}
                      </span>
                      <span style={{ flex: 1 }}>
                        <span style={{ fontSize: 12, color: 'var(--text)', display: 'block' }}>{t.title}</span>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t.projectName}</span>
                      </span>
                      <span style={{
                        fontSize: 10, padding: '2px 7px', borderRadius: 20,
                        background: `${STATUS_COLOR[t.statusCode]}20`,
                        color: STATUS_COLOR[t.statusCode],
                        border: `1px solid ${STATUS_COLOR[t.statusCode]}50`,
                      }}>
                        {t.statusLabel}
                      </span>
                    </button>
                  )
                })}
              </div>
            ) : (
              <p style={{ fontSize: 12, color: 'var(--text-dim)', padding: '8px 0' }}>
                {ekyteLoading ? 'Buscando tasks do eKyte...' : 'Clique em "Buscar tasks" para carregar as tasks deste cliente.'}
              </p>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 24, justifyContent: 'flex-end' }}>
          <button onClick={onClose} className="btn-ghost">Cancelar</button>
          <button onClick={save} className="btn-neon" disabled={saving || !title.trim()}>
            {saving ? 'Salvando...' : 'Salvar restrição'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main panel ──────────────────────────────────────────────────────────────

export function ConstraintsPanel({ clientId }: Props) {
  const [constraints, setConstraints] = useState<Constraint[]>([])
  const [ekyteTasks, setEkyteTasks] = useState<EkyteTask[]>([])
  const [ekyteLoading, setEkyteLoading] = useState(false)
  const [modal, setModal] = useState<'new' | Constraint | null>(null)
  const [resolvedOpen, setResolvedOpen] = useState(false)

  const load = useCallback(async () => {
    const res = await fetch(`/api/constraints/${clientId}`)
    setConstraints(await res.json())
  }, [clientId])

  useEffect(() => { load() }, [load])

  async function fetchEkyte() {
    setEkyteLoading(true)
    try {
      const res = await fetch(`/api/ekyte-tasks/${clientId}`)
      setEkyteTasks(await res.json())
    } catch { /* silent */ }
    setEkyteLoading(false)
  }

  async function resolve(c: Constraint) {
    await fetch(`/api/constraints/${clientId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: c.id, status: 'resolved' }),
    })
    load()
  }

  function onSave(saved: Constraint) {
    setModal(null)
    setConstraints(prev => {
      const idx = prev.findIndex(c => c.id === saved.id)
      if (idx >= 0) { const n = [...prev]; n[idx] = saved; return n }
      return [saved, ...prev]
    })
  }

  function onTaskUpdate(updated: Constraint) {
    setConstraints(prev => prev.map(c => c.id === updated.id ? updated : c))
  }

  const active = constraints.filter(c => c.status === 'active')
  const resolved = constraints.filter(c => c.status === 'resolved')

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {active.length === 0 ? (
          <div className="constraint-active" style={{ padding: '32px 28px', textAlign: 'center' }}>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
              Nenhuma restrição ativa — defina o próximo gargalo do projeto.
            </p>
            <button onClick={() => setModal('new')} className="btn-neon">+ Definir restrição</button>
          </div>
        ) : (
          active.map(c => {
            const dl = deadlineLabel(c.deadline)
            const linked = ekyteTasks.filter(t => c.linkedEkyteTaskIds.includes(t.id))
            const pendingTasks = (c.tasks ?? []).filter(t => !t.done).length
            const totalTasks = (c.tasks ?? []).length

            return (
              <div key={c.id} className="constraint-active" style={{ padding: '24px 28px' }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
                  <div style={{ paddingTop: 4 }}><div className="neon-dot" /></div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 10, color: 'var(--red)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
                      Restrição Principal
                    </p>
                    <p style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', lineHeight: 1.25 }}>{c.title}</p>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    {totalTasks > 0 && (
                      <span style={{
                        fontSize: 11, padding: '4px 10px', borderRadius: 20, fontWeight: 600,
                        background: pendingTasks > 0 ? 'rgba(255,59,59,0.12)' : 'rgba(52,211,153,0.1)',
                        color: pendingTasks > 0 ? 'var(--red)' : 'var(--green)',
                        border: `1px solid ${pendingTasks > 0 ? 'var(--red-border)' : 'rgba(52,211,153,0.3)'}`,
                      }}>
                        {pendingTasks > 0 ? `${pendingTasks}/${totalTasks} abertas` : `${totalTasks} concluídas ✓`}
                      </span>
                    )}
                    {dl && (
                      <span style={{
                        fontSize: 11, padding: '4px 10px', borderRadius: 20, fontWeight: 600,
                        background: dl.urgent ? 'rgba(255,59,59,0.15)' : 'rgba(255,255,255,0.06)',
                        color: dl.urgent ? 'var(--red)' : 'var(--text-muted)',
                        border: `1px solid ${dl.urgent ? 'var(--red-border)' : 'var(--border)'}`,
                      }}>
                        {dl.text}
                      </span>
                    )}
                    <button onClick={() => setModal(c)} className="btn-ghost" style={{ fontSize: 11, padding: '4px 10px' }}>Editar</button>
                    <button onClick={() => resolve(c)} className="btn-ghost" style={{ fontSize: 11, padding: '4px 10px' }}>Resolver ✓</button>
                  </div>
                </div>

                {/* Context */}
                {c.context && (
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, marginBottom: 8, paddingLeft: 20 }}>
                    {c.context}
                  </p>
                )}

                {/* Task checklist */}
                <TaskChecklist constraint={{ ...c, tasks: c.tasks ?? [] }} clientId={clientId} onUpdate={onTaskUpdate} />

                {/* Linked eKyte tasks (when loaded) */}
                {linked.length > 0 && (
                  <div style={{ paddingLeft: 20, marginTop: 16 }}>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                      Tasks eKyte vinculadas
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {linked.map(t => (
                        <a
                          key={t.id}
                          href={`https://app.ekyte.com/tarefas/${t.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'flex', alignItems: 'center', gap: 10, padding: '7px 12px',
                            borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)',
                            textDecoration: 'none', transition: 'all 0.15s',
                          }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-strong)' }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)' }}
                        >
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: STATUS_COLOR[t.statusCode], flexShrink: 0 }} />
                          <span style={{ fontSize: 12, color: 'var(--text)', flex: 1 }}>{t.title}</span>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t.projectName}</span>
                          <span style={{ fontSize: 10, color: STATUS_COLOR[t.statusCode] }}>{t.statusLabel}</span>
                          <span style={{ fontSize: 10, color: 'var(--red)', opacity: 0.7 }}>↗ eKyte</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}

        {active.length > 0 && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setModal('new')} className="btn-ghost" style={{ fontSize: 12 }}>+ Adicionar restrição</button>
            {ekyteTasks.length === 0 && (
              <button onClick={fetchEkyte} className="btn-ghost" style={{ fontSize: 12 }} disabled={ekyteLoading}>
                {ekyteLoading ? 'Buscando eKyte...' : '↺ Carregar tasks eKyte'}
              </button>
            )}
          </div>
        )}

        {resolved.length > 0 && (
          <div>
            <button
              onClick={() => setResolvedOpen(o => !o)}
              style={{ fontSize: 12, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <span>{resolvedOpen ? '▾' : '▸'}</span>
              {resolved.length} restrição{resolved.length > 1 ? 'ões' : ''} resolvida{resolved.length > 1 ? 's' : ''}
            </button>

            {resolvedOpen && (
              <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {resolved.map(c => (
                  <div key={c.id} className="glass" style={{ padding: '14px 18px', opacity: 0.6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 12, color: 'var(--green)' }}>✓</span>
                      <span style={{ fontSize: 13, color: 'var(--text-muted)', flex: 1 }}>{c.title}</span>
                      {c.resolvedAt && (
                        <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                          {new Date(c.resolvedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                        </span>
                      )}
                      <button
                        onClick={() => fetch(`/api/constraints/${clientId}`, {
                          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ id: c.id, status: 'active', resolvedAt: null }),
                        }).then(() => load())}
                        className="btn-ghost"
                        style={{ fontSize: 10, padding: '3px 8px' }}
                      >
                        Reabrir
                      </button>
                    </div>
                    {c.context && <p style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 4, paddingLeft: 22 }}>{c.context}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {modal !== null && (
        <ConstraintModal
          clientId={clientId}
          initial={modal === 'new' ? undefined : modal}
          ekyteTasks={ekyteTasks}
          ekyteLoading={ekyteLoading}
          onFetchEkyte={fetchEkyte}
          onSave={onSave}
          onClose={() => setModal(null)}
        />
      )}
    </>
  )
}
