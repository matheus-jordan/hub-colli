import { NextResponse } from 'next/server'
import { Task } from '@/lib/types'

// In-memory store — substituir por Vercel KV após ativar no painel
const store: Record<string, Task[]> = {}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return NextResponse.json(store[id] ?? [])
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const task: Task = {
    id: crypto.randomUUID(),
    clientId: id,
    title: body.title,
    description: body.description,
    priority: body.priority ?? 'medium',
    status: 'pending',
    createdAt: new Date().toISOString(),
    dueDate: body.dueDate,
  }
  store[id] = [...(store[id] ?? []), task]
  return NextResponse.json(task, { status: 201 })
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  store[id] = (store[id] ?? []).map(t =>
    t.id === body.id ? { ...t, ...body } : t
  )
  return NextResponse.json({ ok: true })
}
