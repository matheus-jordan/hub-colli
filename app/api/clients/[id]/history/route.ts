import { NextResponse } from 'next/server'
import { HistoryEntry } from '@/lib/types'

const store: Record<string, HistoryEntry[]> = {}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return NextResponse.json(store[id] ?? [])
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const entry: HistoryEntry = {
    id: crypto.randomUUID(),
    clientId: id,
    date: body.date ?? new Date().toISOString().split('T')[0],
    type: body.type ?? 'note',
    summary: body.summary,
    createdAt: new Date().toISOString(),
  }
  store[id] = [entry, ...(store[id] ?? [])]
  return NextResponse.json(entry, { status: 201 })
}
