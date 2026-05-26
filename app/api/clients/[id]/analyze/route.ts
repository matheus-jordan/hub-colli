import { NextResponse } from 'next/server'
import { CLIENTS } from '@/lib/config'
import { getClientDetail } from '@/lib/data'
import { analyzeClient } from '@/lib/ai'

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const client = CLIENTS.find(c => c.id === id)
  if (!client) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const detail = await getClientDetail(client)
  const analysis = await analyzeClient(detail)
  return NextResponse.json(analysis)
}
