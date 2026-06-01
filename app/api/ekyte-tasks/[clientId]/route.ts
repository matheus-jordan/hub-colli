import { NextResponse } from 'next/server'
import { EkyteTask } from '@/lib/types'
import { CLIENTS } from '@/lib/config'

const MCP_URL = 'https://n8n4.services4.collieassociados.com/mcp/mcp-ekyte-direct-v2'

const STATUS_LABELS: Record<number, string> = {
  10: 'Ativo',
  20: 'Pausado',
  30: 'Concluído',
  40: 'Cancelado',
}

async function fetchEkyteTasks(clientName: string): Promise<EkyteTask[]> {
  const token = process.env.EKYTE_MCP_TOKEN
  if (!token) return []

  try {
    const res = await fetch(MCP_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'tools/call',
        params: {
          name: 'ekyte_list_tasks',
          arguments: {
            title: '',
            task_situation: '10,20',
            workspace_id: '',
            executor_id: '',
            squad_id: '',
            project_id: '',
            start_date: '',
            end_date: '',
            period: '',
          },
        },
        id: 1,
      }),
      signal: AbortSignal.timeout(10000),
    })

    if (!res.ok) return []

    const json = await res.json()
    const raw = json?.result?.content?.[0]?.text
    if (!raw) return []

    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
    const list = Array.isArray(parsed) ? parsed : parsed?.tasks ?? parsed?.data ?? []

    const tasks: EkyteTask[] = list.map((t: Record<string, unknown>) => {
      const code = Number(t.situation ?? t.status ?? t.task_situation ?? 10)
      return {
        id: String(t.id ?? t.task_id ?? crypto.randomUUID()),
        title: String(t.title ?? t.name ?? ''),
        statusCode: code,
        statusLabel: STATUS_LABELS[code] ?? 'Ativo',
        projectName: String(t.project_name ?? (t.project as Record<string, unknown>)?.name ?? t.projectName ?? ''),
        dueDate: (t.due_date ?? t.dueDate) as string | undefined,
      }
    })

    const name = clientName.toLowerCase()
    return tasks.filter(t =>
      t.projectName.toLowerCase().includes(name) ||
      t.title.toLowerCase().includes(name)
    )
  } catch {
    return []
  }
}

export async function GET(_req: Request, { params }: { params: Promise<{ clientId: string }> }) {
  const { clientId } = await params
  const client = CLIENTS.find(c => c.id === clientId)
  if (!client) return NextResponse.json([], { status: 404 })

  const tasks = await fetchEkyteTasks(client.name)
  return NextResponse.json(tasks)
}
